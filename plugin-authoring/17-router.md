# 17. Router：给插件开一个 HTTP 入口，但别把它当聊天入口

> **导读** 本章介绍 Router 组件——插件的 HTTP 入口层。Router 与聊天系统中的其他组件性质不同：它不参与对话流程，而是把插件能力以 HTTP 子应用的形式暴露给外部系统。本章将解释 Router 的工作原理、`register_endpoints()` 的用法、路径策略，以及为什么 Router 应该保持轻薄、把业务逻辑下沉给其他组件。最后提供 `BaseRouter` 基类速查。

前面几章，我们一直在讲插件怎样参与“对话系统”本身：

- Tool 提供能力
- Agent 做局部编排
- Action 执行动作
- EventHandler 在系统时刻介入
- Chatter 负责整轮对话主流程

到了这一章，视角要稍微拐一下。

因为 Router 解决的不是“对话里的哪一步”，而是另一件事：

> **如果你的插件想暴露一个 HTTP 接口，该怎么做。**

也就是说，Router 不是给模型看的，也不是给聊天流本身用的。

它更像：

- 给外部系统一个调用入口
- 给管理端或调试端一个访问入口
- 给 webhook、状态查询、插件控制面板之类的需求留位置

所以这一章最重要的目标，是先把一个边界立住：

> **Router 是插件的 HTTP 入口，不是聊天入口。**

只要这句话先立住，后面你在设计插件时，就不容易把 Router、Command、EventHandler、Chatter 这些东西搅成一锅。

## 17.1 先把一句话记住：Router 是对外 HTTP 子应用，不是对话组件

如果用最短的话来描述当前实现里的 Router，可以这样说：

> **一个 Router 组件，本质上就是一个由插件提供、最终挂到主 HTTP 服务器上的 FastAPI 子应用。**

它关注的是：

- URL 路径是什么
- 暴露哪些 HTTP 端点
- 要不要做 CORS
- 启动和卸载时要不要初始化 / 清理资源

它不直接关心：

- 当前聊天流里谁发了什么
- 模型要不要响应
- 某条消息该不该进入上下文

所以从定位上看，Router 和 Chatter 几乎是两条平行线：

- Chatter 面向会话流
- Router 面向 HTTP 请求

## 17.2 为什么 Router 不该被当成“另一种 Command”

这点非常值得专门讲一下。

因为很多插件作者一开始会把 Router 理解成：

- “就是把命令换成 HTTP 而已”

这当然不是完全错，但很容易误导。

### Command 更像聊天世界里的入口

Command 面对的是：

- 某个用户在聊天里发出一条命令
- 插件要在当前对话语境里做响应

### Router 更像系统外部入口

Router 面对的是：

- 一个标准 HTTP 请求
- 一个外部系统或前端页面来访问插件

这意味着 Router 更适合解决的问题是：

- 对外开放插件状态查询
- 提供 webhook 接口
- 提供简单后台或调试 API
- 让别的系统通过 HTTP 调用你的插件能力

而不是把原本适合放在聊天命令里的东西，硬改成 HTTP。

## 17.3 为什么 Router 也不该被当成 EventHandler

同样，Router 也不是事件系统的替代品。

EventHandler 处理的是：

- 系统内部某个事件发生之后
- 插件能不能旁听、改参数、拦截链路

而 Router 处理的是：

- 有人主动对你的插件发来一个 HTTP 请求

这两个方向完全不同：

- EventHandler 是“系统里发生了什么，我来介入一下”
- Router 是“外部来调用我，我给一个 HTTP 响应”

所以这章最值得先记住的边界之一就是：

> **Router 是面向外部请求的入口，不是系统内部事件协作的入口。**

## 17.4 当前实现里的 Router，插件作者真正写的是什么

对插件作者来说，Router 这一层其实非常直接。

你真正要写的就是一个 `BaseRouter` 子类。

它会给你一套很明确的骨架：

- `router_name`
- `router_description`
- `custom_route_path`
- `cors_origins`
- `register_endpoints()`
- `startup()`
- `shutdown()`

其中最核心的是两件事：

1. 在 `register_endpoints()` 里定义端点
2. 通过 `get_route_path()` 决定它最终挂载在哪里

所以 Router 这一层的写法，其实比 Chatter、Agent 那些都更直接一些。

## 17.5 `BaseRouter` 做的事很少，但边界很清楚

当前 `BaseRouter` 基本上做了下面这些事：

1. 初始化时创建一个 `FastAPI` 子应用
2. 如果配置了 `cors_origins`，自动挂上 CORS 中间件
3. 调用 `register_endpoints()` 让你注册路由
4. 提供默认挂载路径规则
5. 提供 `startup()` / `shutdown()` 生命周期钩子

这个设计非常克制。

它没有试图帮你做太多魔法，而是只负责把“插件里的 HTTP 子应用”这个概念清楚地搭起来。

所以你完全可以把它理解成：

> **插件系统帮你准备好了一个 FastAPI 子应用容器，你只需要往里面注册端点，并决定它挂在哪。**

## 17.6 默认路径和自定义路径，分别适合什么场景

`BaseRouter` 提供了两种路径方式：

### 默认路径

如果你不写 `custom_route_path`，默认会走：

```text
/router/{router_name}
```

比如：

```text
/router/echo_api
```

这适合：

- 内部调试接口
- 简单插件接口
- 不太在意对外路径风格的场景

### 自定义路径

如果你写了：

```python
custom_route_path = "/api/echo"
```

那它就会挂到这个路径。

这更适合：

- 你想给外部系统一个稳定接口路径
- 你想做更明确的 API 命名
- 你不想暴露默认 `/router/...` 风格

也就是说，默认路径更像开发期友好，自定义路径更像面向实际使用。

## 17.7 一个最小 Router 示例，应该长什么样

这一章我们按你选的方向，用一个最小 API 示例来讲，不搞复杂后台，也不搞 webhook。

最小版本只做两个端点：

- `/health`：检查 Router 是否可用
- `/echo`：回显输入内容

这很适合第一眼理解 Router 的职责。

```python
from __future__ import annotations

from fastapi import Body

from src.app.plugin_system.base import BaseRouter


class EchoApiRouter(BaseRouter):
    """为插件提供一个最小 HTTP API。"""

    router_name = "echo_api"
    router_description = "提供最小健康检查和回显接口"
    custom_route_path = "/api/echo"
    cors_origins = ["*"]

    def register_endpoints(self) -> None:
        """注册最小 API 端点。"""

        @self.app.get("/health")
        async def health() -> dict[str, str]:
            return {"status": "ok", "router": self.router_name}

        @self.app.post("/echo")
        async def echo(payload: dict[str, str] = Body(...)) -> dict[str, str]:
            text = payload.get("text", "")
            return {"text": text}
```

这段代码已经足够说明 Router 的角色了：

- 它不碰聊天流
- 不碰模型上下文
- 不做事件链控制
- 只是正常提供 HTTP 端点

## 17.8 为什么这个例子里没有接插件内部 Service

这是刻意的。

第一次讲 Router，我更希望你先看清它作为“HTTP 入口”的身份，而不是一上来就把它和插件内部所有能力都串起来。

但你也要知道，真实项目里 Router 往往不会永远停在这么薄的一层。

更常见的写法通常是：

- Router 收到 HTTP 请求
- 做最小的参数整理和校验
- 再调用插件内部的 Service / Tool / 其他能力层

所以你可以把刚才这个例子理解成：

> **先把 HTTP 壳子搭出来，再考虑往里接业务层。**

## 17.9 `startup()` 和 `shutdown()` 不是摆设，它们是 Router 的生命周期钩子

很多人第一次写 Router，只会盯着 `register_endpoints()`。

但 `BaseRouter` 还有两个很重要的钩子：

- `startup()`
- `shutdown()`

它们分别在：

- 挂载后
- 卸载前

被调用。

这很适合用来做一些和 HTTP 接口本身强相关的准备 / 清理工作，比如：

- 初始化某个客户端
- 建立临时资源
- 清理连接或缓存

所以如果你的 Router 不只是几个纯内存端点，而是会依赖外部资源，这两个钩子就很有用了。

## 17.10 自动挂载链路怎么理解：你写的是子应用，系统负责把它接到主服务器

这一章你希望讲清挂载链路，这是对的，因为它正是 Router 和别的组件不一样的地方。

当前运行链大致可以这样理解：

1. 你的插件定义了 `BaseRouter` 子类
2. 插件加载完成后，系统发现这些 Router 组件
3. `RouterManager` 创建 Router 实例
4. 它拿到 Router 里的 `FastAPI` 子应用
5. 再把这个子应用挂到主 HTTP 服务器的指定路径上

也就是说：

> **插件作者写的是一个“子应用”，真正接到主服务上的动作，是系统运行时帮你完成的。**

这就是为什么生命周期必须在这里一并说明：如果不解释挂载时机，读者很容易误以为定义完类就立刻对外可用了。

## 17.11 自动挂载通常发生在所有插件加载完成之后

当前实现里，`initialize_router_manager()` 会订阅 `ON_ALL_PLUGIN_LOADED`，然后在所有插件加载完成后执行 `mount_all_routers()`。

这意味着 Router 的常见运行路径不是：

- 你手动一条条 mount

而是：

- 插件加载完
- 路由统一挂载

当然，公共 API 也保留了手动挂载 / 卸载能力，比如：

- `mount_router()`
- `unmount_router()`
- `reload_router()`

这更适合调试、测试或热重载场景。

## 17.12 为什么说 Router 很适合“对外系统接口”，但不适合拿来替代聊天主流程

这是这一章必须反复强调的边界。

因为一旦插件作者看到 Router 可以暴露 API，很容易开始想：

- 干脆把某些聊天逻辑也搬成 HTTP 吧

当然不是绝对不行，但从架构分层上看，通常不划算。

原因很简单：

### 聊天主流程依赖流式上下文

Chatter 关心的是：

- 未读消息
- 历史上下文
- LLM 调度
- 当前 stream 的生命周期

这些都不是 Router 的天然世界。

### Router 更适合稳定的请求-响应接口

它更适合：

- `/health`
- `/status`
- `/config`
- `/webhook`
- `/invoke`

这种清晰、独立、HTTP 风格很强的接口。

所以可以把这条边界压成一句话：

> **Router 适合做外部系统入口，不适合充当聊天世界里的总控。**

## 17.13 一个更成熟的 Router 往往长什么样

虽然这一章只用最小示例，但你要有个预期：真实插件里的 Router，通常会逐渐演化成下面这种结构：

1. Router 负责定义 HTTP 路径和请求/响应形状
2. Router 只做轻量参数校验与错误转换
3. 具体业务逻辑下沉给 Service 或其他组件

这样写的好处很明显：

- HTTP 层不会吞掉整个业务层
- 插件核心能力不会被 FastAPI 装饰器绑死
- 同一份能力以后也更容易复用给 Command、Agent 或 EventHandler

所以 Router 最稳的姿势通常是：

> **做一个薄而清楚的 HTTP 壳，不要做一个巨大无比的业务容器。**

## 17.14 BaseRouter 基类速查

`BaseRouter` 定义于 `src/core/components/base/router.py`，继承自 `ABC`。

### 类属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `router_name` | `str` | Router 名称（同时作为 FastAPI 应用的 `title`） |
| `router_description` | `str` | Router 描述 |
| `custom_route_path` | `str \| None` | 自定义挂载路径，如 `"/api/v1/my_plugin"`；为 `None` 时使用默认路径 |
| `cors_origins` | `list[str] \| None` | CORS 允许的来源列表，`None` 表示不启用 CORS |
| `dependencies` | `list[str]` | 组件级依赖（其他组件签名列表） |

### 实例属性

| 属性 | 说明 |
|------|------|
| `self.app` | `FastAPI` 实例，在 `__init__` 中自动创建，在 `register_endpoints()` 里向它注册路由 |
| `self.plugin` | 所属插件实例 |

### 方法

| 方法 | 说明 |
|------|------|
| `register_endpoints()` | **抽象方法**，在此方法内向 `self.app` 注册路由端点 |
| `get_route_path() -> str` | 返回实际挂载路径（优先 `custom_route_path`，否则使用默认路径） |
| `get_app() -> FastAPI` | 返回 `self.app` 实例 |
| `startup()` | 启动钩子，Router 挂载完成后调用，可重写 |
| `shutdown()` | 关闭钩子，Router 卸载前调用，可重写 |
| `get_signature() -> str \| None` | 返回组件签名，格式为 `{plugin}:router:{router_name}` |

### register_endpoints 示例

```python
def register_endpoints(self) -> None:
    @self.app.get("/status")
    async def get_status():
        return {"status": "ok", "plugin": "my_plugin"}

    @self.app.post("/trigger")
    async def trigger_action(body: dict):
        # 调用插件 Service 或其他组件
        return {"result": "triggered"}
```

> **注意**：`register_endpoints()` 在 Router 实例化时被调用，此时 FastAPI 应用已经创建好，可以直接向 `self.app` 添加路由。实际挂载（mount）到系统主 HTTP 服务器的操作由运行时完成，不需要手动处理。

### custom_route_path 策略

| 场景 | 推荐做法 |
|------|---------|
| 插件内部接口（调试、状态查询） | 不设置 `custom_route_path`，使用自动生成的默认路径 |
| 对外 API（需要长期稳定路径） | 显式设置 `custom_route_path = "/api/v1/my_plugin"` |

## 17.15 对插件作者来说，这一章最值得带走什么

把这一章压成几个最实用的结论，大概就是：

1. Router 是插件的 HTTP 入口，不是聊天入口。
2. 它本质上是一个 FastAPI 子应用，由系统运行时挂到主 HTTP 服务器上。
3. `register_endpoints()` 负责定义端点，`startup()` / `shutdown()` 负责生命周期。
4. 默认路径适合内部接口，自定义路径更适合稳定对外 API。
5. 更稳的 Router 通常只做 HTTP 壳，把实际业务逻辑继续下沉给别的组件。

## 17.16 把这一章压缩成一句话

如果要把这一章压缩成一句最值得带走的话，那就是：

> **在 Neo-MoFox 里，Router 负责把插件能力以 HTTP 子应用的形式暴露出去，它是面向外部请求的接口层，而不是对话系统本身的一部分。**

沿着这条线，下一步自然会涉及：

> **当 Tool、Agent、Action、EventHandler、Chatter、Router 都讲完以后，插件作者该怎么把这些组件装配成一个职责清晰的小型插件架构？**

那就该写组件分层总章了。