# 插件管理 API

该模块提供了用于管理插件生命周期的核心 API。功能包括：

- 插件生命周期管理（加载、重载、注册、发现）
- 插件的启用/禁用
- 插件卸载
- 插件状态查询

::: tip 相关 API
- 组件状态管理相关功能请使用 [Component State API](./component-state-api)
- 信息查询和报告相关功能请使用 [Plugin Info API](./plugin-info-api)
:::

## 导入方式

```python
from src.plugin_system.apis import plugin_manage_api
```

## 核心概念

- **插件 (Plugin)**: 一个功能包，可以包含一个或多个组件。
- **组件 (Component)**: 实现具体功能的单元，例如一个 `Tool` 或一个 `Chatter`。
- **已注册 (Registered)**: 插件已被发现并记录，但可能尚未加载到内存。
- **已加载 (Loaded)**: 插件已成功加载到内存并可以使用。

---

## 1. 插件生命周期管理

这部分 API 包含控制插件加载、重载、注册和发现的核心功能。

### `reload_all_plugins()`

重新加载所有当前已成功加载的插件。此操作会遍历所有已加载的插件，逐一进行卸载和重新加载。

```python
async def reload_all_plugins() -> bool
```

- **Returns**: `bool` - 如果所有插件都成功重载，则为 `True`，否则为 `False`。

**示例：**

```python
from src.plugin_system.apis import plugin_manage_api

# 重载所有插件
success = await plugin_manage_api.reload_all_plugins()
if success:
    print("所有插件重载成功")
else:
    print("部分插件重载失败")
```

### `reload_plugin()`

重新加载指定的单个插件。

```python
async def reload_plugin(name: str) -> bool
```

- **Args**:
  - `name (str)`: 要重载的插件的名称。
- **Returns**: `bool` - 如果插件成功重载，则为 `True`。
- **Raises**: `ValueError` - 如果插件未在插件管理器中注册。

**示例：**

```python
try:
    success = await plugin_manage_api.reload_plugin("my_plugin")
    if success:
        print("插件重载成功")
except ValueError as e:
    print(f"插件未注册: {e}")
```

### `rescan_and_register_plugins()`

重新扫描所有插件目录，以发现并注册新插件。

```python
def rescan_and_register_plugins(load_after_register: bool = True) -> tuple[int, int]
```

- **Args**:
  - `load_after_register (bool)`: 如果为 `True`，新发现的插件将在注册后立即被加载。默认为 `True`。
- **Returns**: `tuple[int, int]` - 一个元组，包含 `(成功加载的插件数量, 加载失败的插件数量)`。

**示例：**

```python
# 扫描并加载新插件
success_count, fail_count = plugin_manage_api.rescan_and_register_plugins()
print(f"成功加载: {success_count}, 加载失败: {fail_count}")

# 仅扫描注册，不立即加载
success_count, fail_count = plugin_manage_api.rescan_and_register_plugins(load_after_register=False)
```

### `register_plugin_from_file()`

从插件目录中查找、注册并选择性地加载一个指定的插件。

```python
def register_plugin_from_file(plugin_name: str, load_after_register: bool = True) -> bool
```

- **Args**:
  - `plugin_name (str)`: 插件的名称（通常是其目录名）。
  - `load_after_register (bool)`: 注册成功后是否立即加载该插件。默认为 `True`。
- **Returns**: `bool` - 如果插件成功注册（并且根据参数成功加载），则为 `True`。

**示例：**

```python
# 查找并加载指定插件
if plugin_manage_api.register_plugin_from_file("new_plugin"):
    print("插件注册并加载成功")
else:
    print("插件注册失败")
```

---

## 2. 插件状态管理

这部分 API 包含控制插件整体启用/禁用状态的功能。

### `enable_plugin()`

启用一个已禁用的插件。如果插件已经启用，直接返回 `True`。启用插件会同时尝试加载其所有组件。

```python
async def enable_plugin(plugin_name: str) -> bool
```

- **Args**:
  - `plugin_name (str)`: 要启用的插件名称。
- **Returns**: `bool` - 如果插件成功启用，则为 `True`。

**示例：**

```python
success = await plugin_manage_api.enable_plugin("my_plugin")
if success:
    print("插件已启用")
```

### `disable_plugin()`

禁用一个插件。禁用插件不会卸载它，只会标记为禁用状态。

```python
async def disable_plugin(plugin_name: str) -> bool
```

- **Args**:
  - `plugin_name (str)`: 要禁用的插件名称。
- **Returns**: `bool` - 如果插件成功禁用，则为 `True`。

**示例：**

```python
success = await plugin_manage_api.disable_plugin("my_plugin")
if success:
    print("插件已禁用")
```

### `unload_plugin()`

完全卸载一个插件。这会从内存中移除插件及其所有组件。与禁用不同，卸载后需要重新加载才能使用。

```python
async def unload_plugin(plugin_name: str) -> bool
```

- **Args**:
  - `plugin_name (str)`: 要卸载的插件名称。
- **Returns**: `bool` - 如果插件成功卸载，则为 `True`。

**示例：**

```python
success = await plugin_manage_api.unload_plugin("my_plugin")
if success:
    print("插件已完全卸载")
```

### `is_plugin_enabled()`

检查插件是否处于启用状态。

```python
def is_plugin_enabled(plugin_name: str) -> bool
```

- **Args**:
  - `plugin_name (str)`: 要检查的插件名称。
- **Returns**: `bool` - 如果插件已启用，则为 `True`；如果未加载或已禁用，则为 `False`。

**示例：**

```python
if plugin_manage_api.is_plugin_enabled("my_plugin"):
    print("插件已启用")
else:
    print("插件未启用或未加载")
```

### `is_plugin_loaded()`

快速检查一个插件当前是否已成功加载。

```python
def is_plugin_loaded(plugin_name: str) -> bool
```

- **Args**:
  - `plugin_name (str)`: 要检查的插件名称。
- **Returns**: `bool` - 如果插件已加载，则为 `True`，否则为 `False`。

**示例：**

```python
if plugin_manage_api.is_plugin_loaded("my_plugin"):
    print("插件已加载")
```

---

## 3. 插件列表查询

### `list_loaded_plugins()`

列出所有已加载的插件名称。

```python
def list_loaded_plugins() -> list[str]
```

- **Returns**: `list[str]` - 已加载插件的名称列表。

**示例：**

```python
loaded = plugin_manage_api.list_loaded_plugins()
print(f"已加载的插件: {loaded}")
```

### `list_registered_plugins()`

列出所有已注册的插件名称。

```python
def list_registered_plugins() -> list[str]
```

- **Returns**: `list[str]` - 已注册插件的名称列表。

**示例：**

```python
registered = plugin_manage_api.list_registered_plugins()
print(f"已注册的插件: {registered}")
```

### `list_failed_plugins()`

获取所有加载失败的插件及其错误信息。

```python
def list_failed_plugins() -> dict[str, str]
```

- **Returns**: `dict[str, str]` - 插件名称到错误信息的映射。

**示例：**

```python
failed = plugin_manage_api.list_failed_plugins()
for name, error in failed.items():
    print(f"插件 {name} 加载失败: {error}")
```

### `get_plugin_instance()`

获取插件实例。

```python
def get_plugin_instance(plugin_name: str) -> BasePlugin | None
```

- **Args**:
  - `plugin_name (str)`: 插件名称。
- **Returns**: `BasePlugin | None` - 插件实例，如果不存在则返回 `None`。

**示例：**

```python
instance = plugin_manage_api.get_plugin_instance("my_plugin")
if instance:
    print(f"插件版本: {instance.version}")
```