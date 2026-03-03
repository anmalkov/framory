"""Tests for show_progress_bar feature."""

from __future__ import annotations

import tempfile
from pathlib import Path

import pytest

from app.models.channel import Channel
from app.models.messages import ChannelConfig, ConfigureSettings
from app.services import db


@pytest.fixture
async def test_db():
    """Provide a temporary SQLite database, initialized and cleaned up."""
    with tempfile.TemporaryDirectory() as tmpdir:
        db_path = str(Path(tmpdir) / "test.db")
        await db.init_db(db_path)
        yield db_path
        await db.close_db()


class TestShowProgressBarDefault:
    def test_channel_defaults_to_true(self) -> None:
        ch = Channel(id="test-ch")
        assert ch.show_progress_bar is True

    def test_channel_explicit_false(self) -> None:
        ch = Channel(id="test-ch", show_progress_bar=False)
        assert ch.show_progress_bar is False


class TestShowProgressBarRoundTrip:
    async def test_save_and_get_default(self, test_db: str) -> None:
        ch = Channel(id="round-trip")
        await db.save_channel(ch)
        row = await db.get_channel("round-trip")
        assert row is not None
        assert row["show_progress_bar"] == 1

    async def test_save_and_get_false(self, test_db: str) -> None:
        ch = Channel(id="rt-false", show_progress_bar=False)
        await db.save_channel(ch)
        row = await db.get_channel("rt-false")
        assert row is not None
        assert row["show_progress_bar"] == 0

    async def test_update_toggle(self, test_db: str) -> None:
        ch = Channel(id="rt-toggle")
        await db.save_channel(ch)

        ch.show_progress_bar = False
        await db.save_channel(ch)

        row = await db.get_channel("rt-toggle")
        assert row is not None
        assert row["show_progress_bar"] == 0


class TestShowProgressBarMessages:
    def test_channel_config_includes_field(self) -> None:
        cfg = ChannelConfig(
            folder="photos",
            delay_seconds=30,
            stop_time="22:00",
            show_progress_bar=True,
        )
        assert cfg.show_progress_bar is True
        data = cfg.model_dump()
        assert "show_progress_bar" in data

    def test_configure_settings_optional(self) -> None:
        settings = ConfigureSettings()
        assert settings.show_progress_bar is None

    def test_configure_settings_explicit(self) -> None:
        settings = ConfigureSettings(show_progress_bar=False)
        assert settings.show_progress_bar is False
