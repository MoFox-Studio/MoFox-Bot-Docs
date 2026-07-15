# Plugin API

`src.app.plugin_system.api.plugin_api` 提供插件的加载、卸载、重载、查询和生命周期管理。

加载、卸载、重载操作为**异步函数**，调用时需 `await`；查询类函数为同步函数。

## 导入

```python
from src.app.plugin_system.api.plugin_api import (
    load_plugin_from_manifest,
    load_plugin,
    unload_plugin,
    reload_plugin,
    get_plugin,
    get_all_plugins,
    list_loaded_plugins,
    get_manifest,
    is_plugin_loaded,
    get_plugin_path,
    list_unloaded_plugins,
)
```

## 函数

### 加载与卸载

#### `load_plugin_from_manifest(plugin_path: str, manifest: PluginManifest) -> bool`

加载单个插件（manifest 由 loader 提供）。此函数为**异步函数**。

#### `load_plugin(plugin_path: str) -> bool`

按路径加载插件。此函数为**异步函数**。

#### `unload_plugin(plugin_name: str) -> bool`

卸载插件。此函数为**异步函数**。

#### `reload_plugin(plugin_name: str) -> bool`

重载插件。此函数为**异步函数**。

### 查询

#### `get_plugin(plugin_name: str) -> BasePlugin | None`

获取已加载插件实例。

```python
plugin = get_plugin("web_search")
if plugin:
    print(f"版本: {plugin.plugin_version}")
```

#### `get_all_plugins() -> dict[str, BasePlugin]`

获取所有已加载插件，返回名称到实例的映射。

#### `list_loaded_plugins() -> list[str]`

列出所有已加载插件的名称。

```python
for name in list_loaded_plugins():
    print(f"已加载: {name}")
```

#### `get_manifest(plugin_name: str) -> PluginManifest | None`

获取插件清单（`manifest.json` 解析结果）。

#### `is_plugin_loaded(plugin_name: str) -> bool`

检查插件是否已加载。

#### `get_plugin_path(plugin_name: str) -> str | None`

获取插件在磁盘上的路径。

#### `list_unloaded_plugins() -> dict[str, dict]`

列出 `plugins` 目录下所有未加载的插件。此函数为**异步函数**。

返回所有未加载插件的详细信息，包括未主动加载的插件和加载失败的插件。返回格式：

```python
{
    "plugin_name": {
        "name": str,
        "version": str,
        "description": str,
        "author": str,
        "path": str,
        "status": "not_loaded" | "failed",
        "reason": str | None,  # 失败原因（仅 status 为 failed 时）
    }
}
```

```python
unloaded = await list_unloaded_plugins()
for name, info in unloaded.items():
    print(f"{name}: {info['status']}")
    if info['reason']:
        print(f"  原因: {info['reason']}")
```

## 相关文档

- [Plugin 组件](../components/plugin.md)
- [插件编写指南](../guide/plugin-authoring/1-introduction.md)
