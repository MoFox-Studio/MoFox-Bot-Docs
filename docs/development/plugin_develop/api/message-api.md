# Message API

`src.app.plugin_system.api.message_api` 提供消息查询、计数与可读格式化接口。

所有函数均为**异步函数**，调用时需 `await`。数据结构完全采用 Neo-MoFox 最新模型语义。

## 导入

```python
from src.app.plugin_system.api.message_api import (
    # 时间范围查询
    get_messages_by_time,
    get_messages_by_time_in_chat,
    get_messages_by_time_in_chat_inclusive,
    get_messages_by_time_in_chat_for_users,
    get_messages_by_time_for_users,
    get_random_chat_messages,
    # 时间戳之前查询
    get_messages_before_time,
    get_messages_before_time_in_chat,
    get_messages_before_time_for_users,
    # 最近消息
    get_recent_messages,
    # 计数
    count_new_messages,
    count_new_messages_for_users,
    # 格式化
    build_readable_messages_to_str,
    build_readable_messages_with_details,
    # 辅助
    get_person_ids_from_messages,
    filter_bot_messages,
)
```

## 时间范围查询

| 函数 | 说明 |
|------|------|
| `get_messages_by_time(start_time, end_time, limit=0, limit_mode="latest", filter_bot=False) -> list[dict]` | 获取指定时间范围内的消息 |
| `get_messages_by_time_in_chat(stream_id, start_time, end_time, limit=0, limit_mode="latest", filter_bot=False, filter_command=False) -> list[dict]` | 获取指定 stream 中指定时间范围内的消息 |
| `get_messages_by_time_in_chat_inclusive(stream_id, start_time, end_time, limit=0, limit_mode="latest", filter_bot=False, filter_command=False) -> list[dict]` | 同上，但包含边界时间 |
| `get_messages_by_time_in_chat_for_users(stream_id, start_time, end_time, person_ids, limit=0, limit_mode="latest") -> list[dict]` | 获取指定 stream 中指定用户在时间范围内的消息 |
| `get_messages_by_time_for_users(start_time, end_time, person_ids, limit=0, limit_mode="latest") -> list[dict]` | 获取指定用户在所有 stream 中指定时间范围内的消息 |
| `get_random_chat_messages(start_time, end_time, limit=0, limit_mode="latest", filter_bot=False) -> list[dict]` | 随机选择一个 stream，返回该 stream 在时间范围内的消息 |

参数说明：

- `start_time` / `end_time`: 时间戳（`float`）
- `limit`: 限制数量，`0` 表示不限制
- `limit_mode`: 排序模式，取 `"earliest"`（最早优先）或 `"latest"`（最新优先）
- `filter_bot`: 是否过滤机器人自身消息
- `filter_command`: 是否过滤命令消息

## 时间戳之前查询

| 函数 | 说明 |
|------|------|
| `get_messages_before_time(timestamp, limit=0, filter_bot=False) -> list[dict]` | 获取指定时间戳之前的消息 |
| `get_messages_before_time_in_chat(stream_id, timestamp, limit=0, filter_bot=False) -> list[dict]` | 获取指定 stream 中指定时间戳之前的消息 |
| `get_messages_before_time_for_users(timestamp, person_ids, limit=0) -> list[dict]` | 获取指定用户在指定时间戳之前的消息 |

## 最近消息

`get_recent_messages(stream_id: str, hours: float = 24.0, limit: int = 100, limit_mode: str = "latest", filter_bot: bool = False) -> list[dict]`

获取指定 stream 中最近一段时间的消息。

- `stream_id`: 聊天流 ID
- `hours`: 回溯小时数
- `limit`: 限制数量
- `limit_mode`: 排序模式
- `filter_bot`: 是否过滤机器人消息

```python
from src.app.plugin_system.api.message_api import get_recent_messages

messages = await get_recent_messages("qq_group_123", hours=12, limit=50)
```

## 计数

| 函数 | 说明 |
|------|------|
| `count_new_messages(stream_id, start_time=0.0, end_time=None) -> int` | 计算指定 stream 中从开始时间到结束时间的新消息数量 |
| `count_new_messages_for_users(stream_id, start_time, end_time, person_ids) -> int` | 计算指定 stream 中指定用户在时间范围内的新消息数量 |

## 格式化

### `build_readable_messages_to_str(messages: list[dict], replace_bot_name: bool = True, merge_messages: bool = False, timestamp_mode: str = "relative", read_mark: float = 0.0, truncate: bool = False, show_actions: bool = False) -> str`

将消息列表构建为可读字符串。

- `messages`: 消息字典列表
- `replace_bot_name`: 是否替换机器人名称
- `merge_messages`: 是否合并同一发送者的连续消息
- `timestamp_mode`: 时间显示模式，取 `"relative"`（相对时间）或 `"absolute"`（绝对时间）
- `read_mark`: 已读时间戳，大于 0 时会插入 `--- 未读消息 ---` 分隔
- `truncate`: 是否截断过长文本（超过 120 字符）
- `show_actions`: 是否包含动作内容

### `build_readable_messages_with_details(messages: list[dict], replace_bot_name: bool = True, merge_messages: bool = False, timestamp_mode: str = "relative", truncate: bool = False) -> tuple[str, list[tuple[float, str, str]]]`

将消息列表构建为可读字符串并返回详细元组。返回 `(可读消息文本, [(时间戳, 发送者, 内容), ...])`。

## 辅助函数

| 函数 | 说明 |
|------|------|
| `get_person_ids_from_messages(messages) -> list[str]` | 从消息列表中提取去重后的 `person_id` 列表 |
| `filter_bot_messages(messages) -> list[dict]` | 从消息列表中过滤 Bot 自身消息（按当前激活适配器 Bot 信息） |

## 消息字典结构

所有查询函数返回的消息字典包含以下字段：

| 字段 | 说明 |
|------|------|
| `id` | 记录 ID |
| `message_id` | 平台消息 ID |
| `time` | 时间戳 |
| `stream_id` | 聊天流 ID |
| `person_id` | 用户身份标识 |
| `sender_id` | 发送者 ID |
| `sender_name` | 发送者名称 |
| `sender_cardname` | 发送者群名片 |
| `message_type` | 消息类型 |
| `content` | 原始内容 |
| `processed_plain_text` | 处理后的纯文本 |
| `reply_to` | 回复目标消息 ID |
| `platform` | 平台名称 |
| `extra` | 扩展信息 |

## 相关文档

- [Stream API](./stream-api.md)
- [Send API](./send-api.md)
