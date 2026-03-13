# EventHandler — 事件处理器组件

`BaseEventHandler` 订阅系统事件并在事件触发时执行响应逻辑。支持优先级排序和事件拦截控制。

## 工作原理

1. EventHandler 在初始化时订阅指定事件（`init_subscribe` 列表）
2. 事件触发时，EventBus 按优先级（priority = weight）降序调用订阅者
3. 每个处理器返回 `EventDecision` 决定流程：
   - `SUCCESS`：继续执行后续处理器，传播参数变更
   - `STOP`：拦截事件，阻止后续处理器执行
   - `PASS`：跳过本处理器，不传播参数变更

## 执行流程

```text
事件触发（如 ON_MESSAGE_RECEIVED）
    ↓
EventBus 收集所有订阅者，按 weight 降序排列
    ↓
Handler A（weight=100）→ execute() → 返回 (EventDecision.SUCCESS, params)
    ↓（继续）
Handler B（weight=50）→ execute() → 返回 (EventDecision.STOP, params)
    ↓（中断）
Handler C（weight=0）→ [未执行]
```

## 类属性

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `handler_name` | `str` | `""` | 处理器名称（必须设置，在插件内唯一）|
| `handler_description` | `str` | `""` | 处理器功能描述 |
| `weight` | `int` | `0` | 处理器优先级，数值越大越先执行 |
| `intercept_message` | `bool` | `False` | 元数据字段（实际拦截由 `execute()` 返回值决定）|
| `init_subscribe` | `list[EventType \| str]` | `[]` | 初始订阅的事件类型列表 |
| `dependencies` | `list[str]` | `[]` | 组件级依赖签名列表 |

## 系统事件类型（EventType）

| 枚举值 | 触发时机 |
| --- | --- |
| `ON_START` | Bot 启动时 |
| `ON_STOP` | Bot 停止时 |
| `ON_MESSAGE_RECEIVED` | 收到新消息时 |
| `ON_MESSAGE_SENT` | 消息发送完成后 |
| `ON_NOTICE_RECEIVED` | 收到通知事件时 |
| `ON_RECEIVED_OTHER_MESSAGE` | 收到其他类型消息时 |
| `ON_ALL_PLUGIN_LOADED` | 所有插件加载完成时 |
| `ON_PLUGIN_UNLOADED` | 某个插件被卸载时 |
| `ON_COMPONENT_LOADED` | 某个组件加载完成时 |
| `ON_COMPONENT_UNLOADED` | 某个组件被卸载时 |

**自定义事件**：也支持自定义字符串事件，如 `"my_plugin:custom_event"`

## 事件决策（EventDecision）

`execute()` 方法必须返回一个 `EventDecision` 枚举值，控制事件流程：

| 决策值 | 含义 |
| --- | --- |
| `EventDecision.SUCCESS` | 正常执行完成，继续执行后续处理器，传播参数变更 |
| `EventDecision.STOP` | 拦截事件，阻止后续处理器执行 |
| `EventDecision.PASS` | 跳过本处理器，不传播参数变更 |

## 必须实现的方法

### `execute(event_name: str, params: dict[str, Any]) -> tuple[EventDecision, dict[str, Any]]`

事件处理的核心逻辑。

**参数**：
- `event_name`：触发的事件名称（由 EventBus 传入）
- `params`：事件参数字典，可以就地修改

**返回值**：`(EventDecision, params)` — 返回决策和（可能已修改的）参数字典

```python
from src.kernel.event import EventDecision

async def execute(
    self, event_name: str, params: dict[str, Any]
) -> tuple[EventDecision, dict[str, Any]]:
    # 正常处理，继续后续处理器
    return EventDecision.SUCCESS, params
    
    # 拦截，阻止后续处理器执行
    params["reason"] = "已拦截"
    return EventDecision.STOP, params
    
    # 跳过，不传播本处理器对 params 的变更
    return EventDecision.PASS, params
```

## 实例属性

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `self.plugin` | `BasePlugin` | 所属插件实例，可访问插件配置 |
| `self.signature` | `str` | 组件签名，格式为 `"plugin_name:event_handler:handler_name"` |

## 完整示例

### 示例 1：消息日志记录器

```python
from typing import Any
from src.core.components.base.event_handler import BaseEventHandler
from src.core.components.types import EventType
from src.kernel.event import EventDecision
from src.app.plugin_system.api.log_api import get_logger

logger = get_logger("message_logger")


class MessageLogHandler(BaseEventHandler):
    """记录所有收到的消息"""

    handler_name = "message_logger"
    handler_description = "记录消息日志到 Logger"
    weight = 100  # 高权重，优先执行
    init_subscribe = [EventType.ON_MESSAGE_RECEIVED]

    async def execute(
        self, event_name: str, params: dict[str, Any]
    ) -> tuple[EventDecision, dict[str, Any]]:
        message = params.get("message", {})
        stream_id = message.get("stream_id", "unknown_stream")
        sender_id = message.get("sender_id", "unknown")
        content = message.get("content", "")

        logger.info(f"[{stream_id}] {sender_id}: {content[:100]}")
        
        # 成功处理，继续后续处理器
        return EventDecision.SUCCESS, params
```

### 示例 2：黑名单过滤器（拦截消息）

```python
from typing import Any
from src.core.components.base.event_handler import BaseEventHandler
from src.core.components.types import EventType
from src.kernel.event import EventDecision
from src.app.plugin_system.api.log_api import get_logger

logger = get_logger("blacklist_filter")


class BlacklistFilter(BaseEventHandler):
    """黑名单消息过滤器"""

    handler_name = "blacklist_filter"
    handler_description = "过滤黑名单用户的消息"
    weight = 200  # 更高权重，确保在日志记录之前执行
    init_subscribe = [EventType.ON_MESSAGE_RECEIVED]

    BLACKLIST = {"banned_user_1", "banned_user_2"}

    async def execute(
        self, event_name: str, params: dict[str, Any]
    ) -> tuple[EventDecision, dict[str, Any]]:
        message = params.get("message", {})
        sender_id = message.get("sender_id", "")
        
        if sender_id in self.BLACKLIST:
            logger.warning(f"拦截黑名单用户消息: {sender_id}")
            # 拦截消息，后续处理器不再执行
            return EventDecision.STOP, params

        # 不在黑名单，继续执行后续处理器
        return EventDecision.SUCCESS, params
```

### 示例 3：启动时初始化

```python
from typing import Any
from src.core.components.base.event_handler import BaseEventHandler
from src.core.components.types import EventType
from src.kernel.event import EventDecision
from src.app.plugin_system.api.log_api import get_logger

logger = get_logger("startup")


class StartupHandler(BaseEventHandler):
    """Bot 启动时执行初始化"""

    handler_name = "startup_init"
    handler_description = "启动时预热缓存"
    init_subscribe = [EventType.ON_ALL_PLUGIN_LOADED]

    async def execute(
        self, event_name: str, params: dict[str, Any]
    ) -> tuple[EventDecision, dict[str, Any]]:
        # 预热缓存
        await self._warm_up_cache()
        logger.info("缓存预热完成")
        
        params["cache_warmed"] = True
        return EventDecision.SUCCESS, params

    async def _warm_up_cache(self) -> None:
        # 实现缓存预热逻辑
        pass
```

### 示例 4：修改事件参数

```python
from typing import Any
from src.core.components.base.event_handler import BaseEventHandler
from src.core.components.types import EventType
from src.kernel.event import EventDecision


class MessageEnricher(BaseEventHandler):
    """为消息添加额外信息"""

    handler_name = "message_enricher"
    handler_description = "为消息添加时间戳和元数据"
    weight = 150
    init_subscribe = [EventType.ON_MESSAGE_RECEIVED]

    async def execute(
        self, event_name: str, params: dict[str, Any]
    ) -> tuple[EventDecision, dict[str, Any]]:
        import time
        
        # 修改参数，添加额外信息
        params["processed_at"] = time.time()
        params["enriched"] = True
        
        # 传播修改后的参数给后续处理器
        return EventDecision.SUCCESS, params
```

### 示例 5：订阅自定义事件

```python
from typing import Any
from src.core.components.base.event_handler import BaseEventHandler
from src.kernel.event import EventDecision
from src.app.plugin_system.api.log_api import get_logger

logger = get_logger("custom_handler")


class CustomEventHandler(BaseEventHandler):
    """处理自定义事件"""

    handler_name = "custom_handler"
    handler_description = "处理用户自定义动作事件"
    # 订阅自定义字符串事件
    init_subscribe = ["my_plugin:user_action"]

    async def execute(
        self, event_name: str, params: dict[str, Any]
    ) -> tuple[EventDecision, dict[str, Any]]:
        action = params.get("action")
        user_id = params.get("user_id")
        logger.info(f"用户 {user_id} 执行了动作: {action}")
        
        return EventDecision.SUCCESS, params
```

## 动态订阅/取消订阅

EventHandler 支持在运行时动态调整订阅的事件。

```python
# 在运行时动态订阅新事件
handler_instance.subscribe(EventType.ON_NOTICE_RECEIVED)
handler_instance.subscribe("another_plugin:some_event")  # 自定义事件

# 取消订阅
handler_instance.unsubscribe(EventType.ON_MESSAGE_RECEIVED)

# 获取当前订阅列表
subscribed = handler_instance.get_subscribed_events()

# 检查是否订阅了特定事件
if handler_instance.is_subscribed(EventType.ON_MESSAGE_RECEIVED):
    print("已订阅消息接收事件")
```

## 辅助方法

### `get_signature() -> str | None`

获取组件的唯一签名。

```python
>>> MessageLogHandler.get_signature()
"my_plugin:event_handler:message_logger"
```

### `subscribe(event: EventType | str) -> None`

订阅事件（支持 `EventType` 枚举或自定义字符串事件）。

### `unsubscribe(event: EventType | str) -> None`

取消订阅事件。

### `get_subscribed_events() -> list[EventType | str]`

获取已订阅的事件列表。

### `is_subscribed(event: EventType | str) -> bool`

检查是否订阅了特定事件。

## 最佳实践

### 1. 合理设置权重

```python
# 过滤器应该高权重，优先执行
class SecurityFilter(BaseEventHandler):
    weight = 1000
    
# 日志记录器中等权重
class LogHandler(BaseEventHandler):
    weight = 100
    
# 统计分析低权重
class AnalyticsHandler(BaseEventHandler):
    weight = 10
```

### 2. 明确拦截意图

```python
async def execute(
    self, event_name: str, params: dict[str, Any]
) -> tuple[EventDecision, dict[str, Any]]:
    # ✅ 明确：需要拦截就返回 STOP
    if should_block:
        return EventDecision.STOP, params
    
    # ✅ 明确：正常处理继续流程
    return EventDecision.SUCCESS, params
```

### 3. 合理修改参数

```python
async def execute(
    self, event_name: str, params: dict[str, Any]
) -> tuple[EventDecision, dict[str, Any]]:
    # ✅ 修改参数以供后续处理器使用
    params["processed"] = True
    params["handler"] = self.handler_name
    
    return EventDecision.SUCCESS, params
```

### 4. 使用 PASS 跳过处理

```python
async def execute(
    self, event_name: str, params: dict[str, Any]
) -> tuple[EventDecision, dict[str, Any]]:
    # 某些条件下不处理，跳过
    if not self._should_process(params):
        return EventDecision.PASS, params
    
    # 正常处理
    params["processed"] = True
    return EventDecision.SUCCESS, params
```

## 注意事项

::: warning 关于 intercept_message 属性
`intercept_message` 是元数据字段，实际是否拦截由 `execute()` 方法的返回值决定。返回 `EventDecision.STOP` 才会真正拦截事件。
:::

::: tip 自定义事件的取消订阅
目前 `unsubscribe()` 对自定义字符串事件的支持有限。如需频繁动态取消订阅，建议优先使用 `EventType` 枚举事件。
:::

::: danger 异步处理注意
`execute()` 是异步方法，可以安全地调用其他异步操作。但应避免长时间阻塞，以免影响事件处理性能。
:::
