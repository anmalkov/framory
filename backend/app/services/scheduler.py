from __future__ import annotations

import asyncio
import logging
from datetime import datetime

from app.config import config
from app.models.channel import PlaybackState
from app.services.channel_manager import channel_manager

logger = logging.getLogger(__name__)


class Scheduler:
    def __init__(self) -> None:
        self._task: asyncio.Task[None] | None = None

    def start(self) -> None:
        self._task = asyncio.create_task(self._run())
        logger.info("Scheduler started")

    def stop(self) -> None:
        if self._task and not self._task.done():
            self._task.cancel()
            logger.info("Scheduler stopped")

    async def _run(self) -> None:
        try:
            while True:
                await asyncio.sleep(5)
                await self._check_stop_times()
        except asyncio.CancelledError:
            pass

    async def _check_stop_times(self) -> None:
        now = datetime.now(config.tz)
        for channel in channel_manager.get_all_channels():
            if channel.state != PlaybackState.playing:
                continue
            try:
                h, m = map(int, channel.stop_time.split(":"))
                stop_at = now.replace(hour=h, minute=m, second=0, microsecond=0)
                if now >= stop_at and (now - stop_at).total_seconds() < 60:
                    logger.info(
                        "Scheduled stop for channel %s at %s",
                        channel.id,
                        channel.stop_time,
                    )
                    channel.state = PlaybackState.stopped_scheduled
                    channel_manager._cancel_timer(channel.id)
                    from app.services.db import save_channel

                    await save_channel(channel)
                    await channel_manager.broadcast_state(channel.id)
            except Exception:
                logger.warning(
                    "Error checking stop time for channel %s", channel.id
                )


scheduler = Scheduler()
