import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine, SessionLocal
from app.seed_data import initialize_database_seeds
from app.ml_engine import ml_service
from app.risk_engine import risk_engine
from app.blockchain_audit import blockchain_audit_service
from app.graph_engine import graph_service

# Initialize test database tables and seeds
Base.metadata.create_all(bind=engine)
db = SessionLocal()
initialize_database_seeds(db)
db.close()

client = TestClient(app)

def test_ml_model_evaluation():
    """Verify ML models are trained, metrics are calculated without fabrication"""
    assert ml_service.is_trained == True
    metrics = ml_service.model_metrics
    assert "rf" in metrics
    assert "xgboost" in metrics
    # ROC-AUC should be high (~0.90+) based on the research paper's SMOTE-balanced models
    assert metrics["rf"]["roc_auc"] > 0.85
    assert metrics["xgboost"]["roc_auc"] > 0.85
    assert "confusion_matrix" in metrics["rf"]
    assert "feature_importances" in metrics["xgboost"]

def test_address_poisoning_detection():
    """Verify address poisoning detection logic"""
    tx_data = {
        "sender": "0x71C8F794B2a6886e088a29A7228800Fc92779A42",
        "receiver": "0x82a91000000000000000000000000000000071f3", # vanity collision
        "amount": 0.00005,
        "currency": "ETH"
    }
    wallet_info = {
        "historical_recipients": ["0x82a91f3a6a9b4cfb06159c39fa421184a22b71f3"]
    }
    res = risk_engine.analyze_transaction(tx_data, wallet_info)
    assert res["risk_score"] >= 80
    assert "Address Poisoning Attack" in res["primary_classification"]
    assert res["risk_level"] == "HIGH"

def test_wallet_drainer_detection():
    """Verify wallet drainer & phishing detection logic"""
    tx_data = {
        "sender": "0x82a91f3a6a9b4cfb06159c39fa421184a22b71f3",
        "receiver": "0x71C8F794B2a6886e088a29A7228800Fc92779A42",
        "amount": 12.5,
        "currency": "ETH"
    }
    res = risk_engine.analyze_transaction(tx_data)
    assert res["risk_score"] >= 85
    assert res["risk_level"] == "HIGH"
    assert "Drainer" in res["primary_classification"] or "Phishing" in res["primary_classification"]

def test_blockchain_evidence_hashing_and_verification():
    """Verify SHA-256 evidence hashing and tamper-evident proof generation"""
    case_payload = {
        "case_id": "CR-2026-TEST-01",
        "tx_hash": "0xabc123test",
        "primary_wallet": "0x71C8F794B2a6886e088a29A7228800Fc92779A42",
        "amount": "5.0 ETH",
        "risk_score": 90,
        "fraud_type": "Investment Scam",
        "timestamp": "2026-08-26"
    }
    ev_hash = blockchain_audit_service.compute_evidence_hash(case_payload)
    assert len(ev_hash) == 64 # 64 hex characters (256-bit SHA-256)

    # Anchor on-chain
    record = blockchain_audit_service.record_investigation_on_chain(
        case_id="CR-2026-TEST-01",
        tx_hash="0xabc123test",
        risk_score=90,
        evidence_hash=ev_hash,
        primary_classification="Investment Scam"
    )
    assert record["verified"] == True
    assert record["on_chain_tx_hash"].startswith("0x")

    # Verify
    is_valid, stored = blockchain_audit_service.verify_on_chain_evidence("CR-2026-TEST-01", ev_hash)
    assert is_valid == True
    assert stored["evidence_hash"] == ev_hash

def test_follow_money_graph_traversal():
    """Verify multi-hop money flow tracing"""
    trace = graph_service.follow_the_money("0x82a91f3a6a9b4cfb06159c39fa421184a22b71f3", max_hops=3)
    assert "total_amount_traced_eth" in trace
    assert trace["wallets_involved_count"] >= 1
    assert "timeline" in trace

def test_investigator_login_api():
    """Verify investigator login with MFA"""
    res = client.post("/api/v1/auth/investigator-login", json={
        "organization_id": "CYBER-INTEL-HQ",
        "investigator_id": "INV-182",
        "password": "Shield@2026",
        "otp_code": "123456"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["user_type"] == "investigator"

def test_pre_transaction_risk_check_api():
    """Verify pre-transaction warning endpoint for consumer wallet"""
    res = client.post("/api/v1/transactions/pre-check", json={
        "sender": "0x82a91f3a6a9b4cfb06159c39fa421184a22b71f3",
        "recipient": "0x71C8F794B2a6886e088a29A7228800Fc92779A42",
        "amount": 0.82,
        "currency": "ETH",
        "blockchain": "Ethereum"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["risk_level"] == "HIGH"
    assert data["is_dangerous"] == True
    assert len(data["reasons"]) > 0
