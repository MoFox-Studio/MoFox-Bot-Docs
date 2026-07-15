# Chat API

`src.app.plugin_system.api.chat_api` 提供 Chatter 组件的查询、活跃实例管理和聊天流绑定。

## 导入

```python
from src.app.plugin_system.api.chat_api import (
    get_all_chatters,
    get_chatters_for_plugin,
    get_chatter_class,
    get_active_chatters,
    register_active_chatter,
    unregister_active_chatter,
    bind_chatter_for_stream,
    restore_stream_to_default,
    get_chatter_by_stream,
    get_or_create_chatter_for_stream,
)
```

## 函数

### `get_all_chatters() -> dict[str, type[BaseChatter]]`

获取所有已注册的 Chatter 组件。

### `get_chatters_for_plugin(plugin_name: str) -> dict[str, type[BaseChatter]]`

获取指定插件的所有 Chatter。

### `get_chatter_class(signature: str) -> type[BaseChatter] | None`

通过签名获取 Chatter 类。

### `get_active_chatters() -> dict[str, BaseChatter]`

获取当前活跃的 Chatter 实例（按 `stream_id` 索引）。

### `register_active_chatter(stream_id: str, chatter: BaseChatter) -> None`

注册一个活跃的 Chatter 实例到指定聊天流。

### `unregister_active_chatter(stream_id: str) -> bool`

注销指定聊天流的 Chatter 实例。

### `bind_chatter_for_stream(stream_id: str, chatter: BaseChatter) -> None`

显式绑定 chatter 到指定 stream，覆盖默认 chatter 选择。

### `restore_stream_to_default(stream_id: str) -> bool`

移除显式绑定，恢复默认 chatter 选择逻辑。

### `get_chatter_by_stream(stream_id: str) -> BaseChatter | None`

获取指定聊天流的活跃 Chatter 实例。

### `get_or_create_chatter_for_stream(stream_id: str, chat_type: ChatType | str, platform: str) -> BaseChatter | None`

获取或自动创建绑定到指定聊天流的 Chatter。这是最常用的入口函数。

- `stream_id`: 聊天流 ID
- `chat_type`: 聊天类型（`private` / `group` / `discuss`），支持 [`ChatType`](../../components/types.md) 枚举或字符串
- `platform`: 平台标识

```python
from src.app.plugin_system.api.chat_api import get_or_create_chatter_for_stream

chatter = get_or_create_chatter_for_stream(
    stream_id="group_123",
    chat_type="group",
    platform="qq",
)
```

## 相关文档

- [Chatter 组件](../components/chatter.md)
