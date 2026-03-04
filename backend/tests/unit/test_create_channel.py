"""Tests for channel creation with optional folder parameter."""

from __future__ import annotations

import tempfile
from pathlib import Path
from unittest.mock import patch

import pytest

from app.models.channel import Channel
from app.services import db
from app.services.channel_manager import ChannelManager


@pytest.fixture
async def test_db():
    """Provide a temporary SQLite database, initialized and cleaned up."""
    with tempfile.TemporaryDirectory() as tmpdir:
        db_path = str(Path(tmpdir) / "test.db")
        await db.init_db(db_path)
        yield db_path
        await db.close_db()


@pytest.fixture
def photo_root(tmp_path: Path) -> Path:
    """Create a temporary photo root with a test folder containing photos."""
    family = tmp_path / "family"
    family.mkdir()
    (family / "photo1.jpg").write_bytes(b"fake-jpg-1")
    (family / "photo2.jpg").write_bytes(b"fake-jpg-2")
    return tmp_path


class TestCreateChannelWithFolder:
    async def test_create_with_valid_folder(
        self, test_db: str, photo_root: Path
    ) -> None:
        manager = ChannelManager()
        with patch("app.services.channel_manager.config") as mock_config:
            mock_config.default_folder = ""
            mock_config.default_delay_seconds = 60
            mock_config.default_stop_time = "00:00"
            mock_config.photo_root = str(photo_root)
            ch = await manager.create_channel("test-ch", folder="family")
        assert ch.folder == "family"
        assert len(ch.sequence) > 0

    async def test_create_without_folder_backward_compat(
        self, test_db: str
    ) -> None:
        manager = ChannelManager()
        with patch("app.services.channel_manager.config") as mock_config:
            mock_config.default_folder = ""
            mock_config.default_delay_seconds = 60
            mock_config.default_stop_time = "00:00"
            ch = await manager.create_channel("compat-ch")
        assert ch.folder == ""
        assert ch.sequence == []

    async def test_create_with_empty_folder_no_photos(
        self, test_db: str, photo_root: Path
    ) -> None:
        empty = photo_root / "empty"
        empty.mkdir()
        manager = ChannelManager()
        with patch("app.services.channel_manager.config") as mock_config:
            mock_config.default_folder = ""
            mock_config.default_delay_seconds = 60
            mock_config.default_stop_time = "00:00"
            mock_config.photo_root = str(photo_root)
            ch = await manager.create_channel("empty-ch", folder="empty")
        assert ch.folder == "empty"
        assert ch.sequence == []


class TestCreateChannelValidation:
    def test_channel_id_too_short(self) -> None:
        with pytest.raises(ValueError, match="2-50 characters"):
            Channel(id="a")

    def test_channel_id_invalid_chars(self) -> None:
        with pytest.raises(ValueError, match="lowercase alphanumeric"):
            Channel(id="INVALID!")

    def test_channel_id_valid(self) -> None:
        ch = Channel(id="my-channel")
        assert ch.id == "my-channel"
