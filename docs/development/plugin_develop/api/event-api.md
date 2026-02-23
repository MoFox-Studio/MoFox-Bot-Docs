# 事件 API

`src/app/plugin_system/api/event_api` 提供事件发布和处理器注册能力。

## 导入

```python
from src.app.plugin_system.api.event_api import (
    publish_event,
    register_handler,
    unregister_handler,
    build_subscription_map,
    get_event_stats,
)
```

## 函数说明

### `publish_event(event, kwargs=None) -> dict[str, Any]`

发布系统事件或自定义事件。

```python
from src.core.components.types import EventType

result = await publish_event(
    EventType.ON_MESSAGE_RECEIVED,
    {"stream_id": "qq_group_123", "content": "hello"},
)

custom = await publish_event(
    "my_plugin:user_action",
    {"user_id": "u1", "action": "buy"},
)
```

### `register_handler(signature, handler) -> None`

手动注册处理器实例。

### `unregister_handler(signature) -> None`

注销处理器。

### `build_subscription_map() -> None`

根据当前已注册处理器重建订阅映射。

### `get_event_stats() -> dict[str, int]`

返回统计字段：

- `handler_count`
- `event_type_count`
- `total_subscriptions`

```python
stats = get_event_stats()
# 例如：{'handler_count': 12, 'event_type_count': 6, 'total_subscriptions': 20}
```

## 跨插件事件示例

```python
# 发布
await publish_event("shop:item_purchased", {"user_id": "u1", "item": "vip"})

# 订阅（在 EventHandler 组件中）
# init_subscribe = ["shop:item_purchased"]
```
