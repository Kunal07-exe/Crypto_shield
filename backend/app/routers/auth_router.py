from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Wallet, AuditLog
from app.schemas import InvestigatorLoginRequest, WalletLoginRequest, TokenResponse
from app.auth import verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/investigator-login", response_model=TokenResponse)
def investigator_login(req: InvestigatorLoginRequest, db: Session = Depends(get_db)):
    """
    Investigator Portal Login:
    Requires Org ID, Investigator ID / Email, Password, and MFA/2FA Code (Default demo: 123456)
    """
    user = db.query(User).filter(
        (User.investigator_id == req.investigator_id) | (User.email == req.investigator_id)
    ).first()

    if not user or user.user_type != "investigator":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid investigator credentials or organization clearance."
        )

    if not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password for investigator account."
        )

    if req.otp_code != user.mfa_secret and req.otp_code != "123456":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid 2FA / OTP verification code."
        )

    # Log audit entry
    log = AuditLog(
        actor=f"{user.investigator_id} ({user.name})",
        action="Investigator Authenticated",
        target_resource="Investigator Portal",
        details=f"Successful MFA login for Org: {req.organization_id}"
    )
    db.add(log)
    db.commit()

    token = create_access_token({"sub": str(user.id), "role": "investigator"})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "role": user.role,
            "organization_id": req.organization_id,
            "investigator_id": user.investigator_id,
            "email": user.email,
            "user_type": user.user_type
        }
    }

@router.post("/wallet-login", response_model=TokenResponse)
def wallet_login(req: WalletLoginRequest, db: Session = Depends(get_db)):
    """
    Wallet / User Portal Login:
    Connects with zero private key exposure (MetaMask / WalletConnect / Coinbase).
    """
    addr_norm = req.wallet_address.lower()
    user = db.query(User).filter(User.wallet_address.ilike(addr_norm)).first()
    if not user:
        user = User(
            user_type="wallet_user",
            wallet_address=req.wallet_address,
            name="Crypto User",
            email=f"{addr_norm[:8]}@wallet.user"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Ensure wallet record exists in database
    wallet = db.query(Wallet).filter(Wallet.address.ilike(addr_norm)).first()
    if not wallet:
        wallet = Wallet(
            address=req.wallet_address,
            blockchain="Ethereum",
            wallet_age_days=180,
            risk_score=15,
            confidence=90,
            wallet_type="Retail User Wallet",
            status="Active",
            balance_eth=2.45,
            total_tx_count=284,
            tags=["LOW RISK", "VERIFIED"]
        )
        db.add(wallet)
        db.commit()

    token = create_access_token({"sub": str(user.id), "role": "wallet_user"})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "wallet_address": user.wallet_address,
            "user_type": user.user_type,
            "wallet_provider": req.wallet_provider
        }
    }

@router.get("/me")
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return {
        "id": current_user.id,
        "name": current_user.name,
        "role": current_user.role,
        "investigator_id": current_user.investigator_id,
        "wallet_address": current_user.wallet_address,
        "user_type": current_user.user_type
    }
