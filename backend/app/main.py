from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncIterator

from fastapi import FastAPI, WebSocket
from fastapi.staticfiles import StaticFiles

from app.api.routes import router as api_router
from app.api.websocket import websocket_handler
from app.config import config
from app.services.channel_manager import channel_manager
from app.services.db import close_db, init_db
from app.services.scheduler import scheduler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    # Startup
    config.ensure_directories()
    await init_db(config.db_path)
    await channel_manager.load_from_db()
    scheduler.start()
    logger.info("Framory started — %d channels loaded", len(channel_manager.get_all_channels()))
    yield
    # Shutdown
    scheduler.stop()
    channel_manager.cleanup()
    await close_db()
    logger.info("Framory shutdown complete")


app = FastAPI(title="Framory", lifespan=lifespan)
app.include_router(api_router)


@app.websocket("/ws/{channel_id}")
async def ws_endpoint(websocket: WebSocket, channel_id: str) -> None:
    await websocket_handler(websocket, channel_id)


# Mount frontend static files (must be after API and WS routes)
_static_dir = Path(__file__).resolve().parent.parent / "static"
if _static_dir.is_dir():
    app.mount("/", StaticFiles(directory=str(_static_dir), html=True), name="static")
