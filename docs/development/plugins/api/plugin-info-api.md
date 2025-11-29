# 插件信息 API

该模块提供了用于查询插件和组件信息、生成报告和统计数据的 API。

主要功能包括：
- 系统状态报告生成
- 插件详情查询
- 组件列表和搜索
- 状态统计
- 工具函数

::: tip 相关 API
- 插件生命周期管理相关功能请使用 [Plugin Manage API](./plugin-manage-api)
- 组件状态管理相关功能请使用 [Component State API](./component-state-api)
:::

## 导入方式

```python
from src.plugin_system.apis import plugin_info_api
```

---

## 1. 信息查询与报告

这部分 API 用于获取关于插件和组件的详细信息、列表和统计数据。

### `get_system_report()`

生成一份详细的系统状态报告。报告包含已加载插件、失败插件和组件的全面信息，是调试和监控系统状态的核心工具。

```python
def get_system_report() -> dict[str, Any]
```

- **Returns**: `dict[str, Any]` - 包含系统、插件和组件状态的详细报告字典。
- **返回字典结构**:
  ```python
  {
      "system_info": {
          "loaded_plugins_count": int,
          "total_components_count": int,
      },
      "plugins": {
          "<plugin_name>": {
              "display_name": str,
              "version": str,
              "author": str,
              "enabled": bool,
              "components": [
                  {
                      "name": str,
                      "component_type": str,
                      "description": str,
                      "enabled": bool,
                  }
              ]
          }
      },
      "failed_plugins": {
          "<plugin_name>": "<error_message>"
      }
  }
  ```

**示例：**

```python
from src.plugin_system.apis import plugin_info_api

report = plugin_info_api.get_system_report()
print(f"已加载插件数量: {report['system_info']['loaded_plugins_count']}")
print(f"总组件数量: {report['system_info']['total_components_count']}")

# 遍历所有插件
for name, info in report['plugins'].items():
    print(f"插件: {info['display_name']} v{info['version']}")
    print(f"  - 作者: {info['author']}")
    print(f"  - 启用状态: {info['enabled']}")
    print(f"  - 组件数量: {len(info['components'])}")
```

### `get_plugin_details()`

获取单个插件的详细报告。报告内容包括插件的元数据、所有组件的详细信息及其当前状态。

```python
def get_plugin_details(plugin_name: str) -> dict[str, Any] | None
```

- **Args**:
  - `plugin_name (str)`: 要查询的插件名称。
- **Returns**: `dict | None` - 包含插件详细信息的字典，如果插件未注册则返回 `None`。
- **返回字典结构**:
  ```python
  {
      "name": str,
      "display_name": str,
      "version": str,
      "author": str,
      "license": str,
      "description": str,
      "enabled": bool,
      "status": str,  # "loaded" 或 "registered"
      "components": [
          {
              "name": str,
              "component_type": str,
              "description": str,
              "enabled": bool,
          }
      ]
  }
  ```

**示例：**

```python
details = plugin_info_api.get_plugin_details("my_plugin")
if details:
    print(f"插件名称: {details['display_name']}")
    print(f"版本: {details['version']}")
    print(f"描述: {details['description']}")
    print(f"状态: {details['status']}")
    
    for comp in details['components']:
        status = "✓" if comp['enabled'] else "✗"
        print(f"  [{status}] {comp['name']} ({comp['component_type']})")
else:
    print("插件未找到")
```

### `list_plugins()`

根据指定的状态列出插件名称列表。提供了一种快速、便捷的方式来监控和调试插件系统。

```python
def list_plugins(status: Literal["loaded", "registered", "failed"]) -> list[str]
```

- **Args**:
  - `status (str)`: 插件状态，可选值为 `'loaded'`, `'registered'`, `'failed'`。
- **Returns**: `list[str]` - 对应状态的插件名称列表。
- **Raises**: `ValueError` - 如果传入了无效的状态字符串。

**示例：**

```python
# 获取所有已加载的插件
loaded_plugins = plugin_info_api.list_plugins("loaded")
print(f"已加载: {loaded_plugins}")

# 获取所有已注册的插件（包括未加载的）
registered_plugins = plugin_info_api.list_plugins("registered")
print(f"已注册: {registered_plugins}")

# 获取所有加载失败的插件
failed_plugins = plugin_info_api.list_plugins("failed")
if failed_plugins:
    print(f"加载失败: {failed_plugins}")
```

### `list_components()`

列出指定类型的所有组件的详细信息。这是查找和管理组件的核心功能。

```python
def list_components(component_type: ComponentType, enabled_only: bool = True) -> list[dict[str, Any]]
```

- **Args**:
  - `component_type (ComponentType)`: 要查询的组件类型。
  - `enabled_only (bool, optional)`: 是否只返回已启用的组件。默认为 `True`。
- **Returns**: `list[dict[str, Any]]` - 一个包含组件信息字典的列表。
- **返回字典结构**:
  ```python
  {
      "name": str,
      "plugin_name": str,
      "description": str,
      "enabled": bool,
  }
  ```

**示例：**

```python
from src.plugin_system.base.component_types import ComponentType

# 获取所有已启用的工具组件
tools = plugin_info_api.list_components(ComponentType.TOOL)
for tool in tools:
    print(f"工具: {tool['name']} - {tool['description']}")

# 获取所有 Chatter 组件（包括禁用的）
chatters = plugin_info_api.list_components(ComponentType.CHATTER, enabled_only=False)
for chatter in chatters:
    status = "启用" if chatter['enabled'] else "禁用"
    print(f"Chatter: {chatter['name']} ({status})")
```

### `search_components_by_name()`

根据名称关键字搜索组件，支持模糊匹配和精确匹配。极大地增强了组件的可发现性。

```python
def search_components_by_name(
    name_keyword: str,
    component_type: ComponentType | None = None,
    case_sensitive: bool = False,
    exact_match: bool = False,
) -> list[dict[str, Any]]
```

- **Args**:
  - `name_keyword (str)`: 用于搜索的名称关键字。
  - `component_type (ComponentType | None, optional)`: 如果提供，则只在该类型中搜索。默认为 `None` (搜索所有类型)。
  - `case_sensitive (bool, optional)`: 是否进行大小写敏感的搜索。默认为 `False`。
  - `exact_match (bool, optional)`: 是否进行精确匹配。默认为 `False` (模糊匹配)。
- **Returns**: `list[dict[str, Any]]` - 匹配的组件信息字典的列表。

**示例：**

```python
# 模糊搜索包含 "weather" 的组件
results = plugin_info_api.search_components_by_name("weather")
for comp in results:
    print(f"找到: {comp['name']} ({comp['component_type']})")

# 精确匹配指定名称的工具
results = plugin_info_api.search_components_by_name(
    "get_weather",
    component_type=ComponentType.TOOL,
    exact_match=True
)

# 大小写敏感搜索
results = plugin_info_api.search_components_by_name(
    "Weather",
    case_sensitive=True
)
```

### `get_component_info()`

获取任何一个已注册组件的详细信息对象。

```python
def get_component_info(name: str, component_type: ComponentType) -> ComponentInfo | None
```

- **Args**:
  - `name (str)`: 组件的唯一名称。
  - `component_type (ComponentType)`: 组件的类型。
- **Returns**: `ComponentInfo | None` - 包含组件完整信息的 `ComponentInfo` 对象，如果找不到则返回 `None`。

**示例：**

```python
info = plugin_info_api.get_component_info("my_tool", ComponentType.TOOL)
if info:
    print(f"组件名称: {info.name}")
    print(f"所属插件: {info.plugin_name}")
    print(f"描述: {info.description}")
    print(f"启用状态: {info.enabled}")
```

---

## 2. 状态查询与统计

这部分 API 提供状态查询和统计功能。

### `get_plugin_state()`

获取插件的详细状态信息。

```python
def get_plugin_state(plugin_name: str) -> dict[str, Any] | None
```

- **Args**:
  - `plugin_name (str)`: 要查询的插件名称。
- **Returns**: `dict | None` - 包含插件状态信息的字典，如果插件不存在则返回 `None`。
- **返回字典结构**:
  ```python
  {
      "name": str,
      "is_loaded": bool,
      "is_enabled": bool,
      "total_components": int,
      "enabled_components": int,
      "disabled_components": int,
  }
  ```

**示例：**

```python
state = plugin_info_api.get_plugin_state("my_plugin")
if state:
    print(f"插件: {state['name']}")
    print(f"已加载: {state['is_loaded']}")
    print(f"已启用: {state['is_enabled']}")
    print(f"组件总数: {state['total_components']}")
    print(f"已启用组件: {state['enabled_components']}")
```

### `get_all_plugin_states()`

获取所有已加载插件的状态信息。

```python
def get_all_plugin_states() -> dict[str, dict[str, Any]]
```

- **Returns**: `dict` - 插件名称到状态信息的映射。

**示例：**

```python
all_states = plugin_info_api.get_all_plugin_states()
for name, state in all_states.items():
    enabled = "✓" if state['is_enabled'] else "✗"
    print(f"[{enabled}] {name}: {state['enabled_components']}/{state['total_components']} 组件启用")
```

### `get_state_statistics()`

获取整体状态统计信息。

```python
def get_state_statistics() -> dict[str, Any]
```

- **Returns**: `dict` - 包含插件和组件状态统计的字典。
- **返回字典结构**:
  ```python
  {
      "plugins": {
          "loaded": int,
          "registered": int,
          "failed": int,
          "enabled": int,
          "disabled": int,
      },
      "components": {
          "total": int,
          "enabled": int,
          "disabled": int,
          "by_type": {
              "<component_type>": {
                  "total": int,
                  "enabled": int,
                  "disabled": int,
              }
          }
      }
  }
  ```

**示例：**

```python
stats = plugin_info_api.get_state_statistics()

# 插件统计
print("=== 插件统计 ===")
print(f"已加载: {stats['plugins']['loaded']}")
print(f"已注册: {stats['plugins']['registered']}")
print(f"加载失败: {stats['plugins']['failed']}")
print(f"已启用: {stats['plugins']['enabled']}")

# 组件统计
print("\n=== 组件统计 ===")
print(f"总数: {stats['components']['total']}")
print(f"已启用: {stats['components']['enabled']}")
print(f"已禁用: {stats['components']['disabled']}")

# 按类型统计
print("\n=== 按类型统计 ===")
for comp_type, type_stats in stats['components']['by_type'].items():
    print(f"{comp_type}: {type_stats['enabled']}/{type_stats['total']} 启用")
```

---

## 3. 工具函数

这部分提供了一些轻量级的辅助函数，用于快速检查状态。

### `is_plugin_loaded()`

快速检查一个插件当前是否已成功加载。这是一个比 `get_plugin_details` 更轻量级的检查方法。

```python
def is_plugin_loaded(plugin_name: str) -> bool
```

- **Args**:
  - `plugin_name (str)`: 要检查的插件名称。
- **Returns**: `bool` - 如果插件已加载，则为 `True`，否则为 `False`。

**示例：**

```python
if plugin_info_api.is_plugin_loaded("my_plugin"):
    print("插件已加载，可以使用")
else:
    print("插件未加载")
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
if plugin_info_api.is_plugin_enabled("my_plugin"):
    print("插件已启用")
else:
    print("插件未启用或未加载")
```

### `get_component_plugin()`

查找一个特定组件属于哪个插件。在调试或管理组件时，此函数能够方便地追溯其定义的源头。

```python
def get_component_plugin(component_name: str, component_type: ComponentType) -> str | None
```

- **Args**:
  - `component_name (str)`: 组件的名称。
  - `component_type (ComponentType)`: 组件的类型。
- **Returns**: `str | None` - 组件所属的插件名称，如果找不到组件则返回 `None`。

**示例：**

```python
plugin_name = plugin_info_api.get_component_plugin("my_tool", ComponentType.TOOL)
if plugin_name:
    print(f"工具 'my_tool' 来自插件: {plugin_name}")
else:
    print("未找到该组件")
```

### `validate_component_exists()`

验证组件是否存在于注册表中。

```python
def validate_component_exists(name: str, component_type: ComponentType) -> bool
```

- **Args**:
  - `name (str)`: 组件名称。
  - `component_type (ComponentType)`: 组件类型。
- **Returns**: `bool` - 如果组件存在，则为 `True`。

**示例：**

```python
if plugin_info_api.validate_component_exists("my_tool", ComponentType.TOOL):
    print("组件存在")
else:
    print("组件不存在")
```

### `get_plugin_component_summary()`

获取插件的组件摘要信息。

```python
def get_plugin_component_summary(plugin_name: str) -> dict[str, Any] | None
```

- **Args**:
  - `plugin_name (str)`: 插件名称。
- **Returns**: `dict | None` - 包含组件摘要的字典，如果插件不存在则返回 `None`。
- **返回字典结构**:
  ```python
  {
      "plugin_name": str,
      "total_components": int,
      "by_type": {
          "<component_type>": {
              "total": int,
              "enabled": int,
              "disabled": int,
              "names": list[str],
          }
      }
  }
  ```

**示例：**

```python
summary = plugin_info_api.get_plugin_component_summary("my_plugin")
if summary:
    print(f"插件: {summary['plugin_name']}")
    print(f"组件总数: {summary['total_components']}")
    
    for comp_type, info in summary['by_type'].items():
        print(f"\n{comp_type}:")
        print(f"  总数: {info['total']}")
        print(f"  已启用: {info['enabled']}")
        print(f"  组件列表: {', '.join(info['names'])}")
```
