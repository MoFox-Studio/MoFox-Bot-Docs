# Event API

`src.app.plugin_system.api.event_api` 提供事件的发布、处理器注册和临时监听器管理。

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

`publish_event(event: EventType | str, kwargs: dict | None = None) -> dict[str, Any]`

发布事件给订阅者。支持系统事件（`EventType` 枚举）和自定义事件（字符串）。

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
| `register_handler(signature: str, handler: BaseEventHandler) -> None` | 注册事件处理器 |
| `unregister_handler(signature: str) -> None` | 注销事件处理器 |
| `build_subscription_map() -> None` | 构建事件订阅映射表 |

### 临时监听器

| 函数 | 说明 |
|------|------|
| `create_temporary_handler(event_names, handle_func, priority=0) -> str` | 创建临时监听器，执行后自动清除 |
| `unregister_temporary_handler(temporary_id: str) -> bool` | 手动注销临时监听器 |

### 统计

`get_event_stats() -> dict[str, int]`

获取事件统计信息（处理器数量、事件类型数、总订阅数）。

## 相关文档

- [EventHandler 组件](../components/event-handler.md)
