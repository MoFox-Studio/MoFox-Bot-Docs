# Command — 命令组件

`BaseCommand` 提供命令式交互能力，支持：

- Trie 路由匹配
- 参数字符串到类型注解的自动转换
- 统一权限控制

## `@cmd_route` 装饰器

使用 `@cmd_route(*path)` 注册子命令路径。

```python
from src.core.components.base.command import BaseCommand, cmd_route


class TimeCommand(BaseCommand):
    command_name = "time"
    command_prefix = "/"

    @cmd_route("set")
    async def handle_set(self, seconds: int) -> tuple[bool, str]:
        return True, f"已设置为 {seconds} 秒"

    @cmd_route("get")
    async def handle_get(self) -> tuple[bool, str]:
        return True, "当前值：30 秒"
```

## 类属性

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `command_name` | `str` | `""` | 命令名称 |
| `command_description` | `str` | `""` | 描述 |
| `command_prefix` | `str` | `"/"` | 命令前缀 |
| `permission_level` | `PermissionLevel` | `PermissionLevel.USER` | 最低权限 |
| `chat_type` | `ChatType` | `ChatType.ALL` | 聊天类型限制 |
| `associated_platforms` | `list[str]` | `[]` | 平台限制 |
| `dependencies` | `list[str]` | `[]` | 组件级依赖 |

## 权限枚举（当前源码）

```python
from src.core.components.types import PermissionLevel

PermissionLevel.GUEST     # 1
PermissionLevel.USER      # 2
PermissionLevel.OPERATOR  # 3
PermissionLevel.OWNER     # 4
```

## 执行与返回

`BaseCommand.execute(message_text)` 返回 `tuple[bool, str]`：

- `True`：执行成功
- `False`：执行失败或参数错误

Handler 推荐返回 `tuple[bool, str]`，框架会直接透传。

## 参数类型转换

框架按 handler 签名自动转换参数，支持：

- `str`
- `int`
- `float`
- `bool`
- `list[T]`（以逗号分隔）

`bool` 的字符串判定规则（当前实现）：

- 视为 `True`：`true`、`1`、`yes`、`on`（大小写不敏感）
- 其他输入视为 `False`

```python
@cmd_route("limit")
async def handle_limit(self, count: int, enabled: bool = True) -> tuple[bool, str]:
    return True, f"count={count}, enabled={enabled}"
```

## 实例属性

| 属性 | 说明 |
| --- | --- |
| `self.plugin` | 所属插件实例 |
| `self.stream_id` | 当前命令的目标聊天流 ID |


## 完整示例

```python
from src.core.components.base.command import BaseCommand, cmd_route
from src.core.components.types import PermissionLevel, ChatType


class AdminCommand(BaseCommand):
    command_name = "admin"
    command_description = "管理员命令"
    command_prefix = "/"
    permission_level = PermissionLevel.OPERATOR
    chat_type = ChatType.GROUP

    @cmd_route("ban")
    async def handle_ban(self, user_id: str) -> tuple[bool, str]:
        # 在这里调用服务层执行封禁逻辑
        return True, f"已封禁 {user_id}"

    @cmd_route("unban")
    async def handle_unban(self, user_id: str) -> tuple[bool, str]:
        return True, f"已解封 {user_id}"


class HelpCommand(BaseCommand):
    command_name = "help"
    command_description = "帮助命令"

    @cmd_route()
    async def root(self) -> tuple[bool, str]:
        return True, "可用命令：/help, /admin ban <user_id>"
```
