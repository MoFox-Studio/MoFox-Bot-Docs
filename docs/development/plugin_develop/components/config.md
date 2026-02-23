# Config — 配置组件

`BaseConfig` 管理插件的 TOML 配置文件，扩展自 kernel 的 `ConfigBase`（基于 Pydantic 实现）。

## 配置文件位置

框架自动在以下路径管理配置文件：

```
config/
└── plugins/
    └── {plugin_name}/
        └── {config_name}.toml    # 默认 config_name = "config"
```

初次运行时，若配置文件不存在，框架会自动生成包含所有默认值的配置文件。

## 类属性

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `config_name` | `str` | `"config"` | 配置文件名（不含 .toml）|
| `config_description` | `str` | `""` | 配置描述 |

## 核心装饰器

### `@config_section("section_name")`

将内嵌类声明为 TOML 配置节（`[section_name]`）。

### `Field(default=..., description="...")`

声明配置字段，描述会作为 TOML 注释自动写入配置文件。

## 完整示例

### 配置类定义（config.py）

```python
"""my_plugin 配置定义"""

from src.core.components.base.config import BaseConfig, config_section, Field, SectionBase


class MyPluginConfig(BaseConfig):
    """My Plugin 配置"""

    config_name = "config"
    config_description = "My Plugin 的配置文件"

    @config_section("bot")
    class BotSection(SectionBase):
        """Bot 基本信息"""
        nickname: str = Field(default="MoFox", description="Bot 昵称")
        bot_id: str = Field(default="0", description="Bot 的平台 ID")

    @config_section("server")
    class ServerSection(SectionBase):
        """平台服务器连接配置"""
        host: str = Field(default="127.0.0.1", description="服务器地址")
        port: int = Field(default=8080, description="服务器端口")
        access_token: str = Field(default="", description="访问令牌，留空表示不鉴权")

    @config_section("features")
    class FeaturesSection(SectionBase):
        """功能开关"""
        enable_emoji: bool = Field(default=True, description="是否启用表情包回复")
        max_history: int = Field(default=20, description="保留的历史消息数量")
        allowed_groups: list[str] = Field(
            default_factory=list,
            description="允许的群号列表，空列表表示允许所有群"
        )

    # 将每个 section 声明为字段
    bot: BotSection = Field(default_factory=BotSection)
    server: ServerSection = Field(default_factory=ServerSection)
    features: FeaturesSection = Field(default_factory=FeaturesSection)
```

### 自动生成的 TOML 文件

```toml
# My Plugin 的配置文件

[bot]
# Bot 昵称
nickname = "MoFox"
# Bot 的平台 ID
bot_id = "0"

[server]
# 服务器地址
host = "127.0.0.1"
# 服务器端口
port = 8080
# 访问令牌，留空表示不鉴权
access_token = ""

[features]
# 是否启用表情包回复
enable_emoji = true
# 保留的历史消息数量
max_history = 20
# 允许的群号列表，空列表表示允许所有群
allowed_groups = []
```

### 在 Plugin 中声明并使用配置

```python
from typing import cast

@register_plugin
class MyPlugin(BasePlugin):
    plugin_name = "my_plugin"
    
    # 声明配置类，框架会在插件实例化前自动加载
    configs = [MyPluginConfig]

    async def on_plugin_loaded(self) -> None:
        config = cast(MyPluginConfig, self.config)
        host = config.server.host
        port = config.server.port
        logger.info(f"已连接到服务器: {host}:{port}")
```

### 在组件中访问配置

```python
class MyAction(BaseAction):
    async def execute(self, content: str) -> tuple[bool, str]:
        # 通过 self.plugin 访问配置
        config = cast(MyPluginConfig, self.plugin.config)
        if not config.features.enable_emoji:
            return False, "表情包功能已禁用"
        # ...
```

## 类方法

### `get_default_path() -> Path | None`

获取默认配置文件路径：`config/plugins/{plugin_name}/{config_name}.toml`

### `generate_default(path=None) -> None`

手动生成默认配置文件，通常不需要手动调用（框架自动处理）。

### `load_for_plugin(plugin_name, *, auto_generate=True, auto_update=True) -> BaseConfig`

按插件名加载配置文件：

- 路径固定为 `config/plugins/{plugin_name}/{config_name}.toml`
- `auto_generate=True` 时，文件不存在会自动生成默认配置
- `auto_update=True` 时，会按最新 schema 自动补全新字段

```python
config = MyPluginConfig.load_for_plugin("my_plugin")
```

### `reload() -> BaseConfig`

从默认路径重新加载配置（依赖插件名已注入）。

```python
config = MyPluginConfig.reload()
```

::: tip 多配置文件
一个插件可以有多个配置类，在 `configs` 列表中按顺序声明。第一个配置类的实例通过 `self.config` 访问，其他配置类需要单独处理。
:::
