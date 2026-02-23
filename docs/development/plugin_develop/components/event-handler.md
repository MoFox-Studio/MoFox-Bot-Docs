# EventHandler — 事件处理器组件

`BaseEventHandler` 订阅系统事件并在事件触发时执行响应逻辑。支持权重排序和消息拦截控制。

## 事件处理链

多个 EventHandler 可以订阅同一事件，按 **权重降序** 依次执行：

```
事件触发
    ↓
Handler A（weight=100）→ execute() → [intercept=True → 后续 Handler 跳过]
    ↓（intercept=False）
Handler B（weight=50）→ execute()
    ↓
Handler C（weight=0）→ execute()
```

## 类属性

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `handler_name` | `str` | `""` | 处理器名称（插件内唯一）|
| `handler_description` | `str` | `""` | 功能描述 |
| `weight` | `int` | `0` | 处理器权重，越大越先执行 |
| `intercept_message` | `bool` | `False` | 兼容性元数据字段（当前运行时不直接依据此字段拦截）|
| `init_subscribe` | `list[EventType \| str]` | `[]` | 初始订阅的事件类型列表 |
| `dependencies` | `list[str]` | `[]` | 组件级依赖 |

## 系统事件类型（EventType）

| 枚举值 | 触发时机 |
| --- | --- |
| `EventType.ON_START` | Bot 启动时 |
| `EventType.ON_STOP` | Bot 停止时 |
| `EventType.ON_MESSAGE_RECEIVED` | 收到新消息时 |
| `EventType.ON_MESSAGE_SENT` | 消息发送完成后 |
| `EventType.ON_NOTICE_RECEIVED` | 收到通知事件时 |
| `EventType.ON_RECEIVED_OTHER_MESSAGE` | 收到其他类型消息时 |
| `EventType.ON_ALL_PLUGIN_LOADED` | 所有插件加载完成时 |
| `EventType.ON_PLUGIN_UNLOADED` | 某个插件被卸载时 |
| `EventType.ON_COMPONENT_LOADED` | 某个组件加载完成时 |
| `EventType.ON_COMPONENT_UNLOADED` | 某个组件被卸载时 |

也支持**自定义字符串事件**：`"my_plugin:custom_event"`

## 必须实现的方法

### `execute(kwargs: dict | None) -> tuple[bool, bool, str | None]`

返回 `(是否成功, 是否拦截后续处理器, 消息/None)`。

::: danger 拦截判定以返回值为准
当前实现中，是否中断后续处理器执行由 `execute()` 的第二个返回值决定，而不是 `intercept_message` 类属性。

- 返回 `(True, True, ...)`：拦截，后续处理器不再执行
- 返回 `(True, False, ...)`：继续执行后续处理器
:::

## 完整示例

### 示例 1：消息日志记录器

```python
from src.core.components.base.event_handler import BaseEventHandler
from src.core.components.types import EventType
from src.app.plugin_system.api.log_api import get_logger

logger = get_logger("message_logger")


class MessageLogHandler(BaseEventHandler):
    """记录所有收到的消息"""

    handler_name = "message_logger"
    handler_description = "记录消息日志到 Logger"
    weight = 100  # 高权重，最先执行
    intercept_message = False  # 元数据字段，实际拦截仍以 execute 返回值为准
    init_subscribe = [EventType.ON_MESSAGE_RECEIVED]

    async def execute(self, kwargs: dict | None) -> tuple[bool, bool, str | None]:
        if kwargs is None:
            return False, False, None

        stream_id = kwargs.get("message", {}).get("stream_id", "unknown_stream")
        sender_id = kwargs.get("message", {}).get("sender_id", "unknown")
        content = kwargs.get("message", {}).get("content", "")

        logger.info(f"[{stream_id}] {sender_id}: {content[:100]}")
        return True, False, None  # 成功，不拦截
```

### 示例 2：黑名单过滤器（会拦截消息）

```python
class BlacklistFilter(BaseEventHandler):
    """黑名单消息过滤器"""

    handler_name = "blacklist_filter"
    weight = 200  # 更高权重，确保在日志之前执行
    intercept_message = True   # 元数据字段，仍需 execute 返回 (True, True, ...) 才会拦截
    init_subscribe = [EventType.ON_MESSAGE_RECEIVED]

    BLACKLIST = {"banned_user_1", "banned_user_2"}

    async def execute(self, kwargs: dict | None) -> tuple[bool, bool, str | None]:
        if not kwargs:
            return True, False, None

        sender_id = kwargs.get("message", {}).get("sender_id", "")
        if sender_id in self.BLACKLIST:
            logger.warning(f"拦截黑名单用户消息: {sender_id}")
            return True, True, "黑名单用户，已拦截"  # True = 拦截！

        return True, False, None  # 不在黑名单，放行
```

### 示例 3：启动时初始化

```python
class StartupHandler(BaseEventHandler):
    """Bot 启动时执行初始化"""

    handler_name = "startup_init"
    init_subscribe = [EventType.ON_ALL_PLUGIN_LOADED]

    async def execute(self, kwargs: dict | None) -> tuple[bool, bool, str | None]:
        # 预热缓存
        await self._warm_up_cache()
        logger.info("缓存预热完成")
        return True, False, "初始化完成"

    async def _warm_up_cache(self) -> None:
        # 实现缓存预热逻辑
        pass
```

### 示例 4：订阅自定义事件

```python
class CustomEventHandler(BaseEventHandler):
    """处理自定义事件"""

    handler_name = "custom_handler"
    init_subscribe = ["my_plugin:user_action"]  # 自定义字符串事件

    async def execute(self, kwargs: dict | None) -> tuple[bool, bool, str | None]:
        if kwargs:
            action = kwargs.get("action")
            user_id = kwargs.get("user_id")
            logger.info(f"用户 {user_id} 执行了动作: {action}")
        return True, False, None
```

## 动态订阅/取消订阅

```python
# 在运行时动态订阅新事件
handler_instance.subscribe(EventType.ON_NOTICE_RECEIVED)
handler_instance.subscribe("another_plugin:some_event")

# 取消订阅
handler_instance.unsubscribe(EventType.ON_MESSAGE_RECEIVED)

# 获取当前订阅列表
subscribed = handler_instance.get_subscribed_events()
```

::: warning 自定义字符串事件的取消订阅边界
当前实现支持 `subscribe("my_plugin:event")`，但对自定义字符串事件执行 `unsubscribe("my_plugin:event")` 时不会生效。

如果你需要动态取消自定义字符串事件订阅，请优先使用 `EventType` 枚举事件，或在设计上避免频繁对该类事件做运行时退订。
:::
