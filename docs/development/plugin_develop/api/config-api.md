# Config API

`src/app/plugin_system/api/config_api` 提供插件配置的加载、重载与查询能力。

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

## 核心函数

### `load_config(plugin_name: str, config_class: Type[BaseConfig], *, auto_generate=True, auto_update=True) -> BaseConfig`

加载插件配置。

**参数：**
- `plugin_name`: 插件名称
- `config_class`: 配置类（必须继承自 `BaseConfig`）
- `auto_generate`: 是否自动生成配置文件（默认 `True`）
- `auto_update`: 是否自动更新配置文件（默认 `True`）

**返回值：**
- 配置实例

**使用示例：**
```python
from src.core.components.base.config import BaseConfig, SectionBase, config_section
from pydantic import Field

class MyPluginConfig(BaseConfig):
    @config_section("my_plugin")
    class Settings(SectionBase):
        api_key: str = Field(..., description="API 密钥")
        timeout: int = Field(30, description="超时时间（秒）")

# 加载配置
config = load_config(
    plugin_name="my_plugin",
    config_class=MyPluginConfig,
)

# 访问配置
print(config.settings.api_key)
print(config.settings.timeout)
```

---

### `reload_config(plugin_name: str, config_class: Type[BaseConfig], *, auto_update=True) -> BaseConfig`

重新加载插件配置（从文件重新读取）。

**参数：**
- `plugin_name`: 插件名称
- `config_class`: 配置类
- `auto_update`: 是否自动更新配置文件（默认 `True`）

**返回值：**
- 新的配置实例

**使用示例：**
```python
# 重新加载配置
config = reload_config(
    plugin_name="my_plugin",
    config_class=MyPluginConfig,
)

print("配置已重新加载")
```

---

### `get_config(plugin_name: str) -> BaseConfig | None`

获取已加载的配置实例。

**参数：**
- `plugin_name`: 插件名称

**返回值：**
- 配置实例，未加载则返回 `None`

**使用示例：**
```python
# 获取已加载的配置
config = get_config("my_plugin")

if config:
    print(f"配置已加载: {config}")
else:
    print("配置未加载")
```

---

### `remove_config(plugin_name: str) -> bool`

移除指定插件的配置缓存。

**参数：**
- `plugin_name`: 插件名称

**返回值：**
- `True` 表示移除成功，`False` 表示配置不存在

**使用示例：**
```python
# 移除配置缓存
success = remove_config("my_plugin")

if success:
    print("配置缓存已移除")
else:
    print("配置不存在")
```

---

### `get_loaded_plugins() -> list[str]`

获取已加载配置的插件名称列表。

**返回值：**
```python
["my_plugin", "another_plugin", "third_plugin"]
```

**使用示例：**
```python
loaded_plugins = get_loaded_plugins()
print(f"已加载配置的插件: {', '.join(loaded_plugins)}")
```

---

### `initialize_all_configs() -> None`

初始化所有包含 Config 组件的插件配置。

**使用场景：**
- 系统启动时批量初始化
- 重置所有配置

**使用示例：**
```python
# 初始化所有配置
initialize_all_configs()
print("所有配置已初始化")
```

## 完整示例

### 示例 1：在插件中使用配置

```python
from src.core.components.base.plugin import BasePlugin
from src.core.components.base.config import BaseConfig, SectionBase, config_section
from src.app.plugin_system.api.config_api import load_config
from pydantic import Field

class MyPluginConfig(BaseConfig):
    @config_section("my_plugin")
    class Settings(SectionBase):
        """插件设置"""
        api_key: str = Field("", description="API 密钥")
        max_retries: int = Field(3, description="最大重试次数")
        timeout: float = Field(30.0, description="超时时间（秒）")
    
    @config_section("features")
    class Features(SectionBase):
        """功能开关"""
        enable_cache: bool = Field(True, description="启用缓存")
        enable_logging: bool = Field(True, description="启用日志")

class MyPlugin(BasePlugin):
    async def initialize(self):
        # 加载配置
        self.config = load_config(
            plugin_name=self.name,
            config_class=MyPluginConfig,
        )
        
        # 使用配置
        self.logger.info(f"API 密钥: {self.config.settings.api_key}")
        self.logger.info(f"超时时间: {self.config.settings.timeout}s")
        
        if self.config.features.enable_cache:
            self.logger.info("缓存已启用")
```

### 示例 2：配置热重载

```python
from src.core.components.base.command import BaseCommand
from src.app.plugin_system.api.config_api import (
    reload_config,
    get_config,
)

class ReloadConfigCommand(BaseCommand):
    async def execute(self, plugin_name: str = ""):
        # 如果未指定插件名，重载当前插件配置
        if not plugin_name:
            plugin_name = self.plugin.name
        
        # 获取原配置
        old_config = get_config(plugin_name)
        if not old_config:
            await self.send_text(f"插件 {plugin_name} 配置未加载")
            return
        
        # 重新加载配置
        new_config = reload_config(
            plugin_name=plugin_name,
            config_class=old_config.__class__,
        )
        
        await self.send_text(f"插件 {plugin_name} 配置已重新加载")
```

### 示例 3：配置管理命令

```python
from src.app.plugin_system.api.config_api import (
    get_loaded_plugins,
    get_config,
    remove_config,
)

class ConfigManagerCommand(BaseCommand):
    async def execute(self, action: str, plugin_name: str = ""):
        if action == "list":
            # 列出所有已加载配置的插件
            plugins = get_loaded_plugins()
            await self.send_text(
                f"已加载配置的插件:\n" + "\n".join(f"- {p}" for p in plugins)
            )
        
        elif action == "show":
            # 显示指定插件的配置
            config = get_config(plugin_name)
            if config:
                await self.send_text(f"配置:\n{config.model_dump_json(indent=2)}")
            else:
                await self.send_text(f"插件 {plugin_name} 配置未加载")
        
        elif action == "remove":
            # 移除配置缓存
            success = remove_config(plugin_name)
            if success:
                await self.send_text(f"插件 {plugin_name} 配置缓存已移除")
            else:
                await self.send_text(f"插件 {plugin_name} 配置不存在")
```

### 示例 4：配置文件位置

配置文件默认保存在 `config/plugins/<plugin_name>.toml`：

```toml
# config/plugins/my_plugin.toml

[my_plugin]
api_key = "your_api_key_here"
max_retries = 3
timeout = 30.0

[features]
enable_cache = true
enable_logging = true
```

## 配置系统最佳实践

### 1. 使用 config_section 装饰器

```python
from src.core.components.base.config import BaseConfig, SectionBase, config_section

class MyConfig(BaseConfig):
    @config_section("basic")
    class Basic(SectionBase):
        """基础配置"""
        pass
    
    @config_section("advanced")
    class Advanced(SectionBase):
        """高级配置"""
        pass
```

### 2. 提供默认值和描述

```python
from pydantic import Field

class Settings(SectionBase):
    api_key: str = Field("", description="API 密钥")
    timeout: int = Field(30, description="超时时间（秒）", ge=1, le=300)
```

### 3. 使用类型注解和验证

```python
from pydantic import Field, validator

class Settings(SectionBase):
    port: int = Field(8080, description="端口号", ge=1, le=65535)
    host: str = Field("0.0.0.0", description="监听地址")
    
    @validator("port")
    def validate_port(cls, v):
        if v < 1024:
            raise ValueError("端口号不建议小于 1024")
        return v
```

## 相关文档

- [Config 组件](../components/config.md) — Config 组件的详细说明
- [插件结构](../structure.md) — 插件配置文件组织
- [配置指南](/docs/guides/bot_config_guide) — 配置系统详解
