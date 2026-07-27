# Neo-MoFox 组件精确规则速查

本文件是 `mofox-plugin-workflow` Skill 的参考资料，只在开发具体组件时按需查阅。
所有规则均来自源码行为，与 `AI插件编写规范.md` 对齐。

---

## 0. 导入入口

优先用公开入口，源码内部路径只在公开入口缺东西时才用：

```python
from src.app.plugin_system.base import (
    BaseAction, BaseAdapter, BaseAgent, BaseChatter, BaseCommand,
    BaseConfig, BaseEventHandler, BasePlugin, BaseRouter, BaseService, BaseTool,
    Field, SectionBase, config_section, cmd_route, register_plugin,
    Failure, Stop, Success, Wait, WaitResumeEvent,
)
from src.app.plugin_system.types import ChatType, ComponentType
from src.app.plugin_system.api import (
    action_api, adapter_api, agent_api, chat_api, command_api, config_api,
    database_api, event_api, llm_api, log_api, media_api, message_api,
    permission_api, plugin_api, prompt_api, router_api, send_api,
    service_api, storage_api, stream_api,
)
```

内核能力（无 api 层封装时直接用）：

```python
from src.kernel.concurrency import get_task_manager
from src.kernel.event import EventDecision
from src.kernel.scheduler import TriggerType, get_unified_scheduler
from src.kernel.storage import JSONStore
from src.core.components.types import EventType
from src.core.models.message import Message, MessageType
```

---

## 1. Plugin（`BasePlugin`）

```python
@register_plugin
class MyPlugin(BasePlugin):
    plugin_name = "my_plugin"          # 必须 == manifest.name
    plugin_description = "..."
    plugin_version = "1.0.0"

    configs: list[type] = [MyConfig]   # 配置类只放这里
    dependent_components: list[str] = []

    def __init__(self, config: MyConfig | None = None) -> None:
        super().__init__(config)

    def get_components(self) -> list[type]:
        return [MyHandler, MyCommand]  # 返回类，不是实例；不含配置类

    async def on_plugin_loaded(self) -> None: ...
    async def on_plugin_unloaded(self) -> None: ...
```

关键约束：

- `__init__` 必须接受 `config` 关键字参数。`PluginManager` 调的是 `plugin_class(config=config_instance)`。
- `configs` 有多个类时**只有第一个**会被加载并注入 `self.config`。
- `dependent_components` 不影响加载顺序，真正影响加载顺序的是 `manifest.dependencies.plugins`。
- `on_plugin_unloaded` 必须清理：定时任务（`scheduler.remove_schedule`）、后台任务（`task_manager.cancel_task`）、system reminder（`store.delete`）。

---

## 2. Config（`BaseConfig`）

```python
from typing import ClassVar

from src.app.plugin_system.base import BaseConfig, Field, SectionBase, config_section


class MyConfig(BaseConfig):
    """插件配置。"""

    name: ClassVar[str] = "config"
    description: ClassVar[str] = "插件配置"

    @config_section("general", title="常规设置", tag="general")
    class GeneralSection(SectionBase):
        """常规配置。"""

        enabled: bool = Field(default=True, description="是否启用", label="启用", tag="general")
        keywords: list[str] = Field(
            default_factory=list, description="关键词列表", label="关键词", tag="general"
        )

    general: GeneralSection = Field(default_factory=GeneralSection)
```

- 配置文件路径：`config/plugins/{plugin_name}/{Config.name}.toml`
- `Field` 的 `label` / `tag` / `icon` 是 WebUI 渲染元数据，写上有好处。
- 可变默认值必须用 `default_factory`，不能用 `default=[]`。
- 加载时机：`PluginManager` 在实例化插件前调 `config_manager.load_config(plugin_name, config_cls)`，会自动生成默认文件。

---

## 3. EventHandler（`BaseEventHandler`）

```python
from typing import Any

from src.app.plugin_system.base import BaseEventHandler
from src.core.components.types import EventType
from src.kernel.event import EventDecision


class MyHandler(BaseEventHandler):
    """监听收到的消息。"""

    name = "my_handler"
    description = "..."
    weight = 10                       # 越大越先执行
    intercept_message = False
    init_subscribe = [EventType.ON_MESSAGE_RECEIVED]
    dependencies: list[str] = []      # 完整三段签名

    async def execute(
        self, event_name: str, params: dict[str, Any]
    ) -> tuple[EventDecision, dict[str, Any]]:
        """处理事件。"""
        message = params.get("message")
        if message is None:
            return EventDecision.PASS, params
        # ... 业务逻辑
        return EventDecision.PASS, params
```

硬规则：

- **返回的 `params` 必须与传入的 key 集合完全一致**。可以改 value，不能增删 key。
- **抛异常不会拦截传播**，事件管理器会把异常吞掉转成 `PASS`。要阻断必须 `return EventDecision.STOP, params`。
- `init_subscribe` 只是登记，真正绑定 EventBus 是在插件加载完成后由 `EventManager.register_plugin_handlers` 做的。
- 每个 handler 的当前超时是 30 秒；不要在里面做长阻塞操作，需要长任务就交给 `task_manager`。
- **没有 `self.chat_stream`**，上下文只能从 `params` 里拿。

`EventType` 会随框架演进，**不要在插件文档中维护易过期的完整枚举副本**。使用时直接引用 `src/core/components/types.py::EventType`。主要类别包括：启动/停止、消息收发、Chatter、内部上下文、通知与其他消息、插件/组件生命周期、Prompt 构建、LLM/Tool/Action/Command 调用生命周期、媒体识别和 `CUSTOM`。

---

## 4. Command（`BaseCommand`）

```python
from src.app.plugin_system.base import BaseCommand, cmd_route
from src.app.plugin_system.types import ChatType
from src.core.components.types import PermissionLevel


class MyCommand(BaseCommand):
    """插件命令。"""

    name = "mycmd"
    command_prefix = "/"
    permission_level = PermissionLevel.USER
    associated_platforms: list[str] = []
    chat_type = ChatType.ALL
    dependencies = ["my_plugin:service:my_service"]

    @cmd_route("add")
    async def add(self, item: str) -> tuple[bool, str]:
        """添加一项。"""
        return True, f"已添加 {item}"

    @cmd_route("limit", "set")
    async def set_limit(self, value: int) -> tuple[bool, str]:
        """设置上限。value 会按注解自动转成 int。"""
        return True, f"上限设为 {value}"
```

- 路由是 Trie 树。`@cmd_route("limit", "set")` 对应用户输入 `/mycmd limit set 10`。
- **不要重写 `execute()`**。它收到的是**剥掉前缀和组件 `name` 之后**的子路由文本。
- 参数按 `typing.get_type_hints` 自动转换（`int/float/bool/str/list[T]`），转换失败返回错误串而不抛异常。
- 参数用 `shlex.split` 拆，支持引号包裹带空格的参数。
- 没匹配到路由时自动生成帮助文本。
- **没有 `self.chat_stream`**，有 `self.plugin` 和 `self.stream_id`。

---

## 5. Tool（`BaseTool`）

```python
from typing import Annotated

from src.app.plugin_system.base import BaseTool


class MyTool(BaseTool):
    """查询工具。"""

    name = "my_tool"
    description = "查询某个指标的当前值。"
    dependencies: list[str] = []

    async def execute(
        self,
        metric: Annotated[str, "要查询的指标名称"],
        window: Annotated[int, "时间窗口（分钟），默认 60"] = 60,
    ) -> tuple[bool, str | dict]:
        """执行查询。"""
        return True, {"metric": metric, "value": 42}
```

- `Annotated` 参数说明是**推荐而非强制**：它能改善给 LLM 的参数描述，但普通类型注解也可生成 schema。
- 无论是否使用 `Annotated`，都要用 `MyTool.to_schema()` 验证 schema 可生成、参数类型和 required 列表符合预期。
- Tool 用于查询，不应该有明显副作用。
- **没有 `self.chat_stream`**。

---

## 6. Action（`BaseAction`）

```python
from typing import Annotated

from src.app.plugin_system.base import BaseAction


class MyAction(BaseAction):
    """执行动作。"""

    name = "my_action"
    description = "向当前会话发送一条提醒。"
    dependencies: list[str] = []
    associated_types: list[str] = ["text"]

    async def execute(
        self,
        content: Annotated[str, "提醒内容"],
    ) -> tuple[bool, str]:
        """执行动作。"""
        await self._send_to_stream(content)
        return True, "已发送"
```

- `associated_types` 是强制契约，必须是非空 `list[str]`，且每项去除空白后仍非空；不要依赖基类默认空列表。
- 返回值**只能是 `(bool, str)`**，不能返回 dict（那是 Tool 的约定）。
- **有 `self.chat_stream`**（构造时注入），需要上下文/历史/发送目标时从这里拿。
- 有 `self._send_to_stream()` 便捷方法。
- 需要 LLM 判断是否激活时可用 `self._llm_judge_activation()`。

---

## 7. Service（`BaseService`）

```python
from src.app.plugin_system.base import BaseService


class MyService(BaseService):
    """跨插件复用能力。"""

    name = "my_service"
    description = "..."

    async def do_something(self, arg: str) -> bool:
        """公开方法。"""
        return True
```

调用方：

```python
from src.app.plugin_system.api import service_api
from typing import cast

svc = service_api.get_service("my_plugin:service:my_service")
if svc is not None:
    await cast(MyService, svc).do_something("x")
```

- **每次 `get_service()` 都返回新实例**，不要依赖实例字段跨调用保持状态。共享状态放 JSONStore / 数据库 / 模块级对象。
- **没有 `self.chat_stream`**。

---

## 8. Agent（`BaseAgent`）

```python
from src.app.plugin_system.base import BaseAgent


class MyAgent(BaseAgent):
    """带私有工具集的子代理。"""

    name = "my_agent"
    description = "..."
    associated_types: list[str] = ["text"]
    usables: list[type | str] = [MyPrivateTool, "other_plugin:tool:x"]

    async def execute(self, task: str) -> tuple[bool, str | dict]:
        """执行任务。"""
        req = self.create_llm_request(...)
        ...
```

- `associated_types` 与 Action 一样是强制非空 `list[str]`，真实插件注册会调用 `validate_associated_types()`。
- `usables` 是**私有**能力集，不进全局注册表，只对该 Agent 可见。
- 只有"需要子代理编排一组私有工具"时才用 Agent；单纯查信息用 Tool。
- 构造签名是 `__init__(stream_id, plugin)`。

---

## 9. Chatter（`BaseChatter`）

```python
from collections.abc import AsyncGenerator

from src.app.plugin_system.base import BaseChatter, Failure, Stop, Success, Wait


class MyChatter(BaseChatter):
    """对话主控制器。"""

    name = "my_chatter"
    description = "..."

    async def execute(self) -> AsyncGenerator:
        """对话主循环。"""
        unreads = await self.fetch_unreads()
        if not unreads:
            yield Wait(None)          # 等新消息
            return
        # ... 处理
        await self.flush_unreads()
        yield Success()
```

`ChatterResult` 语义：

| 结果 | 含义 |
|---|---|
| `Wait(None)` | 等新未读消息才恢复 |
| `Wait(seconds)` | 到时间 或 有新未读，二者之一即恢复 |
| `Stop(time, direct_message_wake_enabled=, direct_message_wake_probability=)` | 冷却；到时间且有未读才恢复，被 @ / 私聊可按概率提前唤醒 |
| `Success()` / `Failure()` | 终止本轮 |

- 有 `create_request()`（支持 `with_reminder="actor"`）、`inject_usables()`、`run_tool_call()`、`exec_llm_usable()`、`fetch_unreads()`、`flush_unreads()`。
- 构造签名是 `__init__(stream_id, plugin)`。

---

## 10. Router（`BaseRouter`）

```python
from src.app.plugin_system.base import BaseRouter


class MyRouter(BaseRouter):
    """HTTP 接口。"""

    name = "my_router"
    description = "..."

    def register_endpoints(self) -> None:
        """注册 FastAPI 端点。"""

        @self.app.get("/my_plugin/status")
        async def status() -> dict:
            return {"ok": True}
```

- 只用于 HTTP，不要拿它承载聊天逻辑或命令。
- 需要 `CoreConfig` 里开启 `http_router` 才会真正启动服务器。

---

## 11. Adapter（`BaseAdapter`）

```python
from typing import Any

from src.app.plugin_system.base import BaseAdapter


class MyAdapter(BaseAdapter):
    """平台桥接。"""

    name = "my_adapter"
    adapter_version = "1.0.0"
    description = "..."
    platform = "myplatform"

    async def from_platform_message(self, raw: Any):
        """平台原始消息 -> MessageEnvelope。"""
        ...

    async def get_bot_info(self) -> dict[str, Any]:
        """返回 bot 自身信息。"""
        ...
```

- 可选实现 `on_adapter_loaded` / `on_adapter_unloaded` / `health_check` / `reconnect`。
- 基类自带健康检查循环（默认 30s），失败自动 `reconnect()`。
- 出站方向由 `MessageSender` 按 `message.platform == cls.platform` 自动找到对应 adapter。
- Adapter 只做协议转换，不做业务决策。

---

## 12. Collection（当前限制）

Collection 是 Action/Tool 的嵌套分组概念，但当前 `ComponentType` 与 `PluginManager._identify_component()` 没有可独立注册的 Collection 类型。不要把 Collection 类放进 `get_components()` 或 `manifest.include`；仅在框架已有的组合 API 内部使用。

---

## 13. 常用 API 索引

| API 模块 | 典型函数 |
|---|---|
| `send_api` | `send_text` / `send_image` / `send_emoji` / `send_voice` / `send_video` / `send_file` / `send_custom` / `send_message` / `send_batch` / `send_batch_parallel` / `send_text_with_image` / `broadcast_text` |
| `service_api` | `get_service(signature)` / `get_service_class` / `get_all_services` / `get_services_for_plugin` |
| `storage_api` | `save_json` / `load_json` / `delete_json` / `exists_json` / `list_json` |
| `llm_api` | `create_llm_request` / `get_model_set_by_task` / `get_model_set_by_name` / `run_tool_call` / `exec_llm_usable` |
| `prompt_api` | `add_system_reminder`（**只写 store，不会自动注入**） |
| `config_api` | 按类显式加载配置（多配置类插件用） |
| `permission_api` | 权限校验 |
| `stream_api` / `chat_api` / `message_api` | 聊天流与消息查询 |
| `event_api` | 事件发布/临时订阅 |
| `log_api` | `get_logger(name)` |

### system reminder 的坑

`prompt_api.add_system_reminder()` 只写入 store，**不会自动进入任何 LLM 请求**。真正注入取决于调用方是否传了 `with_reminder`：

```python
llm_api.create_llm_request(..., with_reminder="actor")
BaseChatter.create_request(..., with_reminder="actor")
BaseAgent.create_llm_request(..., with_reminder="sub_actor")
```

写了 reminder 但目标链路没传对应 bucket → 完全不生效。

---

## 14. 异步任务

```python
from src.kernel.concurrency import get_task_manager

tm = get_task_manager()
task = tm.create_task(coro, name="my_task", daemon=True)
task_id = task.task_id
# 清理
tm.cancel_task(task_id)
```

定时任务：

```python
from src.kernel.scheduler import TriggerType, get_unified_scheduler

sid = await get_unified_scheduler().create_schedule(
    callback=self._tick,
    trigger_type=TriggerType.TIME,
    trigger_config={"interval_seconds": 60},
    is_recurring=True,
    task_name="my_plugin_tick",
    force_overwrite=True,
)
# on_plugin_unloaded 里必须 remove_schedule(sid)
```

**注意**：插件加载时 scheduler 可能还没 start，`create_schedule` 会抛 `RuntimeError`。参考 `plugins/todo_plugin/plugin.py` 的重试模式：在 daemon 任务里循环重试直到成功。
