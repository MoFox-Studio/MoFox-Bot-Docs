"""Pytest bootstrap for e2e_probe tests."""

from __future__ import annotations

import asyncio
import os
import sys
from pathlib import Path

import pytest


def find_project_root(start: Path) -> Path:
    """Find a Neo-MoFox root from an override or the current path ancestry."""
    override = os.environ.get("NEO_MOFOX_ROOT")
    candidates = [Path(override).resolve()] if override else []
    candidates.extend((start, *start.parents))
    for candidate in candidates:
        if (
            (candidate / "src" / "app" / "plugin_system").is_dir()
            and (candidate / "pyproject.toml").is_file()
        ):
            return candidate
    raise RuntimeError("无法定位 Neo-MoFox 项目根；请设置 NEO_MOFOX_ROOT")


WORK_ROOT = Path(__file__).resolve().parents[2]
PROJECT_ROOT = find_project_root(Path(__file__).resolve().parent)
for root in (WORK_ROOT, PROJECT_ROOT):
    if str(root) not in sys.path:
        sys.path.insert(0, str(root))


@pytest.fixture(scope="session")
def event_loop_policy() -> asyncio.AbstractEventLoopPolicy:
    """Use selector loops on Windows to avoid socketpair permission failures."""
    if sys.platform == "win32":
        selector_policy = getattr(asyncio, "WindowsSelectorEventLoopPolicy")
        return selector_policy()
    return asyncio.get_event_loop_policy()


@pytest.fixture()
def isolated_json_storage(tmp_path, monkeypatch):
    """Route plugin JSON storage to a per-test temporary directory."""
    import src.app.plugin_system.api.storage_api as storage_api
    from src.kernel.storage import JSONStore

    store = JSONStore(str(tmp_path / "json"))
    monkeypatch.setattr(storage_api, "_get_plugin_json_store", lambda _name: store)
    return store
