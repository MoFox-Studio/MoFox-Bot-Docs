# Config — 配置组件

`BaseConfig` 管理插件的 TOML 配置文件，扩展自 kernel 的 `ConfigBase`（基于 Pydantic 实现）。

::: tip WebUI 支持
配置系统支持 WebUI 可视化编辑器。使用 `Field` 定义配置项时，可指定 UI 属性（label, tag, placeholder 等），系统会自动生成 Schema 供 WebUI 渲染配置表单。
:::

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

## 核心装饰器与函数

### `@config_section(name, *, title=None, description=None, tag=None, order=0)`

将内嵌类声明为 TOML 配置节（`[section_name]`），并设置 WebUI 显示元数据。

**参数：**
- `name` (str)：TOML 节名（必需）
- `title` (str, 可选)：WebUI 显示标题（不指定则使用节名美化）
- `description` (str, 可选)：节描述（不指定则使用类 docstring 首行）
- `tag` (str, 可选)：预设标签，系统会自动映射到对应图标
  - 可选值：`"general"`, `"security"`, `"network"`, `"ai"`, `"database"`, `"user"`, `"timer"`, `"performance"`, `"text"`, `"list"`, `"advanced"`, `"debug"`, `"file"`, `"color"`, `"notification"`, `"plugin"`
- `order` (int)：显示顺序，数字越小越靠前（默认 0）

**示例：**
```python
@config_section(
    "advanced",
    title="高级设置",
    description="除非你知道自己在干什么，否则别动",
    tag="advanced",
    order=100
)
class AdvancedSection(SectionBase):
    debug_mode: bool = Field(default=False, description="调试模式")
```

### `Field(default=..., *, description="", ...)`

声明配置字段，支持 Pydantic 验证、WebUI 显示增强、条件显示等功能。

#### 核心参数

**Pydantic 原生验证参数：**
- `ge` (float | int)：最小值（>=）- 适用于 int/float
- `le` (float | int)：最大值（<=）- 适用于 int/float
- `gt` (float | int)：大于（>）
- `lt` (float | int)：小于（<）
- `min_length` (int)：最小长度 - 适用于 str/list
- `max_length` (int)：最大长度 - 适用于 str/list
- `pattern` (str)：正则表达式验证 - 适用于 str

**WebUI 显示增强参数：**
- `label` (str)：显示标签（不指定则使用字段名）
- `tag` (str)：预设标签（如 `"ai"`, `"security"`），系统会自动映射到对应图标
- `placeholder` (str)：输入框占位符文本
- `hint` (str)：帮助提示文本
- `order` (int)：显示顺序（数字越小越靠前）
- `hidden` (bool)：是否隐藏
- `disabled` (bool)：是否禁用（只读）

**输入控件类型：**
- `input_type` (str)：强制指定输入控件类型（不指定则自动推断）
  - `"text"`：单行文本
  - `"password"`：密码输入（遮罩）
  - `"textarea"`：多行文本
  - `"number"`：数字输入框
  - `"slider"`：滑块
  - `"switch"`：开关
  - `"select"`：下拉选择
  - `"list"`：列表编辑器
  - `"json"`：JSON 编辑器
  - `"color"`：颜色选择器
  - `"file"`：文件路径选择

**控件特定参数：**
- `rows` (int)：textarea 的行数（默认 5）
- `step` (float | int)：number/slider 的步进值（如 0.1）
- `choices` (list)：select 的选项列表

**列表配置：**
- `item_type` (str)：列表项类型（`"str"`, `"number"`, `"boolean"`, `"object"`）
- `item_fields` (dict)：当 `item_type="object"` 时，定义对象字段
- `min_items` (int)：最少列表项数
- `max_items` (int)：最多列表项数

**条件显示：**
- `depends_on` (str)：依赖的字段名（如 `"use_proxy"`）
- `depends_value` (Any)：依赖字段的期望值（如 `True`）

#### Field 示例

```python
# 自动高级示例：使用 WebUI 增强功能

```python
class AdvancedConfig(BaseConfig):
    config_name = "advanced"

    @config_section("ai", title="AI 配置", tag="ai", order=0)
    class AISection(SectionBase):
        """AI 模型配置"""
        
        # 滑块控件（自动推断）
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
    
    @config_section("proxy", title="代理设置", tag="network", order=10)
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

### 推断为 slider（因为有 ge/le）
temperature: float = Field(
    default=0.7,
    ge=0.0,
    le=2.0,
    step=0.1,
    description="生成温度",
    tag="performance"
)

# 强制使用 password 控件
api_key: str = Field(
    default="",
    description="API 密钥",
    input_type="password",
    placeholder="sk-xxxxxxxx",
    tag="security"
)

# 条件显示示例
use_proxy: bool = Field(
    default=False,
    description="是否使用代理"
)
proxy_url: str = Field(
    default="",
    description="代理地址",
    depends_on="use_proxy",
    depends_value=True,
    placeholder="http://127.0.0.1:7890"
)

# 字符串长度验证
username: str = Field(
    default="",
    min_length=3,
    max_length=20,
    pattern="^[a-zA-Z0-9_]+$",
    description="用户名（3-20个字符，仅允许字母数字下划线）"
)

# 列表编辑器
allowed_groups: list[str] = Field(
    default_factory=list,
    description="允许的群号列表",
    item_type="str",
    min_items=0,
    max_items=100
)
```

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
acc

**关于 `auto_update` 机制：**

当 `auto_update=True` 时，框架会将配置文件内容与模型定义的"签名"进行比对：
- 配置节/字段是否存在
- 注释文档（section docstring + Field.description）
- 字段类型（由类型注解推导）
- 默认值（由 Field.default 推导）

## 最佳实践

### 1. 使用类型注解和验证

```python
# ✅ 推荐：明确的类型和验证
port: int = Field(
    default=8080,
    ge=1,
    le=65535,
    description="服务器端口"
)

# ❌ 避免：缺少验证
port: int = Field(default=8080, description="端口")
```

### 2. 为敏感字段使用 password 控件

```python
# ✅ 推荐：使用 password 输入
api_key: str = Field(
    default="",
    input_type="password",
    description="API 密钥",
    tag="security"
)
```

### 3. 使用条件显示减少界面复杂度

```python
# ✅ 推荐：相关字段使用条件显示
enable_feature: bool = Field(default=False, description="启用功能")
feature_config: str = Field(
    default="",
    description="功能配置",
    depends_on="enable_feature",
    depends_value=True
)
```

### 4. 为数值字段设置合理的边界

```python
# ✅ 推荐：设置边界和步进
temperature: float = Field(
    default=0.7,
    ge=0.0,
    le=2.0,
    step=0.1,
    description="温度参数"
)
```

### 5. 使用 tag 提升用户体验

```python
# ✅ 推荐：使用合适的 tag
@config_section("security", tag="security")
class SecuritySection(SectionBase):
    """安全配置"""
    password: str = Field(
        default="",
        input_type="password",
        tag="security"
    )
```

## 常见问题

### Q: 如何迁移旧配置？

A: 启用 `auto_update=True`（默认开启），框架会自动保留用户数据并补全新字段：

```python
# 自动迁移（推荐）
config = MyPluginConfig.load_for_plugin("my_plugin", auto_update=True)
```

### Q: 如何让某个字段不显示在 WebUI？

A: 使用 `hidden=True`：

```python
internal_token: str = Field(
    default="",
    description="内部令牌",
    hidden=True
)
```

### Q: 如何创建只读字段？

A: 使用 `disabled=True`：

```python
version: str = Field(
    default="1.0.0",
    description="插件版本",
    disabled=True
)
```

### Q: Field 的 tag 和 config_section 的 tag 有什么区别？

A: 
- `config_section` 的 `tag` 用于整个配置节的图标和样式
- `Field` 的 `tag` 用于单个字段的图标提示

建议保持一致性，相同类型的配置使用相同的 tag。

::: tip 多配置文件
一个插件可以有多个配置类，在 `configs` 列表中按顺序声明。第一个配置类的实例通过 `self.config` 访问，其他配置类需要单独处理。
:::

::: warning 配置文件编码
所有 TOML 配置文件使用 UTF-8 编码。如果手动编辑配置文件，请确保编辑器使用 UTF-8 编码保存
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
