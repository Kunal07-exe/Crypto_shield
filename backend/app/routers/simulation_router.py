from fastapi import APIRouter, Query, HTTPException
from typing import Optional, Dict, Any
from app.simulator import simulator_service, SIMULATION_SCENARIOS

router = APIRouter(prefix="/simulation", tags=["Simulation & Resilience Gateway"])

@router.get("/scenarios")
def list_available_scenarios():
    return [
        {
            "id": s["type"],
            "description": s["desc"],
            "sender": s["sender"],
            "receiver": s["receiver"],
            "amount_sample": s["amount_range"]
        } for s in SIMULATION_SCENARIOS
    ]

@router.post("/trigger")
async def trigger_simulation_event(scenario: Optional[str] = Query(None)):
    """
    MANUAL ATTACK SIMULATOR:
    Injects a live on-chain attack vector (Address Poisoning, Drainer, Mule Layering, Exchange Cashout),
    evaluates through 6-layer pipeline, updates database & graph, and broadcasts through WebSockets.
    """
    res = simulator_service.generate_single_transaction(forced_scenario=scenario)
    
    # Broadcast through WebSockets to update dashboard counters & alerts immediately
    await simulator_service.broadcast({
        "event": "NEW_TRANSACTION",
        "data": res
    })
    
    return {
        "status": "Event Generated & Broadcasted Successfully",
        "scenario_triggered": scenario or "RANDOM",
        "transaction": res
    }

@router.get("/resilience-health")
def get_provider_mesh_health():
    return {
        "primary_gateway": {
            "name": "Provider A (Infura Gateway Node 1)",
            "status": "ONLINE",
            "latency_ms": 42,
            "success_rate": "99.98%",
            "circuit_breaker": "CLOSED (Normal)"
        },
        "secondary_gateway": {
            "name": "Provider B (Alchemy Resilience Relay)",
            "status": "STANDBY / HOT REPLICA",
            "latency_ms": 58,
            "success_rate": "99.95%",
            "circuit_breaker": "CLOSED (Normal)"
        },
        "tertiary_gateway": {
            "name": "Provider C (QuickNode Multi-Region Mesh)",
            "status": "STANDBY",
            "latency_ms": 71,
            "success_rate": "99.90%",
            "circuit_breaker": "CLOSED (Normal)"
        },
        "rate_limiting": {
            "current_rpm": 384,
            "max_allowed_rpm": 5000,
            "throttled_requests": 0
        },
        "response_cache": {
            "hit_ratio": "84.2%",
            "cached_keys_count": 14209
        }
    }
