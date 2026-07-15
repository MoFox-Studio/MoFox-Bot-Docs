# Stream API

`src.app.plugin_system.api.stream_api` 提供聊天流的创建、查询、消息管理、上下文操作与批量清空能力。

所有涉及 I/O 的函数均为**异步函数**，调用时需 `await`；`clear_stream_cache`、`clear_context`、`get_all_stream_ids` 为同步函数。

::: tip 想了解"聊天流是什么"？
本页是 `stream_api` 的 API 速查。如果你还不知道 `stream_id` / `ChatStream` / `StreamContext` / `ChatStreams` 表这四个名词分别指什么，请先读 [16.5 Stream：聊天流是什么](../guide/plugin-authoring/16.5-stream)。
:::

## 导入

```python
from src.app.plugin_system.api.stream_api import (
    get_or_create_stream,
    get_stream,
    build_stream_from_database,
    load_stream_context,
    add_message_to_stream,
    add_message,
    add_sent_message_to_history,
    delete_stream,
    get_stream_info,
    get_stream_messages,
    clear_stream_cache,
    refresh_stream,
    activate_stream,
    clear_context,
    load_and_clear_context,
    get_all_stream_ids,
    get_stream_ids_from_db,
    bulk_clear_streams,
)
```

## 函数

### 流的获取与创建

#### `get_or_create_stream(stream_id: str = "", platform: str = "", user_id: str = "", group_id: str = "", chat_type: ChatType | str = "private") -> ChatStream`

获取现有流或创建新流。

- 若提供 `stream_id`，按该 ID 获取或创建。
- 若未提供 `stream_id`，则必须提供 `platform` 且至少提供 `user_id` 或 `group_id` 之一，否则抛出 `ValueError`。
- `chat_type` 支持 [`ChatType`](../../components/types.md) 枚举或字符串（如 `"private"`、`"group"`）。

```python
from src.app.plugin_system.api.stream_api import get_or_create_stream

stream = await get_or_create_stream(
    platform="qq",
    user_id="123456",
    chat_type="private",
)
```

#### `get_stream(stream_id: str = "") -> ChatStream | None`

获取现有流。若未找到则返回 `None`。

#### `build_stream_from_database(stream_id: str) -> ChatStream | None`

从数据库记录构建 [`ChatStream`](../guide/plugin-authoring/16.5-stream#chatstream-可读字段)。未找到返回 `None`。

#### `load_stream_context(stream_id: str, max_messages: int | None = None) -> StreamContext`

从数据库加载 [`StreamContext`](../guide/plugin-authoring/16.5-stream#streamcontext-可读字段)。`max_messages` 控制最大加载消息数，可选。

#### `refresh_stream(stream_id: str) -> ChatStream | None`

强制从数据库刷新流。未找到返回 `None`。

#### `activate_stream(stream_id: str) -> ChatStream | None`

激活流，更新其最后活跃时间。未找到返回 `None`。

### 消息管理

#### `add_message_to_stream(message: Message) -> Messages`

添加消息到流。`message` 不能为空，否则抛出 `ValueError`。

#### `add_message(message: Message) -> Messages`

添加消息到流，等价于 [`add_message_to_stream()`](#add_message_to_streammessage-message---messages)。

#### `add_sent_message_to_history(message: Message) -> Messages`

添加“已发送消息”到流历史消息，用于记录 Bot 主动发送的消息。

#### `get_stream_messages(stream_id: str, limit: int = 100, offset: int = 0) -> list[Message]`

获取流的消息（支持分页）。`limit` 和 `offset` 必须为非负整数。

#### `get_stream_info(stream_id: str) -> dict[str, Any] | None`

获取流的综合信息字典。未找到返回 `None`。

### 删除与缓存

#### `delete_stream(stream_id: str, delete_messages: bool = True) -> bool`

删除流及其消息。`delete_messages` 控制是否删除关联消息。

#### `clear_stream_cache(stream_id: str | None = None) -> None`

清理流实例缓存。传入 `stream_id` 清理单个，不传则清理全部。此函数为**同步**函数。

### 上下文清空

#### `clear_context(stream_id: str) -> bool`

清空指定流的内存上下文（仅当流已在内存中时生效）。

将 [`StreamContext`](../guide/plugin-authoring/16.5-stream#streamcontext-可读字段) 的 `history_messages` 和 `unread_messages` 全部清空，使 Chatter 下一轮从空白上下文开始处理。若流尚未加载到内存，返回 `False`。重启后上下文会从数据库重新加载，该操作不影响持久化记录。

```python
from src.app.plugin_system.api.stream_api import clear_context

if clear_context("qq_group_123456"):
    print("上下文已清空")
```

#### `load_and_clear_context(stream_id: str) -> bool`

清空指定流的内存上下文。

若流已在内存中，立即清空；若流不在内存中，将其加入待清空标记集，下次该流通过 [`get_or_create_stream()`](#get_or_create_streamstream_id-str--platform-str--user_id-str--group_id-str--chat_type-chattype--str--private---chatstream) 加载时自动应用清空。此调用始终是瞬时的，不会触发数据库加载，适合批量操作。始终返回 `True`。

#### `bulk_clear_streams(chat_type: str = "") -> int`

批量清空流上下文，持久化清空时间戳到数据库。

通过单条 UPDATE SQL 完成，效率极高。重启 bot 后清空效果依然生效，因为 [`load_stream_context()`](#load_stream_contextstream_id-str-max_messages-int--none---streamcontext) 只会加载 `context_cleared_at` 时间点之后的消息。

- `chat_type`: 聊天类型（`"group"` / `"private"`），空字符串表示清空所有类型
- 返回数据库中成功更新的流数量

```python
from src.app.plugin_system.api.stream_api import bulk_clear_streams

count = await bulk_clear_streams("group")
print(f"已清空 {count} 个群聊流")
```

### 流列表查询

#### `get_all_stream_ids() -> list[str]`

获取当前内存中所有活跃流的 ID 列表。此函数为**同步**函数。

```python
from src.app.plugin_system.api.stream_api import get_all_stream_ids

active = get_all_stream_ids()
print(f"活跃流数: {len(active)}")
```

#### `get_stream_ids_from_db(chat_type: str = "") -> list[str]`

从数据库查询流 ID 列表。

- `chat_type`: 聊天类型（`"group"` / `"private"`），空字符串表示查询所有类型
- 返回流 ID 列表

## 相关文档

- [聊天流概念详解（16.5 Stream）](../guide/plugin-authoring/16.5-stream)
- [Stream API 指南章节（第 24 章）](../guide/plugin-authoring/24-stream-api)
- [Chat API](./chat-api.md)
- [Message API](./message-api.md)
