# 插件测试模式

测试位置先遵循已有布局：已有插件内 `tests/` / `test/` 或主仓 `test/plugins/<plugin_name>/` 时，在原位置补充，不迁移。只有新插件采用默认规则：独立 git 插件优先放插件内 `tests/`，主仓插件放 `test/plugins/<plugin_name>/`。仓库已配置 `asyncio_mode = "auto"`，async 测试函数**不需要** `@pytest.mark.asyncio`。

运行命令（`--no-cov` 必须加，否则会跑全量 `src/` 覆盖率；`-p no:randomly` 关掉随机顺序便于复现）：

```bash
"$PY" -X utf8 -m pytest "$TEST_DIR" -q --no-cov -p no:randomly
```

---

## 1. conftest.py 骨架

```python
"""Pytest bootstrap for <plugin_name> tests."""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

import pytest

def find_project_root(start: Path) -> Path:
    """Find a Neo-MoFox root from plugin-internal or main-repo tests."""
    for candidate in (start, *start.parents):
        if (
            (candidate / "src" / "app" / "plugin_system").is_dir()
            and (candidate / "pyproject.toml").is_file()
        ):
            return candidate
    raise RuntimeError("无法定位 Neo-MoFox 项目根")


ROOT = find_project_root(Path(__file__).resolve().parent)
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


@pytest.fixture(scope="session")
def event_loop_policy() -> asyncio.AbstractEventLoopPolicy:
    """Use selector loops on Windows to avoid socketpair permission failures."""
    if sys.platform == "win32":
        return asyncio.WindowsSelectorEventLoopPolicy()
    return asyncio.get_event_loop_policy()


@pytest.fixture()
def isolated_json_storage(tmp_path, monkeypatch):
    """Route plugin JSON storage to a per-test temporary directory."""
    import src.app.plugin_system.api.storage_api as storage_api
    from src.kernel.storage import JSONStore

    store = JSONStore(str(tmp_path / "json"))
    monkeypatch.setattr(storage_api, "_get_plugin_json_store", lambda _name: store)
    return store
```

---

## 2. Fake 对象模式

框架依赖多，**优先手写轻量 fake 类，而不是堆 `MagicMock`**。fake 类可以断言调用记录，比 mock 更可读。

### Fake Service

```python
from typing import Any


class FakeDemoService:
    """DemoService 的最小替身。"""

    def __init__(self) -> None:
        self.items: list[str] = []
        self.added: list[str] = []
        self.removed: list[str] = []

    async def list_keywords(self) -> list[str]:
        return list(self.items)

    async def add_keyword(self, keyword: str) -> bool:
        self.added.append(keyword)
        if keyword in self.items:
            return False
        self.items.append(keyword)
        return True

    async def remove_keyword(self, keyword: str) -> bool:
        self.removed.append(keyword)
        if keyword not in self.items:
            return False
        self.items.remove(keyword)
        return True
```

### Fake Plugin（组件构造时需要）

```python
from plugins.demo_plugin.config import DemoConfig


class FakePlugin:
    """BasePlugin 的最小替身。"""

    plugin_name = "demo_plugin"

    def __init__(self, config: DemoConfig | None = None) -> None:
        self.config = config or DemoConfig()
```

### Fake Message

```python
from types import SimpleNamespace


def make_message(text: str, stream_id: str = "s1", **extra) -> SimpleNamespace:
    """构造一个满足插件读取需求的消息替身。"""
    return SimpleNamespace(
        message_id="m1",
        processed_plain_text=text,
        content=text,
        sender_id="u1",
        sender_name="TestUser",
        platform="test",
        chat_type="group",
        stream_id=stream_id,
        **extra,
    )
```

需要真实 `Message` 时直接用框架的：

```python
from src.core.models.message import Message, MessageType

msg = Message(
    message_id="m1",
    content="hello",
    processed_plain_text="hello",
    message_type=MessageType.TEXT,
    sender_id="u1",
    sender_name="Alice",
    platform="test",
    chat_type="group",
    stream_id="s1",
)
```

---

## 3. 测试 Config

```python
"""DemoConfig 测试。"""

from __future__ import annotations

from plugins.demo_plugin.config import DemoConfig


def test_default_values() -> None:
    """默认配置符合预期。"""
    cfg = DemoConfig()
    assert cfg.general.enabled is True
    assert cfg.general.keywords == []
    assert "{keyword}" in cfg.general.notify_template


def test_generate_and_reload(tmp_path) -> None:
    """生成默认配置文件后可重新加载，值保持一致。"""
    path = tmp_path / "config.toml"
    DemoConfig.generate_default(str(path))
    assert path.is_file()

    loaded = DemoConfig.load(str(path))
    assert loaded.general.enabled is True
```

---

## 4. 测试 EventHandler

核心断言三件事：**返回决策正确**、**params key 集合没变**、**副作用被触发**。

```python
"""DemoHandler 测试。"""

from __future__ import annotations

import pytest

from plugins.demo_plugin import handlers as handlers_module
from plugins.demo_plugin.config import DemoConfig
from plugins.demo_plugin.handlers import DemoHandler
from src.core.components.types import EventType
from src.kernel.event import EventDecision


class FakePlugin:
    """插件替身。"""

    plugin_name = "demo_plugin"

    def __init__(self, config: DemoConfig | None = None) -> None:
        self.config = config or DemoConfig()


@pytest.fixture()
def sent(monkeypatch):
    """捕获 send_api.send_text 调用。"""
    calls: list[tuple[str, str]] = []

    # 真实签名：send_text(content, stream_id, platform=None, reply_to=None, ...)
    async def fake_send_text(content: str, stream_id: str, **_kwargs) -> bool:
        calls.append((stream_id, content))
        return True

    monkeypatch.setattr(handlers_module.send_api, "send_text", fake_send_text)
    return calls


@pytest.fixture()
def service(monkeypatch):
    """注入 fake service。"""
    fake = FakeDemoService()
    monkeypatch.setattr(
        handlers_module.service_api, "get_service", lambda _sig: fake
    )
    return fake


async def test_keyword_hit_sends_notice(sent, service) -> None:
    """命中关键词时发送提醒。"""
    service.items = ["紧急"]
    handler = DemoHandler(FakePlugin())
    params = {"message": make_message("这条是紧急通知"), "envelope": None}
    original_keys = set(params)

    decision, out = await handler.execute(EventType.ON_MESSAGE_RECEIVED, params)

    assert decision is EventDecision.PASS
    assert set(out) == original_keys           # key 集合不可变
    assert len(sent) == 1
    assert "紧急" in sent[0][1]


async def test_no_hit_no_send(sent, service) -> None:
    """未命中时不发送。"""
    service.items = ["紧急"]
    handler = DemoHandler(FakePlugin())
    params = {"message": make_message("普通消息"), "envelope": None}

    decision, out = await handler.execute(EventType.ON_MESSAGE_RECEIVED, params)

    assert decision is EventDecision.PASS
    assert sent == []


async def test_disabled_short_circuits(sent, service) -> None:
    """配置关闭时直接放行。"""
    cfg = DemoConfig()
    cfg.general.enabled = False
    service.items = ["紧急"]
    handler = DemoHandler(FakePlugin(cfg))
    params = {"message": make_message("紧急"), "envelope": None}

    decision, _ = await handler.execute(EventType.ON_MESSAGE_RECEIVED, params)

    assert decision is EventDecision.PASS
    assert sent == []


async def test_missing_message_is_safe(sent, service) -> None:
    """params 里没有 message 时不崩。"""
    handler = DemoHandler(FakePlugin())
    params = {"message": None, "envelope": None}

    decision, out = await handler.execute(EventType.ON_MESSAGE_RECEIVED, params)

    assert decision is EventDecision.PASS
    assert set(out) == {"message", "envelope"}
```

---

## 5. 测试 Command

命令测试要覆盖：路由命中、参数类型转换、未知路由降级到 help。

**注意**：`BaseCommand.execute()` 收到的是**剥掉前缀和组件 `name` 之后**的子路由文本。测试直接调路由方法最稳妥，需要验证路由树时再走 `execute()`。

```python
"""DemoCommand 测试。"""

from __future__ import annotations

import pytest

from plugins.demo_plugin import commands as commands_module
from plugins.demo_plugin.commands import DemoCommand


@pytest.fixture()
def command(monkeypatch):
    """构造带 fake service 的命令实例。"""
    fake = FakeDemoService()
    monkeypatch.setattr(
        commands_module.service_api, "get_service", lambda _sig: fake
    )
    cmd = DemoCommand(FakePlugin(), "s1")
    cmd._fake = fake  # 便于断言
    return cmd


async def test_add_then_list(command) -> None:
    """添加后能列出。"""
    ok, msg = await command.add_keyword("紧急")
    assert ok is True
    assert "紧急" in msg

    ok, msg = await command.list_keywords()
    assert ok is True
    assert "紧急" in msg


async def test_add_duplicate_fails(command) -> None:
    """重复添加返回失败。"""
    await command.add_keyword("紧急")
    ok, msg = await command.add_keyword("紧急")
    assert ok is False
    assert "已存在" in msg


async def test_remove_missing_fails(command) -> None:
    """删除不存在的项返回失败。"""
    ok, msg = await command.remove_keyword("不存在")
    assert ok is False


async def test_route_via_execute(command) -> None:
    """通过 execute 走 Trie 路由（注意传入的是子路由文本）。"""
    ok, msg = await command.execute("add 紧急")
    assert ok is True
    assert "紧急" in msg


async def test_unknown_route_returns_help(command) -> None:
    """未知路由返回帮助文本而不是抛异常。"""
    ok, msg = await command.execute("nonexistent")
    assert isinstance(msg, str)
    assert msg  # 有内容
```

参数类型转换测试：

```python
async def test_int_arg_conversion(command) -> None:
    """int 注解参数被自动转换。"""
    ok, msg = await command.execute("limit set 10")
    assert ok is True


async def test_bad_int_arg_returns_error(command) -> None:
    """非法整数返回错误信息而不是抛异常。"""
    ok, msg = await command.execute("limit set abc")
    assert ok is False
```

---

## 6. 测试 Service（带真实存储隔离）

```python
"""DemoService 测试（使用隔离的 JSON 存储）。"""

from __future__ import annotations

from plugins.demo_plugin.services import DemoService


class FakePlugin:
    plugin_name = "demo_plugin"

    def __init__(self) -> None:
        self.config = None


async def test_add_and_list(isolated_json_storage) -> None:
    """添加后可列出，数据真实落到隔离存储。"""
    svc = DemoService(FakePlugin())

    assert await svc.list_keywords() == []
    assert await svc.add_keyword("a") is True
    assert await svc.list_keywords() == ["a"]


async def test_add_duplicate(isolated_json_storage) -> None:
    """重复添加返回 False。"""
    svc = DemoService(FakePlugin())
    await svc.add_keyword("a")
    assert await svc.add_keyword("a") is False


async def test_state_survives_new_instance(isolated_json_storage) -> None:
    """Service 不是单例，但状态通过存储跨实例保持。"""
    svc1 = DemoService(FakePlugin())
    await svc1.add_keyword("a")

    svc2 = DemoService(FakePlugin())
    assert await svc2.list_keywords() == ["a"]
```

---

## 7. 测试 Tool / Action

```python
"""DemoTool / DemoAction 测试。"""

from __future__ import annotations

from plugins.demo_plugin.tools import DemoTool


async def test_tool_returns_dict() -> None:
    """Tool 返回 (bool, dict)。"""
    tool = DemoTool(FakePlugin())
    ok, result = await tool.execute(metric="qps")
    assert ok is True
    assert isinstance(result, dict)


def test_tool_schema_is_valid() -> None:
    """to_schema() 能生成合法 schema；Annotated 仅用于改善参数说明。"""
    schema = DemoTool.to_schema()
    assert schema is not None
```


Action/Agent 必须覆盖 `associated_types` 正负模式：

```python
def test_action_associated_types_are_valid() -> None:
    """非空内容类型声明通过框架校验。"""
    assert DemoAction.validate_associated_types() == ["text"]


def test_empty_action_associated_types_are_rejected() -> None:
    """空 associated_types 会在真实注册时失败。"""

    class InvalidAction(DemoAction):
        name = "invalid_action"
        associated_types: list[str] = []

    with pytest.raises(ValueError, match="associated_types"):
        InvalidAction.validate_associated_types()
```

Agent 使用相同模式调用 `DemoAgent.validate_associated_types()`；另需覆盖非 list、含空字符串等负例。验证器 D5 会在真实加载路径重复检查这一契约。


```python
async def test_action_sends(monkeypatch) -> None:
    """Action 执行后调用了发送。"""
    sent: list[str] = []

    action = DemoAction(chat_stream=make_fake_stream(), plugin=FakePlugin())

    async def fake_send(text: str, **_kwargs) -> bool:
        sent.append(text)
        return True

    monkeypatch.setattr(action, "_send_to_stream", fake_send)

    ok, msg = await action.execute(content="提醒内容")

    assert ok is True
    assert sent == ["提醒内容"]
```

---

## 8. 集成测试：模拟完整消息链路

验证"消息进来 → 插件反应 → 副作用发生"这一整条链路。

```python
"""demo_plugin 集成测试：模拟消息链路。"""

from __future__ import annotations

import pytest

from plugins.demo_plugin import handlers as handlers_module
from plugins.demo_plugin.config import DemoConfig
from plugins.demo_plugin.handlers import DemoHandler
from plugins.demo_plugin.plugin import DemoPlugin
from plugins.demo_plugin.services import DemoService
from src.core.components.types import ComponentType, EventType, build_signature
from src.kernel.event import EventDecision


def test_plugin_declares_expected_components() -> None:
    """插件返回的组件类与设计一致。"""
    plugin = DemoPlugin(DemoConfig())
    components = plugin.get_components()

    assert DemoService in components
    assert DemoHandler in components
    # 配置类不应出现在这里
    assert DemoConfig not in components


def test_component_signatures() -> None:
    """组件签名符合 plugin:type:name 格式。"""
    assert (
        build_signature("demo_plugin", ComponentType.SERVICE, DemoService.name)
        == "demo_plugin:service:demo_service"
    )
    assert (
        build_signature("demo_plugin", ComponentType.EVENT_HANDLER, DemoHandler.name)
        == "demo_plugin:event_handler:demo_handler"
    )


async def test_end_to_end_keyword_flow(monkeypatch, isolated_json_storage) -> None:
    """完整链路：Service 写入关键词 -> 消息进来 -> Handler 命中 -> 发送提醒。"""
    plugin = DemoPlugin(DemoConfig())

    # 1. 真实 Service 写入关键词（走隔离存储）
    svc = DemoService(plugin)
    await svc.add_keyword("紧急")

    # 2. 让 handler 拿到同一个 Service 类型的新实例（模拟 get_service 语义）
    monkeypatch.setattr(
        handlers_module.service_api, "get_service", lambda _sig: DemoService(plugin)
    )

    # 3. 捕获发送
    sent: list[tuple[str, str]] = []

    async def fake_send_text(content: str, stream_id: str, **_kwargs) -> bool:
        sent.append((stream_id, content))
        return True

    monkeypatch.setattr(handlers_module.send_api, "send_text", fake_send_text)

    # 4. 模拟消息进入
    handler = DemoHandler(plugin)
    params = {
        "message": make_message("这是紧急情况", stream_id="stream_1"),
        "envelope": None,
        "adapter_signature": "test:adapter:test",
    }
    original_keys = set(params)

    decision, out = await handler.execute(EventType.ON_MESSAGE_RECEIVED, params)

    # 5. 断言链路完整走通
    assert decision is EventDecision.PASS
    assert set(out) == original_keys
    assert len(sent) == 1
    assert sent[0][0] == "stream_1"
    assert "紧急" in sent[0][1]
```

---

## 9. 生命周期测试

```python
async def test_lifecycle_hooks_are_idempotent() -> None:
    """加载/卸载钩子可执行且不抛异常。"""
    plugin = DemoPlugin(DemoConfig())
    await plugin.on_plugin_loaded()
    await plugin.on_plugin_unloaded()
    # 重复卸载不应崩
    await plugin.on_plugin_unloaded()
```

带定时任务的插件，卸载测试要断言资源被清理：

```python
async def test_unload_removes_schedule(monkeypatch) -> None:
    """卸载时移除定时任务。"""
    removed: list[str] = []

    class FakeScheduler:
        async def remove_schedule(self, sid: str) -> None:
            removed.append(sid)

    monkeypatch.setattr(
        "src.kernel.scheduler.get_unified_scheduler", lambda: FakeScheduler()
    )

    plugin = DemoPlugin(DemoConfig())
    plugin._schedule_id = "sched_1"

    await plugin.on_plugin_unloaded()

    assert removed == ["sched_1"]
    assert plugin._schedule_id is None
```

---

## 10. 测试覆盖清单

每个插件至少要有：

| 覆盖点 | 说明 |
|---|---|
| 配置默认值 | 默认值符合设计 |
| 配置 round-trip | 生成 → 加载 → 值一致 |
| 组件清单 | `get_components()` 返回预期的类，且不含配置类 |
| 组件签名 | 签名格式与 manifest 一致 |
| 正向路径 | 触发条件满足时行为正确 |
| 负向路径 | 不满足时不误触发 |
| 开关短路 | `enabled=False` 时不执行 |
| 边界输入 | 空消息 / None / 缺字段不崩 |
| params 不变性 | EventHandler 返回的 key 集合不变 |
| 生命周期 | 加载/卸载钩子可执行、资源被清理 |
| 端到端 | 至少一条完整链路 |
