from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.graph_engine import graph_service
from app.schemas import FollowMoneyRequest

router = APIRouter(prefix="/graph", tags=["Network Graph & Follow Money"])

@router.get("/overview")
def get_graph_network_overview():
    """
    Returns full node-link graph for interactive Canvas / D3 visualization.
    Color coding:
    - Red (#ef4444): High Risk
    - Orange/Yellow (#f59e0b): Medium Risk
    - Green (#10b981): Low Risk
    - Blue (#3b82f6): Centralized Exchange
    - Purple (#a855f7): Reported Scam Node
    """
    return graph_service.get_full_graph()

@router.post("/follow-money")
def follow_the_money_trace(req: FollowMoneyRequest):
    """
    FOLLOW MONEY feature:
    Traces multi-hop fund movements from 1 to 10 hops downstream.
    Returns cumulative amounts, hops, exchange exits, and full chronological timeline.
    """
    if req.max_hops < 1 or req.max_hops > 10:
        raise HTTPException(status_code=400, detail="Trace depth must be between 1 and 10 hops.")

    result = graph_service.follow_the_money(
        start_address=req.start_wallet,
        max_hops=req.max_hops,
        min_amount=req.min_amount
    )
    return result
