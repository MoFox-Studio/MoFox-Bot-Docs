# 组件状态 API

该模块提供了用于管理组件启用/禁用状态的核心 API。支持全局和局部（临时）范围的组件状态控制，以及批量操作。

主要功能包括：
- 组件的全局和局部启用/禁用
- 批量组件状态管理
- 组件状态查询与筛选

::: tip 相关 API
- 插件生命周期管理相关功能请使用 [Plugin Manage API](./plugin-manage-api)
- 信息查询和报告相关功能请使用 [Plugin Info API](./plugin-info-api)
:::

## 导入方式

```python
from src.plugin_system.apis import component_state_api
```

## 核心概念

- **全局状态**: 组件在整个系统中的启用/禁用状态，影响所有会话。
- **局部状态**: 针对特定会话（`stream_id`）的临时状态，会覆盖全局状态，仅在该会话中有效。
- **Chatter 保护**: 系统会阻止禁用最后一个已启用的 Chatter 组件，以确保系统正常运行。



## 1. 组件状态管理

这部分 API 负责控制单个组件的启用和禁用状态，支持全局和局部（临时）范围。

### `set_component_enabled()`

在**全局范围**内启用或禁用一个组件。此更改会直接修改组件在注册表中的状态，但此状态是临时的，不会持久化到配置文件中。

```python
async def set_component_enabled(name: str, component_type: ComponentType, enabled: bool) -> bool
```

- **Args**:
  - `name (str)`: 要操作的组件的名称。
  - `component_type (ComponentType)`: 组件的类型。
  - `enabled (bool)`: `True` 表示启用, `False` 表示禁用。
- **Returns**: `bool` - 如果操作成功，则为 `True`。
- **Note**: 系统会阻止禁用最后一个已启用的 `Chatter` 组件。

**示例：**

```python
from src.plugin_system.apis import component_state_api
from src.plugin_system.base.component_types import ComponentType

# 禁用一个工具
success = await component_state_api.set_component_enabled(
    "weather_tool",
    ComponentType.TOOL,
    enabled=False
)
if success:
    print("工具已禁用")

# 启用一个 Chatter
success = await component_state_api.set_component_enabled(
    "my_chatter",
    ComponentType.CHATTER,
    enabled=True
)
```

### `set_component_enabled_local()`

在一个特定的 `stream_id` **上下文（局部范围）**内临时启用或禁用组件。此状态仅存在于内存中，并且只对指定的 `stream_id` 有效，不影响全局组件状态。

```python
def set_component_enabled_local(
    stream_id: str, 
    name: str, 
    component_type: ComponentType, 
    enabled: bool
) -> bool
```

- **Args**:
  - `stream_id (str)`: 唯一的上下文标识符，例如一个会话ID。
  - `name (str)`: 组件名称。
  - `component_type (ComponentType)`: 组件类型。
  - `enabled (bool)`: `True` 为启用, `False` 为禁用。
- **Returns**: `bool` - 如果操作成功，则为 `True`。

**示例：**

```python
# 在特定会话中禁用某个工具
stream_id = "session_12345"
success = component_state_api.set_component_enabled_local(
    stream_id,
    "dangerous_tool",
    ComponentType.TOOL,
    enabled=False
)

# 这只会影响 stream_id 为 "session_12345" 的会话
# 其他会话仍然可以使用该工具
```

### `clear_local_component_states()`

清除指定会话的所有局部组件状态。当会话结束时应调用此方法来清理资源。

```python
def clear_local_component_states(stream_id: str) -> None
```

- **Args**:
  - `stream_id (str)`: 要清除状态的会话ID。

**示例：**

```python
# 会话结束时清理资源
stream_id = "session_12345"
component_state_api.clear_local_component_states(stream_id)
print(f"已清理会话 {stream_id} 的所有局部状态")
```

### `is_component_enabled()`

检查组件是否在指定上下文中启用。

```python
def is_component_enabled(
    name: str, 
    component_type: ComponentType, 
    stream_id: str | None = None
) -> bool
```

- **Args**:
  - `name (str)`: 组件名称。
  - `component_type (ComponentType)`: 组件类型。
  - `stream_id (str | None)`: 可选的会话ID，用于检查局部状态。
- **Returns**: `bool` - 如果组件启用，则为 `True`。

**示例：**

```python
# 检查全局状态
if component_state_api.is_component_enabled("my_tool", ComponentType.TOOL):
    print("工具全局启用")

# 检查特定会话中的状态
if component_state_api.is_component_enabled("my_tool", ComponentType.TOOL, "session_12345"):
    print("工具在该会话中启用")
```

### `get_component_state()`

获取组件的详细状态信息。

```python
def get_component_state(name: str, component_type: ComponentType) -> dict[str, Any] | None
```

- **Args**:
  - `name (str)`: 组件名称。
  - `component_type (ComponentType)`: 组件类型。
- **Returns**: `dict | None` - 包含组件状态信息的字典，如果组件不存在则返回 `None`。
- **返回字典结构**:
  ```python
  {
      "name": str,
      "component_type": str,
      "plugin_name": str,
      "enabled": bool,
      "description": str,
  }
  ```

**示例：**

```python
state = component_state_api.get_component_state("my_tool", ComponentType.TOOL)
if state:
    print(f"组件: {state['name']}")
    print(f"类型: {state['component_type']}")
    print(f"所属插件: {state['plugin_name']}")
    print(f"启用状态: {state['enabled']}")
    print(f"描述: {state['description']}")
```



## 2. 批量组件状态管理

这部分 API 提供批量操作组件状态的功能。

### `enable_all_plugin_components()`

启用指定插件下的所有组件。

```python
async def enable_all_plugin_components(plugin_name: str) -> dict[str, bool]
```

- **Args**:
  - `plugin_name (str)`: 插件名称。
- **Returns**: `dict[str, bool]` - 每个组件名称及其启用操作是否成功的字典。

**示例：**

```python
results = await component_state_api.enable_all_plugin_components("my_plugin")
print(f"成功启用: {sum(results.values())}/{len(results)} 个组件")

for name, success in results.items():
    status = "✓" if success else "✗"
    print(f"  [{status}] {name}")
```

### `disable_all_plugin_components()`

禁用指定插件下的所有组件。包含对 Chatter 组件的保护机制。

```python
async def disable_all_plugin_components(plugin_name: str) -> dict[str, bool]
```

- **Args**:
  - `plugin_name (str)`: 插件名称。
- **Returns**: `dict[str, bool]` - 每个组件名称及其禁用操作是否成功的字典。

**示例：**

```python
results = await component_state_api.disable_all_plugin_components("my_plugin")

# 检查是否有组件因保护机制而未被禁用
for name, success in results.items():
    if not success:
        print(f"警告: {name} 未能禁用（可能是最后一个 Chatter）")
```

### `set_components_enabled_by_type()`

启用或禁用指定插件下特定类型的所有组件。

```python
async def set_components_enabled_by_type(
    plugin_name: str, 
    component_type: ComponentType, 
    enabled: bool
) -> dict[str, bool]
```

- **Args**:
  - `plugin_name (str)`: 插件名称。
  - `component_type (ComponentType)`: 要操作的组件类型。
  - `enabled (bool)`: `True` 为启用，`False` 为禁用。
- **Returns**: `dict[str, bool]` - 每个组件名称及其操作是否成功的字典。

**示例：**

```python
# 禁用某插件的所有工具
results = await component_state_api.set_components_enabled_by_type(
    "my_plugin",
    ComponentType.TOOL,
    enabled=False
)
print(f"已禁用 {sum(results.values())} 个工具")

# 启用某插件的所有 Action
results = await component_state_api.set_components_enabled_by_type(
    "my_plugin",
    ComponentType.ACTION,
    enabled=True
)
```

### `batch_set_components_enabled()`

批量启用或禁用多个组件。

```python
async def batch_set_components_enabled(
    components: list[tuple[str, ComponentType]], 
    enabled: bool
) -> dict[str, bool]
```

- **Args**:
  - `components (list[tuple[str, ComponentType]])`: 要操作的组件列表，每个元素为 `(组件名称, 组件类型)` 元组。
  - `enabled (bool)`: `True` 为启用，`False` 为禁用。
- **Returns**: `dict[str, bool]` - 每个组件名称及其操作是否成功的字典。

**示例：**

```python
# 批量禁用多个组件
components_to_disable = [
    ("tool_a", ComponentType.TOOL),
    ("tool_b", ComponentType.TOOL),
    ("action_c", ComponentType.ACTION),
]

results = await component_state_api.batch_set_components_enabled(
    components_to_disable,
    enabled=False
)

print(f"批量操作完成: {sum(results.values())}/{len(results)} 成功")
```



## 3. 组件状态查询与筛选

这部分 API 提供组件状态的查询和筛选功能。

### `get_components_by_state()`

根据条件筛选组件。

```python
def get_components_by_state(
    component_type: ComponentType | None = None,
    enabled: bool | None = None,
    plugin_name: str | None = None,
) -> list[ComponentInfo]
```

- **Args**:
  - `component_type (ComponentType | None)`: 按组件类型筛选。
  - `enabled (bool | None)`: 按启用状态筛选。
  - `plugin_name (str | None)`: 按插件名称筛选。
- **Returns**: `list[ComponentInfo]` - 符合条件的组件信息列表。

**示例：**

```python
# 获取所有已启用的工具
enabled_tools = component_state_api.get_components_by_state(
    component_type=ComponentType.TOOL,
    enabled=True
)

# 获取某插件的所有禁用组件
disabled_in_plugin = component_state_api.get_components_by_state(
    enabled=False,
    plugin_name="my_plugin"
)

# 获取所有 Chatter（不论启用状态）
all_chatters = component_state_api.get_components_by_state(
    component_type=ComponentType.CHATTER
)
```

### `get_disabled_components()`

获取所有被禁用的组件。

```python
def get_disabled_components(plugin_name: str | None = None) -> list[ComponentInfo]
```

- **Args**:
  - `plugin_name (str | None)`: 可选，仅获取指定插件的禁用组件。
- **Returns**: `list[ComponentInfo]` - 禁用组件的信息列表。

**示例：**

```python
# 获取所有禁用的组件
all_disabled = component_state_api.get_disabled_components()
print(f"共有 {len(all_disabled)} 个禁用组件")

# 获取特定插件的禁用组件
plugin_disabled = component_state_api.get_disabled_components("my_plugin")
for comp in plugin_disabled:
    print(f"禁用: {comp.name} ({comp.component_type.value})")
```

### `get_enabled_components()`

获取所有已启用的组件。

```python
def get_enabled_components(plugin_name: str | None = None) -> list[ComponentInfo]
```

- **Args**:
  - `plugin_name (str | None)`: 可选，仅获取指定插件的启用组件。
- **Returns**: `list[ComponentInfo]` - 启用组件的信息列表。

**示例：**

```python
# 获取所有启用的组件
all_enabled = component_state_api.get_enabled_components()
print(f"共有 {len(all_enabled)} 个启用组件")

# 获取特定插件的启用组件
plugin_enabled = component_state_api.get_enabled_components("my_plugin")
for comp in plugin_enabled:
    print(f"启用: {comp.name} ({comp.component_type.value})")
```

### `get_component_count()`

获取指定类型的已加载并启用的组件的总数。可以根据 `stream_id` 考虑局部状态。

```python
def get_component_count(component_type: ComponentType, stream_id: str | None = None) -> int
```

- **Args**:
  - `component_type (ComponentType)`: 要查询的组件类型。
  - `stream_id (str | None)`: 可选的上下文ID。如果提供，将计入局部状态。
- **Returns**: `int` - 该类型下已启用的组件的数量。

**示例：**

```python
# 获取全局启用的工具数量
tool_count = component_state_api.get_component_count(ComponentType.TOOL)
print(f"全局启用的工具数量: {tool_count}")

# 获取特定会话中启用的工具数量（考虑局部状态）
session_tool_count = component_state_api.get_component_count(
    ComponentType.TOOL,
    stream_id="session_12345"
)
print(f"会话中启用的工具数量: {session_tool_count}")
```



## 使用场景示例

### 场景 1: 会话级工具控制

在某些场景下，你可能希望在特定会话中禁用某些敏感工具：

```python
async def setup_session_tools(stream_id: str, user_level: str):
    """根据用户等级设置会话工具"""
    
    if user_level == "guest":
        # 访客用户禁用敏感工具
        sensitive_tools = ["file_delete", "system_exec", "network_scan"]
        for tool in sensitive_tools:
            component_state_api.set_component_enabled_local(
                stream_id,
                tool,
                ComponentType.TOOL,
                enabled=False
            )
        print(f"已为访客会话 {stream_id} 禁用敏感工具")

async def cleanup_session(stream_id: str):
    """会话结束时清理"""
    component_state_api.clear_local_component_states(stream_id)
```

### 场景 2: 插件维护模式

临时禁用某个插件的所有组件进行维护：

```python
async def enter_maintenance_mode(plugin_name: str):
    """进入维护模式"""
    results = await component_state_api.disable_all_plugin_components(plugin_name)
    failed = [name for name, success in results.items() if not success]
    
    if failed:
        print(f"警告: 以下组件未能禁用: {failed}")
    else:
        print(f"插件 {plugin_name} 已进入维护模式")
    
    return results

async def exit_maintenance_mode(plugin_name: str):
    """退出维护模式"""
    results = await component_state_api.enable_all_plugin_components(plugin_name)
    print(f"插件 {plugin_name} 已恢复正常")
    return results
```

### 场景 3: 组件健康检查

检查系统中组件的健康状态：

```python
def health_check():
    """组件健康检查"""
    
    # 检查是否有 Chatter
    chatter_count = component_state_api.get_component_count(ComponentType.CHATTER)
    if chatter_count == 0:
        print("警告: 没有启用的 Chatter!")
        return False
    
    # 检查禁用组件
    disabled = component_state_api.get_disabled_components()
    if disabled:
        print(f"注意: 有 {len(disabled)} 个组件被禁用:")
        for comp in disabled:
            print(f"  - {comp.name} ({comp.plugin_name})")
    
    print("组件健康检查完成")
    return True
```
