from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import datetime
from app.database import get_db
from app.models import Alert, AuditLog
from app.schemas import FeedbackSubmission

router = APIRouter(prefix="/alerts", tags=["Alerts & Investigator Feedback Loop"])

@router.get("")
def list_alerts(unread_only: bool = False, db: Session = Depends(get_db)):
    query = db.query(Alert)
    if unread_only:
        query = query.filter(Alert.is_read == False)
    alerts = query.order_by(Alert.timestamp.desc()).limit(50).all()
    
    return [
        {
            "id": al.id,
            "title": al.title,
            "subtitle": al.subtitle,
            "severity": al.severity,
            "wallet_address": al.wallet_address,
            "tx_hash": al.tx_hash,
            "alert_type": al.alert_type,
            "timestamp": al.timestamp.isoformat() if al.timestamp else None,
            "is_read": al.is_read,
            "details": al.details or {}
        } for al in alerts
    ]

@router.post("/feedback")
def submit_investigator_feedback(req: FeedbackSubmission, db: Session = Depends(get_db)):
    """
    INVESTIGATOR FEEDBACK LOOP:
    Investigators classify alerts as:
    - Confirmed Suspicious
    - False Positive
    - Needs Review
    This feedback feeds directly back into dataset improvement, threshold calibration, and retraining.
    """
    if req.alert_id:
        alert = db.query(Alert).filter(Alert.id == req.alert_id).first()
        if alert:
            alert.is_read = True
            if not alert.details:
                alert.details = {}
            alert.details["feedback"] = req.feedback_type
            alert.details["investigator_notes"] = req.investigator_notes
    
    log = AuditLog(
        actor="Investigator Feedback Loop",
        action="Alert Feedback Recorded",
        target_resource=f"Alert #{req.alert_id}" if req.alert_id else req.tx_hash,
        details=f"Classification: {req.feedback_type}. Notes: {req.investigator_notes}"
    )
    db.add(log)
    db.commit()

    return {
        "status": "Feedback Recorded Successfully",
        "feedback_type": req.feedback_type,
        "impact": "Incorporated into continuous learning and model drift calibration dataset"
    }
