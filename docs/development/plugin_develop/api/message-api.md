# Message API

`src.app.plugin_system.api.message_api` 提供消息查询、计数、格式化等接口。

## 核心函数

### 消息查询

| 函数 | 说明 |
|------|------|
| `get_messages_by_stream(stream_id, limit=50, offset=0) -> list[dict]` | 按聊天流获取消息 |
| `get_recent_messages(stream_id, limit=20) -> list[dict]` | 获取最近消息 |
| `get_message_count(stream_id) -> int` | 获取消息总数 |

### 消息格式化

| 函数 | 说明 |
|------|------|
| `format_messages_readable(messages, truncate=True, replace_bot_name=True, merge_messages=True) -> tuple[str, list]` | 格式化消息为可读文本 |

### Person 相关

| 函数 | 说明 |
|------|------|
| `get_person_ids_from_messages(messages) -> list[str]` | 提取去重 person_id |
| `filter_bot_messages(messages) -> list[dict]` | 过滤 Bot 自身消息 |

```python
from src.app.plugin_system.api.message_api import (
    get_recent_messages,
    format_messages_readable,
)

messages = await get_recent_messages("qq_group_123", limit=20)
text, details = await format_messages_readable(messages)
```
