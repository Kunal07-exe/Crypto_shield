from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.simulator import simulator_service

router = APIRouter(tags=["WebSockets"])

@router.websocket("/ws/live-stream")
async def websocket_live_stream_endpoint(websocket: WebSocket):
    await websocket.accept()
    simulator_service.register_client(websocket)
    # Send welcome ping
    await websocket.send_json({
        "event": "CONNECTED",
        "message": "Connected to CryptoShield Real-Time Event Pipeline"
    })
    try:
        while True:
            # Keep connection open and receive optional client messages
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        simulator_service.unregister_client(websocket)
    except Exception:
        simulator_service.unregister_client(websocket)
