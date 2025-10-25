# 插件权限系统使用指南

为了简化插件开发并确保权限管理的一致性，我们引入了一套声明式的权限节点注册机制。开发者应通过在插件类中定义一个 `permission_nodes` 属性来声明插件所需的所有权限。

## 1. 注册权限节点

这是为你的插件定义权限的第一步，也是最重要的一步。

### 核心概念 `PermissionNodeField`

`PermissionNodeField` 是一个数据类，用于定义单个权限节点的元数据。它的结构如下：

- `node_name` (str): 权限节点的名称，例如 `"manage"` 或 `"view"`。这个名称是相对于插件的，系统会自动为其添加 `plugins.<plugin_name>.` 前缀。
- `description` (str): 权限的详细描述，用于在管理界面中向管理员说明该权限的用途。

### 如何使用

你需要在你的插件类中，添加一个 `permission_nodes` 属性，它是一个 `PermissionNodeField` 对象的列表。

#### 示例

假设我们有一个名为 `MyAwesomePlugin` 的插件，它需要两个权限：一个用于管理，一个用于查看。

```python
from src.plugin_system import BasePlugin, register_plugin
from src.plugin_system.base.component_types import PermissionNodeField

@register_plugin
class MyAwesomePlugin(BasePlugin):
    plugin_name: str = "MyAwesomePlugin"
    
    permission_nodes: list[PermissionNodeField] = [
        PermissionNodeField(
            node_name="manage",
            description="允许用户管理 MyAwesomePlugin 的各项功能。"
        ),
        PermissionNodeField(
            node_name="view",
            description="允许用户查看 MyAwesomePlugin 的状态信息。"
        ),
    ]

    # ... 插件的其他代码 ...
```

### 自动注册

当插件被加载时，系统会自动检查 `permission_nodes` 属性。如果该属性不为空，它会遍历列表中的每一个 `PermissionNodeField` 对象，并为其注册权限节点。

注册时，权限节点的完整名称会自动规范化为 `plugins.<plugin_name>.<node_name>` 的格式。例如，在上面的示例中，注册的两个权限节点分别是：

- `plugins.MyAwesomePlugin.manage`
- `plugins.MyAwesomePlugin.view`

## 2. 在代码中检查权限

声明权限后，你需要在代码的相应位置检查用户是否拥有该权限。

### 推荐方式：使用装饰器

这是最简单、最直接的权限检查方式，推荐在命令处理函数上使用。

```python
from src.plugin_system.utils.permission_decorators import require_permission, require_master

class MyCommand(BaseCommand):
    @require_permission("plugins.MyAwesomePlugin.manage")
    async def execute(self, message: Message, chat_stream: ChatStream, args: List[str]):
        await send_message(chat_stream, "你有管理员权限！")
    
    @require_master("只有Master可以执行此操作")
    async def master_only_function(self, message: Message, chat_stream: ChatStream):
        await send_message(chat_stream, "Master专用功能")
```

### 灵活方式：手动检查

对于更复杂的权限逻辑，你可以使用 `PermissionChecker` 进行手动检查。

```python
from src.plugin_system.utils.permission_decorators import PermissionChecker

class MyCommand(BaseCommand):
    async def execute(self, message: Message, chat_stream: ChatStream, args: List[str]):
        # 检查是否为Master用户
        if PermissionChecker.is_master(chat_stream):
            await send_message(chat_stream, "Master用户可以执行所有操作")
            return
        
        # 检查特定权限
        if PermissionChecker.check_permission(chat_stream, "plugins.MyAwesomePlugin.view"):
            await send_message(chat_stream, "你可以查看数据")
        
        # 使用 ensure_permission 自动发送权限不足消息
        if await PermissionChecker.ensure_permission(chat_stream, "plugins.MyAwesomePlugin.manage"):
            await send_message(chat_stream, "你可以管理此插件")
```

### 高级方式：直接调用 API

在某些特殊场景下，你可能需要更底层的权限操作，可以直接调用 `permission_api`。

```python
from src.plugin_system.apis.permission_api import permission_api

# 检查特定用户的权限
has_permission = permission_api.check_permission("qq", "123456", "plugins.MyAwesomePlugin.manage")

# 检查特定用户是否为Master
is_master = permission_api.is_master("qq", "123456")

# 获取用户的所有权限
permissions = permission_api.get_user_permissions("qq", "123456")
```

## 3. 最佳实践

1.  **细粒度权限**：为不同功能创建独立的权限节点，而不是用一个宽泛的 `admin` 权限。
2.  **清晰描述**：为每个权限节点提供清晰、准确的描述，方便管理员理解和授权。
3.  **命名规范**：遵循 `plugins.<plugin_name>.<node_name>` 的命名规范，保持一致性。
4.  **安全第一**：所有权限都默认为拒绝，需要管理员显式授权，这保证了系统的安全性。