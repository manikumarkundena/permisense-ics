import asyncio
import json
from collections import defaultdict
from typing import Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect


class EventBroadcaster:
    def __init__(self) -> None:
        self._clients: set[WebSocket] = set()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self._clients.add(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        self._clients.discard(websocket)

    async def publish(self, message: dict[str, Any]) -> None:
        if not self._clients:
            return

        payload = json.dumps(message, default=str)
        clients = tuple(self._clients)
        stale: list[WebSocket] = []

        for client in clients:
            try:
                await client.send_text(payload)
            except Exception:
                stale.append(client)

        for client in stale:
            self.disconnect(client)


broadcaster = EventBroadcaster()
router = APIRouter(tags=["Live Stream"])


@router.websocket("/ws/events")
async def event_stream(websocket: WebSocket) -> None:
    await broadcaster.connect(websocket)
    try:
        await websocket.send_json({
            "type": "connection",
            "status": "connected",
            "service": "PermiSense",
        })
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        broadcaster.disconnect(websocket)
    except Exception:
        broadcaster.disconnect(websocket)
