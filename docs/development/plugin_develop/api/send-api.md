# Send API

`src.app.plugin_system.api.send_api` 提供各类消息的发送、批量发送与广播接口。

所有函数均为**异步函数**，调用时需 `await`。

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

## 基础消息发送

所有发送函数均支持以下公共参数：

- `stream_id`: 聊天流 ID
- `platform`: 平台名称（可选，会从 `stream_id` 推断）
- `adapter_signature`: 目标适配器组件签名（可选），格式为 `plugin_name:adapter:adapter_name`；指定后直接通过该适配器发送，不再按 `platform` 推断，且 `platform` 参数被忽略

### `send_text(content: str, stream_id: str, platform: str | None = None, reply_to: str | None = None, adapter_signature: str | None = None) -> bool`

发送文本消息。

```python
await send_text("你好！", "qq_group_123456")
await send_text("回复消息", "qq_group_123456", reply_to="msg_id_123")
await send_text("Hello!", "qq_group_123456", adapter_signature="onebot:adapter:napcat")
```

### `send_image(image_data: str, stream_id: str, platform: str | None = None, processed_plain_text: str = "[图片]", reply_to: str | None = None, adapter_signature: str | None = None) -> bool`

发送图片消息（支持 base64 或 URL）。

### `send_emoji(emoji_data: str, stream_id: str, platform: str | None = None, processed_plain_text: str = "", adapter_signature: str | None = None) -> bool`

发送表情包（支持 base64 或 URL）。

```python
await send_emoji(emoji_base64, "qq_group_123456", processed_plain_text="[表情包: 开心挥手]")
```

### `send_voice(voice_data: str, stream_id: str, platform: str | None = None, processed_plain_text: str = "[语音]", adapter_signature: str | None = None) -> bool`

发送语音消息（支持 base64 或 URL）。

### `send_video(video_data: str, stream_id: str, platform: str | None = None, processed_plain_text: str = "[视频]", adapter_signature: str | None = None) -> bool`

发送视频消息（支持 base64 或 URL）。

### `send_file(file_path: str, stream_id: str, platform: str | None = None, file_name: str | None = None, adapter_signature: str | None = None) -> bool`

发送文件。

- `file_path`: 文件路径
- `file_name`: 显示的文件名（可选）

### `send_custom(content: Any, message_type: MessageType | str, stream_id: str, platform: str | None = None, processed_plain_text: str = "", adapter_signature: str | None = None) -> bool`

发送自定义类型消息。当 `message_type` 为未知字符串时（如 `"music"`），会通过 `extra_media` 机制传递，使适配器可直接处理自定义消息段类型。

### `send_message(message: Message, adapter_signature: str | None = None) -> bool`

直接发送 [`Message`](../../components/message.md) 对象。

```python
from src.core.models.message import Message

msg = Message(content="Hello", platform="qq", stream_id="qq_group_123456")
await send_message(msg)
```

## 批量发送

### `send_batch(messages: list[Message], adapter_signature: str | None = None) -> list[bool]`

顺序批量发送消息。返回每条消息的发送结果列表。

### `send_batch_parallel(messages: list[Message], adapter_signature: str | None = None) -> list[bool]`

并行批量发送消息（速度更快但顺序不保证）。返回每条消息的发送结果列表。

## 便捷组合

### `send_text_with_image(text: str, image_data: str, stream_id: str, platform: str | None = None, adapter_signature: str | None = None) -> bool`

发送文本 + 图片组合消息（先发文本，再发图片）。任一失败则返回 `False`。

```python
await send_text_with_image("看看这张图片", image_base64, "qq_group_123456")
```

### `broadcast_text(content: str, stream_ids: list[str], platform: str | None = None) -> dict[str, bool]`

向多个聊天流广播文本。返回 `{stream_id: success}` 映射。

```python
results = await broadcast_text("系统维护通知", ["group_1", "group_2"])
```

## 相关文档

- [Message API](./message-api.md)
- [Adapter API](./adapter-api.md)
