import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import Base, engine, SessionLocal
from app.seed_data import initialize_database_seeds
from app.simulator import simulator_service
from app.graph_engine import graph_service
from app.models import Transaction, Wallet

from app.routers import (
    auth_router,
    wallet_router,
    tx_router,
    graph_router,
    case_router,
    evidence_router,
    alert_router,
    report_router,
    ml_router,
    simulation_router,
    ws_router
)

def _populate_graph_from_db(db):
    """Load all wallets and transactions from DB into the in-memory graph engine on startup."""
    print("[CryptoShield] Loading graph from database...")
    
    # Register all wallets as nodes
    wallets = db.query(Wallet).all()
    for w in wallets:
        graph_service.register_node(
            address=w.address,
            risk_score=w.risk_score,
            node_type=w.wallet_type,
            balance=w.balance_eth,
            tags=w.tags or []
        )
    
    # Register all transactions as edges
    transactions = db.query(Transaction).order_by(Transaction.timestamp.asc()).all()
    for tx in transactions:
        # Auto-register nodes for addresses not already registered
        for addr in [tx.sender, tx.receiver]:
            if addr.lower() not in graph_service.nodes:
                graph_service.register_node(
                    address=addr,
                    risk_score=tx.risk_score if tx.sender.lower() == addr.lower() else 20,
                    node_type="Wallet",
                    balance=0.0,
                    tags=[]
                )
        
        is_exchange = (
            "binance" in tx.receiver.lower() or
            "exchange" in tx.receiver.lower() or
            "coinbase" in tx.receiver.lower()
        )
        
        graph_service.add_edge(
            from_addr=tx.sender,
            to_addr=tx.receiver,
            amount=tx.amount,
            tx_hash=tx.tx_hash,
            risk=tx.risk_score,
            timestamp=tx.timestamp.strftime("%d %b %Y, %H:%M") if tx.timestamp else "",
            edge_type="exchange" if is_exchange else "flow"
        )
    
    print(f"[CryptoShield] Graph loaded: {len(graph_service.nodes)} nodes, {sum(len(e) for e in graph_service.adj.values())} edges")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB Schema and Seeds
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        initialize_database_seeds(db)
        # Populate graph engine from DB after seeding
        _populate_graph_from_db(db)
    finally:
        db.close()
    
    # Start live transaction background simulator task
    sim_task = asyncio.create_task(simulator_service.run_simulation_loop())
    print("[CryptoShield] Real-Time Platform Initialized & Streaming.")
    yield
    simulator_service.is_running = False
    sim_task.cancel()

app = FastAPI(
    title="CryptoShield - Real-Time Cybercrime Intelligence Platform",
    description="Real-Time Cryptocurrency Wallet & Transaction Fraud Detection, Tracking, Prevention, and Investigation Platform",
    version=settings.VERSION,
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(auth_router.router, prefix=settings.API_V1_STR)
app.include_router(wallet_router.router, prefix=settings.API_V1_STR)
app.include_router(tx_router.router, prefix=settings.API_V1_STR)
app.include_router(graph_router.router, prefix=settings.API_V1_STR)
app.include_router(case_router.router, prefix=settings.API_V1_STR)
app.include_router(evidence_router.router, prefix=settings.API_V1_STR)
app.include_router(alert_router.router, prefix=settings.API_V1_STR)
app.include_router(report_router.router, prefix=settings.API_V1_STR)
app.include_router(ml_router.router, prefix=settings.API_V1_STR)
app.include_router(simulation_router.router, prefix=settings.API_V1_STR)
app.include_router(ws_router.router, prefix=settings.API_V1_STR)

@app.get("/health")
def health_check():
    return {
        "status": "HEALTHY",
        "service": "CryptoShield Enterprise API",
        "version": settings.VERSION,
        "active_ws_subscribers": len(simulator_service.ws_clients),
        "graph_nodes": len(graph_service.nodes),
        "graph_edges": sum(len(e) for e in graph_service.adj.values())
    }
