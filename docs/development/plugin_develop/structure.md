# 插件结构与最佳实践

一个规范的 Neo-MoFox 插件项目结构有助于提高可维护性和可扩展性。

## 推荐目录结构

以下是一个功能完整的插件的典型目录树：

```
plugins/
└── my_plugin/
    ├── manifest.json          # [必须] 插件元数据
    ├── plugin.py              # [必须] 插件入口，定义所有组件
    ├── config.py              # [推荐] 配置类定义
    ├── handlers/              # [推荐] 业务逻辑处理模块
    │   ├── __init__.py
    │   ├── message.py         # 消息处理相关逻辑
    │   └── api.py             # 外部 API 调用封装
    ├── models/                # [可选] 数据模型
    │   └── __init__.py
    └── src/                   # [可选] 复杂子模块
        └── ...
```

### 1. `manifest.json` — 插件元数据

必须存在，用于声明插件的：
- 基本信息（名称、版本、描述、作者）
- 依赖关系（依赖哪些插件或组件）
- 包含的组件列表（用于框架校验）
- 最低框架版本要求

详见 [manifest.json 格式](./manifest)。

### 2. `plugin.py` — 插件入口

这是插件被加载的起点，主要职责：
- 定义带有 `@register_plugin` 装饰器的 Plugin 根组件
- 在 Plugin 的 `get_components()` 中返回所有子组件类
- 定义所有 Action、Tool、Chatter 等子组件（可内聚，也可拆分到子模块后在此 import）

**最佳实践**：

```python
# 使用 @register_plugin 装饰器，组件拆分到子模块
from src.core.components.loader import register_plugin
from src.core.components.base import BasePlugin
from .handlers.message import MyAction  # 从子模块导入

@register_plugin
class MyPlugin(BasePlugin):
    plugin_name = "my_plugin"
    plugin_version = "1.0.0"

    def get_components(self) -> list[type]:
        return [MyAction]  # 集中声明所有组件
```

### 3. `config.py` — 配置定义

如果插件需要用户可配置的参数，建议独立到 `config.py`：

```python
# config.py
from src.core.components.base.config import BaseConfig, config_section, Field, SectionBase

class MyPluginConfig(BaseConfig):
    config_name = "config"
    config_description = "My Plugin 配置"

    @config_section("server")
    class ServerSection(SectionBase):
        host: str = Field(default="127.0.0.1", description="服务器地址")
        port: int = Field(default=8080, description="服务器端口")

    server: ServerSection = Field(default_factory=ServerSection)
```

配置文件将自动生成在 `config/plugins/my_plugin/config.toml`。

### 4. `handlers/` — 业务逻辑

将具体的业务逻辑从组件类中剥离到 `handlers/`，让 `plugin.py` 保持清晰：

```python
# handlers/message.py
from src.app.plugin_system.api.send_api import send_text

async def handle_greeting(stream_id: str, user_name: str) -> bool:
    return await send_text(f"你好，{user_name}！", stream_id)
```

```python
# plugin.py 中的 Action 调用 handler
class GreetAction(BaseAction):
    async def execute(self, user_name: str) -> tuple[bool, str]:
        from .handlers.message import handle_greeting
        success = await handle_greeting(self.chat_stream.stream_id, user_name)
        return success, "问候已发送"
```

## 命名约定

| 项目 | 规范 | 示例 |
| --- | --- | --- |
| 插件名称 | `snake_case` | `my_plugin` |
| 组件类名 | `PascalCase` | `SendGreetingAction` |
| 属性名 | `snake_case` | `action_name = "send_greeting"` |
| 配置节名 | `snake_case` | `@config_section("server_settings")` |

## 常见最佳实践

### 错误处理

在 `execute()` 方法中始终处理异常，避免异常冒泡导致整个对话中断：

```python
async def execute(self, query: str) -> tuple[bool, str]:
    try:
        result = await some_api_call(query)
        return True, result
    except Exception as e:
        logger.error(f"执行失败: {e}")
        return False, f"执行出错: {str(e)}"
```

### 日志使用

```python
from src.app.plugin_system.api.log_api import get_logger

logger = get_logger("my_plugin")  # 模块级创建，不要在函数内重复创建

class MyAction(BaseAction):
    async def execute(self, content: str) -> tuple[bool, str]:
        logger.info(f"执行动作: {content}")
        ...
```

### 避免循环导入

插件内部模块互相导入时，使用延迟导入：

```python
def get_some_manager():
    from src.core.managers import get_xxx_manager  # 函数内导入
    return get_xxx_manager()
```
