# Config 配置组件

## 概述

`BaseConfig` 是 MoFox 插件的配置管理基类，用于定义和管理插件的 TOML 配置文件。它基于 Pydantic 实现，提供类型验证、默认值管理和自动配置文件生成功能。

::: tip WebUI 可视化编辑支持
配置系统支持 **Neo-MoFox-WebUI** 等可视化编辑器。通过在 `Field` 中指定 UI 属性（如 `label`、`tag`、`placeholder`），系统会自动生成配置表单界面，让用户无需手动编辑 TOML 文件。
:::

## 配置文件位置

框架自动管理配置文件，存放在以下路径：

```
config/
└── plugins/
    └── {plugin_name}/          # 插件名称
        └── {config_name}.toml  # 配置文件（默认为 config.toml）
```

**自动生成规则：**
- 插件首次加载时，若配置文件不存在，框架会自动生成包含所有默认值的配置文件
- 配置文件采用 UTF-8 编码
- 支持多配置文件（通过 `config_name` 区分）

## 基础配置类

### 类属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `config_name` | `str` | `"config"` | 配置文件名（不含 .toml 扩展名） |
| `config_description` | `str` | `""` | 配置描述（生成为 TOML 文件顶部注释） |

### 基本示例

```python
from src.core.components.base.config import BaseConfig, Field

class MyPluginConfig(BaseConfig):
    """我的插件配置"""
    
    config_name = "config"
    config_description = "My Plugin 的配置文件"
    
    # 简单的顶层字段
    enabled: bool = Field(default=True, description="是否启用插件")
    timeout: int = Field(default=30, description="请求超时时间（秒）")
```

生成的 TOML 文件：

```toml
# My Plugin 的配置文件

# 是否启用插件
enabled = true
# 请求超时时间（秒）
timeout = 30
```

## 配置节（Section）

使用 `@config_section` 装饰器将内嵌类声明为 TOML 配置节，支持分层组织配置。

### `@config_section` 装饰器

```python
@config_section(
    name: str,           # 必需，TOML 节名
    title: str = None,   # 可选，WebUI 显示标题
    description: str = None,  # 可选，节描述
    tag: str = None,     # 可选，预设标签（用于 WebUI 图标）
    order: int = 0       # 可选，显示顺序
)
```

**参数说明：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `name` | `str` | TOML 节名（如 `"server"` 对应 `[server]`） |
| `title` | `str` | WebUI 显示标题（不指定则使用节名） |
| `description` | `str` | 节描述（不指定则使用类的 docstring 首行） |
| `tag` | `str` | 预设标签，WebUI 会自动映射图标 |
| `order` | `int` | 显示顺序，数字越小越靠前 |

**可用的 tag 标签：**

`"general"`, `"security"`, `"network"`, `"ai"`, `"database"`, `"user"`, `"timer"`, `"performance"`, `"text"`, `"list"`, `"advanced"`, `"debug"`, `"file"`, `"color"`, `"notification"`, `"plugin"`

### 配置节示例

```python
from src.core.components.base.config import (
    BaseConfig,
    SectionBase,
    config_section,
    Field
)

class MyPluginConfig(BaseConfig):
    config_name = "config"
    
    @config_section("server", title="服务器配置", tag="network", order=0)
    class ServerSection(SectionBase):
        """服务器连接配置"""
        host: str = Field(default="127.0.0.1", description="服务器地址")
        port: int = Field(default=8080, ge=1, le=65535, description="端口")
    
    @config_section("features", title="功能开关", tag="general", order=10)
    class FeaturesSection(SectionBase):
        """功能开关配置"""
        enable_emoji: bool = Field(default=True, description="启用表情包回复")
    
    # 必须声明为字段
    server: ServerSection = Field(default_factory=ServerSection)
    features: FeaturesSection = Field(default_factory=FeaturesSection)
```

生成的 TOML 文件：

```toml
[server]
# 服务器地址
host = "127.0.0.1"
# 端口
port = 8080

[features]
# 启用表情包回复
enable_emoji = true
```

## Field 字段定义

`Field` 用于定义配置项，支持类型验证、默认值、WebUI 增强等功能。

### 核心参数

#### 1. Pydantic 验证参数

| 参数 | 适用类型 | 说明 |
|------|---------|------|
| `default` | 所有类型 | 默认值（必需） |
| `description` | 所有类型 | 字段描述（生成为注释） |
| `ge` | int/float | 大于等于（>=） |
| `le` | int/float | 小于等于（<=） |
| `gt` | int/float | 大于（>） |
| `lt` | int/float | 小于（<） |
| `min_length` | str/list | 最小长度 |
| `max_length` | str/list | 最大长度 |
| `pattern` | str | 正则表达式验证 |

#### 2. WebUI 显示增强参数

::: warning 依赖 WebUI
以下参数仅在使用 Neo-MoFox-WebUI 或其他支持的可视化界面时生效。如果仅使用 TOML 文件配置，这些参数不会影响功能。
:::

| 参数 | 说明 |
|------|------|
| `label` | 显示标签（不指定则使用字段名） |
| `tag` | 预设标签（自动映射图标） |
| `placeholder` | 输入框占位符 |
| `hint` | 帮助提示文本 |
| `order` | 显示顺序 |
| `hidden` | 是否隐藏 |
| `disabled` | 是否只读 |

#### 3. 输入控件类型

通过 `input_type` 参数强制指定 WebUI 输入控件类型（不指定则自动推断）：

| 控件类型 | 说明 | 适用场景 |
|---------|------|---------|
| `"text"` | 单行文本 | 普通字符串 |
| `"password"` | 密码输入（遮罩） | API 密钥、令牌 |
| `"textarea"` | 多行文本 | 长文本、描述 |
| `"number"` | 数字输入框 | 整数、浮点数 |
| `"slider"` | 滑块 | 有明确范围的数值 |
| `"switch"` | 开关 | 布尔值 |
| `"select"` | 下拉选择 | 枚举值 |
| `"list"` | 列表编辑器 | 字符串/数字列表 |
| `"json"` | JSON 编辑器 | 复杂对象 |
| `"color"` | 颜色选择器 | 颜色值 |
| `"file"` | 文件路径选择 | 文件路径 |

**自动推断规则：**

当不指定 `input_type` 时，系统根据以下规则自动推断控件类型：

| 条件 | 自动推断为 | 说明 |
|------|----------|------|
| 类型为 `bool` | `switch` | 布尔值自动显示为开关 |
| 类型为 `list` | `list` | 列表自动显示为列表编辑器 |
| 类型为 `dict` | `json` | 字典/对象自动显示为 JSON 编辑器 |
| 有 `choices` 参数 | `select` | 有选项列表时自动显示为下拉选择 |
| int/float 且有 `ge` 和 `le` | `slider` | 有明确数值范围时自动显示为滑块 |
| int/float 但无范围 | `number` | 无范围的数值显示为数字输入框 |
| `str` 类型 | `text` | 字符串默认显示为单行文本 |

**示例：**

```python
# 自动推断为 switch
enabled: bool = Field(default=True, description="启用功能")

# 自动推断为 slider（因为有 ge 和 le）
temperature: float = Field(
    default=0.7,
    ge=0.0,
    le=2.0,
    description="温度参数"
)

# 自动推断为 number（无范围限制）
timeout: int = Field(
    default=30,
    description="超时时间（秒）"
)

# 自动推断为 select（因为有 choices）
level: str = Field(
    default="INFO",
    choices=["DEBUG", "INFO", "WARNING", "ERROR"],
    description="日志级别"
)

# 自动推断为 list
tags: list[str] = Field(
    default_factory=list,
    description="标签列表"
)

# 自动推断为 text
name: str = Field(
    default="",
    description="名称"
)

# 强制覆盖：显式指定为 password（覆盖默认的 text）
api_key: str = Field(
    default="",
    input_type="password",  # 必须显式指定，否则会推断为 text
    description="API 密钥"
)

# 强制覆盖：显式指定为 textarea（覆盖默认的 text）
content: str = Field(
    default="",
    input_type="textarea",  # 必须显式指定，否则会推断为 text
    rows=10,
    description="长文本内容"
)
```

#### 4. 控件特定参数

不同控件类型支持的额外参数：

| 参数 | 适用控件 | 类型 | 说明 |
|------|---------|------|------|
| `choices` | `select` | `list` | 下拉选择的选项列表 |
| `rows` | `textarea` | `int` | 多行文本框的行数（默认 5） |
| `step` | `number`, `slider` | `float/int` | 数值步进值（如 0.1, 1, 10） |

**示例：**

```python
# select 控件必须指定 choices
model: str = Field(
    default="gpt-4",
    input_type="select",
    choices=["gpt-4", "gpt-3.5-turbo", "claude-3-opus"],
    description="选择模型"
)

# textarea 控件可指定行数
description: str = Field(
    default="",
    input_type="textarea",
    rows=10,
    description="详细描述"
)

# slider 控件可指定步进
volume: float = Field(
    default=0.5,
    ge=0.0,
    le=1.0,
    input_type="slider",
    step=0.01,
    description="音量"
)
```

#### 5. 列表配置

当字段类型为 `list` 时的额外参数：

| 参数 | 类型 | 说明 |
|------|------|------|
| `item_type` | `str` | 列表项类型：`"str"`, `"number"`, `"boolean"`, `"object"` |
| `item_fields` | `dict` | 当 `item_type="object"` 时，定义对象的字段结构 |
| `min_items` | `int` | 最少列表项数 |
| `max_items` | `int` | 最多列表项数 |

**示例：**

```python
# 简单字符串列表
allowed_users: list[str] = Field(
    default_factory=list,
    description="允许的用户列表",
    item_type="str",
    min_items=1,
    max_items=50
)

# 数字列表
port_list: list[int] = Field(
    default_factory=list,
    description="监听端口列表",
    item_type="number"
)

# 对象列表（高级用法）
servers: list[dict] = Field(
    default_factory=list,
    description="服务器列表",
    item_type="object",
    item_fields={
        "host": {"type": "string", "label": "主机地址"},
        "port": {"type": "number", "label": "端口"}
    }
)
```

#### 6. 条件显示

实现字段的动态显示/隐藏：

| 参数 | 说明 |
|------|------|
| `depends_on` | 依赖的字段名 |
| `depends_value` | 依赖字段的期望值 |

**示例：**

```python
# 只有启用代理时才显示代理地址
use_proxy: bool = Field(default=False, description="启用代理")

proxy_url: str = Field(
    default="",
    description="代理地址",
    depends_on="use_proxy",
    depends_value=True  # 当 use_proxy 为 True 时才显示
)

proxy_port: int = Field(
    default=7890,
    description="代理端口",
    depends_on="use_proxy",
    depends_value=True
)
```

### Field 示例

```python
from src.core.components.base.config import BaseConfig, config_section, Field, SectionBase

class AdvancedConfig(BaseConfig):
    config_name = "advanced"
    
    @config_section("ai", title="AI 配置", tag="ai")
    class AISection(SectionBase):
        """AI 模型配置"""
        
        # 滑块控件（自动推断，因为有 ge/le）
        temperature: float = Field(
            default=0.7,
            ge=0.0,
            le=2.0,
            step=0.1,
            description="生成温度：控制输出随机性",
            hint="值越高输出越随机，越低越确定",
            tag="performance"
        )
        
        # 密码输入
        api_key: str = Field(
            default="",
            description="API 密钥",
            input_type="password",
            placeholder="sk-xxxxxxxxxxxxxxxx",
            tag="security"
        )
        
        # 下拉选择
        model: str = Field(
            default="gpt-4",
            description="模型名称",
            input_type="select",
            choices=["gpt-4", "gpt-3.5-turbo", "claude-3-opus"],
            tag="ai"
        )
        
        # 多行文本
        system_prompt: str = Field(
            default="",
            description="系统提示词",
            input_type="textarea",
            rows=5,
            placeholder="输入系统提示词...",
            tag="text"
        )
    
    @config_section("proxy", title="代理设置", tag="network")
    class ProxySection(SectionBase):
        """网络代理配置"""
        
        # 条件显示：只有启用代理时才显示地址字段
        enabled: bool = Field(
            default=False,
            description="启用代理",
            label="使用代理"
        )
        
        url: str = Field(
            default="",
            description="代理地址",
            placeholder="http://127.0.0.1:7890",
            depends_on="enabled",
            depends_value=True
        )
    
    ai: AISection = Field(default_factory=AISection)
    proxy: ProxySection = Field(default_factory=ProxySection)
```

## 完整示例

### 配置类定义

```python
"""my_plugin 配置定义"""

from src.core.components.base.config import (
    BaseConfig,
    SectionBase,
    config_section,
    Field
)

class MyPluginConfig(BaseConfig):
    """My Plugin 配置"""
    
    config_name = "config"
    config_description = "My Plugin 的配置文件"
    
    @config_section("bot", title="Bot 信息", tag="general", order=0)
    class BotSection(SectionBase):
        """Bot 基本信息"""
        nickname: str = Field(
            default="MoFox",
            description="Bot 昵称",
            label="昵称"
        )
        bot_id: str = Field(
            default="0",
            description="Bot 的平台 ID",
            label="Bot ID"
        )
    
    @config_section("server", title="服务器配置", tag="network", order=10)
    class ServerSection(SectionBase):
        """平台服务器连接配置"""
        host: str = Field(
            default="127.0.0.1",
            description="服务器地址",
            placeholder="127.0.0.1"
        )
        port: int = Field(
            default=8080,
            ge=1,
            le=65535,
            description="服务器端口"
        )
        access_token: str = Field(
            default="",
            description="访问令牌，留空表示不鉴权",
            input_type="password",
            placeholder="留空表示不鉴权",
            tag="security"
        )
    
    @config_section("features", title="功能开关", tag="general", order=20)
    class FeaturesSection(SectionBase):
        """功能开关"""
        enable_emoji: bool = Field(
            default=True,
            description="是否启用表情包回复",
            label="启用表情包"
        )
        max_history: int = Field(
            default=20,
            ge=1,
            le=100,
            description="保留的历史消息数量"
        )
        allowed_groups: list[str] = Field(
            default_factory=list,
            description="允许的群号列表，空列表表示允许所有群",
            item_type="str",
            label="允许的群"
        )
    
    # 声明配置节字段
    bot: BotSection = Field(default_factory=BotSection)
    server: ServerSection = Field(default_factory=ServerSection)
    features: FeaturesSection = Field(default_factory=FeaturesSection)
```

### 在插件中使用

```python
from typing import cast
from src.core.components.base.plugin import BasePlugin, register_plugin
from .config import MyPluginConfig

@register_plugin
class MyPlugin(BasePlugin):
    plugin_name = "my_plugin"
    
    # 声明配置类（框架会自动加载）
    configs = [MyPluginConfig]
    
    async def on_plugin_loaded(self) -> None:
        """插件加载时的回调"""
        # 访问配置
        config = cast(MyPluginConfig, self.config)
        
        host = config.server.host
        port = config.server.port
        
        self.logger.info(f"服务器地址: {host}:{port}")
        self.logger.info(f"Bot 昵称: {config.bot.nickname}")
```

### 在组件中访问配置

```python
from src.core.components.base.action import BaseAction

class MyAction(BaseAction):
    async def execute(self, content: str) -> tuple[bool, str]:
        # 通过 self.plugin 访问配置
        config = cast(MyPluginConfig, self.plugin.config)
        
        if not config.features.enable_emoji:
            return False, "表情包功能已禁用"
        
        # 使用配置...
        return True, "执行成功"
```

## 类方法

### `load_for_plugin(plugin_name, *, auto_generate=True, auto_update=True)`

按插件名加载配置文件。

**参数：**
- `plugin_name` (str)：插件名称
- `auto_generate` (bool)：文件不存在时是否自动生成（默认 `True`）
- `auto_update` (bool)：是否自动补全新字段（默认 `True`）

**返回：** 配置实例

```python
config = MyPluginConfig.load_for_plugin("my_plugin")
```

### `reload()`

从默认路径重新加载配置（依赖插件名已注入）。

```python
config = MyPluginConfig.reload()
```

### `get_default_path()`

获取默认配置文件路径。

```python
path = MyPluginConfig.get_default_path()
# 返回: config/plugins/{plugin_name}/{config_name}.toml
```

### `generate_default(path=None)`

手动生成默认配置文件（通常由框架自动调用）。

```python
MyPluginConfig.generate_default()
```

## 最佳实践

### ✅ 1. 使用类型注解和验证

```python
# 推荐：明确的类型和验证
port: int = Field(
    default=8080,
    ge=1,
    le=65535,
    description="服务器端口"
)

# 避免：缺少验证
port: int = Field(default=8080, description="端口")
```

### ✅ 2. 为敏感字段使用 password 控件

```python
# 推荐：使用 password 输入
api_key: str = Field(
    default="",
    input_type="password",
    description="API 密钥",
    tag="security"
)
```

### ✅ 3. 使用条件显示减少界面复杂度

```python
# 推荐：相关字段使用条件显示
enable_feature: bool = Field(default=False, description="启用功能")

feature_config: str = Field(
    default="",
    description="功能配置",
    depends_on="enable_feature",
    depends_value=True
)
```

### ✅ 4. 为数值字段设置合理的边界

```python
# 推荐：设置边界和步进
temperature: float = Field(
    default=0.7,
    ge=0.0,
    le=2.0,
    step=0.1,
    description="温度参数"
)
```

### ✅ 5. 使用 tag 提升用户体验

```python
# 推荐：使用合适的 tag
@config_section("security", tag="security")
class SecuritySection(SectionBase):
    """安全配置"""
    password: str = Field(
        default="",
        input_type="password",
        tag="security"
    )
```

### ✅ 6. 为列表字段指定 item_type

```python
# 推荐：明确列表项类型
allowed_groups: list[str] = Field(
    default_factory=list,
    description="允许的群号列表",
    item_type="str",
    min_items=0,
    max_items=100
)
```

## 常见问题

### Q: 如何迁移旧配置？

**A:** 启用 `auto_update=True`（默认开启），框架会自动保留用户数据并补全新字段：

```python
# 自动迁移（推荐）
config = MyPluginConfig.load_for_plugin("my_plugin", auto_update=True)
```

### Q: 如何让某个字段不显示在 WebUI？

**A:** 使用 `hidden=True`：

```python
internal_token: str = Field(
    default="",
    description="内部令牌",
    hidden=True
)
```

### Q: 如何创建只读字段？

**A:** 使用 `disabled=True`：

```python
version: str = Field(
    default="1.0.0",
    description="插件版本",
    disabled=True
)
```

### Q: Field 的 tag 和 config_section 的 tag 有什么区别？

**A:** 
- `config_section` 的 `tag`：用于整个配置节的图标和样式
- `Field` 的 `tag`：用于单个字段的图标提示

建议保持一致性，相同类型的配置使用相同的 tag。

### Q: 一个插件可以有多个配置文件吗？

**A:** 可以。在插件的 `configs` 列表中按顺序声明多个配置类：

```python
@register_plugin
class MyPlugin(BasePlugin):
    configs = [MainConfig, FeatureConfig, AdvancedConfig]
    
    async def on_plugin_loaded(self) -> None:
        # 第一个配置类通过 self.config 访问
        main_config = cast(MainConfig, self.config)
        
        # 其他配置类需要单独加载
        feature_config = FeatureConfig.load_for_plugin(self.plugin_name)
```

### Q: WebUI 相关的参数不起作用怎么办？

**A:** WebUI 相关参数（如 `label`、`tag`、`placeholder`、`input_type` 等）仅在使用 Neo-MoFox-WebUI 或其他支持的可视化界面时生效。如果仅通过 TOML 文件配置，这些参数不会影响功能，但建议保留以便将来使用 WebUI。

## 注意事项

::: warning 配置文件编码
所有 TOML 配置文件使用 **UTF-8 编码**。如果手动编辑配置文件，请确保编辑器使用 UTF-8 编码保存。
:::

::: warning WebUI 依赖
本文档中提到的 WebUI 相关功能（如 `label`、`tag`、`placeholder`、`input_type` 等）需要配合 **Neo-MoFox-WebUI** 或其他支持的可视化界面使用。如果仅使用 TOML 文件配置，这些参数不会影响功能。
:::

::: tip 多配置文件
一个插件可以有多个配置类，在 `configs` 列表中按顺序声明。第一个配置类的实例通过 `self.config` 访问，其他配置类需要单独加载。
:::
