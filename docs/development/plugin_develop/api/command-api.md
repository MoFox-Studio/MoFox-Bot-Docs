# Command API

`src/app/plugin_system/api/command_api` 提供命令的查询、匹配与执行接口。

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
    list_command_tree,
)
```

## 核心函数

### `set_prefixes(prefixes: list[str]) -> None`

设置命令前缀列表。

**参数：**
- `prefixes`: 命令前缀列表

**使用示例：**
```python
# 设置多个命令前缀
set_prefixes(["/", "!", "#"])

# 现在 "/help"、"!help"、"#help" 都会被识别为命令
```

---

### `get_all_commands() -> dict[str, type[BaseCommand]]`

获取所有已注册的 Command 组件。

**返回值：**
```python
{
    "plugin:command:help": HelpCommand,
    "plugin:command:admin.user.list": UserListCommand,
}
```

**使用示例：**
```python
commands = get_all_commands()
print(f"共有 {len(commands)} 个命令")
```

---

### `get_commands_for_plugin(plugin_name: str) -> dict[str, type[BaseCommand]]`

获取指定插件的所有 Command 组件。

**参数：**
- `plugin_name`: 插件名称

**返回值：**
```python
{
    "my_plugin:command:search": SearchCommand,
    "my_plugin:command:download": DownloadCommand,
}
```

**使用示例：**
```python
commands = get_commands_for_plugin("my_plugin")
for signature, cmd_class in commands.items():
    print(f"命令: {signature}")
```

---

### `get_command_class(signature: str) -> type[BaseCommand] | None`

通过签名获取 Command 类。

**参数：**
- `signature`: Command 组件签名

**返回值：**
- Command 类，未找到则返回 `None`

**使用示例：**
```python
cmd_class = get_command_class("my_plugin:command:help")
if cmd_class:
    print(f"找到命令: {cmd_class.__name__}")
```

---

### `is_command(text: str) -> bool`

检查文本是否为命令（是否以配置的前缀开头）。

**参数：**
- `text`: 待检测文本

**返回值：**
- `True` 表示是命令，`False` 表示不是

**使用示例：**
```python
if is_command("/help"):
    print("这是一个命令")

if is_command("hello"):
    print("这不是命令")  # 这行不会执行
```

---

### `match_command(text: str) -> tuple[str, type[BaseCommand] | None, list[str]]`

匹配命令并返回命令路径、类与参数。

**参数：**
- `text`: 命令文本

**返回值：**
- `(命令路径, 命令类, 参数列表)`

**返回值示例：**
```python
# 输入: "/admin user ban 123456 spam"
(
    "admin.user.ban",
    BanCommand,
    ["123456", "spam"]
)
```

**使用示例：**
```python
path, cmd_class, args = match_command("/admin user list")

if cmd_class:
    print(f"命令路径: {path}")
    print(f"命令类: {cmd_class.__name__}")
    print(f"参数: {args}")
else:
    print("命令不存在")
```

---

### `execute_command(message: Message, text: str | None = None) -> tuple[bool, str]`

执行命令。

**参数：**
- `message`: 消息对象
- `text`: 命令文本，可选（默认使用 message 中的文本）

**返回值：**
- `(是否成功, 结果描述)`

**返回值示例：**
```python
# 成功执行
(True, "命令执行成功")

# 命令不存在
(False, "命令不存在")

# 权限不足
(False, "权限不足")
```

**使用示例：**
```python
success, result = await execute_command(
    message=self.message,
    text="/help plugin",
)

if success:
    print(f"命令执行成功: {result}")
else:
    print(f"命令执行失败: {result}")
```

---

### `get_command_help(signature: str) -> str`

获取命令帮助信息。

**参数：**
- `signature`: Command 组件签名

**返回值：**
- 帮助文本字符串

**使用示例：**
```python
help_text = get_command_help("my_plugin:command:help")
print(help_text)
```

---

### `list_command_tree() -> dict[str, Any]`

获取命令树结构（层级组织）。

**返回值：**
```python
{
    "admin": {
        "_commands": [],
        "user": {
            "_commands": [
                ("list", UserListCommand),
                ("ban", BanCommand),
            ],
        },
        "group": {
            "_commands": [
                ("list", GroupListCommand),
            ],
        },
    },
    "help": {
        "_commands": [("", HelpCommand)],
    },
}
```

**使用示例：**
```python
tree = list_command_tree()

# 遍历顶层命令分组
for key, subtree in tree.items():
    print(f"命令组: {key}")
    
    # 遍历子命令
    if "_commands" in subtree:
        for cmd_name, cmd_class in subtree["_commands"]:
            print(f"  - {cmd_name}: {cmd_class.__name__}")
```

## 完整示例

### 示例 1：命令列表

```python
from src.app.plugin_system.api.command_api import (
    get_all_commands,
    list_command_tree,
)

class ListCommandsCommand(BaseCommand):
    async def execute(self):
        # 方法 1: 获取所有命令（扁平列表）
        commands = get_all_commands()
        cmd_list = [f"- {sig}" for sig in commands]
        await self.send_text("所有命令:\n" + "\n".join(cmd_list))
        
        # 方法 2: 获取命令树（层级结构）
        tree = list_command_tree()
        tree_text = self._format_tree(tree)
        await self.send_text("命令树:\n" + tree_text)
    
    def _format_tree(self, tree: dict, indent: int = 0) -> str:
        lines = []
        prefix = "  " * indent
        
        for key, value in tree.items():
            if key == "_commands":
                for cmd_name, cmd_class in value:
                    lines.append(f"{prefix}- {cmd_name}")
            else:
                lines.append(f"{prefix}{key}/")
                lines.append(self._format_tree(value, indent + 1))
        
        return "\n".join(lines)
```

### 示例 2：命令匹配和执行

```python
from src.app.plugin_system.api.command_api import (
    is_command,
    match_command,
    execute_command,
)

class MessageProcessor:
    async def process(self, message: Message):
        text = message.processed_plain_text
        
        # 1. 检查是否为命令
        if not is_command(text):
            # 不是命令，走正常对话流程
            return await self.handle_chat(message)
        
        # 2. 匹配命令
        path, cmd_class, args = match_command(text)
        
        if not cmd_class:
            await self.send_text("命令不存在，使用 /help 查看帮助")
            return
        
        # 3. 执行命令
        success, result = await execute_command(message)
        
        if not success:
            await self.send_text(f"命令执行失败: {result}")
```

### 示例 3：自定义命令前缀

```python
from src.app.plugin_system.api.command_api import set_prefixes

class SetupCommand(BaseCommand):
    async def execute(self, prefixes: str):
        # 从参数解析前缀列表
        prefix_list = prefixes.split()
        
        # 设置命令前缀
        set_prefixes(prefix_list)
        
        await self.send_text(
            f"命令前缀已设置为: {', '.join(prefix_list)}"
        )
```

### 示例 4：权限检查

```python
from src.app.plugin_system.api.command_api import (
    match_command,
    get_command_class,
)
from src.app.plugin_system.api.permission_api import (
    check_command_permission,
    generate_person_id,
)

class SecureCommandExecutor:
    async def execute(self, message: Message):
        text = message.processed_plain_text
        
        # 匹配命令
        path, cmd_class, args = match_command(text)
        
        if not cmd_class:
            return
        
        # 生成用户 ID
        person_id = generate_person_id(
            platform=message.platform,
            user_id=message.sender_id,
        )
        
        # 检查权限
        has_permission, reason = await check_command_permission(
            person_id=person_id,
            command_class=cmd_class,
        )
        
        if not has_permission:
            await self.send_text(f"权限不足: {reason}")
            return
        
        # 执行命令
        await execute_command(message)
```

## 相关文档

- [Command 组件](../components/command.md) — Command 组件的详细说明
- [Permission API](./permission-api.md) — 权限管理 API
- [快速开始](../guide/quick-start.md) — 创建第一个命令
