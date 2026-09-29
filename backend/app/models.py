import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    user_type = Column(String(20), index=True) # "investigator" or "wallet_user"
    organization_id = Column(String(50), nullable=True)
    investigator_id = Column(String(50), unique=True, nullable=True, index=True)
    email = Column(String(100), unique=True, nullable=True, index=True)
    hashed_password = Column(String(255), nullable=True)
    wallet_address = Column(String(100), unique=True, nullable=True, index=True)
    name = Column(String(100), default="Investigator")
    role = Column(String(50), default="Lead Investigator")
    mfa_secret = Column(String(50), default="123456") # Default prototype OTP
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Wallet(Base):
    __tablename__ = "wallets"
    
    id = Column(Integer, primary_key=True, index=True)
    address = Column(String(100), unique=True, index=True, nullable=False)
    blockchain = Column(String(20), default="Ethereum", index=True) # Ethereum, Bitcoin, Solana, BNB, Polygon
    first_seen = Column(DateTime, default=datetime.datetime.utcnow)
    last_seen = Column(DateTime, default=datetime.datetime.utcnow)
    wallet_age_days = Column(Integer, default=30)
    risk_score = Column(Integer, default=15) # 0-100
    confidence = Column(Integer, default=85) # 0-100%
    wallet_type = Column(String(50), default="Standard Wallet") # Exchange, Smart Contract, Mule Wallet, Drainer, Victim, Standard
    status = Column(String(50), default="Active") # Active, Flagged, Under Investigation, Frozen/Monitored
    balance_eth = Column(Float, default=0.0)
    total_tx_count = Column(Integer, default=0)
    incoming_tx_count = Column(Integer, default=0)
    outgoing_tx_count = Column(Integer, default=0)
    total_received_eth = Column(Float, default=0.0)
    total_sent_eth = Column(Float, default=0.0)
    unique_senders = Column(Integer, default=0)
    unique_recipients = Column(Integer, default=0)
    avg_tx_amount_eth = Column(Float, default=0.0)
    tx_velocity_per_hour = Column(Float, default=0.0)
    known_scam_connections = Column(Integer, default=0)
    known_exchange_connections = Column(Integer, default=0)
    suspicious_contract_interactions = Column(Integer, default=0)
    is_monitored = Column(Boolean, default=False)
    tags = Column(JSON, default=list) # e.g. ["HIGH RISK", "EXCHANGE", "MULE"]

class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    tx_hash = Column(String(100), unique=True, index=True, nullable=False)
    blockchain = Column(String(20), default="Ethereum", index=True)
    sender = Column(String(100), index=True, nullable=False)
    receiver = Column(String(100), index=True, nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="ETH")
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    block_number = Column(Integer, default=18942100)
    risk_score = Column(Integer, default=20)
    confidence = Column(Integer, default=80)
    risk_level = Column(String(20), default="LOW") # LOW, MEDIUM, HIGH
    fraud_type = Column(String(100), default="Legitimate Transfer")
    status = Column(String(50), default="CONFIRMED") # CONFIRMED, FLAGGED, BLOCKED_PRE_SETTLEMENT, HELD
    evidence_signals = Column(JSON, default=list)
    reasons = Column(JSON, default=list)
    is_simulated = Column(Boolean, default=True)

class WalletConnection(Base):
    __tablename__ = "wallet_connections"
    
    id = Column(Integer, primary_key=True, index=True)
    source_wallet = Column(String(100), index=True, nullable=False)
    destination_wallet = Column(String(100), index=True, nullable=False)
    transaction_count = Column(Integer, default=1)
    total_amount_eth = Column(Float, default=0.0)
    first_interaction = Column(DateTime, default=datetime.datetime.utcnow)
    last_interaction = Column(DateTime, default=datetime.datetime.utcnow)
    risk_weight = Column(Float, default=0.1)

class Case(Base):
    __tablename__ = "cases"
    
    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. CR-2026-00182
    title = Column(String(200), nullable=False)
    subject = Column(String(100), nullable=False) # target wallet / entity
    primary_wallet = Column(String(100), nullable=False)
    victim_wallet = Column(String(100), nullable=True)
    suspect_wallet = Column(String(100), nullable=True)
    priority = Column(String(20), default="HIGH") # CRITICAL, HIGH, MEDIUM, LOW
    status = Column(String(50), default="Under Investigation") # Under Investigation, Pending Review, High Risk, Low Risk, Resolved, Closed
    risk_score = Column(Integer, default=85)
    fraud_type = Column(String(100), default="Investment Scam")
    amount_lost = Column(String(50), default="₹4,75,000")
    investigator = Column(String(100), default="Inv. Rahul Verma")
    organization = Column(String(100), default="Cyber Crime Unit")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    evidence_items = relationship("Evidence", back_populates="case_rel")

class Evidence(Base):
    __tablename__ = "evidence"
    
    id = Column(Integer, primary_key=True, index=True)
    evidence_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. EV-10282
    case_id = Column(String(50), ForeignKey("cases.case_id"), nullable=False, index=True)
    tx_hash = Column(String(100), nullable=False)
    source_blockchain = Column(String(50), default="Ethereum Blockchain")
    amount = Column(String(50), default="2.4 ETH")
    from_wallet = Column(String(100), nullable=False)
    to_wallet = Column(String(100), nullable=False)
    evidence_hash = Column(String(100), nullable=False) # SHA-256
    added_by = Column(String(50), default="INV-182")
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    on_chain_tx_hash = Column(String(100), nullable=True) # Anchored tx hash
    block_number = Column(Integer, nullable=True)
    is_verified_on_chain = Column(Boolean, default=False)
    
    case_rel = relationship("Case", back_populates="evidence_items")

class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    subtitle = Column(String(200), nullable=True)
    severity = Column(String(20), default="HIGH") # CRITICAL, HIGH, MEDIUM, LOW
    wallet_address = Column(String(100), nullable=True)
    tx_hash = Column(String(100), nullable=True)
    alert_type = Column(String(100), default="High risk wallet detected")
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    is_read = Column(Boolean, default=False)
    details = Column(JSON, default=dict)

class UserFraudReport(Base):
    __tablename__ = "user_fraud_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(String(50), unique=True, index=True) # FR-8821
    reporter_wallet = Column(String(100), nullable=True)
    target_wallet_or_tx = Column(String(100), nullable=False)
    fraud_type = Column(String(100), nullable=False)
    amount_lost = Column(Float, default=0.0)
    currency = Column(String(10), default="ETH")
    incident_date = Column(String(50), nullable=True)
    description = Column(Text, nullable=False)
    evidence_attachment = Column(String(255), nullable=True)
    status = Column(String(50), default="Pending Investigation")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class ThreatIntelEntity(Base):
    __tablename__ = "threat_intel_entities"
    
    id = Column(Integer, primary_key=True, index=True)
    address = Column(String(100), unique=True, index=True, nullable=False)
    entity_name = Column(String(150), nullable=False)
    category = Column(String(50), nullable=False) # Scam, Phishing, Drainer, Mixer, Ransomware, Fake Exchange, High Risk
    risk_level = Column(String(20), default="HIGH")
    reported_count = Column(Integer, default=1)
    source = Column(String(100), default="CryptoShield Threat Mesh / CERT-In")
    added_at = Column(DateTime, default=datetime.datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    actor = Column(String(100), nullable=False) # e.g. "INV-182 (Rahul Verma)"
    action = Column(String(100), nullable=False) # e.g. "Wallet Analyzed", "Evidence Anchored On-Chain"
    target_resource = Column(String(150), nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), default="10.0.4.18")
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
