import datetime
from sqlalchemy.orm import Session
from app.models import User, Wallet, Transaction, WalletConnection, Case, Evidence, Alert, ThreatIntelEntity, AuditLog
from app.graph_engine import graph_service
from app.blockchain_audit import blockchain_audit_service
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def initialize_database_seeds(db: Session):
    # Check if data is already seeded
    if db.query(User).count() > 0:
        return

    print("[CryptoShield] Initializing seed intelligence database...")

    # 1. Investigators and Users
    default_pw_hash = pwd_context.hash("Shield@2026")
    inv1 = User(
        user_type="investigator",
        organization_id="CYBER-INTEL-HQ",
        investigator_id="INV-182",
        email="investigator@agency.gov",
        hashed_password=default_pw_hash,
        name="Inv. Rahul Verma",
        role="Senior Financial Crime Analyst",
        mfa_secret="123456"
    )
    user1 = User(
        user_type="wallet_user",
        wallet_address="0x82a91f3a6a9b4cfb06159c39fa421184a22b71f3",
        name="Retail Investor",
        email="user@retail.eth"
    )
    db.add_all([inv1, user1])

    # 2. Key Wallets matching reference UI
    wallets_data = [
        {
            "address": "0x71C8F794B2a6886e088a29A7228800Fc92779A42",
            "blockchain": "Ethereum",
            "wallet_age_days": 12,
            "risk_score": 87,
            "confidence": 94,
            "wallet_type": "Mule / Drainer",
            "status": "Under Investigation",
            "balance_eth": 12.45,
            "total_tx_count": 284,
            "incoming_tx_count": 210,
            "outgoing_tx_count": 74,
            "total_received_eth": 125.45,
            "total_sent_eth": 112.32,
            "unique_senders": 42,
            "unique_recipients": 18,
            "avg_tx_amount_eth": 1.45,
            "tx_velocity_per_hour": 14.2,
            "known_scam_connections": 8,
            "known_exchange_connections": 3,
            "suspicious_contract_interactions": 5,
            "is_monitored": True,
            "tags": ["HIGH RISK", "DRAINER", "REPORTED"]
        },
        {
            "address": "0x82a91f3a6a9b4cfb06159c39fa421184a22b71f3",
            "blockchain": "Ethereum",
            "wallet_age_days": 420,
            "risk_score": 18,
            "confidence": 92,
            "wallet_type": "Retail Protected Wallet",
            "status": "Active / Verified",
            "balance_eth": 2.45,
            "total_tx_count": 284,
            "incoming_tx_count": 160,
            "outgoing_tx_count": 124,
            "total_received_eth": 14.2,
            "total_sent_eth": 11.75,
            "unique_senders": 12,
            "unique_recipients": 15,
            "avg_tx_amount_eth": 0.22,
            "tx_velocity_per_hour": 0.4,
            "known_scam_connections": 0,
            "known_exchange_connections": 2,
            "suspicious_contract_interactions": 0,
            "is_monitored": False,
            "tags": ["LOW RISK", "VERIFIED"]
        },
        {
            "address": "0x19b08f8832a82914101e1882361b17a102712804",
            "blockchain": "Ethereum",
            "wallet_age_days": 8,
            "risk_score": 91,
            "confidence": 92,
            "wallet_type": "Tornado Cash Linked Mule",
            "status": "High Risk",
            "balance_eth": 45.10,
            "total_tx_count": 142,
            "incoming_tx_count": 120,
            "outgoing_tx_count": 22,
            "total_received_eth": 88.5,
            "total_sent_eth": 43.4,
            "unique_senders": 35,
            "unique_recipients": 4,
            "avg_tx_amount_eth": 2.1,
            "tx_velocity_per_hour": 8.5,
            "known_scam_connections": 12,
            "known_exchange_connections": 1,
            "suspicious_contract_interactions": 3,
            "is_monitored": True,
            "tags": ["HIGH RISK", "MIXER", "MULE"]
        },
        {
            "address": "0x91d5757b46bb354438341618a8b13998f82877a1",
            "blockchain": "Ethereum",
            "wallet_age_days": 65,
            "risk_score": 45,
            "confidence": 78,
            "wallet_type": "Intermediary Layering Node",
            "status": "Pending Review",
            "balance_eth": 3.80,
            "total_tx_count": 89,
            "incoming_tx_count": 50,
            "outgoing_tx_count": 39,
            "total_received_eth": 22.0,
            "total_sent_eth": 18.2,
            "unique_senders": 8,
            "unique_recipients": 9,
            "avg_tx_amount_eth": 0.8,
            "tx_velocity_per_hour": 1.2,
            "known_scam_connections": 1,
            "known_exchange_connections": 2,
            "suspicious_contract_interactions": 0,
            "is_monitored": False,
            "tags": ["MEDIUM RISK", "LAYER"]
        },
        {
            "address": "0xAA38221890e0c5fb6e680a7114138e68224435FB",
            "blockchain": "Ethereum",
            "wallet_age_days": 4,
            "risk_score": 94,
            "confidence": 96,
            "wallet_type": "Phishing Smart Contract",
            "status": "Under Investigation",
            "balance_eth": 18.90,
            "total_tx_count": 412,
            "incoming_tx_count": 405,
            "outgoing_tx_count": 7,
            "total_received_eth": 310.0,
            "total_sent_eth": 291.1,
            "unique_senders": 94,
            "unique_recipients": 2,
            "avg_tx_amount_eth": 3.2,
            "tx_velocity_per_hour": 28.0,
            "known_scam_connections": 24,
            "known_exchange_connections": 0,
            "suspicious_contract_interactions": 18,
            "is_monitored": True,
            "tags": ["HIGH RISK", "PHISHING", "CONTRACT"]
        },
        {
            "address": "0x33F486a424269be4326f95d82084b655d81b6821",
            "blockchain": "Ethereum",
            "wallet_age_days": 18,
            "risk_score": 73,
            "confidence": 88,
            "wallet_type": "Ponzi Deposit Collector",
            "status": "Under Investigation",
            "balance_eth": 8.40,
            "total_tx_count": 164,
            "incoming_tx_count": 150,
            "outgoing_tx_count": 14,
            "total_received_eth": 65.2,
            "total_sent_eth": 56.8,
            "unique_senders": 45,
            "unique_recipients": 3,
            "avg_tx_amount_eth": 1.2,
            "tx_velocity_per_hour": 5.4,
            "known_scam_connections": 6,
            "known_exchange_connections": 1,
            "suspicious_contract_interactions": 2,
            "is_monitored": True,
            "tags": ["REPORTED", "HIGH RISK"]
        },
        {
            "address": "0x55c68997a3915124019a97f39442011929997f3",
            "blockchain": "Ethereum",
            "wallet_age_days": 800,
            "risk_score": 8,
            "confidence": 95,
            "wallet_type": "Verified Uniswap V3 Pool",
            "status": "Active",
            "balance_eth": 840.5,
            "total_tx_count": 18290,
            "incoming_tx_count": 9200,
            "outgoing_tx_count": 9090,
            "total_received_eth": 45000.0,
            "total_sent_eth": 44159.5,
            "unique_senders": 1200,
            "unique_recipients": 1150,
            "avg_tx_amount_eth": 4.5,
            "tx_velocity_per_hour": 45.0,
            "known_scam_connections": 0,
            "known_exchange_connections": 8,
            "suspicious_contract_interactions": 0,
            "is_monitored": False,
            "tags": ["LOW RISK", "DEFI"]
        },
        {
            "address": "0xbinancehotwallet000000000000000000000001",
            "blockchain": "Ethereum",
            "wallet_age_days": 1800,
            "risk_score": 4,
            "confidence": 98,
            "wallet_type": "Centralized Exchange Gateway",
            "status": "Active",
            "balance_eth": 125000.0,
            "total_tx_count": 284000,
            "incoming_tx_count": 140000,
            "outgoing_tx_count": 144000,
            "total_received_eth": 980000.0,
            "total_sent_eth": 855000.0,
            "unique_senders": 85000,
            "unique_recipients": 92000,
            "avg_tx_amount_eth": 6.8,
            "tx_velocity_per_hour": 350.0,
            "known_scam_connections": 0,
            "known_exchange_connections": 25,
            "suspicious_contract_interactions": 0,
            "is_monitored": False,
            "tags": ["EXCHANGE", "LOW RISK"]
        }
    ]

    for w in wallets_data:
        wallet_obj = Wallet(**w)
        db.add(wallet_obj)
        graph_service.register_node(
            address=w["address"],
            risk_score=w["risk_score"],
            node_type=w["wallet_type"],
            balance=w["balance_eth"],
            tags=w["tags"]
        )

    # 3. Network Graph Adjacencies matching the UI reference graph
    graph_connections = [
        ("0x82a91f3a6a9b4cfb06159c39fa421184a22b71f3", "0x71C8F794B2a6886e088a29A7228800Fc92779A42", 5.0, "0x8ab29c41829ea4b1239857218900192a83819208a9f201099238471928371928", 87),
        ("0x71C8F794B2a6886e088a29A7228800Fc92779A42", "0x19b08f8832a82914101e1882361b17a102712804", 4.9, "0x77c4892182049182039182039182039182039182039182039182039182039182", 91),
        ("0x19b08f8832a82914101e1882361b17a102712804", "0x91d5757b46bb354438341618a8b13998f82877a1", 4.8, "0x9923847192837192837192837192837192837192837192837192837192837192", 45),
        ("0x91d5757b46bb354438341618a8b13998f82877a1", "0xbinancehotwallet000000000000000000000001", 4.75, "0x6618290319203810293810293810293810293810293810293810293810293810", 15),
        ("0x71C8F794B2a6886e088a29A7228800Fc92779A42", "0xAA38221890e0c5fb6e680a7114138e68224435FB", 12.45, "0x1203918203918203918203918203918203918203918203918203918203918203", 94),
        ("0x71C8F794B2a6886e088a29A7228800Fc92779A42", "0x55c68997a3915124019a97f39442011929997f3", 2.2, "0x5519283019283019283019283019283019283019283019283019283019283019", 10),
        ("0xAA38221890e0c5fb6e680a7114138e68224435FB", "0x33F486a424269be4326f95d82084b655d81b6821", 8.4, "0x3391820391820391820391820391820391820391820391820391820391820391", 73),
        ("0x33F486a424269be4326f95d82084b655d81b6821", "0xbinancehotwallet000000000000000000000001", 8.1, "0x8810293810293810293810293810293810293810293810293810293810293810", 12)
    ]

    for src, dst, amt, txh, risk in graph_connections:
        conn = WalletConnection(
            source_wallet=src,
            destination_wallet=dst,
            transaction_count=3,
            total_amount_eth=amt,
            risk_weight=risk / 100.0
        )
        db.add(conn)
        graph_service.add_edge(src, dst, amt, txh, risk, "26 Aug 2026, 14:32")

    # 4. Recent Investigations / Cases from screenshot
    cases_data = [
        {
            "case_id": "CR-2026-00182",
            "title": "Operation DarkFlow: Multi-Hop Phishing & Drainer Syndicate",
            "subject": "0x71C...9A42",
            "primary_wallet": "0x71C8F794B2a6886e088a29A7228800Fc92779A42",
            "victim_wallet": "0x82a91f3a6a9b4cfb06159c39fa421184a22b71f3",
            "suspect_wallet": "0x19b08f8832a82914101e1882361b17a102712804",
            "priority": "HIGH",
            "status": "Under Investigation",
            "risk_score": 87,
            "fraud_type": "Wallet Drainer + Phishing Vector",
            "amount_lost": "₹4,75,000",
            "investigator": "Inv. Rahul Verma",
            "organization": "Cyber Crime Unit",
            "notes": "Victim reported signature compromise leading to automated asset dispersal into high-risk layering nodes."
        },
        {
            "case_id": "CR-2026-00181",
            "title": "Investigation into High-Velocity Retail Dispersion",
            "subject": "0x82A...71F3",
            "primary_wallet": "0x82a91f3a6a9b4cfb06159c39fa421184a22b71f3",
            "victim_wallet": "0x82a91f3a6a9b4cfb06159c39fa421184a22b71f3",
            "priority": "MEDIUM",
            "status": "Pending Review",
            "risk_score": 62,
            "fraud_type": "Unusual Behavioral Outlier",
            "amount_lost": "₹1,20,000",
            "investigator": "Inv. Priya Sharma",
            "organization": "Financial Intelligence Unit"
        },
        {
            "case_id": "CR-2026-00180",
            "title": "Tornado Cash Linked Layering & Funneling",
            "subject": "0x19B...2804",
            "primary_wallet": "0x19b08f8832a82914101e1882361b17a102712804",
            "priority": "HIGH",
            "status": "High Risk",
            "risk_score": 91,
            "fraud_type": "Mule Wallet + Mixer Obfuscation",
            "amount_lost": "₹18,50,000",
            "investigator": "Inv. Rahul Verma",
            "organization": "Cyber Crime Unit"
        },
        {
            "case_id": "CR-2026-00179",
            "title": "OTC Liquidity Arbitrage Node Verification",
            "subject": "0x91D...77A1",
            "primary_wallet": "0x91d5757b46bb354438341618a8b13998f82877a1",
            "priority": "LOW",
            "status": "Low Risk",
            "risk_score": 45,
            "fraud_type": "Standard Layering Node",
            "amount_lost": "₹45,000",
            "investigator": "Inv. Amit Patel",
            "organization": "FinCrime Division"
        },
        {
            "case_id": "CR-2026-00178",
            "title": "Fake Uniswap Governance Phishing Portal",
            "subject": "0xAA3...35FB",
            "primary_wallet": "0xAA38221890e0c5fb6e680a7114138e68224435FB",
            "priority": "HIGH",
            "status": "Under Investigation",
            "risk_score": 73,
            "fraud_type": "Phishing Contract",
            "amount_lost": "₹9,80,000",
            "investigator": "Inv. Rahul Verma",
            "organization": "Cyber Crime Unit"
        }
    ]

    for c in cases_data:
        case_obj = Case(**c)
        db.add(case_obj)

    # 5. Evidence item matching screenshot
    ev_hash = blockchain_audit_service.compute_evidence_hash({
        "case_id": "CR-2026-00182",
        "tx_hash": "0x8ab29c41829ea4b1239857218900192a83819208a9f201099238471928371928",
        "primary_wallet": "0x71C8F794B2a6886e088a29A7228800Fc92779A42",
        "amount": "2.4 ETH",
        "risk_score": 87,
        "fraud_type": "Wallet Drainer + Phishing Vector",
        "timestamp": "26 Aug 2026, 14:32"
    })
    
    # Anchor to mock blockchain ledger
    audit_rec = blockchain_audit_service.record_investigation_on_chain(
        case_id="CR-2026-00182",
        tx_hash="0x8ab29c41829ea4b1239857218900192a83819208a9f201099238471928371928",
        risk_score=87,
        evidence_hash=ev_hash,
        primary_classification="Wallet Drainer + Phishing Vector"
    )

    ev = Evidence(
        evidence_id="EV-10282",
        case_id="CR-2026-00182",
        tx_hash="0x8ab29c41829ea4b1239857218900192a83819208a9f201099238471928371928",
        source_blockchain="Ethereum Blockchain",
        amount="2.4 ETH",
        from_wallet="0x82a91f3a6a9b4cfb06159c39fa421184a22b71f3",
        to_wallet="0x71C8F794B2a6886e088a29A7228800Fc92779A42",
        evidence_hash=ev_hash,
        added_by="INV-182",
        on_chain_tx_hash=audit_rec["on_chain_tx_hash"],
        block_number=audit_rec["block_number"],
        is_verified_on_chain=True
    )
    db.add(ev)

    # 6. Recent Alerts from UI Screenshot
    alerts_data = [
        {
            "title": "High risk wallet detected",
            "subtitle": "0x71C...9A42",
            "severity": "HIGH",
            "wallet_address": "0x71C8F794B2a6886e088a29A7228800Fc92779A42",
            "alert_type": "High risk wallet detected",
            "timestamp": datetime.datetime.utcnow() - datetime.timedelta(minutes=2)
        },
        {
            "title": "Large suspicious transaction",
            "subtitle": "12.45 ETH transfer to unverified drainer contract",
            "severity": "HIGH",
            "wallet_address": "0xAA38221890e0c5fb6e680a7114138e68224435FB",
            "alert_type": "Large suspicious transaction",
            "timestamp": datetime.datetime.utcnow() - datetime.timedelta(minutes=9)
        },
        {
            "title": "New fraud report submitted",
            "subtitle": "Fraud report #FR-8821 attached to active cluster",
            "severity": "MEDIUM",
            "wallet_address": "0x33F486a424269be4326f95d82084b655d81b6821",
            "alert_type": "New report submitted",
            "timestamp": datetime.datetime.utcnow() - datetime.timedelta(minutes=15)
        },
        {
            "title": "Connected to scam wallet",
            "subtitle": "0x19B...2804 interacted with flagged mixer",
            "severity": "HIGH",
            "wallet_address": "0x19b08f8832a82914101e1882361b17a102712804",
            "alert_type": "Connected to scam wallet",
            "timestamp": datetime.datetime.utcnow() - datetime.timedelta(minutes=23)
        }
    ]

    for al in alerts_data:
        db.add(Alert(**al))

    # 7. Audit Log entries
    logs = [
        AuditLog(actor="INV-182 (Rahul Verma)", action="Investigator Authenticated", target_resource="Portal Session", details="MFA verified successfully (Org: CYBER-INTEL-HQ)"),
        AuditLog(actor="INV-182 (Rahul Verma)", action="Wallet Analyzed", target_resource="0x71C8F794B2a6886e088a29A7228800Fc92779A42", details="Risk engine evaluated composite risk score: 87/100 (HIGH RISK)"),
        AuditLog(actor="INV-182 (Rahul Verma)", action="Evidence Anchored On-Chain", target_resource="EV-10282", details=f"SHA-256 Digest {ev_hash[:16]}... anchored on Sepolia testnet at tx {audit_rec['on_chain_tx_hash'][:18]}...")
    ]
    db.add_all(logs)

    db.commit()
    print("[CryptoShield] Intelligence database seeded successfully.")
