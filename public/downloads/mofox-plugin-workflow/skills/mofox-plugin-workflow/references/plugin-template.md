# 最小完整插件骨架

这是一个可直接改写的起步模板：EventHandler + Command + Config + Service 的组合。
按实际需要删掉不用的组件（同时删掉 `manifest.include` 里对应项和 `get_components()` 里对应类）。

以下用 `demo_plugin` 作为占位名，全部替换成实际插件名。

模板默认只包含精简 README。**不要创建空 `CHANGELOG.md`、`LICENSE` 或 API 文档**；只有满足 `documentation-rules.md` 的条件并有实际内容时才创建。

---

## README.md

删除不适用的行和章节，不保留空标题：

```markdown
# demo_plugin

一句话说明插件解决的问题和适用范围。

## 安装与启用

将插件放入 Neo-MoFox 配置的插件目录并启用；如有额外依赖，在此列出真实安装方式。

## 配置

| 字段 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `general.enabled` | `bool` | `true` | 是否启用插件 |
| `general.keywords` | `list[str]` | `[]` | 触发关键词 |
| `general.notify_template` | `str` | `检测到关键词：{keyword}` | 提醒模板 |

## 使用

- 收到消息时，`demo_handler` 检查已配置关键词并发送提醒。
- `/demo list`：列出关键词。
- `/demo add <keyword>`：添加关键词。
- `/demo remove <keyword>`：删除关键词。

## 组件

| 签名 | 类型 | 行为差异 |
|---|---|---|
| `demo_plugin:config:config` | Config | 提供关键词和提醒模板配置 |
| `demo_plugin:service:demo_service` | Service | 为其他组件提供持久化关键词读写；实例本身不保存跨调用状态 |
| `demo_plugin:event_handler:demo_handler` | EventHandler | 监听消息但不拦截传播，命中关键词时产生发送提醒的副作用 |
| `demo_plugin:command:demo` | Command | `/` 前缀，USER 权限，支持全部聊天类型 |

## 兼容性与限制

- 最低 Neo-MoFox core 版本：`1.0.0`。
- 只处理可提取纯文本且具有 `stream_id` 的消息。
```

README 的配置、命令、组件签名、权限、事件和最低版本必须随实现与 `manifest.json` 同步。

---

## manifest.json

```json
{
  "name": "demo_plugin",
  "version": "1.0.0",
  "display_name": "示例插件",
  "summary": "一句话概述",
  "description": "示例插件：演示 EventHandler + Command + Service 组合",
  "author": "your_name",
  "maintainers": ["your_name"],
  "categories": ["tool"],
  "tags": ["demo"],
  "dependencies": {
    "plugins": [],
    "components": []
  },
  "include": [
    {
      "component_type": "config",
      "component_name": "config",
      "dependencies": [],
      "enabled": true
    },
    {
      "component_type": "service",
      "component_name": "demo_service",
      "dependencies": [],
      "enabled": true
    },
    {
      "component_type": "event_handler",
      "component_name": "demo_handler",
      "dependencies": ["demo_plugin:service:demo_service"],
      "enabled": true
    },
    {
      "component_type": "command",
      "component_name": "demo",
      "dependencies": ["demo_plugin:service:demo_service"],
      "enabled": true
    }
  ],
  "entry_point": "plugin.py",
  "min_core_version": "1.0.0",
  "python_dependencies": [],
  "dependencies_required": true
}
```

要点：
- `name` 必须与 `plugin.py` 里的 `plugin_name` 完全一致。
- `min_core_version` 必须显式写。缺失时当前 loader 会保留为空、发出警告并继续加载；工作流政策仍将其视为应修复的 `POLICY/WARN`。
- `include` 必须手工维护，和 `get_components()` 保持一致。
- `include[].dependencies` 必须是完整三段签名。

---

## `__init__.py`

```python
"""demo_plugin 包初始化。"""
```

---

## config.py

```python
"""demo_plugin 配置定义。"""

from __future__ import annotations

from typing import ClassVar

from src.app.plugin_system.base import BaseConfig, Field, SectionBase, config_section


class DemoConfig(BaseConfig):
    """demo_plugin 配置。"""

    name: ClassVar[str] = "config"
    description: ClassVar[str] = "demo 插件配置"

    @config_section("general", title="常规设置", tag="general")
    class GeneralSection(SectionBase):
        """常规配置。"""

        enabled: bool = Field(
            default=True,
            description="是否启用插件",
            label="启用",
            tag="general",
        )
        keywords: list[str] = Field(
            default_factory=list,
            description="触发关键词列表",
            label="关键词",
            tag="general",
        )
        notify_template: str = Field(
            default="检测到关键词：{keyword}",
            description="提醒文案模板，支持 {keyword} 占位符",
            label="提醒模板",
            tag="general",
        )

    general: GeneralSection = Field(default_factory=GeneralSection)
```

---

## services.py

```python
"""demo_plugin 服务层。"""

from __future__ import annotations

from src.app.plugin_system.api import storage_api
from src.app.plugin_system.base import BaseService

_STORE = "demo_plugin"
_KEY = "keywords"


class DemoService(BaseService):
    """关键词存储服务。

    注意：Service 每次通过 get_service() 获取都是新实例，
    因此状态必须落到 storage，不能只放实例字段。
    """

    name = "demo_service"
    description = "关键词的读写"

    async def list_keywords(self) -> list[str]:
        """返回当前关键词列表。"""
        data = await storage_api.load_json(_STORE, _KEY)
        if not data:
            return []
        items = data.get("items", [])
        return [str(x) for x in items] if isinstance(items, list) else []

    async def add_keyword(self, keyword: str) -> bool:
        """新增关键词，已存在时返回 False。"""
        items = await self.list_keywords()
        if keyword in items:
            return False
        items.append(keyword)
        await storage_api.save_json(_STORE, _KEY, {"items": items})
        return True

    async def remove_keyword(self, keyword: str) -> bool:
        """删除关键词，不存在时返回 False。"""
        items = await self.list_keywords()
        if keyword not in items:
            return False
        items.remove(keyword)
        await storage_api.save_json(_STORE, _KEY, {"items": items})
        return True
```

---

## handlers.py

```python
"""demo_plugin 事件处理器。"""

from __future__ import annotations

from typing import Any, cast

from src.app.plugin_system.api import send_api, service_api
from src.app.plugin_system.api.log_api import get_logger
from src.app.plugin_system.base import BaseEventHandler
from src.core.components.types import EventType
from src.kernel.event import EventDecision

from .config import DemoConfig
from .services import DemoService

logger = get_logger("demo_plugin")


class DemoHandler(BaseEventHandler):
    """监听消息，命中关键词时发提醒。"""

    name = "demo_handler"
    description = "关键词命中提醒"
    weight = 10
    intercept_message = False
    init_subscribe = [EventType.ON_MESSAGE_RECEIVED]
    dependencies = ["demo_plugin:service:demo_service"]

    async def execute(
        self, event_name: str, params: dict[str, Any]
    ) -> tuple[EventDecision, dict[str, Any]]:
        """处理收到的消息。

        Args:
            event_name: 事件名
            params: 事件参数，必须原样返回（key 集合不可变）

        Returns:
            (决策, 参数)
        """
        config = self.plugin.config
        if not isinstance(config, DemoConfig) or not config.general.enabled:
            return EventDecision.PASS, params

        message = params.get("message")
        if message is None:
            return EventDecision.PASS, params

        text = str(getattr(message, "processed_plain_text", "") or "")
        if not text:
            return EventDecision.PASS, params

        svc = service_api.get_service("demo_plugin:service:demo_service")
        if svc is None:
            logger.warning("demo_service 不可用")
            return EventDecision.PASS, params

        keywords = await cast(DemoService, svc).list_keywords()
        hit = next((k for k in keywords if k and k in text), None)
        if hit is None:
            return EventDecision.PASS, params

        stream_id = getattr(message, "stream_id", "")
        if stream_id:
            # 参数顺序：send_text(content, stream_id, ...)，content 在前
            await send_api.send_text(
                config.general.notify_template.format(keyword=hit),
                stream_id,
            )

        return EventDecision.PASS, params
```

---

## commands.py

```python
"""demo_plugin 命令。"""

from __future__ import annotations

from typing import cast

from src.app.plugin_system.api import service_api
from src.app.plugin_system.base import BaseCommand, cmd_route
from src.app.plugin_system.types import ChatType
from src.core.components.types import PermissionLevel

from .services import DemoService


class DemoCommand(BaseCommand):
    """关键词管理命令。"""

    name = "demo"
    description = "管理关键词提醒列表"
    command_prefix = "/"
    permission_level = PermissionLevel.USER
    associated_platforms: list[str] = []
    chat_type = ChatType.ALL
    dependencies = ["demo_plugin:service:demo_service"]

    def _service(self) -> DemoService | None:
        """获取服务实例。"""
        svc = service_api.get_service("demo_plugin:service:demo_service")
        return cast(DemoService, svc) if svc is not None else None

    @cmd_route("list")
    async def list_keywords(self) -> tuple[bool, str]:
        """列出所有关键词。"""
        svc = self._service()
        if svc is None:
            return False, "服务不可用"
        items = await svc.list_keywords()
        if not items:
            return True, "当前没有关键词"
        return True, "关键词：\n" + "\n".join(f"- {x}" for x in items)

    @cmd_route("add")
    async def add_keyword(self, keyword: str) -> tuple[bool, str]:
        """添加关键词。"""
        svc = self._service()
        if svc is None:
            return False, "服务不可用"
        ok = await svc.add_keyword(keyword)
        return (True, f"已添加：{keyword}") if ok else (False, f"已存在：{keyword}")

    @cmd_route("remove")
    async def remove_keyword(self, keyword: str) -> tuple[bool, str]:
        """删除关键词。"""
        svc = self._service()
        if svc is None:
            return False, "服务不可用"
        ok = await svc.remove_keyword(keyword)
        return (True, f"已删除：{keyword}") if ok else (False, f"不存在：{keyword}")
```

---

## plugin.py

```python
"""demo_plugin 插件入口。"""

from __future__ import annotations

from src.app.plugin_system.api.log_api import get_logger
from src.app.plugin_system.base import BasePlugin, register_plugin

from .commands import DemoCommand
from .config import DemoConfig
from .handlers import DemoHandler
from .services import DemoService

logger = get_logger("demo_plugin")


@register_plugin
class DemoPlugin(BasePlugin):
    """示例插件。"""

    plugin_name: str = "demo_plugin"          # 必须 == manifest.name
    plugin_description: str = "关键词提醒示例插件"
    plugin_version: str = "1.0.0"

    configs: list[type] = [DemoConfig]
    dependent_components: list[str] = []

    def __init__(self, config: DemoConfig | None = None) -> None:
        """初始化插件。"""
        super().__init__(config)

    def get_components(self) -> list[type]:
        """返回组件类列表（不含配置类）。"""
        return [DemoService, DemoHandler, DemoCommand]

    async def on_plugin_loaded(self) -> None:
        """插件加载完成。"""
        logger.info("demo_plugin 已加载")

    async def on_plugin_unloaded(self) -> None:
        """插件卸载，清理资源。"""
        logger.info("demo_plugin 已卸载")
```

---

## 带定时任务的变体

如果插件需要定时执行，参考这个模式（关键点是 scheduler 可能还没 start，需要重试）：

```python
import asyncio

from src.kernel.concurrency import get_task_manager


@register_plugin
class DemoPlugin(BasePlugin):
    ...

    def __init__(self, config: DemoConfig | None = None) -> None:
        super().__init__(config)
        self._schedule_id: str | None = None
        self._register_task_id: str | None = None

    async def on_plugin_loaded(self) -> None:
        """注册定时任务（异步等待 scheduler 就绪）。"""
        task = get_task_manager().create_task(
            self._register_schedule_when_ready(),
            name="demo_plugin_register_schedule",
            daemon=True,
        )
        self._register_task_id = task.task_id

    async def on_plugin_unloaded(self) -> None:
        """清理定时任务与后台任务。"""
        from src.kernel.scheduler import get_unified_scheduler

        if self._schedule_id:
            try:
                await get_unified_scheduler().remove_schedule(self._schedule_id)
            except Exception as exc:
                logger.warning(f"移除定时任务失败: {exc}")
            self._schedule_id = None

        if self._register_task_id:
            try:
                get_task_manager().cancel_task(self._register_task_id)
            except Exception as exc:
                logger.warning(f"取消注册任务失败: {exc}")
            self._register_task_id = None

    async def _register_schedule_when_ready(self) -> None:
        """等待 scheduler 就绪后注册定时任务。"""
        from src.kernel.scheduler import TriggerType, get_unified_scheduler

        scheduler = get_unified_scheduler()
        for _attempt in range(600):
            try:
                self._schedule_id = await scheduler.create_schedule(
                    callback=self._tick,
                    trigger_type=TriggerType.TIME,
                    trigger_config={"interval_seconds": 60},
                    is_recurring=True,
                    task_name="demo_plugin_tick",
                    force_overwrite=True,
                )
                return
            except RuntimeError:
                await asyncio.sleep(0.5)
            except Exception as exc:
                logger.warning(f"注册定时任务失败: {exc}")
                await asyncio.sleep(2.0)
        logger.warning("等待 scheduler 就绪超时")

    async def _tick(self) -> None:
        """定时任务回调。"""
        ...
```

---

## 生成后立即验证

复用 Phase 0 已探测的变量，不硬编码虚拟环境、插件目录或全局 Skill 安装位置：

```bash
PLUGIN_DIR="$PLUGINS_DIR/demo_plugin"
ruff check "$PLUGIN_DIR"
"$PY" -X utf8 "$SKILL_DIR/scripts/verify_plugin.py" "$PLUGIN_DIR" --timeout 30
```

目标：`0 FAIL`；仅当不存在未动态验证的外部组件依赖及相关副作用风险时，才要求并声称 `0 WARN / 0 FAIL`。
