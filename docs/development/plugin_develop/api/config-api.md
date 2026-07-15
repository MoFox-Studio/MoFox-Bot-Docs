# Config API

`src.app.plugin_system.api.config_api` 提供插件配置的加载、重载和查询。

配置默认路径为 `config/plugins/{plugin_name}/{config_name}.toml`。

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

### `load_config(plugin_name: str, config_class: Type[BaseConfig], *, auto_generate: bool = True, auto_update: bool = True) -> BaseConfig`

加载插件配置。首次调用从 TOML 文件读取，后续返回缓存。

- `plugin_name`: 插件名称
- `config_class`: 配置类，必须是 [`BaseConfig`](../components/config.md) 子类
- `auto_generate`: 是否自动生成配置文件（默认 `True`）
- `auto_update`: 是否自动更新配置文件（默认 `True`）

```python
from my_plugin.config import MyPluginConfig

config = load_config("my_plugin", MyPluginConfig)
```

### `reload_config(plugin_name: str, config_class: Type[BaseConfig], *, auto_update: bool = True) -> BaseConfig`

强制重新加载插件配置（清除缓存后重新读取文件）。

- `auto_update`: 是否自动更新配置文件（默认 `True`）

### `get_config(plugin_name: str) -> BaseConfig | None`

获取已加载的配置实例，不触发加载。

### `remove_config(plugin_name: str) -> bool`

移除指定插件的配置缓存。

### `get_loaded_plugins() -> list[str]`

获取已加载配置的插件名称列表。

### `initialize_all_configs() -> None`

初始化所有包含 Config 组件的插件配置。一般在启动时调用一次。

::: warning 多配置类插件
当插件在 `configs` 中声明多个 [`BaseConfig`](../components/config.md) 子类时，`PluginManager` 在实例化插件时只会取**第一个**可加载配置注入到 `plugin.config`。如果需要多个配置对象，应通过 `load_config` 按类显式加载。
:::

## 相关文档

- [Config 组件](../components/config.md)
- [插件配置指南](../guide/plugin-authoring/6-config.md)
