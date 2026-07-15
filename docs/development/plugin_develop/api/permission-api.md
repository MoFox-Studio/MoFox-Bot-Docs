# Permission API

`src.app.plugin_system.api.permission_api` 提供用户身份标识生成与权限管理能力。

涉及权限查询和设置的操作均为**异步函数**，调用时需 `await`；身份标识生成函数为同步函数。

## 导入

```python
from src.app.plugin_system.api.permission_api import (
    generate_raw_person_id,
    generate_person_id,
    get_user_permission_level,
    set_user_permission_group,
    remove_user_permission_group,
    check_command_permission,
    grant_command_permission,
    remove_command_permission_override,
    get_user_command_overrides,
)
```

## 函数

### 身份标识生成

#### `generate_raw_person_id(platform: str, user_id: str) -> str`

生成原始格式的 `person_id`（`platform:user_id`）。

#### `generate_person_id(platform: str, user_id: str) -> str`

生成哈希后的 `person_id`，用于权限系统内部索引。

```python
pid = generate_person_id("qq", "123456789")
```

### 用户权限管理

#### `get_user_permission_level(person_id: str) -> PermissionLevel`

获取用户权限级别。此函数为**异步函数**。

#### `set_user_permission_group(person_id: str, level: PermissionLevel, granted_by: str | None = None, reason: str | None = None) -> bool`

设置用户权限组。此函数为**异步函数**。

- `person_id`: 用户身份标识
- `level`: 权限级别，必须是 [`PermissionLevel`](../../components/types.md) 类型
- `granted_by`: 授权人标识，可选
- `reason`: 授权原因，可选

#### `remove_user_permission_group(person_id: str) -> bool`

移除用户权限组。此函数为**异步函数**。

### 命令权限管理

#### `check_command_permission(person_id: str, command_class: type[BaseCommand], command_signature: str | None = None) -> tuple[bool, str]`

检查用户是否有权限执行命令。此函数为**异步函数**。

- `person_id`: 用户身份标识
- `command_class`: 命令类
- `command_signature`: 命令签名，可选
- 返回: `(是否允许, 提示信息)`

#### `grant_command_permission(person_id: str, command_signature: str, granted: bool = True, granted_by: str | None = None, reason: str | None = None) -> bool`

设置用户对特定命令的权限覆盖。此函数为**异步函数**。

- `person_id`: 用户身份标识
- `command_signature`: 命令签名
- `granted`: 是否授权（默认 `True`）
- `granted_by`: 授权人标识，可选
- `reason`: 授权原因，可选

#### `remove_command_permission_override(person_id: str, command_signature: str) -> bool`

移除命令权限覆盖。此函数为**异步函数**。

#### `get_user_command_overrides(person_id: str) -> list[dict[str, Any]]`

获取用户的所有命令权限覆盖。此函数为**异步函数**。

## 相关文档

- [Command 组件](../components/command.md)
- [权限系统](../advanced/permissions.md)
