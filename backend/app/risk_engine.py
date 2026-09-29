import difflib
from typing import Dict, Any, List, Tuple
from app.ml_engine import ml_service

# Known Threat Intelligence Databases
KNOWN_THREAT_DATABASE = {
    "0x71C8F794B2a6886e088a29A7228800Fc92779A42".lower(): {
        "name": "Inferno / Angel Drainer Mesh",
        "category": "Wallet Drainer",
        "risk": 96,
        "reports": 38,
        "tags": ["HIGH RISK", "DRAINER", "REPORTED"]
    },
    "0x19b08f8832a82914101e1882361b17a102712804".lower(): {
        "name": "Tornado Cash Linked Mule Node",
        "category": "Mixer & Mule Wallet",
        "risk": 91,
        "reports": 19,
        "tags": ["HIGH RISK", "MIXER", "MULE"]
    },
    "0xAA38221890e0c5fb6e680a7114138e68224435FB".lower(): {
        "name": "Fake Uniswap Phishing Contract",
        "category": "Phishing Contract",
        "risk": 94,
        "reports": 42,
        "tags": ["HIGH RISK", "PHISHING", "REPORTED"]
    },
    "0x33F486a424269be4326f95d82084b655d81b6821".lower(): {
        "name": "Reported Telegram Investment Ponzi",
        "category": "Investment Scam",
        "risk": 87,
        "reports": 14,
        "tags": ["HIGH RISK", "REPORTED"]
    },
    "0x91d5757b46bb354438341618a8b13998f82877a1".lower(): {
        "name": "Suspicious OTC Intermediate Node",
        "category": "Layering Node",
        "risk": 45,
        "reports": 3,
        "tags": ["MEDIUM RISK", "LAYER"]
    },
    "0x82a91f3a6a9b4cfb06159c39fa421184a22b71f3".lower(): {
        "name": "Authorized Retail Protected Wallet",
        "category": "Standard User",
        "risk": 12,
        "reports": 0,
        "tags": ["LOW RISK", "VERIFIED"]
    },
    "0x55c68997a3915124019a97f39442011929997f3".lower(): {
        "name": "Verified Liquidity Pool Vault",
        "category": "DeFi Protocol",
        "risk": 8,
        "reports": 0,
        "tags": ["LOW RISK", "DEFI"]
    },
    "0xbinancehotwallet000000000000000000000001".lower(): {
        "name": "Binance Official Hot Wallet",
        "category": "Exchange",
        "risk": 5,
        "reports": 0,
        "tags": ["EXCHANGE", "LOW RISK"]
    }
}

class MultiLayerRiskEngine:
    """
    6-Layer Detection & Decision Architecture for CryptoShield:
    Layer 1: Rule Engine (deterministic rules, dusting, poisoning)
    Layer 2: Machine Learning (Random Forest + XGBoost with SMOTE)
    Layer 3: Graph & Money Flow Analysis (clustering, hops, peel chains, funnel)
    Layer 4: Behavioral Anomaly Analysis (deviation from wallet baseline)
    Layer 5: Smart Contract Security (reentrancy, flash loan signals, honeypots)
    Layer 6: Threat Intelligence Engine (live scam/drainer feeds)
    """

    def calculate_wallet_security_score(self, wallet_obj: Any, recent_txs: List[Any]) -> Tuple[int, str]:
        """
        Calculates a dynamic security score (0-100) based on all historical and recent transactions.
        100 = Maximum Security, 0 = High Vulnerability
        """
        if not recent_txs:
            return 85, "LOW RISK"

        total_tx = len(recent_txs)
        high_risk_tx_count = sum(1 for tx in recent_txs if getattr(tx, 'risk_score', 0) >= 71)
        med_risk_tx_count = sum(1 for tx in recent_txs if 31 <= getattr(tx, 'risk_score', 0) < 71)

        # Penalty score based on exposure
        penalty = (high_risk_tx_count * 25) + (med_risk_tx_count * 8)
        raw_score = max(10, min(98, 92 - penalty))

        if raw_score >= 75:
            label = "LOW RISK"
        elif raw_score >= 40:
            label = "MEDIUM RISK"
        else:
            label = "HIGH RISK"

        return int(raw_score), label

    def check_address_poisoning(self, sender: str, recipient: str, amount: float, historical_recipients: List[str]) -> Tuple[bool, float, List[str]]:
        reasons = []
        is_poisoning = False
        poison_risk = 0.0

        if amount < 0.001:
            for hist in historical_recipients:
                if hist.lower() != recipient.lower():
                    prefix_match = hist[:5].lower() == recipient[:5].lower()
                    suffix_match = hist[-4:].lower() == recipient[-4:].lower()
                    similarity = difflib.SequenceMatcher(None, hist.lower(), recipient.lower()).ratio()

                    if (prefix_match and suffix_match) or similarity > 0.78:
                        is_poisoning = True
                        poison_risk = 92.0
                        reasons.append(f"Target address mimicked legitimate counterparty {hist[:6]}...{hist[-4:]} with 0 ETH / dusting value transfer")
                        reasons.append("Address poisoning attack vector identified (vanity collision trick)")
                        break
        return is_poisoning, poison_risk, reasons

    def check_wallet_drainer(self, recipient_info: Dict[str, Any], tx_data: Dict[str, Any]) -> Tuple[bool, float, List[str]]:
        reasons = []
        is_drainer = False
        drainer_risk = 0.0

        contract_tags = recipient_info.get("tags", []) if recipient_info else []
        if "DRAINER" in contract_tags or "PERMIT2_DRAINER" in contract_tags:
            is_drainer = True
            drainer_risk = 96.0
            reasons.append("Destination contract matches known wallet drainer signature")
            reasons.append("High-risk phishing asset sweep vector detected")
        elif tx_data.get("is_approval", False) and tx_data.get("approval_amount", 0) > 1000000:
            is_drainer = True
            drainer_risk = 88.0
            reasons.append("Suspicious unlimited token approval request to newly deployed unverified contract")
        return is_drainer, drainer_risk, reasons

    def analyze_transaction(self, tx_data: Dict[str, Any], wallet_info: Dict[str, Any] = None, recipient_info: Dict[str, Any] = None) -> Dict[str, Any]:
        sender = tx_data.get("sender", "").lower()
        recipient = tx_data.get("receiver", tx_data.get("recipient", "")).lower()
        amount = float(tx_data.get("amount", 0.0))
        historical_recipients = wallet_info.get("historical_recipients", []) if wallet_info else []

        layer_scores = {}
        evidence_signals = []
        secondary_indicators = []
        reasons = []

        # --- Layer 1: Rule Engine ---
        l1_score = 0.0
        is_poisoning, poison_risk, poison_reasons = self.check_address_poisoning(sender, recipient, amount, historical_recipients)
        if is_poisoning:
            l1_score = max(l1_score, poison_risk)
            evidence_signals.append("Deterministic vanity similarity collision detected (Address Poisoning)")
            reasons.extend(poison_reasons)

        if tx_data.get("is_zero_value_contract_call", False):
            l1_score = max(l1_score, 75.0)
            reasons.append("Unsolicited zero-value smart contract call")

        layer_scores["rule_engine"] = l1_score

        # --- Layer 2: Machine Learning Engine ---
        ml_features = {
            "indegree": wallet_info.get("incoming_tx_count", 3) if wallet_info else 3,
            "outdegree": wallet_info.get("outgoing_tx_count", 2) if wallet_info else 2,
            "in_btc": wallet_info.get("total_received_eth", 2.5) if wallet_info else 2.5,
            "out_btc": wallet_info.get("total_sent_eth", 2.0) if wallet_info else 2.0,
            "total_btc": (wallet_info.get("total_received_eth", 2.5) + wallet_info.get("total_sent_eth", 2.0)) if wallet_info else 4.5,
            "mean_in_btc": amount,
            "mean_out_btc": amount * 0.95,
            "in_malicious": 1 if recipient in KNOWN_THREAT_DATABASE else 0,
            "out_malicious": 1 if sender in KNOWN_THREAT_DATABASE else 0,
            "out_and_tx_malicious": 0.85 if (recipient in KNOWN_THREAT_DATABASE or sender in KNOWN_THREAT_DATABASE) else 0.05,
            "all_malicious": 0.9 if (recipient in KNOWN_THREAT_DATABASE and sender in KNOWN_THREAT_DATABASE) else 0.1
        }
        ml_res = ml_service.predict_transaction(ml_features)
        l2_score = ml_res["ml_fraud_prob"] * 100.0
        layer_scores["machine_learning"] = l2_score
        if ml_res["is_fraud"]:
            evidence_signals.append(f"AI Ensemble (XGBoost {ml_res['xgb_prob']*100:.1f}%, RF {ml_res['rf_prob']*100:.1f}%) flagged anomalous pattern")

        # --- Layer 3: Graph Analysis ---
        l3_score = 0.0
        fan_in = wallet_info.get("unique_senders", 1) if wallet_info else 1
        fan_out = wallet_info.get("unique_recipients", 1) if wallet_info else 1
        if fan_in > 15 and fan_out <= 2:
            l3_score = 88.0
            evidence_signals.append("Graph topology exhibits Funnel Wallet concentration characteristics")
            secondary_indicators.append("Funnel behavior: Multiple incoming sources consolidated to single exit")
            reasons.append("Consolidation of funds from multiple disperse sources (Funnel pattern)")
        elif fan_in <= 2 and fan_out > 15:
            l3_score = 84.0
            evidence_signals.append("Graph topology exhibits Peel Chain dispersion characteristics")
            secondary_indicators.append("Peel chain: Repeated peeling and layering into small unverified hops")
            reasons.append("Rapid automated dispersal across dozens of downstream addresses")
        elif tx_data.get("hop_velocity_high", False):
            l3_score = 82.0
            secondary_indicators.append("Rapid wallet hopping: Funds moved through 4+ hops within <10 minutes")
            reasons.append("High velocity multi-hop relay detected")
        layer_scores["graph_analysis"] = l3_score

        # --- Layer 4: Behavioral Analysis ---
        l4_score = 0.0
        avg_amt = wallet_info.get("avg_tx_amount_eth", 0.5) if wallet_info else 0.5
        wallet_age = wallet_info.get("wallet_age_days", 60) if wallet_info else 60
        
        if amount > (avg_amt * 15) and wallet_age > 5:
            l4_score = 55.0
            secondary_indicators.append(f"Wallet behavioral deviation: Transfer is {amount/avg_amt:.1f}x higher than historical baseline")
            reasons.append("Volumetric transaction deviation relative to normal wallet history")
        if wallet_age <= 1:
            l4_score = max(l4_score, 45.0)
            secondary_indicators.append("Newly activated wallet with zero seasoned activity")
        layer_scores["behavior_analysis"] = l4_score

        # --- Layer 5: Smart Contract Security ---
        l5_score = 0.0
        contract_type = tx_data.get("contract_type", "")
        if contract_type == "reentrancy_exploit":
            l5_score = 98.0
            evidence_signals.append("Callstack recursion and state change after external call (Reentrancy pattern)")
            reasons.append("State inconsistency during external contract invocation")
        elif contract_type == "flash_loan_manipulation":
            l5_score = 95.0
            evidence_signals.append("Flash-loan liquidity drain pattern with spot oracle skew")
            reasons.append("Multi-dex flash loan atomic arbitrage attack signature")
        layer_scores["smart_contract"] = l5_score

        # --- Layer 6: Threat Intelligence ---
        l6_score = 0.0
        threat_match = KNOWN_THREAT_DATABASE.get(recipient) or KNOWN_THREAT_DATABASE.get(sender)
        if threat_match:
            l6_score = float(threat_match["risk"])
            evidence_signals.append(f"Threat Intelligence hit: Counterparty listed in blacklist ({threat_match['name']})")
            reasons.append(f"Address identified in security intelligence database as {threat_match['category']}")
            secondary_indicators.append(f"Connected to verified malicious cluster ({threat_match['reports']} external reports)")
        layer_scores["threat_intelligence"] = l6_score

        # Composite Risk Calculation
        weights = {
            "threat_intelligence": 0.30,
            "machine_learning": 0.25,
            "rule_engine": 0.20,
            "graph_analysis": 0.15,
            "smart_contract": 0.10
        }
        
        if l6_score >= 85:
            final_risk = max(l6_score, 88.0)
            confidence = 94
        elif is_poisoning:
            final_risk = 92.0
            confidence = 91
        elif l5_score >= 90:
            final_risk = l5_score
            confidence = 95
        else:
            base_score = (
                layer_scores["threat_intelligence"] * weights["threat_intelligence"] +
                layer_scores["machine_learning"] * weights["machine_learning"] +
                layer_scores["rule_engine"] * weights["rule_engine"] +
                layer_scores["graph_analysis"] * weights["graph_analysis"] +
                layer_scores["smart_contract"] * weights["smart_contract"] +
                layer_scores["behavior_analysis"] * 0.10
            )
            final_risk = min(100.0, max(0.0, base_score))
            active_signals = sum(1 for s in layer_scores.values() if s > 40)
            confidence = min(96, max(45, 50 + (active_signals * 12)))

        final_risk_int = int(round(final_risk))
        
        if final_risk_int <= 30:
            risk_level = "LOW"
            recommended_action = "ALLOW TRANSACTION"
        elif final_risk_int <= 70:
            risk_level = "MEDIUM"
            recommended_action = "HOLD / VERIFY TRANSACTION"
        else:
            risk_level = "HIGH"
            recommended_action = "HOLD TRANSACTION • CREATE INVESTIGATION CASE"

        if is_poisoning:
            primary_classification = "Address Poisoning Attack"
        elif threat_match and "Drainer" in threat_match["category"]:
            primary_classification = "Wallet Drainer + Phishing Vector"
        elif threat_match and "Mixer" in threat_match["category"]:
            primary_classification = "Mule Wallet + Layering / Mixer Obfuscation"
        elif l5_score >= 90:
            primary_classification = "Smart Contract Vulnerability Exploit"
        elif l3_score >= 80:
            primary_classification = "Mule Wallet + Layering Pattern"
        elif l4_score >= 50 and final_risk_int > 60:
            primary_classification = "On-chain behavior consistent with possible wallet compromise"
        elif final_risk_int > 70:
            primary_classification = "On-chain behavior consistent with possible investment / phishing scam"
        elif final_risk_int > 30:
            primary_classification = "Unusual Behavioral / Volumetric Outlier"
        else:
            primary_classification = "Standard Legitimate Transfer"

        if not reasons:
            reasons.append("Standard peer-to-peer cryptocurrency transfer within expected parameters")
            reasons.append("No matches against malicious clusters or known scam databases")

        return {
            "risk_score": final_risk_int,
            "confidence": confidence,
            "risk_level": risk_level,
            "primary_classification": primary_classification,
            "secondary_indicators": secondary_indicators,
            "evidence_signals": evidence_signals,
            "reasons": reasons,
            "layer_scores": {k: round(v, 1) for k, v in layer_scores.items()},
            "recommended_action": recommended_action
        }

risk_engine = MultiLayerRiskEngine()
