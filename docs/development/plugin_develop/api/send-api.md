# 消息发送 API

`src/app/plugin_system/api/send_api` 提供主动发送消息的扁平化接口。

## 导入

```python
from src.app.plugin_system.api.send_api import (
    send_text,
    send_image,
    send_emoji,
    send_voice,
    send_video,
    send_file,
    send_custom,
    send_message,
    send_batch,
    send_batch_parallel,
    send_text_with_image,
    broadcast_text,
)
```

## 通用参数

`send_message/send_batch/send_batch_parallel` 直接接收 `Message` 对象，不使用下表参数。
其余函数参数约定如下：

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `stream_id` | `str` | 目标聊天流 ID（示例：`qq_group_123456`） |
| `platform` | `str | None` | 平台名。为 `None` 时会尝试从 `stream_id` 推断 |

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

`broadcast_text` 例外：使用 `stream_ids: list[str]`（多个聊天流）与可选 `platform`。

## 基础发送

### `send_text(content, stream_id, platform=None) -> bool`

发送文本消息。

### `send_image(image_data, stream_id, platform=None) -> bool`

发送图片消息，`image_data` 支持 URL 或 base64 字符串。

### `send_emoji(emoji_data, stream_id, platform=None) -> bool`

发送表情消息，`emoji_data` 支持 URL 或 base64 字符串。

### `send_voice(voice_data, stream_id, platform=None) -> bool`

发送语音消息，`voice_data` 支持 URL 或 base64 字符串。

### `send_video(video_data, stream_id, platform=None) -> bool`

发送视频消息，`video_data` 支持 URL 或 base64 字符串。

### `send_file(file_path, stream_id, platform=None, file_name=None) -> bool`

发送文件。

- `file_path`：本地文件路径
- `file_name`：可选，指定展示名称；不传则使用默认文件名

```python
ok = await send_file(
    file_path="/tmp/report.pdf",
    stream_id="0b8babfe12cb251daa26040f993e85582b93df44ddd3ce59262e749d2ee854cc",
    file_name="周报.pdf",
)
```

### `send_custom(content, message_type, stream_id, platform=None) -> bool`

发送自定义类型消息。

- `message_type` 支持 `MessageType` 或 `str`
- 传入 `str` 且无法映射到 `MessageType` 时，会回退为 `MessageType.UNKNOWN`

## Message 对象发送

### `send_message(message: Message) -> bool`

直接发送构造好的 `Message` 对象。

```python
from src.core.models.message import Message, MessageType

msg = Message(
    message_id="custom_1",
    content="你好",
    processed_plain_text="你好",
    message_type=MessageType.TEXT,
    sender_id="bot",
    sender_name="Bot",
    platform="qq",
    stream_id="0b8babfe12cb251daa26040f993e85582b93df44ddd3ce59262e749d2ee854cc",
    chat_type="group",
)
ok = await send_message(message = msg)
```

## 批量发送

### `send_batch(messages: list[Message]) -> list[bool]`

串行批量发送，按顺序逐条发送。

### `send_batch_parallel(messages: list[Message]) -> list[bool]`

并行批量发送，速度更快，但发送顺序不保证。

## 便捷组合

### `send_text_with_image(text, image_data, stream_id, platform=None) -> bool`

先发文本，再发图片；任一步失败返回 `False`。

### `broadcast_text(content, stream_ids, platform=None) -> dict[str, bool]`

向多个聊天流广播文本，返回每个 `stream_id` 的发送结果。

```python
results = await broadcast_text(
    content = "系统通知：10 分钟后维护",
    stream_ids = ["0b8babfe12cb251daa26040f993e85582b93df44ddd3ce59262e749d2ee854cc", "a1b2c3d4..."],
)
# {'0b8babfe12cb251daa26040f993e85582b93df44ddd3ce59262e749d2ee854cc': True, 'a1b2c3d4...': False}
```