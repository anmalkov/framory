from __future__ import annotations

import json
import logging

from fastapi import WebSocket, WebSocketDisconnect

from app.models.messages import CommandMessage, ConfigureMessage, PongMessage
from app.services.channel_manager import channel_manager

logger = logging.getLogger(__name__)


async def websocket_handler(websocket: WebSocket, channel_id: str) -> None:
    # Check channel exists
    channel = channel_manager.get_channel(channel_id)
    if not channel:
        await websocket.close(code=4004, reason="Channel not found")
        return

    await websocket.accept()
    await channel_manager.register_client(channel_id, websocket)

    try:
        # Send initial state sync
        await channel_manager.send_state_to(channel_id, websocket)

        while True:
            raw = await websocket.receive_text()
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                await websocket.close(code=4400, reason="Bad message")
                break

            msg_type = data.get("type")

            if msg_type == "command":
                try:
                    msg = CommandMessage(**data)
                    await channel_manager.handle_command(channel_id, msg.action)
                except Exception:
                    logger.warning("Invalid command message: %s", data)

            elif msg_type == "configure":
                try:
                    msg_cfg = ConfigureMessage(**data)
                    await channel_manager.handle_configure(
                        channel_id, msg_cfg.settings.model_dump(exclude_none=True)
                    )
                except Exception:
                    logger.warning("Invalid configure message: %s", data)

            elif msg_type == "ping":
                pong = PongMessage()
                await websocket.send_json(pong.model_dump())

            else:
                await websocket.close(code=4400, reason="Bad message")
                break

    except WebSocketDisconnect:
        pass
    finally:
        await channel_manager.unregister_client(channel_id, websocket)
