# Adapter — 适配器组件

`BaseAdapter` 是平台接入层组件，继承 `mofox_wire.AdapterBase`，增加了：

- 插件生命周期钩子
- 自动健康检查
- 自动重连

## 类属性

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `adapter_name` | `str` | 适配器名称 |
| `adapter_version` | `str` | 版本 |
| `adapter_description` | `str` | 描述 |
| `platform` | `str` | 平台标识（如 `qq`） |
| `dependencies` | `list[str]` | 组件级依赖 |

## 必须实现的方法

### `from_platform_message(raw: Any) -> MessageEnvelope`

把平台原始事件转换为标准 `MessageEnvelope`。

### `get_bot_info() -> dict[str, Any]`

返回当前 Bot 信息。

建议至少包含以下字段：

- `bot_id`
- `bot_nickname`
- `platform`

::: tip 字段对齐说明
`send_api` 在发送链路中会读取 `bot_id` 和 `bot_nickname`。如果没有 `bot_nickname`，显示名会回退为 `Bot`。
:::

## 可重写方法

### `_send_platform_message(envelope: MessageEnvelope) -> None`

默认逻辑：

- 若配置了自动传输，调用父类发送
- 否则抛出 `NotImplementedError`

未使用自动传输时，需自行重写该方法。

### 生命周期和连接相关

- `start()` / `stop()`
- `on_adapter_loaded()`
- `on_adapter_unloaded()`
- `health_check() -> bool`
- `reconnect()`

## 示例

```python
from typing import Any

from mofox_wire import CoreSink, MessageEnvelope
from src.core.components.base.adapter import BaseAdapter


class MyAdapter(BaseAdapter):
    adapter_name = "my_adapter"
    adapter_version = "1.0.0"
    platform = "my_platform"

    def __init__(self, core_sink: CoreSink, **kwargs: Any):
        super().__init__(core_sink=core_sink, **kwargs)

    async def from_platform_message(self, raw: Any) -> MessageEnvelope:
        # 这里只演示结构，字段请按你的平台协议映射
        return MessageEnvelope(
            direction="incoming",
            message_info={"platform": self.platform, "user_id": str(raw.get("user_id", ""))},
            message_segment=[{"type": "text", "data": raw.get("text", "")}],
            raw_message=raw,
        )

    async def _send_platform_message(self, envelope: MessageEnvelope) -> None:
        # 未使用自动传输时，自行实现平台发送
        payload = {
            "type": "send_message",
            "data": envelope.message_segment,
        }
        await self._client_send(payload)  # 伪代码

    async def get_bot_info(self) -> dict[str, Any]:
        return {
            "bot_id": "123456",
            "bot_nickname": "MyBot",
            "platform": self.platform,
        }

    async def _client_send(self, payload: dict[str, Any]) -> None:
        ...
```
