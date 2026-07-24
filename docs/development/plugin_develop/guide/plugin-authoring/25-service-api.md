# 25. Service API：跨插件复用服务能力的统一入口

> **导读** 本章介绍 `plugin_system.api.service_api`——一个看起来小、但语义边界很值得专门立住的 API。它只做两件事：**列出 / 查找已注册的 Service 组件类**，以及**按签名拿到一个新构造的 Service 实例**。如果你还不知道"Service 是什么"、"Command 是入口、Service 是能力"这条分工，请先读 [第 7 章 · Command 与 Service](./7-command-and-service)。

::: tip 本章只介绍 API
本章不重复"为什么要写 Service"的概念讨论，也不展开 `BaseService` 基类的字段与生命周期。Service 的定位、与 Command / Tool 的边界，统一在 [第 7 章](./7-command-and-service) 里讲。本章专注于 `service_api` 的几个函数怎么用、签名怎么拼、实例从哪里来、踩哪些坑。
:::

## 25.1 这一层 API 是干什么的

第 24 章结尾点过一句：`plugin_system.api` 里和"运行时能力"相关的高频入口已经讲完了。`service_api` 不属于"高频"，但它解决的是另一类问题——

> **当某个能力被抽成 Service 之后，怎么从"插件外部"拿到它。**

这件事在 [第 7 章](./7-command-and-service) 里其实已经露过一次面：

```python
from src.app.plugin_system.api import service_api

service = service_api.get_service("echo_demo:service:echo_service")
```

那是"插件内部"用 `EchoService(self.plugin)` 直接构造的场景——你拿得到 `EchoService` 这个类。但下面这些场景你拿不到类：

- 你的插件想调用**另一个插件**暴露的 Service（比如 `booku_memory` 想用某个第三方插件提供的检索能力）。
- 你写一个 Action / Tool，运行时才知道要调哪个 Service（比如 `emoji_sender` 的 Action 通过签名拿 `EmojiSenderService` 实例）。
- 你想在调试脚本里列出当前系统里都有哪些 Service。

`service_api` 就是给这些场景用的统一入口。它的体量很小——只有四个函数，全是同步的——但它和 `BaseService` 的注册机制、组件签名系统绑得很紧，所以单独拉一章讲清楚。

## 25.2 这一层 API 的导入边界

按前面一直在遵循的入口原则：

```python
from src.app.plugin_system.api import service_api
```

如果需要直接用 `BaseService` 类型（比如做 `isinstance` 检查或 `cast` 收窄类型），从 `plugin_system.base` 或 `core.components.base.service` 拿：

```python
from src.app.plugin_system.base import BaseService
```

你不需要直接 import `src.core.managers.service_manager`——`service_api` 已经把 `ServiceManager` 包好了，所有调用都通过它转发。

::: warning 这四个函数都是同步的
`service_api` 里的四个函数**全部是同步函数**，不需要 `await`。这一点和 `stream_api` / `message_api` / `send_api` 形成对比——后三者大量使用异步。原因很简单：`service_api` 只做"查注册表 / 创建实例"，不涉及数据库、网络、IO，所以没必要做成异步。

如果你看到自己写了 `await service_api.get_service(...)`，那一定是写错了。
:::

## 25.3 先把"签名"这条链路搞清楚

`service_api` 几乎所有函数都围绕一个东西转——**组件签名（signature）**。

Service 的签名格式是：

```
plugin_name:service:component_name
```

也就是三段用冒号分隔的字符串，中间那段固定是 `service`（对应 `ComponentType.SERVICE`）。例如：

| Service 类 | 所属插件 | 签名 |
|-----------|---------|------|
| `EchoService` | `echo_demo` | `echo_demo:service:echo_service` |
| `EmojiSenderService` | `emoji_sender` | `emoji_sender:service:emoji_sender` |
| `BookuMemoryService` | `booku_memory` | `booku_memory:service:booku_memory` |

签名从哪里来？看 `BaseComponent.get_signature`（`service.py` 里继承自基类）：

```python
@classmethod
def get_signature(cls) -> str | None:
    if cls._signature_:
        return cls._signature_              # 插件管理器注入的缓存
    if cls._plugin_ and cls.name:
        return f"{cls._plugin_}:{cls.component_type}:{cls.name}"
    return None
```

也就是说：

> **签名不是手写的字符串，它由"插件名 + 组件类型 + 组件 name"自动拼出来。**

插件管理器在加载插件时会往组件类上注入 `_plugin_` 和 `_signature_` 两个类属性。所以在**插件加载前**调 `get_signature()` 会返回 `None`，传给 `service_api.get_service()` 也会因为找不到类而返回 `None`。

记住这一点，就能避开后面"坑一"。

## 25.4 列出所有 Service：`get_all_services` / `get_services_for_plugin`

两个函数都是同步函数，都返回 `dict[str, type[BaseService]]`——**签名 → Service 类**的映射。

### `get_all_services()`：拿到系统里全部 Service 类

```python
services = service_api.get_all_services()
# services = {
#   "echo_demo:service:echo_service": <class 'EchoService'>,
#   "emoji_sender:service:emoji_sender": <class 'EmojiSenderService'>,
#   "booku_memory:service:booku_memory": <class 'BookuMemoryService'>,
#   ...
# }
```

返回的是**类**，不是实例。注意三个含义：

- 数据源是全局组件注册表（`get_global_registry()`），不是数据库。
- 它包含的是**所有已加载插件**的 Service 类，跨插件。
- 它**不**包含没在 `get_components()` 里返回的 Service（见坑一）。

适合的场景：调试时打印当前系统都有哪些 Service、做"是否有某个能力的探针"。

### `get_services_for_plugin(plugin_name)`：只看某个插件的 Service

```python
services = service_api.get_services_for_plugin("emoji_sender")
# services = {
#   "emoji_sender:service:emoji_sender": <class 'EmojiSenderService'>,
# }
```

它会校验 `plugin_name` 非空（空字符串或非字符串会直接 `raise ValueError`）。返回结构和 `get_all_services` 一致，只是范围缩小到单个插件。

适合的场景：你想"列一下插件 X 暴露了哪些能力"、或者写一个"插件自检"工具时用它枚举自己的 Service。

## 25.5 拿到类 vs 拿到实例：`get_service_class` vs `get_service`

这两个函数是 `service_api` 真正的核心。它们的差别看似只是一个"是否构造实例"，但背后的语义差别很大。

### `get_service_class(signature)`：只拿类

```python
service_cls = service_api.get_service_class("emoji_sender:service:emoji_sender")
# service_cls 是 EmojiSenderService 类本身（不是实例）
```

返回 `type[BaseService] | None`。找不到时返回 `None`（不抛异常）。

只做"在注册表里查一下类"这件事，不做任何创建动作。适合：

- 你想检查某个 Service 是否被注册了（`if service_cls is None`）。
- 你想自己控制实例的构造方式（比如传特殊参数，但 `BaseService.__init__` 只接 `plugin`，通常没这个需求）。
- 你想读 Service 类上的元信息（`name` / `description` / `version`）而不实例化它。

### `get_service(signature)`：拿一个新构造的实例

```python
service = service_api.get_service("emoji_sender:service:emoji_sender")
# service 是 EmojiSenderService(plugin=emoji_sender_plugin) 的实例
```

返回 `BaseService | None`。这一步背后做了**四件事**：

1. 调 `get_service_class(signature)` 拿到 Service 类。
2. 解析签名，抽出 `plugin_name`。
3. 从 `plugin_manager.get_plugin(plugin_name)` 拿到对应的 `BasePlugin` 实例。
4. 用 `service_cls(plugin=plugin)` 创建实例并返回。

任何一步失败都会返回 `None`：

- 签名格式不对 → `_parse_signature` 解析失败 → `None`。
- 中间那段不是 `service`（比如你传了 `plugin:tool:xxx`）→ `None`，并打 warning。
- 插件还没加载 → `None`，并打 warning `"插件未加载: xxx"`。
- 构造时抛异常 → `None`，并打 error。

## 25.6 关键点：`get_service` 每次都新建一个实例

这是 `service_api` 最容易被误用的一条——

> **`get_service(signature)` 不是单例模式。每次调它，都会调一次 `service_cls(plugin=plugin)`，得到一个全新的实例。**

看 `ServiceManager.get_service` 的源码：

```python
service_instance = service_cls(plugin=plugin)
logger.debug(f"创建 Service 实例: {signature}")
return service_instance
```

这意味着两件事：

1. **如果你在循环里反复调 `get_service(sig)`**，会反复 `__init__`，可能很慢，也可能在 `__init__` 里有副作用时出问题。
2. **实例上的状态不会跨调用共享**——你给实例 A 设了一个属性，下次 `get_service(sig)` 拿到的实例 B 看不到。

正确做法是：**在一次需要用 Service 的逻辑里只调一次 `get_service`**，把拿到的实例在本次作用域内复用。看下一节的例子。

如果某个 Service 真的需要"全局唯一有状态的实例"，那要么用插件级的单例（在 `BasePlugin` 上挂一个缓存），要么把状态外移到 `storage_api` / `database_api` 里——**不要**靠"反复调 `get_service` 然后期望它返回同一个对象"。

## 25.7 一个完整的真实例子：`emoji_sender` 的 Action

`plugins/emoji_sender/action.py` 是仓库里目前最典型的 `service_api` 使用方。它把"Action 是 LLM 入口、Service 是能力"这条分工落到了真实代码里。

简化版：

```python
from __future__ import annotations

from typing import Annotated, AsyncGenerator, cast

from src.app.plugin_system.api.service_api import get_service
from src.core.components.base.action import BaseAction

from .service import EmojiSenderService


class SendEmojiMemeAction(BaseAction):
    """发送表情包动作。"""

    name: str = "send_emoji_meme"
    description: str = "根据描述与情感标签，检索并发送一张符合当前情景的表情包。"

    async def execute(
        self,
        description: Annotated[str, "目标表情包的描述文本"],
        emotion_tags: Annotated[list[str] | None, "情感标签（可空）"] = None,
    ) -> AsyncGenerator[tuple[bool, str] | None, None]:
        # 1. 通过 service_api 拿到 Service 实例（每次 execute 调一次，作用域内复用）
        service = get_service("emoji_sender:service:emoji_sender")
        if service is None:
            yield False, "emoji_sender service 未加载"
            return

        # 2. 类型收窄：service_api 只能返回 BaseService，需要 cast 到具体类型
        service = cast(EmojiSenderService, service)

        # 3. 调 Service 的方法
        ok, result, reason = await service.send_best_detailed(
            stream_id=self.chat_stream.stream_id,
            platform=self.chat_stream.platform,
            description_query=description,
            emotion_tags=emotion_tags,
        )

        if ok:
            yield True, "已发送表情包"
            return
        yield False, reason
```

这个例子把这一章最关键的几个点都串起来了：

- **签名是从插件名 + service 类型 + Service 的 `name` 拼出来的**，不是随便写的字符串。
- **`get_service` 在 Action 的 `execute` 内部调**——而不是放在 `__init__` 或模块加载期（避开坑四、坑五）。
- **拿到实例后立刻 `None` 判断**——`service_api` 的所有失败路径都返回 `None`，不抛异常。
- **用 `cast` 做类型收窄**——`service_api` 的返回类型只能声明成 `BaseService | None`，编译期拿不到具体子类，需要 `typing.cast` 帮助类型检查器（见坑二）。

## 25.8 `service_api` vs 直接 `import` Service 类：边界一次说清

这是这一章最值得立的一刀，因为很多人第一次写跨插件调用时，会本能地想"我直接 `from plugins.emoji_sender.service import EmojiSenderService` 不就行了？"。

| 维度 | 直接 `import` Service 类 | 走 `service_api` |
|------|--------------------------|------------------|
| 调用方与被调插件的耦合 | 强耦合（依赖具体路径） | 弱耦合（只依赖签名） |
| 被调插件未加载时 | import 直接报 `ImportError` | `get_service` 返回 `None`，可优雅降级 |
| 是否需要被调插件已在 `get_components()` 返回该 Service | 不需要（只要文件能 import 到） | 需要（否则注册表里没有） |
| 是否能拿到正确的 `plugin` 实例 | 需要自己解决 `plugin` 怎么传 | `service_api` 自动注入 |
| 适合场景 | 插件**内部**自己的组件互调 | 插件**之间**或运行时按签名调用 |

简而言之：

> **插件内部，直接 import 类更简单；插件之间或运行时按签名调用，走 `service_api`。**

更具体一点：

- 你写 `echo_demo` 自己的 `EchoCommand` 调 `EchoService` → 直接 `EchoService(self.plugin)`，别绕 `service_api`。
- 你写 `emoji_sender` 的 Action 调 `EmojiSenderService` → 也可以直接 import，但走 `service_api` 让 Action 不依赖具体路径，更便于把 Service 抽到独立插件里。
- 你写 `booku_memory` 想调 `web_search_tool` 暴露的检索 Service → **必须**走 `service_api`，因为你不能 import 别的插件的内部模块。

把这条边界立住，你就不会写出"插件之间硬 import 内部模块"这种一旦拆包就会断的代码。

## 25.9 这里最容易踩的几个坑

### 坑一：Service 没在 `get_components()` 里返回

文件里有 `class XxxService(BaseService)` 不代表它进了系统注册表。`ServiceManager.get_all_services()` 走的是全局组件注册表，而注册表里有什么，由 `BasePlugin.get_components()` 返回的列表决定。

```python
def get_components(self) -> list[type]:
    return [EchoCommand, EchoService]   # ← 必须显式列出
```

忘了把 `EchoService` 加进这个列表，`service_api.get_all_services()` 里就查不到它，`get_service(...)` 也会返回 `None`，且没有任何报错——只是日志里可能有 warning。

### 坑二：拿到实例后不做 `None` 判断就用

`get_service` 在签名错、插件没加载、构造失败时都返回 `None`，不抛异常。直接 `service = get_service(sig); await service.do_xxx()` 会触发 `AttributeError: 'NoneType' object has no attribute 'do_xxx'`，错误信息很难看。

养成习惯：**`get_service` 后永远先 `if service is None: ...` 再继续**。

### 坑三：把 `get_service` 当单例用

```python
for item in items:
    service = get_service("plugin:service:xxx")   # ← 每次循环都新建一个实例
    await service.handle(item)
```

不仅慢，而且如果 `__init__` 里有副作用（比如读配置、初始化客户端、打日志），会反复触发。把 `get_service` 提到循环外：

```python
service = get_service("plugin:service:xxx")
if service is None:
    return
for item in items:
    await service.handle(item)
```

### 坑四：在模块导入期调 `service_api`

`service_api` 内部延迟获取 `ServiceManager`，但 `get_service` 会再去 `get_plugin_manager().get_plugin(plugin_name)`。在插件加载极早期，插件管理器自己可能还没把目标插件注册好。

把 `get_service` 调用放到组件方法里（`execute` / `handle` / `on_plugin_loaded` 等），而不是模块顶层或 `__init__` 里。

### 坑五：签名里中间那段写错

`service_api.get_service` 内部会调 `parse_signature`，验证中间那段必须是 `service`（`ComponentType.SERVICE`）。如果你传成了：

- `"emoji_sender:tool:emoji_sender"` → `None`（被识别成 Tool）
- `"emoji_sender:emoji_sender"` → 抛 `ValueError`（段数不对）

记住格式永远是三段：`plugin_name:service:component_name`。

### 坑六：在 `get_service` 拿到的实例上长期存状态

因为每次都是新实例，给实例绑的属性下次就拿不到了：

```python
service = get_service("plugin:service:xxx")
service._cache = {...}            # ← 这次调用的局部状态

# 下次再调
service2 = get_service("plugin:service:xxx")
service2._cache                   # ← AttributeError，是新实例
```

需要持久状态，走 `storage_api` / `database_api`，或者放到 `BasePlugin` 实例上（`service.plugin.xxx`）。

### 坑七：用 `await` 调同步函数

```python
service = await service_api.get_service(...)   # ← TypeError: object BaseService can't be used in 'await' expression
```

`service_api` 全是同步函数，直接调即可。

### 坑八：忘了 `cast` 导致类型检查器警告

`get_service` 返回类型是 `BaseService | None`，调用具体子类方法时 `mypy` / `pyright` 会警告 "Cannot access member `send_best_detailed` for `BaseService`"。这是 `service_api` 设计上无法避免的代价——它只知道基类。

```python
from typing import cast
service = cast(EmojiSenderService, get_service("emoji_sender:service:emoji_sender"))
```

`cast` 是纯运行时无操作，只在静态检查阶段起作用，不会带来任何开销。

## 25.10 `service_api` 速查

`service_api` 定义于 `src/app/plugin_system/api/service_api.py`。**所有函数均为同步函数**（不需要 `await`）。

### 列出 / 查找类

| 函数 | 签名要点 | 返回 | 说明 |
|------|---------|------|------|
| `get_all_services` | `()` | `dict[str, type[BaseService]]` | 全局注册表里所有 Service 类（签名 → 类） |
| `get_services_for_plugin` | `(plugin_name)` | `dict[str, type[BaseService]]` | 限定到某个插件的 Service 类；空 `plugin_name` 抛 `ValueError` |
| `get_service_class` | `(signature)` | `type[BaseService] \| None` | 按签名拿单个 Service 类；找不到返回 `None` |

### 拿到实例

| 函数 | 签名要点 | 返回 | 说明 |
|------|---------|------|------|
| `get_service` | `(signature)` | `BaseService \| None` | **每次都新建一个实例**（非单例）；自动注入所属 `BasePlugin`；任一步失败返回 `None` |

### 签名格式

```
plugin_name:service:component_name
```

三段冒号分隔，中间固定为 `service`。来源：

```python
# 在 Service 类上读取
sig = MyService.get_signature()    # 类方法，返回 str | None

# 手动拼（不推荐手写）
from src.core.components.types import build_signature, ComponentType
sig = build_signature("my_plugin", ComponentType.SERVICE, "my_service")
```

### `BaseService` 关键类属性（速查）

| 属性 | 默认值 | 说明 |
|------|--------|------|
| `component_type` | `"service"` | 固定值，对应 `ComponentType.SERVICE` |
| `name` | `""` | 服务名，参与签名拼装 |
| `description` | `""` | 服务描述 |
| `version` | `"1.0.0"` | 服务版本 |
| `dependencies` | `[]` | 组件级依赖列表（签名字符串） |

`BaseService` 不强制实现任何抽象方法，业务方法由插件作者自由定义。`__init__(self, plugin)` 接收所属 `BasePlugin`，实例上可通过 `self.plugin` 访问插件上下文（包括 `self.plugin.config`）。

## 25.11 这一章先收在这里

本章只覆盖 `service_api` 的 API 用法。把这一章压成最后几句话，我最希望你记住的是：

1. **签名格式永远是 `plugin_name:service:component_name`**，由 `BaseService.get_signature()` 自动拼出来，不要手写。
2. **`get_service` 不是单例**——每次调都新建一个实例，循环里要提到外面，状态别往实例上长期存。
3. **`get_service` 的所有失败路径都返回 `None`**——拿到后先判空再用，别让 `AttributeError: NoneType` 替你打日志。
4. **`service_api` 全是同步函数**——不要 `await`。
5. **插件内部直接 import 类，插件之间走 `service_api`**——这条边界一旦立住，你的插件就不会因为别人拆包而断。

至于"为什么要写 Service"、"Command 和 Service 的分工"，统一在 [第 7 章 · Command 与 Service](./7-command-and-service) 里讲。

到这里，`plugin_system.api` 这一层里另一组相对低频但同样有用的入口也补上了一块。和 `stream_api` / `message_api` / `send_api` 这些"直接做事"的 API 不同，`service_api` 解决的是"找到能力"——它是插件之间相互协作的统一握手方式。

如果你想继续深入，下一站很自然的方向是看其它几个相对低频的 API（`chat_api` / `event_api` / `permission_api` / `plugin_api` 等），或者回到 [指南总览](./) 看完整路线图。
