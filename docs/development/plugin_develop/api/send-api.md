# Send API

`src.app.plugin_system.api.send_api` 提供各类消息的发送与广播接口。

## 导入

```python
from src.app.plugin_system.api.send_api import (
    send_text,
    send_image,
    send_markdown,
    send_batch_parallel,
    broadcast_text,
)
```

## 函数

### `send_text(content: str, stream_id: str, platform: str | None = None, reply_to: str | None = None) -> bool`

发送文本消息。

```python
await send_text("你好！", "qq_group_123456")
await send_text("回复消息", "qq_group_123456", reply_to="msg_id_123")
```

### `send_image(image_data: str, stream_id: str, platform: str | None = None) -> bool`

发送图片（支持 base64、URL 或文件路径）。

### `send_markdown(content: str, stream_id: str, platform: str | None = None) -> bool`

发送 Markdown 格式消息（平台需支持）。

### `send_batch_parallel(messages: list[Message]) -> list[bool]`

并行批量发送消息。返回每个消息的发送结果列表。

### `broadcast_text(content: str, stream_ids: list[str], title: str = "", platform: str | None = None) -> dict[str, bool]`

向多个聊天流广播文本。返回 `{stream_id: success}` 映射。

```python
results = await broadcast_text("系统维护通知", ["group_1", "group_2"])
```
