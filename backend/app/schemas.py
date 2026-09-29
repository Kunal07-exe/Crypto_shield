from typing import List, Optional, Any, Dict
from pydantic import BaseModel, ConfigDict
from datetime import datetime

class InvestigatorLoginRequest(BaseModel):
    organization_id: str
    investigator_id: str
    password: str
    otp_code: str
    remember_me: bool = False

class WalletLoginRequest(BaseModel):
    wallet_address: str
    wallet_provider: str = "MetaMask"

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class WalletResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    address: str
    blockchain: str
    first_seen: datetime
    last_seen: datetime
    wallet_age_days: int
    risk_score: int
    confidence: int
    wallet_type: str
    status: str
    balance_eth: float
    total_tx_count: int
    incoming_tx_count: int
    outgoing_tx_count: int
    total_received_eth: float
    total_sent_eth: float
    unique_senders: int
    unique_recipients: int
    avg_tx_amount_eth: float
    tx_velocity_per_hour: float
    known_scam_connections: int
    known_exchange_connections: int
    suspicious_contract_interactions: int
    is_monitored: bool
    tags: List[str]

class TransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tx_hash: str
    blockchain: str
    sender: str
    receiver: str
    amount: float
    currency: str
    timestamp: datetime
    block_number: int
    risk_score: int
    confidence: int
    risk_level: str
    fraud_type: str
    status: str
    evidence_signals: List[str]
    reasons: List[str]

class ExecutePaymentRequest(BaseModel):
    sender_wallet: str
    recipient_wallet: str
    amount: float
    currency: str = "ETH"
    force_proceed: bool = False

class PreTxRiskCheckRequest(BaseModel):
    sender: str
    recipient: str
    amount: float
    currency: str = "ETH"
    blockchain: str = "Ethereum"

class PreTxRiskCheckResponse(BaseModel):
    recipient_address: str
    risk_score: int
    confidence: int
    risk_level: str
    fraud_type: str
    warning_title: str
    reasons: List[str]
    recommended_action: str
    is_dangerous: bool

class SendToInvestigationRequest(BaseModel):
    tx_hash: str
    notes: Optional[str] = "Flagged by investigator for deep multi-hop tracking"
    priority: str = "HIGH"

class FollowMoneyRequest(BaseModel):
    start_wallet: str
    max_hops: int = 3
    min_amount: float = 0.0

class CaseCreate(BaseModel):
    title: str
    subject: Optional[str] = None
    primary_wallet: str
    victim_wallet: Optional[str] = None
    suspect_wallet: Optional[str] = None
    priority: str = "HIGH"
    fraud_type: str = "Investment Scam"
    amount_lost: str = "₹4,75,000"
    notes: Optional[str] = None

class CaseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    case_id: str
    title: str
    subject: str
    primary_wallet: str
    victim_wallet: Optional[str]
    suspect_wallet: Optional[str]
    priority: str
    status: str
    risk_score: int
    fraud_type: str
    amount_lost: str
    investigator: str
    organization: str
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

class EvidenceCreate(BaseModel):
    case_id: str
    tx_hash: str
    source_blockchain: str = "Ethereum Blockchain"
    amount: str
    from_wallet: str
    to_wallet: str
    added_by: str = "INV-182"

class EvidenceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    evidence_id: str
    case_id: str
    tx_hash: str
    source_blockchain: str
    amount: str
    from_wallet: str
    to_wallet: str
    evidence_hash: str
    added_by: str
    timestamp: datetime
    on_chain_tx_hash: Optional[str]
    block_number: Optional[int]
    is_verified_on_chain: bool

class FraudReportCreate(BaseModel):
    reporter_wallet: Optional[str] = None
    target_wallet_or_tx: str
    fraud_type: str
    amount_lost: float = 0.0
    currency: str = "ETH"
    incident_date: Optional[str] = None
    description: str
    evidence_attachment: Optional[str] = None

class FeedbackSubmission(BaseModel):
    alert_id: Optional[int] = None
    tx_hash: Optional[str] = None
    feedback_type: str
    investigator_notes: Optional[str] = None
