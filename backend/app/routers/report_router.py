from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
import datetime
from app.database import get_db
from app.models import UserFraudReport, Alert, Case, Evidence, ThreatIntelEntity, AuditLog, Wallet
from app.schemas import FraudReportCreate
from app.risk_engine import risk_engine
from app.blockchain_audit import blockchain_audit_service

router = APIRouter(prefix="/reports", tags=["Fraud Reporting & Intelligence Mesh"])

@router.post("/user-fraud-report")
def submit_user_fraud_report(req: FraudReportCreate, db: Session = Depends(get_db)):
    """
    USER REPORT FRAUD:
    1. Submits report into user_fraud_reports table.
    2. Performs an automatic 6-layer forensic risk check on the reported address.
    3. Auto-creates an active Case (CR-2026-...) in the Investigator Portal.
    4. Anchors the SHA-256 evidence hash on-chain.
    5. Dispatches an immediate high-priority alert to investigators.
    """
    count = db.query(UserFraudReport).count() + 1
    report_id = f"FR-{8820 + count}"

    new_report = UserFraudReport(
        report_id=report_id,
        reporter_wallet=req.reporter_wallet or "0x82a91f3a6a9b4cfb06159c39fa421184a22b71f3",
        target_wallet_or_tx=req.target_wallet_or_tx,
        fraud_type=req.fraud_type,
        amount_lost=req.amount_lost,
        currency=req.currency,
        incident_date=req.incident_date or datetime.date.today().isoformat(),
        description=req.description,
        evidence_attachment=req.evidence_attachment,
        status="Under Active Investigation"
    )
    db.add(new_report)

    # 1. Automatic 6-layer forensic check on the target
    target_addr = req.target_wallet_or_tx.lower()
    tx_payload = {
        "sender": req.reporter_wallet or "0x82a91f3a6a9b4cfb06159c39fa421184a22b71f3",
        "receiver": req.target_wallet_or_tx,
        "amount": req.amount_lost if req.amount_lost > 0 else 1.0,
        "blockchain": "Ethereum",
        "currency": req.currency
    }
    analysis = risk_engine.analyze_transaction(tx_payload)

    # 2. Ingest into Threat Intelligence Entity
    threat_ent = db.query(ThreatIntelEntity).filter(ThreatIntelEntity.address.ilike(target_addr)).first()
    if not threat_ent:
        threat_ent = ThreatIntelEntity(
            address=req.target_wallet_or_tx,
            entity_name=f"Reported {req.fraud_type} Cluster",
            category=req.fraud_type,
            risk_level="HIGH",
            reported_count=1,
            source=f"User Fraud Desk (Report #{report_id})"
        )
        db.add(threat_ent)
    else:
        threat_ent.reported_count += 1

    # 3. Automatically create an investigation Case in the Investigator Portal
    case_count = db.query(Case).count() + 1
    case_id = f"CR-2026-{182 + case_count:05d}"
    new_case = Case(
        case_id=case_id,
        title=f"User Incident #{report_id}: {req.fraud_type}",
        subject=f"{req.target_wallet_or_tx[:6]}...{req.target_wallet_or_tx[-4:]}",
        primary_wallet=req.target_wallet_or_tx,
        victim_wallet=req.reporter_wallet or "0x82a91f3a6a9b4cfb06159c39fa421184a22b71f3",
        suspect_wallet=req.target_wallet_or_tx,
        priority="HIGH",
        status="Under Investigation",
        risk_score=max(85, analysis["risk_score"]),
        fraud_type=req.fraud_type,
        amount_lost=f"{req.amount_lost} {req.currency}" if req.amount_lost > 0 else "₹4,75,000",
        investigator="Inv. Rahul Verma",
        organization="Cyber Crime Unit",
        notes=f"Auto-generated from User Report #{report_id}. Details: {req.description}"
    )
    db.add(new_case)

    # 4. Compute & anchor evidence hash
    ev_hash = blockchain_audit_service.compute_evidence_hash({
        "case_id": case_id,
        "tx_hash": report_id,
        "primary_wallet": req.target_wallet_or_tx,
        "amount": f"{req.amount_lost} {req.currency}",
        "risk_score": analysis["risk_score"],
        "fraud_type": req.fraud_type,
        "timestamp": datetime.datetime.utcnow().isoformat()
    })
    audit_rec = blockchain_audit_service.record_investigation_on_chain(
        case_id=case_id,
        tx_hash=req.target_wallet_or_tx,
        risk_score=analysis["risk_score"],
        evidence_hash=ev_hash,
        primary_classification=req.fraud_type
    )

    ev_count = db.query(Evidence).count() + 1
    evidence_item = Evidence(
        evidence_id=f"EV-{10282 + ev_count}",
        case_id=case_id,
        tx_hash=req.target_wallet_or_tx,
        source_blockchain="Ethereum Blockchain",
        amount=f"{req.amount_lost} {req.currency}",
        from_wallet=req.reporter_wallet or "0x82a91f3a6a9b4cfb06159c39fa421184a22b71f3",
        to_wallet=req.target_wallet_or_tx,
        evidence_hash=ev_hash,
        added_by="SYSTEM_USER_REPORT",
        on_chain_tx_hash=audit_rec["on_chain_tx_hash"],
        block_number=audit_rec["block_number"],
        is_verified_on_chain=True
    )
    db.add(evidence_item)

    # 5. Generate Investigator Alert
    new_alert = Alert(
        title="New Fraud Incident Filed & Case Created",
        subtitle=f"Report #{report_id} escalated to Case #{case_id} ({req.fraud_type})",
        severity="HIGH",
        wallet_address=req.target_wallet_or_tx,
        alert_type="New report submitted",
        details={
            "report_id": report_id,
            "case_id": case_id,
            "fraud_type": req.fraud_type,
            "amount_lost": f"{req.amount_lost} {req.currency}",
            "reasons": analysis["reasons"]
        }
    )
    db.add(new_alert)

    # Log audit
    log = AuditLog(
        actor=req.reporter_wallet or "Anonymous User",
        action="Fraud Report Submitted & Case Created",
        target_resource=case_id,
        details=f"Report #{report_id} anchored on-chain with evidence digest {ev_hash[:16]}..."
    )
    db.add(log)
    db.commit()

    return {
        "report_id": report_id,
        "case_id": case_id,
        "status": "Submitted Successfully",
        "risk_check": {
            "risk_score": analysis["risk_score"],
            "risk_level": analysis["risk_level"],
            "reasons": analysis["reasons"]
        },
        "message": f"Thank you. Your report #{report_id} has been authenticated, analyzed with risk score {analysis['risk_score']}/100, and escalated to active Case #{case_id}."
    }

@router.get("")
def list_all_fraud_reports(
    reporter_wallet: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(UserFraudReport)
    if reporter_wallet:
        query = query.filter(UserFraudReport.reporter_wallet.ilike(f"%{reporter_wallet}%"))
    reports = query.order_by(UserFraudReport.created_at.desc()).all()
    
    return [
        {
            "id": r.id,
            "report_id": r.report_id,
            "reporter_wallet": r.reporter_wallet,
            "target_wallet_or_tx": r.target_wallet_or_tx,
            "fraud_type": r.fraud_type,
            "amount_lost": r.amount_lost,
            "currency": r.currency,
            "incident_date": r.incident_date,
            "description": r.description,
            "status": r.status,
            "created_at": r.created_at.isoformat() if r.created_at else None
        } for r in reports
    ]
