# 插件管理 API

该模块提供了用于管理插件和组件生命周期、状态和信息查询的核心API。功能包括插件的加载、重载、注册、扫描，组件的启用/禁用，以及系统状态报告的生成。

## 导入方式
```python
from src.plugin_system.apis import plugin_manage_api
```

## 核心概念

- **插件 (Plugin)**: 一个功能包，可以包含一个或多个组件。
- **组件 (Component)**: 实现具体功能的单元，例如一个 `Tool` 或一个 `Chatter`。
- **全局状态 vs 局部状态**: 组件的启用/禁用状态可以全局设置，也可以针对特定的会话（`stream_id`）进行临时（局部）设置，局部设置会覆盖全局设置。

---

## 1. 插件生命周期管理 (Plugin Lifecycle Management)

这部分 API 包含控制插件加载、重载、注册和发现的核心功能。

### `reload_all_plugins()`
重新加载所有当前已成功加载的插件。此操作会遍历所有已加载的插件，逐一进行卸载和重新加载。

```python
async def reload_all_plugins() -> bool:
```
- **Returns**: `bool` - 如果所有插件都成功重载，则为 `True`，否则为 `False`。

### `reload_plugin()`
重新加载指定的单个插件。

```python
async def reload_plugin(name: str) -> bool:
```
- **Args**:
  - `name (str)`: 要重载的插件的名称。
- **Returns**: `bool` - 如果插件成功重载，则为 `True`。
- **Raises**: `ValueError` - 如果插件未在插件管理器中注册。

### `rescan_and_register_plugins()`
重新扫描所有插件目录，以发现并注册新插件。

```python
def rescan_and_register_plugins(load_after_register: bool = True) -> tuple[int, int]:
```
- **Args**:
  - `load_after_register (bool)`: 如果为 `True`，新发现的插件将在注册后立即被加载。默认为 `True`。
- **Returns**: `tuple[int, int]` - 一个元组，包含 `(成功加载的插件数量, 加载失败的插件数量)`。

### `register_plugin_from_file()`
从插件目录中查找、注册并选择性地加载一个指定的插件。

```python
def register_plugin_from_file(plugin_name: str, load_after_register: bool = True) -> bool:
```
- **Args**:
  - `plugin_name (str)`: 插件的名称（通常是其目录名）。
  - `load_after_register (bool)`: 注册成功后是否立即加载该插件。默认为 `True`。
- **Returns**: `bool` - 如果插件成功注册（并且根据参数成功加载），则为 `True`。

---

## 2. 组件状态管理 (Component State Management)

这部分 API 负责控制单个组件的启用和禁用状态。

### `set_component_enabled()`
在**全局范围**内启用或禁用一个组件。此更改是临时的，不会持久化到配置文件中。

```python
async def set_component_enabled(name: str, component_type: ComponentType, enabled: bool) -> bool:
```
- **Args**:
  - `name (str)`: 要操作的组件的名称。
  - `component_type (ComponentType)`: 组件的类型。
  - `enabled (bool)`: `True` 表示启用, `False` 表示禁用。
- **Returns**: `bool` - 如果操作成功，则为 `True`。
- **Note**: 系统会阻止禁用最后一个已启用的 `Chatter` 组件。

### `set_component_enabled_local()`
在一个特定的 `stream_id` **上下文（局部范围）**内临时启用或禁用组件。

```python
def set_component_enabled_local(stream_id: str, name: str, component_type: ComponentType, enabled: bool) -> bool:
```
- **Args**:
  - `stream_id (str)`: 唯一的上下文标识符，例如一个会话ID。
  - `name (str)`: 组件名称。
  - `component_type (ComponentType)`: 组件类型。
  - `enabled (bool)`: `True` 为启用, `False` 为禁用。
- **Returns**: `bool` - 如果操作成功，则为 `True`。

---

## 3. 信息查询与报告 (Information Querying & Reporting)

这部分 API 用于获取关于插件和组件的详细信息、列表和统计数据。

### `get_system_report()`
生成一份详细的系统状态报告，包含已加载插件、失败插件和所有组件的全面信息。

```python
def get_system_report() -> dict[str, Any]:
```
- **Returns**: `dict[str, Any]` - 包含系统、插件和组件状态的详细报告字典。

### `get_plugin_details()`
获取单个插件的详细报告，包括其元数据和所有组件的信息。

```python
def get_plugin_details(plugin_name: str) -> dict[str, Any] | None:
```
- **Args**:
  - `plugin_name (str)`: 要查询的插件名称。
- **Returns**: `dict | None` - 包含插件详细信息的字典，如果插件未注册则返回 `None`。

### `list_plugins()`
根据指定的状态列出插件名称列表。

```python
def list_plugins(status: Literal["loaded", "registered", "failed"]) -> list[str]:
```
- **Args**:
  - `status (str)`: 插件状态，可选值为 `'loaded'`, `'registered'`, `'failed'`。
- **Returns**: `list[str]` - 对应状态的插件名称列表。
- **Raises**: `ValueError` - 如果传入了无效的状态字符串。

### `list_components()`
列出指定类型的所有组件的详细信息。

```python
def list_components(component_type: ComponentType, enabled_only: bool = True) -> list[dict[str, Any]]:
```
- **Args**:
  - `component_type (ComponentType)`: 要查询的组件类型。
  - `enabled_only (bool)`: 是否只返回已启用的组件。默认为 `True`。
- **Returns**: `list[dict[str, Any]]` - 一个包含组件信息字典的列表。

### `search_components_by_name()`
根据名称关键字搜索组件，支持模糊匹配和精确匹配。

```python
def search_components_by_name(
    name_keyword: str,
    component_type: ComponentType | None = None,
    case_sensitive: bool = False,
    exact_match: bool = False,
) -> list[dict[str, Any]]:
```
- **Args**:
  - `name_keyword (str)`: 用于搜索的名称关键字。
  - `component_type (ComponentType | None)`: 如果提供，则只在该类型中搜索。
  - `case_sensitive (bool)`: 是否进行大小写敏感的搜索。默认为 `False`。
  - `exact_match (bool)`: 是否进行精确匹配。默认为 `False`。
- **Returns**: `list[dict[str, Any]]` - 匹配的组件信息字典的列表。

### `get_component_info()`
获取任何一个已注册组件的详细信息对象 (`ComponentInfo`)。

```python
def get_component_info(name: str, component_type: ComponentType) -> ComponentInfo | None:
```
- **Args**:
  - `name (str)`: 组件的唯一名称。
  - `component_type (ComponentType)`: 组件的类型。
- **Returns**: `ComponentInfo | None` - 组件的完整信息对象，如果找不到则返回 `None`。

### `get_component_count()`
获取指定类型的已加载并启用的组件的总数。

```python
def get_component_count(component_type: ComponentType, stream_id: str | None = None) -> int:
```
- **Args**:
  - `component_type (ComponentType)`: 要查询的组件类型。
  - `stream_id (str | None)`: 可选的上下文ID。如果提供，将计入局部状态。
- **Returns**: `int` - 该类型下已启用的组件的数量。

---

## 4. 工具函数 (Utility Helpers)

这部分提供了一些轻量级的辅助函数，用于快速检查状态。

### `is_plugin_loaded()`
快速检查一个插件当前是否已成功加载。

```python
def is_plugin_loaded(plugin_name: str) -> bool:
```
- **Args**:
  - `plugin_name (str)`: 要检查的插件名称。
- **Returns**: `bool` - 如果插件已加载，则为 `True`，否则为 `False`。

### `get_component_plugin()`
查找一个特定组件属于哪个插件。

```python
def get_component_plugin(component_name: str, component_type: ComponentType) -> str | None:
```
- **Args**:
  - `component_name (str)`: 组件的名称。
  - `component_type (ComponentType)`: 组件的类型。
- **Returns**: `str | None` - 组件所属的插件名称，如果找不到组件则返回 `None`。