# MoFox-Core插件开发文档

> 欢迎来到MoFox-Core插件系统开发文档！这里是你开始插件开发旅程的最佳起点。

## 新手入门

- [📖 快速开始指南](quick-start.md) - 快速创建你的第一个插件

## 组件功能详解

- [🧱 Action组件详解](action-components.md) - 掌握最核心的Action组件
- [💻 Command组件详解](PLUS_COMMAND_GUIDE.md) - 学习直接响应命令的组件
- [🔧 Tool组件详解](tool_guide.md) - 了解如何扩展信息获取能力
- [🧬 插件元数据系统指南](metadata-guide.md) - 学习如何定义插件的元数据
- [⚙️ 配置文件系统指南](configuration-guide.md) - 学会使用自动生成的插件配置文件
- [🔑 权限系统使用指南](PERMISSION_GUIDE.md) - 学习如何使用声明式API来注册插件的权限节点

Command vs Action 选择指南

1. 使用Command的场景

- ✅ 用户需要明确调用特定功能
- ✅ 需要精确的参数控制
- ✅ 管理和配置操作
- ✅ 查询和信息显示
- ✅ 系统维护命令

2. 使用Action的场景

- ✅ 增强麦麦的智能行为
- ✅ 根据上下文自动触发
- ✅ 情绪和表情表达
- ✅ 智能建议和帮助
- ✅ 随机化的互动


## API浏览

### 消息发送与处理API
- [📤 发送API](api/send-api.md) - 各种类型消息发送接口
- [消息API](api/message-api.md) - 消息获取，消息构建，消息查询接口
- [聊天流API](api/chat-api.md) - 聊天流管理和查询接口
- [适配器命令API](api/adapter-command-api.md) - 一个向适配器对应的平台发送适配器不直接支持命令的接口

### AI与生成API  
- [LLM API](api/llm-api.md) - 大语言模型交互接口，可以使用内置LLM生成内容
- [✨ 回复生成器API](api/generator-api.md) - 智能回复生成接口，可以使用内置风格化生成器

### 表情包API
- [😊 表情包API](api/emoji-api.md) - 表情包选择和管理接口

### 关系系统API
- [人物信息API](api/person-api.md) - 用户信息，处理麦麦认识的人和关系的接口

### 数据与配置API
- [🗄️ 数据库API](api/database-api.md) - 数据库操作接口
- [⚙️ 配置API](api/config-api.md) - 配置读取和用户信息接口

### 插件和组件管理API
- [🔌 插件API](api/plugin-manage-api.md) - 插件加载和管理接口
- [🧩 组件API](api/component-manage-api.md) - 组件注册和管理接口

### 日志API
- [📜 日志API](api/logging-api.md) - logger实例获取接口
### 工具API
- [🔧 工具API](api/tool-api.md) - tool获取接口
### 本地储存API
- [🗄️ 本地储存API](api/storage-api.md) - 本地数据存储接口

## 支持

> 如果你在文档中发现错误或需要补充，请：

1. 检查最新的文档版本
2. 查看相关示例代码
3. 参考其他类似插件
4. 提交文档仓库issue

## 一个方便的小设计

我们在`__init__.py`中定义了一个`__all__`变量，包含了所有需要导出的类和函数。
这样在其他地方导入时，可以直接使用 `from src.plugin_system import *` 来导入所有插件相关的类和函数。
或者你可以直接使用 `from src.plugin_system import BasePlugin, register_plugin, ComponentInfo` 之类的方式来导入你需要的部分。

### 另一个“隐藏”的设计：`on_plugin_loaded` 钩子

除了常规的事件，插件主类 (`BasePlugin`) 还可以实现一个特殊的钩子方法：`on_plugin_loaded`。

```python
from src.plugin_system import BasePlugin, register_plugin

@register_plugin
class MyAwesomePlugin(BasePlugin):
    plugin_name = "my_awesome_plugin"
    
    async def on_plugin_loaded(self):
        # 在这里编写你的代码
        print(f"插件 {self.plugin_name} 的所有组件都已加载完毕！")
        # 例如，可以在这里执行一些依赖其他插件组件的初始化操作
```

- **执行时机**: 这个方法会在**所有插件的所有组件（Action, Command, Tool, Handler）都加载并注册完毕后**被调用。
- **使用场景**: 它为你提供了一个“总览全局”的机会。当你需要执行一些依赖其他插件、或者需要确保所有功能都已就绪的初始化操作时，这个钩子非常有用。

> **⚠️ 警告**: 请谨慎使用 `on_plugin_loaded`。滥用它很容易导致插件之间产生不必要的强耦合，使得代码难以维护和理解。**只有在你确实没有其他更好的办法时，才应该考虑使用它。**,如果可能的话，尽量通过事件系统等更优雅的方式来实现你的需求。