from __future__ import annotations

import asyncio
import logging
from datetime import datetime
from typing import TYPE_CHECKING

from app.config import config
from app.models.channel import Channel, PlaybackState
from app.models.messages import (
    ChannelConfig,
    ErrorMessage,
    PhotoInfo,
    StateMessage,
)
from app.services import photo_service
from app.services.db import get_channel, list_channels, save_channel

if TYPE_CHECKING:
    from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ChannelManager:
    def __init__(self) -> None:
        self._channels: dict[str, Channel] = {}
        self._clients: dict[str, set[WebSocket]] = {}
        self._locks: dict[str, asyncio.Lock] = {}
        self._timers: dict[str, asyncio.Task[None]] = {}
        self._seq: dict[str, int] = {}

    async def load_from_db(self) -> None:
        """Load all channels from database into memory."""
        rows = await list_channels()
        for row in rows:
            channel = Channel(**row)
            self._channels[channel.id] = channel
            self._seq[channel.id] = 0
            logger.info("Loaded channel: %s", channel.id)

    def get_channel(self, channel_id: str) -> Channel | None:
        return self._channels.get(channel_id)

    def get_all_channels(self) -> list[Channel]:
        return list(self._channels.values())

    def client_count(self, channel_id: str) -> int:
        return len(self._clients.get(channel_id, set()))

    async def create_channel(self, channel_id: str) -> Channel:
        """Create a new channel with default settings."""
        channel = Channel(
            id=channel_id,
            folder=config.default_folder,
            delay_seconds=config.default_delay_seconds,
            stop_time=config.default_stop_time,
        )
        self._channels[channel_id] = channel
        self._seq[channel_id] = 0
        await save_channel(channel)
        return channel

    async def register_client(self, channel_id: str, ws: WebSocket) -> None:
        if channel_id not in self._clients:
            self._clients[channel_id] = set()
        self._clients[channel_id].add(ws)

    async def unregister_client(self, channel_id: str, ws: WebSocket) -> None:
        clients = self._clients.get(channel_id)
        if clients:
            clients.discard(ws)
            if not clients and channel_id in self._channels:
                # All clients disconnected — stop channel (FR-035a)
                channel = self._channels[channel_id]
                if channel.state == PlaybackState.playing:
                    channel.state = PlaybackState.stopped_no_clients
                    self._cancel_timer(channel_id)
                    await save_channel(channel)
                    logger.info("Channel %s stopped (no clients)", channel_id)

    def _get_lock(self, channel_id: str) -> asyncio.Lock:
        if channel_id not in self._locks:
            self._locks[channel_id] = asyncio.Lock()
        return self._locks[channel_id]

    async def handle_command(self, channel_id: str, action: str) -> None:
        async with self._get_lock(channel_id):
            channel = self._channels.get(channel_id)
            if not channel:
                return

            if action == "play":
                if not channel.folder or not channel.sequence:
                    # Try to scan and generate sequence
                    if channel.folder:
                        photos = photo_service.scan_folder(channel.folder)
                        if photos:
                            channel.sequence = photo_service.generate_sequence(photos)
                            channel.current_index = 0
                            channel.history = []
                        else:
                            await self._send_error(
                                channel_id,
                                "No photos found in folder",
                                "NO_PHOTOS",
                            )
                            return
                    else:
                        await self._send_error(
                            channel_id,
                            "No folder configured",
                            "INVALID_FOLDER",
                        )
                        return
                channel.state = PlaybackState.playing
                self._start_timer(channel_id)

            elif action == "stop":
                channel.state = PlaybackState.stopped_manual
                self._cancel_timer(channel_id)

            elif action == "next":
                if not channel.sequence:
                    return
                channel.history.append(channel.current_index)
                channel.current_index = (channel.current_index + 1) % len(channel.sequence)
                if channel.state == PlaybackState.playing:
                    self._cancel_timer(channel_id)
                    self._start_timer(channel_id)

            elif action == "prev":
                if not channel.history:
                    await self._send_error(
                        channel_id,
                        "No previous photo available",
                        "NO_HISTORY",
                    )
                    return
                channel.current_index = channel.history.pop()
                if channel.state == PlaybackState.playing:
                    self._cancel_timer(channel_id)
                    self._start_timer(channel_id)

            elif action == "reset":
                if channel.folder:
                    photos = photo_service.scan_folder(channel.folder)
                    if photos:
                        channel.sequence = photo_service.generate_sequence(photos)
                channel.history = []
                channel.current_index = 0
                if channel.state == PlaybackState.playing:
                    self._cancel_timer(channel_id)
                    self._start_timer(channel_id)

            await save_channel(channel)
        await self.broadcast_state(channel_id)

    async def handle_configure(
        self, channel_id: str, settings: dict[str, object]
    ) -> None:
        import re

        async with self._get_lock(channel_id):
            channel = self._channels.get(channel_id)
            if not channel:
                return

            folder_changed = False

            if "folder" in settings and settings["folder"] is not None:
                new_folder = str(settings["folder"])
                # Path traversal validation
                if ".." in new_folder:
                    await self._send_error(
                        channel_id, "Invalid folder path", "INVALID_CONFIG"
                    )
                    return
                channel.folder = new_folder
                folder_changed = True

            if "delay_seconds" in settings and settings["delay_seconds"] is not None:
                delay = int(settings["delay_seconds"])  # type: ignore[arg-type]
                if delay < 5:
                    await self._send_error(
                        channel_id,
                        "Delay must be at least 5 seconds",
                        "INVALID_CONFIG",
                    )
                    return
                channel.delay_seconds = delay
                if channel.state == PlaybackState.playing:
                    self._cancel_timer(channel_id)
                    self._start_timer(channel_id)

            if "stop_time" in settings and settings["stop_time"] is not None:
                new_stop = str(settings["stop_time"])
                if not re.match(r"^([01]\d|2[0-3]):[0-5]\d$", new_stop):
                    await self._send_error(
                        channel_id,
                        "Invalid stop_time format (HH:MM)",
                        "INVALID_CONFIG",
                    )
                    return
                channel.stop_time = new_stop
                # Check if new stop time is already past
                if channel.state == PlaybackState.playing:
                    now = datetime.now(config.tz)
                    h, m = map(int, new_stop.split(":"))
                    stop_today = now.replace(hour=h, minute=m, second=0, microsecond=0)
                    if now >= stop_today:
                        channel.state = PlaybackState.stopped_scheduled
                        self._cancel_timer(channel_id)

            if folder_changed:
                photos = photo_service.scan_folder(channel.folder)
                if photos:
                    channel.sequence = photo_service.generate_sequence(photos)
                else:
                    channel.sequence = []
                channel.history = []
                channel.current_index = 0

            await save_channel(channel)
        await self.broadcast_state(channel_id)

    async def broadcast_state(self, channel_id: str) -> None:
        channel = self._channels.get(channel_id)
        if not channel:
            return

        self._seq[channel_id] = self._seq.get(channel_id, 0) + 1
        seq = self._seq[channel_id]

        photo_info = None
        photo_path = channel.current_photo_path
        if photo_path and channel.folder:
            try:
                meta = photo_service.get_photo_metadata(channel.folder, photo_path)
                photo_info = PhotoInfo(
                    url=f"/api/channels/{channel_id}/photo?v={seq}",
                    filename=meta.filename,
                    date_taken=meta.date_taken.isoformat() if meta.date_taken else None,
                    date_modified=meta.date_modified.isoformat()
                    if meta.date_modified
                    else None,
                )
            except Exception:
                logger.warning("Failed to get metadata for %s/%s", channel.folder, photo_path)

        msg = StateMessage(
            channel_id=channel_id,
            playback_state=channel.state.value,
            photo=photo_info,
            current_index=channel.current_index,
            sequence_length=channel.sequence_length,
            has_previous=channel.has_previous,
            config=ChannelConfig(
                folder=channel.folder,
                delay_seconds=channel.delay_seconds,
                stop_time=channel.stop_time,
            ),
            seq=seq,
        )

        clients = self._clients.get(channel_id, set()).copy()
        for ws in clients:
            try:
                await ws.send_json(msg.model_dump())
            except Exception:
                logger.debug("Failed to send to client in channel %s", channel_id)

    async def send_state_to(self, channel_id: str, ws: WebSocket) -> None:
        """Send current state to a single client (initial sync)."""
        channel = self._channels.get(channel_id)
        if not channel:
            return

        seq = self._seq.get(channel_id, 0)
        photo_info = None
        photo_path = channel.current_photo_path
        if photo_path and channel.folder:
            try:
                meta = photo_service.get_photo_metadata(channel.folder, photo_path)
                photo_info = PhotoInfo(
                    url=f"/api/channels/{channel_id}/photo?v={seq}",
                    filename=meta.filename,
                    date_taken=meta.date_taken.isoformat() if meta.date_taken else None,
                    date_modified=meta.date_modified.isoformat()
                    if meta.date_modified
                    else None,
                )
            except Exception:
                pass

        msg = StateMessage(
            channel_id=channel_id,
            playback_state=channel.state.value,
            photo=photo_info,
            current_index=channel.current_index,
            sequence_length=channel.sequence_length,
            has_previous=channel.has_previous,
            config=ChannelConfig(
                folder=channel.folder,
                delay_seconds=channel.delay_seconds,
                stop_time=channel.stop_time,
            ),
            seq=seq,
        )
        await ws.send_json(msg.model_dump())

    async def _send_error(self, channel_id: str, message: str, code: str) -> None:
        msg = ErrorMessage(message=message, code=code)
        clients = self._clients.get(channel_id, set()).copy()
        for ws in clients:
            try:
                await ws.send_json(msg.model_dump())
            except Exception:
                pass

    def _start_timer(self, channel_id: str) -> None:
        self._cancel_timer(channel_id)
        channel = self._channels.get(channel_id)
        if not channel:
            return
        self._timers[channel_id] = asyncio.create_task(
            self._auto_advance_loop(channel_id, channel.delay_seconds)
        )

    def _cancel_timer(self, channel_id: str) -> None:
        task = self._timers.pop(channel_id, None)
        if task and not task.done():
            task.cancel()

    async def _auto_advance_loop(self, channel_id: str, delay: int) -> None:
        try:
            while True:
                await asyncio.sleep(delay)
                channel = self._channels.get(channel_id)
                if not channel or channel.state != PlaybackState.playing:
                    break
                # Auto-advance: next photo
                async with self._get_lock(channel_id):
                    channel = self._channels.get(channel_id)
                    if not channel or channel.state != PlaybackState.playing:
                        break
                    if not channel.sequence:
                        break
                    channel.history.append(channel.current_index)
                    channel.current_index = (channel.current_index + 1) % len(
                        channel.sequence
                    )
                    await save_channel(channel)
                await self.broadcast_state(channel_id)
        except asyncio.CancelledError:
            pass

    def cleanup(self) -> None:
        """Cancel all timers on shutdown."""
        for task in self._timers.values():
            if not task.done():
                task.cancel()
        self._timers.clear()


channel_manager = ChannelManager()
