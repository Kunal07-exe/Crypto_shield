from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import datetime
from app.database import get_db
from app.models import Evidence, Case, AuditLog
from app.schemas import EvidenceCreate, EvidenceResponse
from app.blockchain_audit import blockchain_audit_service

router = APIRouter(prefix="/evidence", tags=["Evidence & Blockchain Audit"])

@router.get("", response_model=List[EvidenceResponse])
def list_evidence(case_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Evidence)
    if case_id:
        query = query.filter(Evidence.case_id == case_id)
    return query.order_by(Evidence.timestamp.desc()).all()

@router.post("", response_model=EvidenceResponse)
def add_evidence(req: EvidenceCreate, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.case_id == req.case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail=f"Case {req.case_id} not found")

    count = db.query(Evidence).count() + 1
    evidence_id = f"EV-{10282 + count}"

    # Compute deterministic SHA-256 fingerprint of evidence package
    ev_hash = blockchain_audit_service.compute_evidence_hash({
        "case_id": req.case_id,
        "tx_hash": req.tx_hash,
        "primary_wallet": case.primary_wallet,
        "amount": req.amount,
        "risk_score": case.risk_score,
        "fraud_type": case.fraud_type,
        "timestamp": datetime.datetime.utcnow().isoformat()
    })

    # Anchor to blockchain via smart contract
    audit_rec = blockchain_audit_service.record_investigation_on_chain(
        case_id=req.case_id,
        tx_hash=req.tx_hash,
        risk_score=case.risk_score,
        evidence_hash=ev_hash,
        primary_classification=case.fraud_type
    )

    evidence_item = Evidence(
        evidence_id=evidence_id,
        case_id=req.case_id,
        tx_hash=req.tx_hash,
        source_blockchain=req.source_blockchain,
        amount=req.amount,
        from_wallet=req.from_wallet,
        to_wallet=req.to_wallet,
        evidence_hash=ev_hash,
        added_by=req.added_by,
        on_chain_tx_hash=audit_rec["on_chain_tx_hash"],
        block_number=audit_rec["block_number"],
        is_verified_on_chain=True
    )
    db.add(evidence_item)

    # Log audit
    log = AuditLog(
        actor=req.added_by,
        action="Evidence Anchored On-Chain",
        target_resource=evidence_id,
        details=f"SHA-256 Digest {ev_hash[:16]}... anchored on Sepolia testnet at tx {audit_rec['on_chain_tx_hash'][:18]}..."
    )
    db.add(log)
    db.commit()
    db.refresh(evidence_item)

    return evidence_item

@router.get("/verify/{evidence_id}")
def verify_evidence_on_chain(evidence_id: str, db: Session = Depends(get_db)):
    """
    Cryptographic verification endpoint to prove evidence integrity against blockchain records.
    """
    ev = db.query(Evidence).filter(Evidence.evidence_id == evidence_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Evidence item not found")

    is_valid, record = blockchain_audit_service.verify_on_chain_evidence(ev.case_id, ev.evidence_hash)

    return {
        "evidence_id": ev.evidence_id,
        "case_id": ev.case_id,
        "evidence_hash": ev.evidence_hash,
        "on_chain_tx_hash": ev.on_chain_tx_hash,
        "block_number": ev.block_number,
        "contract_address": blockchain_audit_service.contract_address,
        "network": blockchain_audit_service.network_name,
        "is_immutable_and_verified": is_valid,
        "timestamp": ev.timestamp.isoformat(),
        "recorded_by": record.get("recorded_by", "Authorized Investigator Key")
    }
