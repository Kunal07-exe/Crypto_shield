from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
import datetime
import hashlib
from app.database import get_db
from app.models import Transaction, Wallet, Case, Evidence, Alert, AuditLog
from app.schemas import (
    TransactionResponse, PreTxRiskCheckRequest, PreTxRiskCheckResponse,
    ExecutePaymentRequest, SendToInvestigationRequest
)
from app.risk_engine import risk_engine, KNOWN_THREAT_DATABASE
from app.graph_engine import graph_service
from app.blockchain_audit import blockchain_audit_service
from app.simulator import simulator_service

router = APIRouter(prefix="/transactions", tags=["Transactions & Pre-Tx Protection"])

@router.get("", response_model=List[TransactionResponse])
def list_transactions(
    limit: int = Query(50, ge=1, le=200),
    risk_level: Optional[str] = None,
    wallet: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Transaction)
    if risk_level and risk_level != "ALL":
        query = query.filter(Transaction.risk_level == risk_level.upper())
    if wallet:
        query = query.filter(
            (Transaction.sender.ilike(f"%{wallet}%")) | (Transaction.receiver.ilike(f"%{wallet}%"))
        )
    if search:
        s = f"%{search}%"
        query = query.filter(
            (Transaction.tx_hash.ilike(s)) |
            (Transaction.sender.ilike(s)) |
            (Transaction.receiver.ilike(s)) |
            (Transaction.fraud_type.ilike(s))
        )
    return query.order_by(Transaction.timestamp.desc()).limit(limit).all()

@router.get("/{tx_hash}", response_model=TransactionResponse)
def get_transaction_detail(tx_hash: str, db: Session = Depends(get_db)):
    tx = db.query(Transaction).filter(Transaction.tx_hash.ilike(tx_hash)).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction hash not found in ledger database")
    return tx

@router.post("/execute-payment")
async def execute_user_payment(req: ExecutePaymentRequest, db: Session = Depends(get_db)):
    """
    Executes a real user payment:
    1. Pre-checks recipient risk & provides risk score
    2. Deducts sender balance
    3. Credits recipient / records transaction in ledger
    4. Updates dynamic wallet security score
    5. Broadcasts to WebSocket for real-time UI update
    """
    sender_norm = req.sender_wallet.lower()
    recipient_norm = req.recipient_wallet.lower()

    sender_wallet = db.query(Wallet).filter(Wallet.address.ilike(sender_norm)).first()
    if not sender_wallet:
        sender_wallet = Wallet(
            address=req.sender_wallet,
            blockchain="Ethereum",
            balance_eth=2.45,
            total_tx_count=284,
            risk_score=15
        )
        db.add(sender_wallet)
        db.commit()
        db.refresh(sender_wallet)

    if sender_wallet.balance_eth < req.amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient balance. Current balance is {sender_wallet.balance_eth:.4f} ETH."
        )

    # Perform risk analysis
    sender_info = {
        "wallet_age_days": sender_wallet.wallet_age_days,
        "avg_tx_amount_eth": sender_wallet.avg_tx_amount_eth or 0.5,
        "incoming_tx_count": sender_wallet.incoming_tx_count,
        "outgoing_tx_count": sender_wallet.outgoing_tx_count,
        "historical_recipients": ["0x82a91f3a6a9b4cfb06159c39fa421184a22b71f3", "0x55c68997a3915124019a97f39442011929997f3"]
    }
    tx_payload = {
        "sender": req.sender_wallet,
        "receiver": req.recipient_wallet,
        "amount": req.amount,
        "blockchain": "Ethereum",
        "currency": req.currency
    }
    analysis = risk_engine.analyze_transaction(tx_payload, sender_info)

    # If dangerous and not explicitly forced, return warning check
    if analysis["risk_level"] == "HIGH" and not req.force_proceed:
        return {
            "status": "WARNING_TRIGGERED",
            "warning": True,
            "analysis": analysis,
            "message": "High-risk address warning triggered. Confirmation required."
        }

    # Deduct balance & increment outgoing count
    sender_wallet.balance_eth = round(sender_wallet.balance_eth - req.amount, 4)
    sender_wallet.outgoing_tx_count += 1
    sender_wallet.total_tx_count += 1
    sender_wallet.total_sent_eth = round(sender_wallet.total_sent_eth + req.amount, 4)

    # Generate unique tx hash
    raw_hash_seed = f"{req.sender_wallet}:{req.recipient_wallet}:{req.amount}:{datetime.datetime.utcnow().timestamp()}"
    tx_hash = "0x" + hashlib.sha256(raw_hash_seed.encode("utf-8")).hexdigest()

    new_tx = Transaction(
        tx_hash=tx_hash,
        blockchain="Ethereum",
        sender=req.sender_wallet,
        receiver=req.recipient_wallet,
        amount=req.amount,
        currency=req.currency,
        timestamp=datetime.datetime.utcnow(),
        block_number=18942084 + sender_wallet.total_tx_count,
        risk_score=analysis["risk_score"],
        confidence=analysis["confidence"],
        risk_level=analysis["risk_level"],
        fraud_type=analysis["primary_classification"],
        status="CONFIRMED" if analysis["risk_level"] != "HIGH" else "FLAGGED",
        evidence_signals=analysis["evidence_signals"],
        reasons=analysis["reasons"]
    )
    db.add(new_tx)

    # Re-calculate dynamic wallet security score
    user_txs = db.query(Transaction).filter(
        (Transaction.sender.ilike(sender_norm)) | (Transaction.receiver.ilike(sender_norm))
    ).all()
    new_security_score, new_sec_label = risk_engine.calculate_wallet_security_score(sender_wallet, user_txs + [new_tx])
    sender_wallet.risk_score = 100 - new_security_score

    # Add edge to graph engine
    is_exchange = "binance" in recipient_norm or "exchange" in recipient_norm
    graph_service.add_edge(
        from_addr=req.sender_wallet,
        to_addr=req.recipient_wallet,
        amount=req.amount,
        tx_hash=tx_hash,
        risk=analysis["risk_score"],
        timestamp="Just now",
        edge_type="exchange" if is_exchange else "flow"
    )

    db.commit()
    db.refresh(sender_wallet)
    db.refresh(new_tx)

    # Broadcast event via WebSocket
    tx_dict = {
        "tx_hash": tx_hash,
        "sender": req.sender_wallet,
        "receiver": req.recipient_wallet,
        "amount": req.amount,
        "currency": req.currency,
        "risk_score": analysis["risk_score"],
        "confidence": analysis["confidence"],
        "risk_level": analysis["risk_level"],
        "fraud_type": analysis["primary_classification"],
        "reasons": analysis["reasons"],
        "timestamp": new_tx.timestamp.isoformat(),
        "has_alert": analysis["risk_level"] == "HIGH"
    }
    await simulator_service.broadcast({
        "event": "NEW_TRANSACTION",
        "data": tx_dict
    })

    return {
        "status": "CONFIRMED",
        "tx_hash": tx_hash,
        "new_balance": sender_wallet.balance_eth,
        "new_security_score": new_security_score,
        "security_label": new_sec_label,
        "analysis": analysis
    }

@router.post("/send-to-investigation")
def send_transaction_to_investigation(req: SendToInvestigationRequest, db: Session = Depends(get_db)):
    """
    INVESTIGATION FEATURE:
    Allows an investigator or system operator to convert a suspicious transaction into an official case.
    Auto-anchors evidence to the Solidity smart contract ledger and notifies all analysts.
    """
    tx = db.query(Transaction).filter(Transaction.tx_hash.ilike(req.tx_hash)).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    count = db.query(Case).count() + 1
    case_id = f"CR-2026-{182 + count:05d}"

    new_case = Case(
        case_id=case_id,
        title=f"Forensic Investigation on Tx {tx.tx_hash[:10]}...",
        subject=f"{tx.receiver[:6]}...{tx.receiver[-4:]}",
        primary_wallet=tx.receiver,
        victim_wallet=tx.sender,
        suspect_wallet=tx.receiver,
        priority=req.priority,
        status="Under Investigation",
        risk_score=tx.risk_score,
        fraud_type=tx.fraud_type,
        amount_lost=f"{tx.amount} {tx.currency}",
        investigator="Inv. Rahul Verma",
        organization="Cyber Crime Unit",
        notes=req.notes
    )
    db.add(new_case)

    # Compute & anchor SHA-256 evidence hash
    ev_hash = blockchain_audit_service.compute_evidence_hash({
        "case_id": case_id,
        "tx_hash": tx.tx_hash,
        "primary_wallet": tx.receiver,
        "amount": f"{tx.amount} {tx.currency}",
        "risk_score": tx.risk_score,
        "fraud_type": tx.fraud_type,
        "timestamp": datetime.datetime.utcnow().isoformat()
    })
    audit_rec = blockchain_audit_service.record_investigation_on_chain(
        case_id=case_id,
        tx_hash=tx.tx_hash,
        risk_score=tx.risk_score,
        evidence_hash=ev_hash,
        primary_classification=tx.fraud_type
    )

    ev_count = db.query(Evidence).count() + 1
    evidence_item = Evidence(
        evidence_id=f"EV-{10282 + ev_count}",
        case_id=case_id,
        tx_hash=tx.tx_hash,
        source_blockchain=tx.blockchain,
        amount=f"{tx.amount} {tx.currency}",
        from_wallet=tx.sender,
        to_wallet=tx.receiver,
        evidence_hash=ev_hash,
        added_by="INV-182",
        on_chain_tx_hash=audit_rec["on_chain_tx_hash"],
        block_number=audit_rec["block_number"],
        is_verified_on_chain=True
    )
    db.add(evidence_item)

    # Generate Alert
    new_alert = Alert(
        title="Transaction Escalated to Investigation",
        subtitle=f"Case {case_id} initialized for {tx.amount} {tx.currency} transfer",
        severity="HIGH",
        wallet_address=tx.receiver,
        tx_hash=tx.tx_hash,
        alert_type="Case Escalation",
        details={"case_id": case_id, "evidence_id": evidence_item.evidence_id}
    )
    db.add(new_alert)

    # Log audit
    log = AuditLog(
        actor="INV-182 (Rahul Verma)",
        action="Transaction Sent to Investigation",
        target_resource=case_id,
        details=f"Escalated tx {tx.tx_hash} with SHA-256 evidence hash {ev_hash[:16]}..."
    )
    db.add(log)
    db.commit()

    return {
        "status": "Escalated Successfully",
        "case_id": case_id,
        "evidence_id": evidence_item.evidence_id,
        "on_chain_tx_hash": audit_rec["on_chain_tx_hash"],
        "message": f"Transaction has been escalated to active Case {case_id} and anchored on-chain."
    }

@router.post("/pre-check", response_model=PreTxRiskCheckResponse)
def pre_transaction_risk_check(req: PreTxRiskCheckRequest, db: Session = Depends(get_db)):
    sender_wallet = db.query(Wallet).filter(Wallet.address.ilike(req.sender.lower())).first()
    sender_info = {
        "wallet_age_days": sender_wallet.wallet_age_days if sender_wallet else 30,
        "avg_tx_amount_eth": sender_wallet.avg_tx_amount_eth if sender_wallet else 0.5,
        "historical_recipients": ["0x82a91f3a6a9b4cfb06159c39fa421184a22b71f3", "0x55c68997a3915124019a97f39442011929997f3"]
    }
    tx_payload = {
        "sender": req.sender,
        "receiver": req.recipient,
        "amount": req.amount,
        "blockchain": req.blockchain,
        "currency": req.currency
    }
    analysis = risk_engine.analyze_transaction(tx_payload, sender_info)
    is_dangerous = analysis["risk_level"] in ["HIGH", "MEDIUM"]
    warning_title = "TRANSACTION WARNING" if analysis["risk_level"] == "HIGH" else ("CAUTION ADVISED" if analysis["risk_level"] == "MEDIUM" else "TRANSACTION SAFE")

    return {
        "recipient_address": req.recipient,
        "risk_score": analysis["risk_score"],
        "confidence": analysis["confidence"],
        "risk_level": analysis["risk_level"],
        "fraud_type": analysis["primary_classification"],
        "warning_title": warning_title,
        "reasons": analysis["reasons"],
        "recommended_action": analysis["recommended_action"],
        "is_dangerous": is_dangerous
    }
