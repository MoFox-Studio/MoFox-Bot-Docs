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
- `bot_name`
- `platform`

::: tip 字段对齐说明
`send_api` 与 `BaseAction._send_to_stream` 在发送链路中会读取 `bot_id` 和 `bot_name`。如果没有 `bot_name`，显示名会回退为 `Bot`。
:::

## 可重写方法

### `_send_platform_message(envelope: MessageEnvelope) -> None`

默认逻辑：

- 若配置了自动传输，调用父类发送
- 否则抛出 `NotImplementedError`

未使用自动传输时，需自行重写该方法。

## 支持适配器命令

核心通过 [`adapter_api.send_adapter_command`](../api/adapter-api.md#send-adapter-command) 向适配器发送命令时，会构建一个 `message_segment.type == "adapter_command"` 的 `MessageEnvelope`，调用适配器的 `_send_platform_message()` 下发。

适配器**不是必须**支持该机制。只有显式实现了命令处理逻辑的适配器，才能让 `send_adapter_command` 正常返回结果；未实现的适配器会超时并返回错误。

### 命令-响应协议

核心下发的 `adapter_command` 信封结构：

| 字段 | 值 | 说明 |
| --- | --- | --- |
| `direction` | `"outgoing"` | 由核心发往适配器 |
| `message_info.message_id` | 请求 ID（UUID） | 唯一标识本次请求 |
| `message_info.platform` | 适配器 `platform` | 平台标识 |
| `message_segment.type` | `"adapter_command"` | 固定类型 |
| `message_segment.data.request_id` | 请求 ID | 与 `message_info.message_id` 一致 |
| `message_segment.data.action` | 命令名 | 如 `get_group_list` |
| `message_segment.data.params` | 命令参数 `dict` | 由调用方传入 |
| `message_segment.data.timeout` | 超时秒数 | 调用方设置，默认 `20.0` |

适配器执行完命令后，**必须**通过 `self.core_sink.send(...)` 回发一个 `message_segment.type == "adapter_response"` 的信封，否则核心会一直等待直到超时。

响应信封结构：

| 字段 | 值 | 说明 |
| --- | --- | --- |
| `direction` | `"incoming"` | 由适配器发回核心 |
| `message_info.message_id` | 请求 ID（字符串） | 必须与请求的 `request_id` 一致 |
| `message_info.platform` | 适配器 `platform` | 平台标识 |
| `message_segment.type` | `"adapter_response"` | 固定类型 |
| `message_segment.data.request_id` | 请求 ID | 必须与请求一致，核心据此匹配 Future |
| `message_segment.data.response` | 命令结果 `dict` | 一般包含 `status`/`data`/`message` 字段 |

::: warning request_id 必须一致
响应中的 `request_id` 必须与请求中的 `request_id` **完全一致**，核心据此把响应匹配到对应的 `Future` 并 resolve。不一致会导致调用方超时。
:::

### 适配步骤

在 `_send_platform_message` 中识别 `adapter_command` 类型并处理：

1. 从 `message_segment.data` 取出 `request_id`、`action`、`params`、`timeout`。
2. 将 `action` / `params` 转换为平台协议所需的调用，向平台发起请求并等待结果。
3. 构造 `adapter_response` 信封，回填同一个 `request_id` 和结果 `response`。
4. 通过 `await self.core_sink.send(response_envelope)` 发回核心。
5. 对 `message_segment.type == "adapter_response"` 的入站消息直接跳过，避免循环。

### 示例

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
        return MessageEnvelope(
            direction="incoming",
            message_info={"platform": self.platform, "user_id": str(raw.get("user_id", ""))},
            message_segment=[{"type": "text", "data": raw.get("text", "")}],
            raw_message=raw,
        )

    async def _send_platform_message(self, envelope: MessageEnvelope) -> None:
        segment = envelope.get("message_segment")
        if isinstance(segment, dict):
            seg_type = segment.get("type")

            # 处理适配器命令
            if seg_type == "adapter_command":
                await self._handle_adapter_command(envelope)
                return

            # adapter_response 由 Bot 端处理，适配器收到应跳过
            if seg_type == "adapter_response":
                return

        # 普通消息发送
        payload = {"type": "send_message", "data": envelope.get("message_segment")}
        await self._client_send(payload)  # 伪代码

    async def _handle_adapter_command(self, envelope: MessageEnvelope) -> None:
        """处理核心下发的适配器命令并回发响应。"""
        segment = envelope.get("message_segment", {})
        data: dict[str, Any] = segment.get("data", {}) if isinstance(segment, dict) else {}

        request_id = data.get("request_id")
        action = data.get("action")
        params = data.get("params", {})
        timeout = float(data.get("timeout", 20.0))

        # 向平台发起请求，伪代码
        response = await self._call_platform(action, params, timeout=timeout)

        # 构造 adapter_response 信封，request_id 必须与请求一致
        response_envelope: MessageEnvelope = {
            "direction": "incoming",
            "message_info": {
                "message_id": str(request_id),
                "platform": self.platform,
                "time": 0,
            },
            "message_segment": {
                "type": "adapter_response",
                "data": {
                    "request_id": request_id,
                    "response": response,
                },
            },
        }

        # 通过 core_sink 回发核心
        await self.core_sink.send(response_envelope)

    async def _call_platform(self, action: str, params: dict[str, Any], *, timeout: float) -> dict[str, Any]:
        """向平台发起请求的伪代码。"""
        return {"status": "ok", "data": {"action": action}, "message": "success"}

    async def _client_send(self, payload: dict[str, Any]) -> None:
        ...

    async def get_bot_info(self) -> dict[str, Any]:
        return {
            "bot_id": "123456",
            "bot_name": "MyBot",
            "platform": self.platform,
        }
```

### 生命周期和连接相关

- `start()` / `stop()`
- `on_adapter_loaded()`
- `on_adapter_unloaded()`
- `health_check() -> bool`
- `reconnect()`

## `get_signature()` 类方法

返回组件唯一签名，格式：`"plugin_name:adapter:adapter_name"`。

```python
>>> MyAdapter.get_signature()
"my_plugin:adapter:my_adapter"
```

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
            "bot_name": "MyBot",
            "platform": self.platform,
        }

    async def _client_send(self, payload: dict[str, Any]) -> None:
        ...
```
