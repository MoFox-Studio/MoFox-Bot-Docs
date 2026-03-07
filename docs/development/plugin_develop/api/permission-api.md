# Permission API

`src/app/plugin_system/api/permission_api` 提供用户权限与命令权限管理能力。

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
    revoke_command_permission,
    get_user_command_permissions,
)
from src.core.components.types import PermissionLevel
```

## 权限级别

```python
from src.core.components.types import PermissionLevel

PermissionLevel.OWNER        # 超级管理员
PermissionLevel.ADMIN        # 管理员
PermissionLevel.USER         # 普通用户
PermissionLevel.GUEST        # 访客
PermissionLevel.BANNED       # 封禁用户
```

## 核心函数

### `generate_raw_person_id(platform: str, user_id: str) -> str`

生成原始格式 person_id（未哈希）。

**参数：**
- `platform`: 平台名称
- `user_id`: 用户 ID

**返回值：**
```python
"qq_123456"
```

**使用示例：**
```python
raw_id = generate_raw_person_id(platform="qq", user_id="123456")
# 返回: "qq_123456"
```

---

### `generate_person_id(platform: str, user_id: str) -> str`

生成哈希后的 person_id（SHA-256）。

**参数：**
- `platform`: 平台名称
- `user_id`: 用户 ID

**返回值：**
```python
"a1b2c3d4e5f6..."  # 64 位十六进制字符串
```

**使用示例：**
```python
person_id = generate_person_id(platform="qq", user_id="123456")
# 返回: "a1b2c3d4e5f6789..."
```

---

### `get_user_permission_level(person_id: str) -> PermissionLevel`

获取用户权限级别。

**参数：**
- `person_id`: 用户身份标识（哈希后）

**返回值：**
- `PermissionLevel` 枚举值

**使用示例：**
```python
level = await get_user_permission_level(person_id)

if level == PermissionLevel.ADMIN:
    print("用户是管理员")
elif level == PermissionLevel.BANNED:
    print("用户已被封禁")
```

---

### `set_user_permission_group(person_id: str, level: PermissionLevel, granted_by=None, reason=None) -> bool`

设置用户权限组。

**参数：**
- `person_id`: 用户身份标识
- `level`: 权限级别
- `granted_by`: 授权人标识，可选
- `reason`: 授权原因，可选

**返回值：**
- `True` 表示设置成功，`False` 表示失败

**使用示例：**
```python
# 设置为管理员
success = await set_user_permission_group(
    person_id=person_id,
    level=PermissionLevel.ADMIN,
    granted_by="owner_person_id",
    reason="可信用户",
)

if success:
    print("权限设置成功")
```

---

### `remove_user_permission_group(person_id: str) -> bool`

移除用户权限组（恢复为默认权限）。

**参数：**
- `person_id`: 用户身份标识

**返回值：**
- `True` 表示移除成功，`False` 表示失败

**使用示例：**
```python
success = await remove_user_permission_group(person_id)

if success:
    print("权限已恢复为默认")
```

---

### `check_command_permission(person_id: str, command_class: type[BaseCommand], command_signature=None) -> tuple[bool, str]`

检查用户是否有权限执行命令。

**参数：**
- `person_id`: 用户身份标识
- `command_class`: 命令类
- `command_signature`: 命令签名，可选

**返回值：**
- `(有权限, 原因说明)`

**返回值示例：**
```python
# 有权限
(True, "")

# 无权限
(False, "权限不足，需要 ADMIN 级别")

# 被封禁
(False, "用户已被封禁")
```

**使用示例：**
```python
has_permission, reason = await check_command_permission(
    person_id=person_id,
    command_class=AdminCommand,
)

if not has_permission:
    await self.send_text(f"权限检查失败: {reason}")
    return
```

---

### `grant_command_permission(person_id: str, command_signature: str, granted_by=None) -> bool`

授予用户特定命令的权限。

**参数：**
- `person_id`: 用户身份标识
- `command_signature`: 命令签名
- `granted_by`: 授权人标识，可选

**返回值：**
- `True` 表示授予成功，`False` 表示失败

**使用示例：**
```python
success = await grant_command_permission(
    person_id=person_id,
    command_signature="admin:command:manage_user",
    granted_by=self.sender_person_id,
)
```

---

### `revoke_command_permission(person_id: str, command_signature: str) -> bool`

撤销用户特定命令的权限。

**参数：**
- `person_id`: 用户身份标识
- `command_signature`: 命令签名

**返回值：**
- `True` 表示撤销成功，`False` 表示失败

**使用示例：**
```python
success = await revoke_command_permission(
    person_id=person_id,
    command_signature="admin:command:manage_user",
)
```

---

### `get_user_command_permissions(person_id: str) -> list[str]`

获取用户的所有特定命令权限。

**参数：**
- `person_id`: 用户身份标识

**返回值：**
```python
[
    "admin:command:manage_user",
    "plugin:command:special_feature",
]
```

**使用示例：**
```python
permissions = await get_user_command_permissions(person_id)

if permissions:
    await self.send_text("特殊权限:\n" + "\n".join(f"- {p}" for p in permissions))
else:
    await self.send_text("无特殊权限")
```

## 完整示例

### 示例 1：权限管理命令

```python
from src.app.plugin_system.api.permission_api import (
    generate_person_id,
    get_user_permission_level,
    set_user_permission_group,
)
from src.core.components.types import PermissionLevel

class SetPermissionCommand(BaseCommand):
    name = "setperm"
    description = "设置用户权限"
    permission = PermissionLevel.OWNER  # 仅超级管理员可用
    
    async def execute(self, target_user_id: str, level: str):
        # 生成目标用户 person_id
        target_person_id = generate_person_id(
            platform=self.platform,
            user_id=target_user_id,
        )
        
        # 解析权限级别
        level_map = {
            "owner": PermissionLevel.OWNER,
            "admin": PermissionLevel.ADMIN,
            "user": PermissionLevel.USER,
            "guest": PermissionLevel.GUEST,
            "banned": PermissionLevel.BANNED,
        }
        
        permission_level = level_map.get(level.lower())
        if not permission_level:
            await self.send_text(f"无效的权限级别: {level}")
            return
        
        # 设置权限
        success = await set_user_permission_group(
            person_id=target_person_id,
            level=permission_level,
            granted_by=self.sender_person_id,
            reason=f"手动设置为 {level}",
        )
        
        if success:
            await self.send_text(f"用户 {target_user_id} 权限已设置为 {level}")
        else:
            await self.send_text("权限设置失败")
```

### 示例 2：查询权限命令

```python
from src.app.plugin_system.api.permission_api import (
    generate_person_id,
    get_user_permission_level,
    get_user_command_permissions,
)

class CheckPermissionCommand(BaseCommand):
    name = "checkperm"
    description = "查询用户权限"
    
    async def execute(self, user_id: str = ""):
        # 如果未指定用户，查询自己
        if not user_id:
            person_id = self.sender_person_id
            user_id = self.sender_id
        else:
            person_id = generate_person_id(
                platform=self.platform,
                user_id=user_id,
            )
        
        # 获取权限级别
        level = await get_user_permission_level(person_id)
        
        # 获取特殊命令权限
        special_perms = await get_user_command_permissions(person_id)
        
        # 格式化输出
        result = [
            f"用户 {user_id} 权限信息:",
            f"权限级别: {level.value}",
        ]
        
        if special_perms:
            result.append("特殊权限:")
            result.extend(f"  - {p}" for p in special_perms)
        else:
            result.append("无特殊权限")
        
        await self.send_text("\n".join(result))
```

### 示例 3：封禁/解封用户

```python
from src.app.plugin_system.api.permission_api import (
    generate_person_id,
    set_user_permission_group,
    remove_user_permission_group,
)
from src.core.components.types import PermissionLevel

class BanCommand(BaseCommand):
    name = "ban"
    description = "封禁用户"
    permission = PermissionLevel.ADMIN
    
    async def execute(self, user_id: str, reason: str = "违规"):
        person_id = generate_person_id(
            platform=self.platform,
            user_id=user_id,
        )
        
        success = await set_user_permission_group(
            person_id=person_id,
            level=PermissionLevel.BANNED,
            granted_by=self.sender_person_id,
            reason=reason,
        )
        
        if success:
            await self.send_text(f"用户 {user_id} 已被封禁\n原因: {reason}")
        else:
            await self.send_text("封禁失败")

class UnbanCommand(BaseCommand):
    name = "unban"
    description = "解封用户"
    permission = PermissionLevel.ADMIN
    
    async def execute(self, user_id: str):
        person_id = generate_person_id(
            platform=self.platform,
            user_id=user_id,
        )
        
        # 移除封禁，恢复为默认权限
        success = await remove_user_permission_group(person_id)
        
        if success:
            await self.send_text(f"用户 {user_id} 已解封")
        else:
            await self.send_text("解封失败")
```

### 示例 4：在组件中检查权限

```python
from src.app.plugin_system.api.permission_api import (
    generate_person_id,
    check_command_permission,
)

class SensitiveAction(BaseAction):
    async def execute(self, user_id: str):
        # 生成 person_id
        person_id = generate_person_id(
            platform=self.platform,
            user_id=user_id,
        )
        
        # 检查权限（假设需要 ADMIN 级别）
        from src.core.components.base.command import BaseCommand
        
        class DummyCommand(BaseCommand):
            permission = PermissionLevel.ADMIN
        
        has_permission, reason = await check_command_permission(
            person_id=person_id,
            command_class=DummyCommand,
        )
        
        if not has_permission:
            return {"error": f"权限不足: {reason}"}
        
        # 执行敏感操作
        return {"success": True}
```

## 权限系统架构

```
PermissionLevel (权限级别)
    ├── OWNER (超级管理员)
    ├── ADMIN (管理员)
    ├── USER (普通用户)
    ├── GUEST (访客)
    └── BANNED (封禁用户)

Command.permission (命令权限要求)
    └── 定义在命令类中

用户权限检查流程:
    1. 检查用户是否被封禁
    2. 检查用户权限级别
    3. 检查特定命令权限
    4. 返回检查结果
```

## 相关文档

- [Command 组件](../components/command.md) — 命令权限配置
- [权限系统使用指南](/docs/guides/permission_usage) — 权限系统详解
- [Command API](./command-api.md) — 命令管理 API
