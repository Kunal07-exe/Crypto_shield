import asyncio
import random
import datetime
import hashlib
from typing import Dict, Any, List
from app.risk_engine import risk_engine, KNOWN_THREAT_DATABASE
from app.graph_engine import graph_service
from app.database import SessionLocal
from app.models import Transaction, Alert, Wallet

SIMULATION_SCENARIOS = [
    {
        "type": "NORMAL_TRANSFER",
        "sender": "0x82a91f3a6a9b4cfb06159c39fa421184a22b71f3",
        "receiver": "0x55c68997a3915124019a97f39442011929997f3",
        "amount_range": (0.05, 0.45),
        "desc": "Regular transfer to verified DeFi protocol"
    },
    {
        "type": "ADDRESS_POISONING",
        "sender": "0x71C8F794B2a6886e088a29A7228800Fc92779A42",
        "receiver": "0x82a91ffffffffffffffffffffffffffffffb71f3", # Mimics 0x82a91...71f3
        "amount_range": (0.00001, 0.0001),
        "desc": "Address poisoning dusting transaction attempt"
    },
    {
        "type": "MULE_LAYERING",
        "sender": "0x19b08f8832a82914101e1882361b17a102712804",
        "receiver": "0x91d5757b46bb354438341618a8b13998f82877a1",
        "amount_range": (4.5, 9.8),
        "desc": "High velocity multi-hop mule layering hop"
    },
    {
        "type": "WALLET_DRAINER_SWEEP",
        "sender": "0xAA38221890e0c5fb6e680a7114138e68224435FB",
        "receiver": "0x71C8F794B2a6886e088a29A7228800Fc92779A42",
        "amount_range": (12.0, 24.5),
        "desc": "Automated asset sweep to attacker aggregation address"
    },
    {
        "type": "EXCHANGE_DEPOSIT",
        "sender": "0x91d5757b46bb354438341618a8b13998f82877a1",
        "receiver": "0xbinancehotwallet000000000000000000000001",
        "amount_range": (3.5, 8.0),
        "desc": "Downstream cashout attempt to centralized exchange"
    }
]

class TransactionSimulator:
    def __init__(self):
        self.is_running = False
        self.ws_clients: List[Any] = []

    def register_client(self, websocket):
        self.ws_clients.append(websocket)

    def unregister_client(self, websocket):
        if websocket in self.ws_clients:
            self.ws_clients.remove(websocket)

    async def broadcast(self, message: Dict[str, Any]):
        disconnected = []
        for ws in self.ws_clients:
            try:
                await ws.send_json(message)
            except Exception:
                disconnected.append(ws)
        for ws in disconnected:
            self.unregister_client(ws)

    def generate_single_transaction(self, forced_scenario: str = None) -> Dict[str, Any]:
        """
        Creates and processes a synthetic transaction across the 6-layer pipeline.
        """
        if forced_scenario:
            scenario = next((s for s in SIMULATION_SCENARIOS if s["type"] == forced_scenario), SIMULATION_SCENARIOS[0])
        else:
            scenario = random.choices(
                SIMULATION_SCENARIOS,
                weights=[0.60, 0.12, 0.12, 0.08, 0.08]
            )[0]

        amt = round(random.uniform(*scenario["amount_range"]), 4)
        raw_hash_seed = f"{scenario['sender']}:{scenario['receiver']}:{amt}:{datetime.datetime.utcnow().timestamp()}"
        tx_hash = "0x" + hashlib.sha256(raw_hash_seed.encode("utf-8")).hexdigest()

        tx_payload = {
            "tx_hash": tx_hash,
            "sender": scenario["sender"],
            "receiver": scenario["receiver"],
            "amount": amt,
            "blockchain": "Ethereum",
            "currency": "ETH",
            "hop_velocity_high": scenario["type"] == "MULE_LAYERING",
            "contract_type": "drainer_sweep" if scenario["type"] == "WALLET_DRAINER_SWEEP" else ""
        }

        # Query sender wallet info for behavioral analysis
        db = SessionLocal()
        sender_wallet = db.query(Wallet).filter(Wallet.address == scenario["sender"]).first()
        sender_info = {
            "wallet_age_days": sender_wallet.wallet_age_days if sender_wallet else 30,
            "avg_tx_amount_eth": sender_wallet.avg_tx_amount_eth if sender_wallet else 0.5,
            "incoming_tx_count": sender_wallet.incoming_tx_count if sender_wallet else 10,
            "outgoing_tx_count": sender_wallet.outgoing_tx_count if sender_wallet else 8,
            "historical_recipients": ["0x82a91f3a6a9b4cfb06159c39fa421184a22b71f3", "0x55c68997a3915124019a97f39442011929997f3"]
        }

        analysis = risk_engine.analyze_transaction(tx_payload, sender_info)

        # Persist transaction
        new_tx = Transaction(
            tx_hash=tx_hash,
            blockchain="Ethereum",
            sender=scenario["sender"],
            receiver=scenario["receiver"],
            amount=amt,
            currency="ETH",
            risk_score=analysis["risk_score"],
            confidence=analysis["confidence"],
            risk_level=analysis["risk_level"],
            fraud_type=analysis["primary_classification"],
            status="FLAGGED" if analysis["risk_level"] == "HIGH" else "CONFIRMED",
            evidence_signals=analysis["evidence_signals"],
            reasons=analysis["reasons"]
        )
        db.add(new_tx)

        # Update graph engine
        graph_service.add_edge(
            from_addr=scenario["sender"],
            to_addr=scenario["receiver"],
            amount=amt,
            tx_hash=tx_hash,
            risk=analysis["risk_score"],
            timestamp="Just now"
        )

        # Create alert if High Risk
        alert_obj = None
        if analysis["risk_level"] == "HIGH":
            alert_obj = Alert(
                title=f"High Risk Transaction Flagged ({analysis['primary_classification']})",
                subtitle=f"{amt} ETH from {scenario['sender'][:6]}... to {scenario['receiver'][:6]}...",
                severity="HIGH",
                wallet_address=scenario["sender"],
                tx_hash=tx_hash,
                alert_type="High Risk Transaction",
                details=analysis
            )
            db.add(alert_obj)

        db.commit()
        db.close()

        return {
            "tx_hash": tx_hash,
            "sender": scenario["sender"],
            "receiver": scenario["receiver"],
            "amount": amt,
            "currency": "ETH",
            "risk_score": analysis["risk_score"],
            "confidence": analysis["confidence"],
            "risk_level": analysis["risk_level"],
            "fraud_type": analysis["primary_classification"],
            "reasons": analysis["reasons"],
            "evidence_signals": analysis["evidence_signals"],
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "has_alert": analysis["risk_level"] == "HIGH"
        }

    async def run_simulation_loop(self):
        self.is_running = True
        while self.is_running:
            try:
                tx_res = self.generate_single_transaction()
                await self.broadcast({
                    "event": "NEW_TRANSACTION",
                    "data": tx_res
                })
            except Exception as e:
                print(f"[Simulator error]: {e}")
            await asyncio.sleep(4.0)

simulator_service = TransactionSimulator()
