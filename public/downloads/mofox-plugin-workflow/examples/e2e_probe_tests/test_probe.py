"""e2e_probe 服务层与事件处理器测试。"""

from __future__ import annotations

from types import SimpleNamespace
from typing import Any

import pytest

from examples.e2e_probe import handlers as handlers_module
from examples.e2e_probe.commands import ProbeCommand
from examples.e2e_probe.config import ProbeConfig
from examples.e2e_probe.handlers import ProbeHandler
from examples.e2e_probe.services import ProbeService
from src.kernel.event import EventDecision

@pytest.fixture()
def plugin() -> SimpleNamespace:
    """构造带默认配置的假插件。"""
    return SimpleNamespace(config=ProbeConfig(), plugin_name="e2e_probe")


@pytest.fixture()
def sent(monkeypatch) -> list[tuple[str, str]]:
    """捕获 send_api.send_text 调用。"""
    calls: list[tuple[str, str]] = []

    # 真实签名：send_text(content, stream_id, platform=None, reply_to=None, ...)
    async def fake_send_text(content: str, stream_id: str, **_kwargs: Any) -> bool:
        calls.append((stream_id, content))
        return True

    monkeypatch.setattr(handlers_module.send_api, "send_text", fake_send_text)
    return calls


def _message(text: str, stream_id: str = "s1") -> SimpleNamespace:
    """构造最小消息对象。"""
    return SimpleNamespace(processed_plain_text=text, stream_id=stream_id)


def test_components_use_unified_metadata() -> None:
    """示例组件只依赖统一 name/description 元数据。"""
    assert ProbeConfig.name == "config"
    assert ProbeConfig.description
    assert ProbeService.name == "probe_service"
    assert ProbeService.description
    assert ProbeHandler.name == "probe_handler"
    assert ProbeHandler.description
    assert ProbeCommand.name == "probe"
    assert ProbeCommand.description


@pytest.mark.asyncio
async def test_service_add_list_remove(isolated_json_storage, plugin) -> None:
    """Service 的增删查应经由 storage 持久化。"""
    svc = ProbeService(plugin)

    assert await svc.list_keywords() == []
    assert await svc.add_keyword("报警") is True
    assert await svc.add_keyword("报警") is False  # 重复
    assert await svc.list_keywords() == ["报警"]

    # 新实例读到同样数据 —— Service 非单例，状态必须落存储
    assert await ProbeService(plugin).list_keywords() == ["报警"]

    assert await svc.remove_keyword("报警") is True
    assert await svc.remove_keyword("报警") is False
    assert await svc.list_keywords() == []


@pytest.mark.asyncio
async def test_handler_hits_keyword(
    isolated_json_storage, plugin, sent, monkeypatch
) -> None:
    """命中关键词时应发送提醒，且 params key 集合不变。"""
    svc = ProbeService(plugin)
    await svc.add_keyword("报警")
    monkeypatch.setattr(
        handlers_module.service_api, "get_service", lambda _sig: ProbeService(plugin)
    )

    handler = ProbeHandler(plugin)
    params: dict[str, Any] = {"message": _message("这里有报警信息"), "extra": 1}
    before = set(params)

    decision, out = await handler.execute("on_message_received", params)

    assert decision is EventDecision.PASS
    assert set(out) == before
    assert sent == [("s1", "检测到关键词：报警")]


@pytest.mark.asyncio
async def test_handler_no_hit(isolated_json_storage, plugin, sent, monkeypatch) -> None:
    """未命中关键词时不应发送。"""
    monkeypatch.setattr(
        handlers_module.service_api, "get_service", lambda _sig: ProbeService(plugin)
    )

    handler = ProbeHandler(plugin)
    decision, _ = await handler.execute(
        "on_message_received", {"message": _message("普通消息")}
    )

    assert decision is EventDecision.PASS
    assert sent == []


@pytest.mark.asyncio
async def test_handler_disabled(isolated_json_storage, sent, monkeypatch) -> None:
    """enabled=False 时应直接放行。"""
    cfg = ProbeConfig()
    cfg.general.enabled = False
    plugin = SimpleNamespace(config=cfg, plugin_name="e2e_probe")
    monkeypatch.setattr(
        handlers_module.service_api, "get_service", lambda _sig: ProbeService(plugin)
    )

    handler = ProbeHandler(plugin)
    decision, _ = await handler.execute(
        "on_message_received", {"message": _message("这里有报警信息")}
    )

    assert decision is EventDecision.PASS
    assert sent == []
