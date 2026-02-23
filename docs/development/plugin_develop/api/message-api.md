# 消息查询 API

`src/app/plugin_system/api/message_api` 提供历史消息查询、统计和可读格式化能力。

## 导入

```python
from src.app.plugin_system.api.message_api import (
    get_messages_by_time,
    get_messages_by_time_in_chat,
    get_messages_by_time_in_chat_inclusive,
    get_messages_by_time_in_chat_for_users,
    get_messages_by_time_for_users,
    get_random_chat_messages,
    get_messages_before_time,
    get_messages_before_time_in_chat,
    get_messages_before_time_for_users,
    get_recent_messages,
    count_new_messages,
    count_new_messages_for_users,
    build_readable_messages_to_str,
    build_readable_messages_with_details,
    get_person_ids_from_messages,
    filter_bot_messages,
)
```

::: tip 参数传递风格
本文档所有示例统一使用**关键字参数**（`param=value`）方式调用，这样更清晰易读。  
函数签名支持位置参数和关键字参数混用，但推荐始终使用关键字参数以提高可维护性。
:::

## `stream_id` 格式说明

`stream_id` 是经过 **SHA-256 哈希**后的 64 位十六进制字符串，由平台和会话信息生成：

- **群聊**：`sha256(f"{platform}_{group_id}")`  
  例如：`sha256("qq_123456")` → `"0b8babfe12cb251daa26040f993e85582b93df44ddd3ce59262e749d2ee854cc"`
  
- **私聊**：`sha256(f"{platform}_{user_id}_private")`  
  例如：`sha256("qq_789012_private")` → `"a1b2c3d4..."`

::: tip 在 Chatter 中获取 stream_id
在 Chatter 组件内部，直接使用 `self.stream_id` 即可，该值已经是哈希后的标准格式。

```python
class MyChatter(BaseChatter):
    async def execute(self):
        # self.stream_id 已经是 SHA-256 哈希值
        messages = await get_recent_messages(self.stream_id, hours=1.0)
```
:::

:::tip 其他组件中获取 stream_id
在 Action、Tool、 等组件中，如果需要获取当前会话的 `stream_id`，可以通过 `self.stream`访问聊天流对象来获取相关信息
BaseCommand 组件实例可以通过 `self.stream_id` 获取当前会话的 `stream_id`。
:::

## 返回消息结构

查询函数返回 `list[dict]`，常用字段：

- `message_id`
- `time`
- `stream_id`（SHA-256 哈希值）
- `person_id`
- `sender_id`
- `sender_name`
- `message_type`
- `content`
- `processed_plain_text`
- `platform`

## `limit_mode`

- `"latest"`：优先取最新消息
- `"earliest"`：优先取最早消息

## 查询函数

### 时间范围查询

```python
messages = await get_messages_by_time(start_time, end_time, limit=100)
```

### 会话内时间范围查询（不含边界）

```python
messages = await get_messages_by_time_in_chat(
    stream_id="0b8babfe12cb251daa26040f993e85582b93df44ddd3ce59262e749d2ee854cc",  # SHA-256 哈希后的会话 ID
    start_time=start,
    end_time=end,
    limit=50,
    filter_bot=True,
    filter_command=True,
)
```

### 会话内时间范围查询（含边界）

```python
messages = await get_messages_by_time_in_chat_inclusive(
    stream_id="0b8babfe12cb251daa26040f993e85582b93df44ddd3ce59262e749d2ee854cc",  # SHA-256 哈希后的会话 ID
    start_time=start,
    end_time=end,
)
```

### 会话内按用户过滤

```python
messages = await get_messages_by_time_in_chat_for_users(
    stream_id="0b8babfe12cb251daa26040f993e85582b93df44ddd3ce59262e749d2ee854cc",  # SHA-256 哈希后的会话 ID
    start_time=start,
    end_time=end,
    person_ids=["p1", "p2"],
)
```

### 全局按用户过滤

```python
messages = await get_messages_by_time_for_users(
    start_time=start,
    end_time=end,
    person_ids=["p1", "p2"],
)
```

### 随机会话抽样

```python
messages = await get_random_chat_messages(start_time=start, end_time=end, limit=30)
```

### 查询某时刻前的消息

```python
global_old = await get_messages_before_time(timestamp=ts, limit=100)
chat_old = await get_messages_before_time_in_chat(
    stream_id="0b8babfe12cb251daa26040f993e85582b93df44ddd3ce59262e749d2ee854cc",  # SHA-256 哈希后的会话 ID
    timestamp=ts,
    limit=20,
)
user_old = await get_messages_before_time_for_users(timestamp=ts, person_ids=["p1"], limit=20)
```

### 最近消息

```python
recent = await get_recent_messages(
    stream_id="0b8babfe12cb251daa26040f993e85582b93df44ddd3ce59262e749d2ee854cc",  # SHA-256 哈希后的会话 ID
    hours=2.0,
    limit=80,
    filter_bot=True,
)
```

## 统计函数

```python
stream_id = "0b8babfe12cb251daa26040f993e85582b93df44ddd3ce59262e749d2ee854cc"  # SHA-256 哈希后的会话 ID
total = await count_new_messages(stream_id, start_time=start, end_time=end)
user_total = await count_new_messages_for_users(
    stream_id,
    start_time=start,
    end_time=end,
    person_ids=["p1", "p2"],
)
```

## 可读格式化

### `build_readable_messages_to_str(...) -> str`

用于直接拼接上下文字符串。

常用参数：

- `replace_bot_name: bool`：是否将 Bot 名称替换为“你”
- `merge_messages: bool`：同一发送者的连续消息是否合并
- `timestamp_mode: "relative" | "absolute"`：时间显示模式
- `read_mark: float`：读标时间戳（大于 0 时会插入“未读消息”分隔）
- `truncate: bool`：是否截断过长内容
- `show_actions: bool`：是否保留动作相关文本（当前实现与默认输出一致）

```python
text = await build_readable_messages_to_str(
    recent,
    replace_bot_name=True,
    merge_messages=True,
    timestamp_mode="relative",
    read_mark=0.0,
    truncate=True,
    show_actions=False,
)
```

### `build_readable_messages_with_details(...) -> tuple[str, list[tuple[float, str, str]]]`

在返回文本外，附带 `(时间戳, 发送者, 内容)` 明细。

```python
text, details = await build_readable_messages_with_details(recent, timestamp_mode="absolute")
```

## 其他辅助

```python
person_ids = await get_person_ids_from_messages(recent)
user_only = await filter_bot_messages(recent)
```

## Chatter 场景示例

```python
from typing import AsyncGenerator

from src.core.components.base.chatter import BaseChatter, Wait, Success, Failure
from src.app.plugin_system.api.message_api import get_recent_messages, build_readable_messages_to_str
from src.app.plugin_system.api.llm_api import get_model_set_by_task, create_llm_request
from src.app.plugin_system.api.send_api import send_text
from src.kernel.llm import LLMPayload, ROLE, Text


class ContextChatter(BaseChatter):
    chatter_name = "context_chatter"

    async def execute(self) -> AsyncGenerator[Wait | Success | Failure, None]:
        history = await get_recent_messages(self.stream_id, hours=1.0, limit=30, filter_bot=True)
        history_text = await build_readable_messages_to_str(history, truncate=True)

        unread_json, unread_messages = await self.fetch_unreads()
        if not unread_messages:
            yield Wait()
            return

        req = create_llm_request(get_model_set_by_task("actor"), request_name="context_chat")
        req.add_payload(LLMPayload(ROLE.SYSTEM, Text(f"最近聊天记录：\n{history_text}")))
        req.add_payload(LLMPayload(ROLE.USER, Text(unread_json)))

        yield Wait()
        resp = await req.send(stream=False)

        answer = (resp.message or "").strip()
        if not answer:
            yield Failure("无有效回复")
            return

        if await send_text(answer, self.stream_id):
            await self.flush_unreads(unread_messages)
            yield Success("回复完成")
        else:
            yield Failure("发送失败")
```
