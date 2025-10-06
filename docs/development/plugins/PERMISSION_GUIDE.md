# 插件权限系统使用指南

为了简化插件开发并确保权限管理的一致性，我们引入了一套声明式的权限节点注册机制。开发者不再需要在 `on_plugin_loaded` 方法中手动编写注册代码，而是通过在插件类中定义一个 `permission_nodes` 属性来声明插件所需的权限。

## 核心概念

### `PermissionNodeField`

`PermissionNodeField` 是一个数据类，用于定义单个权限节点的元数据。它的结构如下：

- `node_name` (str): 权限节点的名称，例如 `"manage"` 或 `"view"`。这个名称是相对于插件的，系统会自动为其添加 `plugins.<plugin_name>.` 前缀。
- `description` (str): 权限的详细描述，用于在管理界面中向管理员说明该权限的用途。

### `permission_nodes` 属性

`permission_nodes` 是 `PluginBase` 基类的一个新属性，它是一个 `PermissionNodeField` 对象的列表。插件开发者通过覆盖这个属性来声明插件所需的所有权限节点。

## 如何使用

在你的插件类中，添加一个 `permission_nodes` 属性，并填充所需的 `PermissionNodeField` 对象。

### 示例

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

## 自动注册

当插件被加载时，`PluginManager` 会自动检查 `permission_nodes` 属性。如果该属性不为空，它会遍历列表中的每一个 `PermissionNodeField` 对象，并调用 `permission_api` 为其注册权限节点。

注册时，权限节点的完整名称会自动规范化为 `plugins.<plugin_name>.<node_name>` 的格式。例如，在上面的示例中，注册的两个权限节点分别是：

- `plugins.MyAwesomePlugin.manage`
- `plugins.MyAwesomePlugin.view`

## 优点

- **简洁性**: 无需在 `on_plugin_loaded` 中编写重复的、过程式的注册代码。
- **可读性**: 插件所需的所有权限都集中在一个地方声明，一目了然。
- **一致性**: 强制使用统一的权限声明方式，便于维护和管理。
- **安全性**: 所有权限都默认为拒绝，需要管理员显式授权，避免了因默认授予而产生的安全风险。