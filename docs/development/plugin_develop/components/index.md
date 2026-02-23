# 组件总览

Neo-MoFox 插件系统提供了 **11 种组件类型**，每种组件有明确的职责边界。本文帮助你快速了解各组件的适用场景，选择合适的组件类型。

## 组件速览

```
插件（Plugin）
  ├── 通信层
  │   └── Adapter        — 与外部平台通信（接收/发送消息）
  ├── 对话层
  │   ├── Chatter        — AI 对话核心，编排整个对话流程
  │   ├── Action         — LLM 调用的"响应动作"（如：发消息）
  │   ├── Tool           — LLM 调用的"查询工具"（如：计算器）
  │   └── Collection     — Action/Tool 的分组容器
  ├── 命令层
  │   └── Command        — 命令行式交互（如：/help, /mute）
  ├── 事件层
  │   └── EventHandler   — 订阅系统事件，执行副作用
  ├── 服务层
  │   └── Service        — 暴露功能供其他插件调用
  ├── 接口层
  │   └── Router         — HTTP API 端点（FastAPI）
  └── 配置层
      └── Config         — 插件配置（TOML 文件）
```

## 各组件详解

### Plugin — 插件根组件

- **基类**：`BasePlugin`
- **作用**：所有子组件的容器，提供插件元数据和生命周期钩子
- **必须实现**：`get_components()` 返回所有子组件类列表
- **使用场景**：每个插件 **必须有且只有一个** Plugin 根组件

```python
@register_plugin
class MyPlugin(BasePlugin):
    plugin_name = "my_plugin"
    plugin_version = "1.0.0"

    def get_components(self) -> list[type]:
        return [MyAction, MyTool, MyChatter]
```

---

### Action — 动作组件

- **基类**：`BaseAction`
- **作用**：LLM 通过 Tool Calling 调用的"主动响应"，执行后会产生副作用（如发送消息）
- **必须实现**：`execute()` 方法，返回 `tuple[bool, str]`
- **使用场景**：需要让 LLM 决定"做什么"时，如发送消息、发送表情包、触发外部 API

**关键属性**：
- `primary_action: bool` — 是否为主动作（每次对话只能执行一次）
- `chat_type` — 支持的聊天类型（私聊/群聊/全部）
- `chatter_allow` — 允许调用的 Chatter 列表（空列表表示所有）

详见 [Action components](./action)。

---

### Tool — 工具组件

- **基类**：`BaseTool`
- **作用**：供 LLM 调用的"查询"功能，用于获取信息而非产生副作用
- **必须实现**：`execute()` 方法，返回 `tuple[bool, str | dict]`
- **使用场景**：计算器、翻译、天气查询、数据库查询等

与 Action 的区别：Tool 侧重返回信息，Action 侧重执行操作。

详见 [Tool components](./tool)。

---

### Chatter — 聊天器组件

- **基类**：`BaseChatter`
- **作用**：Bot 的智能核心，定义完整的对话流程，使用生成器模式
- **必须实现**：`execute()` 异步生成器，yield `Wait/Success/Failure/Stop`
- **使用场景**：实现完整的 AI 对话逻辑，需要调用 LLM + 管理对话状态时

**生成器结果类型**：

| 类型 | 说明 |
| --- | --- |
| `Wait(time=None)` | 等待新消息（无超时） |
| `Wait(time=30)` | 等待 30 秒后继续 |
| `Success("完成")` | 对话成功结束 |
| `Failure("出错")` | 对话失败结束 |
| `Stop(time=60)` | 结束并冷却 60 秒 |

详见 [Chatter components](./chatter)。

---

### Adapter — 适配器组件

- **基类**：`BaseAdapter`
- **作用**：与外部平台通信的桥梁，负责消息的接收和发送
- **使用场景**：对接 QQ、Telegram、Discord 等平台

Adapter 基于 `mofox-wire` 标准协议，框架内置 WebSocket 连接管理和自动重连。

详见 [Adapter components](./adapter)。

---

### Command — 命令组件

- **基类**：`BaseCommand`
- **作用**：响应命令前缀消息（如 `/help`），支持多级路由
- **使用场景**：不需要 LLM 的确定性命令处理

使用 **Trie 树路由系统** + `@cmd_route("sub", "command")` 装饰器，支持嵌套子命令和类型注解参数自动解析。

详见 [Command components](./command)。

---

### EventHandler — 事件处理器

- **基类**：`BaseEventHandler`
- **作用**：订阅系统事件，在事件发生时执行逻辑
- **使用场景**：响应插件加载完成、消息到来、用户加群等系统事件

支持权重控制（`weight`）和基于 `execute()` 返回值的消息拦截。

**常用事件类型（`EventType`）**：

| 事件 | 触发时机 |
| --- | --- |
| `ON_START` | Bot 启动时 |
| `ON_STOP` | Bot 停止时 |
| `ON_MESSAGE_RECEIVED` | 收到新消息时 |
| `ON_MESSAGE_SENT` | 消息发送完成后 |
| `ON_NOTICE_RECEIVED` | 收到通知事件时 |
| `ON_ALL_PLUGIN_LOADED` | 所有插件加载完成时 |

详见 [EventHandler components](./event-handler)。

---

### Service — 服务组件

- **基类**：`BaseService`
- **作用**：暴露可供其他插件调用的功能接口
- **使用场景**：一个插件提供的功能需要被多个其他插件复用时

```python
# 插件 A 提供服务
class WeatherService(BaseService):
    service_name = "weather"
    async def get_weather(self, city: str) -> str: ...

# 插件 B 调用服务
from src.core.managers import get_service_manager
service = get_service_manager().get_service("weather_plugin:service:weather")
weather = await service.get_weather("北京")
```

详见 [Service components](./service)。

---

### Router — 路由组件

- **基类**：`BaseRouter`
- **作用**：为插件提供 HTTP API 接口（基于 FastAPI）
- **使用场景**：需要 Webhook、管理面板或外部 API 服务时

详见 [Router components](./router)。

---

### Collection — 集合组件

- **基类**：`BaseCollection`
- **作用**：Action/Tool 的分组容器，向 LLM呈现结构化工具集
- **使用场景**：工具数量多时，需要按功能分组让 LLM 按需解锁时

当 LLM 调用 Collection 时，会解包其包含的所有组件，使其对 LLM 可见。

详见 [Collection components](./collection)。

---

### Config — 配置组件

- **基类**：`BaseConfig`
- **作用**：管理插件的 TOML 配置文件，支持热重载
- **使用场景**：插件有用户可配置的参数时（几乎所有正式插件都应有配置）

配置文件自动放置在 `config/plugins/{plugin_name}/config.toml`。

详见 [Config components](./config)。
