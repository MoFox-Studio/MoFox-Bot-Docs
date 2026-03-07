# Adapter API

`src/app/plugin_system/api/adapter_api` 提供适配器的启动、停止、查询与命令调用能力。

## 导入

```python
from src.app.plugin_system.api.adapter_api import (
    start_adapter,
    stop_adapter,
    restart_adapter,
    get_all_adapters,
    get_adapters_for_plugin,
    get_adapter_class,
    is_adapter_running,
    call_adapter_command,
)
```

## 核心函数

### `start_adapter(signature: str) -> bool`

启动适配器。

**参数：**
- `signature`: 适配器签名（格式：`plugin_name:adapter:adapter_name`）

**返回值：**
- `True` 表示启动成功，`False` 表示失败

**使用示例：**
```python
success = await start_adapter("napcat:adapter:napcat")
if success:
    print("适配器启动成功")
else:
    print("适配器启动失败")
```

---

### `stop_adapter(signature: str) -> bool`

停止适配器。

**参数：**
- `signature`: 适配器签名

**返回值：**
- `True` 表示停止成功，`False` 表示失败

**使用示例：**
```python
success = await stop_adapter("napcat:adapter:napcat")
```

---

### `restart_adapter(signature: str) -> bool`

重启适配器。

**参数：**
- `signature`: 适配器签名

**返回值：**
- `True` 表示重启成功，`False` 表示失败

**使用示例：**
```python
success = await restart_adapter("napcat:adapter:napcat")
```

---

### `get_all_adapters() -> dict[str, type[BaseAdapter]]`

获取所有已注册的适配器组件。

**返回值：**
```python
{
    "napcat:adapter:napcat": NapcatAdapter,
    "telegram:adapter:telegram": TelegramAdapter,
}
```

**使用示例：**
```python
adapters = get_all_adapters()
for signature, adapter_class in adapters.items():
    print(f"适配器: {signature}")
```

---

### `get_adapters_for_plugin(plugin_name: str) -> dict[str, type[BaseAdapter]]`

获取指定插件的所有适配器组件。

**参数：**
- `plugin_name`: 插件名称

**返回值：**
```python
{
    "napcat:adapter:napcat": NapcatAdapter,
}
```

**使用示例：**
```python
adapters = get_adapters_for_plugin("napcat")
```

---

### `get_adapter_class(signature: str) -> type[BaseAdapter] | None`

通过签名获取适配器类。

**参数：**
- `signature`: 适配器签名

**返回值：**
- 适配器类，未找到则返回 `None`

**使用示例：**
```python
adapter_class = get_adapter_class("napcat:adapter:napcat")
if adapter_class:
    print(f"找到适配器: {adapter_class.__name__}")
```

---

### `is_adapter_running(signature: str) -> bool`

检查适配器是否正在运行。

**参数：**
- `signature`: 适配器签名

**返回值：**
- `True` 表示正在运行，`False` 表示未运行

**使用示例：**
```python
if is_adapter_running("napcat:adapter:napcat"):
    print("适配器正在运行")
else:
    print("适配器未运行")
```

---

### `call_adapter_command(signature: str, command_name: str, command_data: dict, timeout: float = 10.0) -> Any`

调用适配器的命令接口。

**参数：**
- `signature`: 适配器签名
- `command_name`: 命令名称
- `command_data`: 命令参数字典
- `timeout`: 超时时间（秒），默认 10 秒

**返回值：**
- 命令执行结果，具体类型取决于命令

**使用示例：**
```python
# 调用 OneBot 适配器的 get_group_info 命令
result = await call_adapter_command(
    signature="napcat:adapter:napcat",
    command_name="get_group_info",
    command_data={"group_id": "123456"},
    timeout=5.0,
)

if result:
    print(f"群名: {result.get('group_name')}")
    print(f"成员数: {result.get('member_count')}")
```

## 完整示例

```python
from src.app.plugin_system.api.adapter_api import (
    get_all_adapters,
    is_adapter_running,
    start_adapter,
    call_adapter_command,
)

class AdapterManagementCommand(BaseCommand):
    async def execute(self):
        # 1. 列出所有适配器
        adapters = get_all_adapters()
        adapter_list = []
        
        for signature in adapters:
            running = is_adapter_running(signature)
            status = "运行中" if running else "已停止"
            adapter_list.append(f"{signature}: {status}")
        
        await self.send_text("\n".join(adapter_list))
        
        # 2. 启动指定适配器
        target = "napcat:adapter:napcat"
        if not is_adapter_running(target):
            success = await start_adapter(target)
            if success:
                await self.send_text(f"适配器 {target} 启动成功")
        
        # 3. 调用适配器命令
        result = await call_adapter_command(
            signature=target,
            command_name="get_login_info",
            command_data={},
        )
        
        if result:
            await self.send_text(f"Bot ID: {result.get('user_id')}")
```

## 常用命令示例

### OneBot 适配器命令

```python
# 获取登录信息
login_info = await call_adapter_command(
    signature="napcat:adapter:napcat",
    command_name="get_login_info",
    command_data={},
)

# 获取群信息
group_info = await call_adapter_command(
    signature="napcat:adapter:napcat",
    command_name="get_group_info",
    command_data={"group_id": "123456"},
)

# 获取群成员列表
member_list = await call_adapter_command(
    signature="napcat:adapter:napcat",
    command_name="get_group_member_list",
    command_data={"group_id": "123456"},
)

# 踢出群成员
await call_adapter_command(
    signature="napcat:adapter:napcat",
    command_name="set_group_kick",
    command_data={
        "group_id": "123456",
        "user_id": "789012",
        "reject_add_request": False,
    },
)
```

## 相关文档

- [Adapter 组件](../components/adapter.md) — Adapter 组件的详细说明
- [适配器列表](/docs/guides/adapter_list) — 可用适配器列表
