# Adapter API

`src.app.plugin_system.api.adapter_api` 提供适配器的启动、停止、重启、查询、Bot 信息获取与命令调用能力。

适配器是平台协议桥接组件，只负责平台消息与统一消息模型转换，不负责业务决策。

## 导入

```python
from src.app.plugin_system.api.adapter_api import (
    start_adapter,
    stop_adapter,
    restart_adapter,
    get_adapter,
    get_all_adapters,
    list_active_adapters,
    is_adapter_active,
    stop_all_adapters,
    get_bot_info_by_platform,
    send_adapter_command,
)
```

## 函数

### 启动与停止

#### `start_adapter(signature: str) -> bool`

启动适配器。返回是否启动成功。此函数为**异步函数**。

#### `stop_adapter(signature: str) -> bool`

停止适配器。返回是否停止成功。此函数为**异步函数**。

#### `restart_adapter(signature: str) -> bool`

重启适配器。返回是否重启成功。此函数为**异步函数**。

#### `stop_all_adapters() -> dict[str, bool]`

停止所有适配器。返回适配器签名到停止结果的映射。此函数为**异步函数**。

### 查询

#### `get_adapter(signature: str) -> BaseAdapter | None`

通过签名获取适配器实例（已启动的）。未找到返回 `None`。

```python
adapter = get_adapter("onebot_adapter:adapter:onebot_adapter")
```

#### `get_all_adapters() -> dict[str, BaseAdapter]`

获取所有已启动的适配器实例，返回签名到实例的映射。

#### `list_active_adapters() -> list[str]`

列出所有已启动的适配器签名列表。

```python
active = list_active_adapters()
# ["onebot_adapter:adapter:onebot_adapter", ...]
```

#### `is_adapter_active(signature: str) -> bool`

检查指定适配器是否已启动。

```python
if is_adapter_active("onebot_adapter:adapter:onebot_adapter"):
    print("适配器运行中")
```

#### `get_bot_info_by_platform(platform: str) -> dict[str, str] | None`

根据平台名称获取 Bot 信息。未找到返回 `None`。此函数为**异步函数**。

```python
info = await get_bot_info_by_platform("qq")
```

### 命令调用

#### `send_adapter_command(adapter_sign: str, command_name: str, command_data: dict[str, Any], timeout: float = 20.0) -> dict[str, Any]`

向指定适配器发送命令并等待响应。此函数为**异步函数**。

- `adapter_sign`: 适配器签名
- `command_name`: 命令名称
- `command_data`: 命令参数字典
- `timeout`: 超时时间（秒），必须为正数
- 返回: 命令执行结果字典，格式为：
    - 成功: `{"status": "ok", "data": {...}, "message": "..."}`
    - 失败: `{"status": "failed", "message": "错误信息"}`
    - 错误: `{"status": "error", "message": "错误信息", "data": None}`

::: warning 只有支持的适配器才能使用
该函数依赖适配器**主动实现**命令响应协议。核心会向适配器下发 `message_segment.type == "adapter_command"` 的信封，适配器执行命令后必须通过 `core_sink` 回发 `message_segment.type == "adapter_response"` 的信封，核心才能拿到结果。

- **已实现命令响应的适配器**（如 OneBot 适配器）可以正常使用。
- **未实现的适配器**会因收不到响应而在 `timeout` 后返回 `{"status": "error", "message": "命令执行超时（Xs）"}`。

适配器开发者如需支持本函数，请参考 [Adapter 组件 — 支持适配器命令](../components/adapter.md#支持适配器命令) 章节。
:::

```python
result = await send_adapter_command(
    adapter_sign="onebot_adapter:adapter:onebot_adapter",
    command_name="get_group_list",
    command_data={},
    timeout=10.0,
)
```

## 相关文档

- [Adapter 组件](../components/adapter.md)
