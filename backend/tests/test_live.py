import json

import pytest

from app.api.live import EventBroadcaster


class FakeWebSocket:
    def __init__(self, fail=False):
        self.fail = fail
        self.accepted = False
        self.messages = []

    async def accept(self):
        self.accepted = True

    async def send_text(self, payload):
        if self.fail:
            raise RuntimeError("socket closed")
        self.messages.append(payload)


@pytest.mark.asyncio
async def test_broadcaster_connect_and_publish():
    broadcaster = EventBroadcaster()
    websocket = FakeWebSocket()

    await broadcaster.connect(websocket)
    await broadcaster.publish({"type": "telemetry", "event_id": "evt-1"})

    assert websocket.accepted is True
    assert len(websocket.messages) == 1
    assert json.loads(websocket.messages[0]) == {
        "type": "telemetry",
        "event_id": "evt-1",
    }


@pytest.mark.asyncio
async def test_broadcaster_removes_stale_clients():
    broadcaster = EventBroadcaster()
    healthy = FakeWebSocket()
    stale = FakeWebSocket(fail=True)

    await broadcaster.connect(healthy)
    await broadcaster.connect(stale)

    await broadcaster.publish({"type": "telemetry"})

    assert healthy.messages
    assert stale not in broadcaster._clients
    assert healthy in broadcaster._clients
