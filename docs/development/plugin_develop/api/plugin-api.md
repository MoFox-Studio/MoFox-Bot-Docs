# Plugin API

`src.app.plugin_system.api.plugin_api` 提供插件的加载、查询和生命周期管理。

## 导入

```python
from src.app.plugin_system.api.plugin_api import (
    get_plugin,
    get_all_plugins,
    list_loaded_plugins,
    get_manifest,
    is_plugin_loaded,
    get_plugin_path,
)
```

## 函数

### `get_plugin(plugin_name: str) -> BasePlugin | None`

获取已加载插件实例。

```python
plugin = get_plugin("web_search")
if plugin:
    print(f"版本: {plugin.plugin_version}")
```

### `get_all_plugins() -> dict[str, BasePlugin]`

获取所有已加载插件，返回名称到实例的映射。

### `list_loaded_plugins() -> list[str]`

列出所有已加载插件的名称。

```python
for name in list_loaded_plugins():
    print(f"已加载: {name}")
```

### `get_manifest(plugin_name: str) -> PluginManifest | None`

获取插件清单（manifest.json 解析结果）。

### `is_plugin_loaded(plugin_name: str) -> bool`

检查插件是否已加载。

### `get_plugin_path(plugin_name: str) -> str | None`

获取插件在磁盘上的路径。

## 相关文档

- [Plugin 组件](../components/plugin.md)
- [插件编写指南](../guide/plugin-authoring/1-introduction.md)
