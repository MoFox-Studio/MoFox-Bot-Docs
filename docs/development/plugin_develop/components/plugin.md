# Plugin — 插件根组件

`BasePlugin` 是所有插件的根组件，作为其他组件的容器，同时提供插件元数据和生命周期钩子。

## 类属性

| 属性 | 类型 | 必须 | 说明 |
| --- | --- | --- | --- |
| `plugin_name` | `str` | ✅ | 插件唯一标识符（与 manifest.json 中 `name` 一致）|
| `plugin_description` | `str` | ❌ | 插件描述，默认 `"无描述"` |
| `plugin_version` | `str` | ❌ | 插件版本，默认 `"1.0.0"` |
| `configs` | `list[type[BaseConfig]]` | ❌ | 插件配置类列表，会在插件实例化前优先加载 |
| `dependent_components` | `list[str]` | ❌ | 预留字段（当前运行时未消费），请勿作为实际依赖声明入口 |

## 必须实现的方法

### `get_components() -> list[type]`

返回插件内所有子组件类的列表。框架通过此方法发现并注册所有子组件。

```python
def get_components(self) -> list[type]:
    return [MyAction, MyTool, MyChatter, MyCommand]
```

## 可选重写的生命周期钩子

### `on_plugin_loaded() -> None`

插件加载完成后调用。可用于初始化资源、订阅事件、启动后台任务等。

```python
async def on_plugin_loaded(self) -> None:
    logger.info(f"插件 {self.plugin_name} 已加载")
    # 初始化数据库连接、缓存等
```

### `on_plugin_unloaded() -> None`

插件卸载前调用。必须在此方法中清理所有资源。

```python
async def on_plugin_unloaded(self) -> None:
    # 关闭数据库连接、取消定时任务等
    await self.cleanup_resources()
```

## 完整示例

```python
"""my_plugin — 功能完整的插件示例"""
from typing import cast

from src.core.components.base import BasePlugin
from src.core.components.loader import register_plugin
from src.app.plugin_system.api.log_api import get_logger

from .config import MyPluginConfig
from .actions import SendGreetingAction, SendImageAction
from .tools import WeatherTool
from .chatter import MyChatter
from .commands import HelpCommand
from .handlers import WelcomeEventHandler

logger = get_logger("my_plugin")


@register_plugin
class MyPlugin(BasePlugin):
    """我的插件 — 一个功能完整的示例插件"""

    plugin_name = "my_plugin"
    plugin_description = "演示插件，包含各种组件类型"
    plugin_version = "1.2.0"

    # 声明配置类（会在插件实例化前自动加载）
    configs = [MyPluginConfig]

    def get_components(self) -> list[type]:
        return [
            # Actions
            SendGreetingAction,
            SendImageAction,
            # Tools
            WeatherTool,
            # Chatter
            MyChatter,
            # Commands
            HelpCommand,
            # Event Handlers
            WelcomeEventHandler,
        ]

    async def on_plugin_loaded(self) -> None:
        config = cast(MyPluginConfig, self.config)
        logger.info(f"插件加载完成，服务器地址: {config.server.host}")

    async def on_plugin_unloaded(self) -> None:
        logger.info("插件正在卸载，清理资源...")
```

## 访问配置

```python
from typing import cast

async def on_plugin_loaded(self) -> None:
    # self.config 是 configs 列表中第一个配置类的实例
    config = cast(MyPluginConfig, self.config)
    host = config.server.host
```

::: tip 注意
`plugin_name` 必须与 `manifest.json` 中的 `name` 字段完全一致，且在整个框架中唯一。
:::

::: warning 关于依赖声明
当前版本中，`dependent_components` 只是类属性预留，运行时不会据此做依赖解析或加载顺序控制。

请使用以下两种“真实生效”的依赖入口：

- `manifest.json -> dependencies.plugins / dependencies.components`
- 组件类上的 `dependencies`（如 Action/Tool/Service 等）
:::

::: warning 关于 `_plugin_` 属性
组件类的 `_plugin_` 属性（如 `MyAction._plugin_`）由框架在组件注册时自动注入，开发者无需手动设置。
:::
