# Config API

`src.app.plugin_system.api.config_api` 提供插件配置的加载、重载和查询。

## 导入

```python
from src.app.plugin_system.api.config_api import (
    load_config,
    reload_config,
    get_config,
    remove_config,
    get_loaded_plugins,
    initialize_all_configs,
)
```

## 函数

### `load_config(plugin_name: str, config_class: Type[BaseConfig]) -> BaseConfig`

加载插件配置。首次调用从 TOML 文件读取，后续返回缓存。

```python
from my_plugin.config import MyPluginConfig

config = load_config("my_plugin", MyPluginConfig)
```

### `reload_config(plugin_name: str, config_class: Type[BaseConfig]) -> BaseConfig`

强制重新加载插件配置（清除缓存后重新读取文件）。

### `get_config(plugin_name: str) -> BaseConfig | None`

获取已加载的配置实例，不触发加载。

### `remove_config(plugin_name: str) -> bool`

移除指定插件的配置缓存。

### `get_loaded_plugins() -> list[str]`

获取已加载配置的插件名称列表。

### `initialize_all_configs() -> None`

初始化所有包含 Config 组件的插件配置。一般在启动时调用一次。

## 相关文档

- [Config 组件](../components/config.md)
- [插件配置指南](../guide/plugin-authoring/6-config.md)
