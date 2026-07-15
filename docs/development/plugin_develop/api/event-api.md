# Event API

`src.app.plugin_system.api.event_api` 提供事件的发布、处理器注册和临时监听器管理。

所有涉及 I/O 的操作均为**异步函数**，调用时需 `await`；`unregister_handler` 和 `get_event_stats` 为同步函数。

## 导入

```python
from src.app.plugin_system.api.event_api import (
    publish_event,
    register_handler,
    unregister_handler,
    build_subscription_map,
    create_temporary_handler,
    unregister_temporary_handler,
    get_event_stats,
)
```

## 函数

### 事件发布

`publish_event(event: EventType | str, kwargs: dict[str, Any] | None = None) -> dict[str, Any]`

发布事件给订阅者。支持系统事件（`EventType` 枚举）和自定义事件（字符串）。返回发布结果，包含最终决策和参数。

```python
from src.core.components import EventType

# 系统事件
result = await publish_event(EventType.ON_MESSAGE_RECEIVED, {"message": msg})

# 自定义事件
result = await publish_event("my_plugin:user_action", {"action": "click"})
```

### 处理器注册

| 函数 | 说明 |
|------|------|
| `register_handler(signature: str, handler: BaseEventHandler) -> None` | 注册事件处理器（异步） |
| `unregister_handler(signature: str) -> None` | 注销事件处理器（同步） |
| `build_subscription_map() -> None` | 构建事件订阅映射表，遍历所有已注册的事件处理器并注册到 EventBus，处理器按权重降序排序（异步） |

### 临时监听器

`create_temporary_handler(event_names: list[EventType | str], handle_func: Callable, priority: int = 0) -> str`

创建运行时临时事件监听器。临时监听器执行后，只要回调返回的 `decision` 不是 `PASS`，就会自动从所有订阅事件上清除。返回临时监听器 ID，可用于手动注销。此函数为**异步函数**。

- `event_names`: 需要订阅的事件名称列表
- `handle_func`: 监听器回调，签名与 EventBus 订阅者协议一致，返回 `(EventDecision, dict[str, Any])`
- `priority`: 监听器优先级

`unregister_temporary_handler(temporary_id: str) -> bool`

手动注销运行时临时事件监听器。此函数为**异步函数**。

### 统计

`get_event_stats() -> dict[str, int]`

获取事件统计信息。返回字典包含：

- `handler_count`: 处理器总数
- `event_type_count`: 事件类型总数
- `total_subscriptions`: 总订阅数

## 相关文档

- [EventHandler 组件](../components/event-handler.md)
