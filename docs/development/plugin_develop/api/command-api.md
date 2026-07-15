# Command API

`src.app.plugin_system.api.command_api` 提供命令注册、匹配、执行和帮助信息。

## 导入

```python
from src.app.plugin_system.api.command_api import (
    set_prefixes,
    get_all_commands,
    get_commands_for_plugin,
    get_command_class,
    is_command,
    match_command,
    execute_command,
    get_command_help,
    get_all_command_names,
)
```

## 函数

### `set_prefixes(prefixes: list[str]) -> None`

设置命令前缀列表（如 `["/", "!"]`）。`prefixes` 必须是非空列表。

### `get_all_commands() -> dict[str, type[BaseCommand]]`

获取所有已注册命令。

### `get_commands_for_plugin(plugin_name: str) -> dict[str, type[BaseCommand]]`

获取指定插件的所有命令。

### `get_command_class(signature: str) -> type[BaseCommand] | None`

通过签名获取命令类。

### `is_command(text: str) -> bool`

检查文本是否为命令（以前缀开头）。

### `match_command(text: str) -> tuple[str, type[BaseCommand] | None, list[str]]`

匹配命令文本，返回 `(命令路径, 命令类, 参数列表)`。

```python
path, cmd_class, args = match_command("/plugin install web_search")
```

### `execute_command(message: Message, text: str | None = None) -> tuple[bool, str]`

执行命令。此函数为**异步函数**。

- `message`: 消息对象
- `text`: 命令文本，可选
- 返回: `(是否成功, 结果描述)`

```python
from src.app.plugin_system.api.command_api import execute_command

success, result = await execute_command(message=msg, text="/help")
```

### `get_command_help(signature: str) -> str`

获取命令帮助信息。

### `get_all_command_names() -> list[str]`

获取所有命令名称列表。

## 相关文档

- [Command 组件](../components/command.md)
