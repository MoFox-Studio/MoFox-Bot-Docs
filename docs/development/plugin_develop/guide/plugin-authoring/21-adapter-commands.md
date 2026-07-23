# 21. 适配器命令：让插件真正调到平台的 API

> **导读** 本章介绍 `plugin_system.api.adapter_api`——插件作者用来操作适配器并调用平台 API 的公共入口。它包含两块能力：一是适配器生命周期管理（启动、停止、重启、查询），二是 `send_adapter_command`——一种基于 `MessageEnvelope` 的请求/响应机制，让插件可以直接调用适配器背后的平台 API（如获取群列表、查询群成员、禁言、撤回等）。理解这一章，你才能真正把“平台能力”接到插件里，而不是只停留在收发文本消息。

前面我们已经分别讲过两件事：

- 第 18 章讲过 Adapter 组件本身——它做的是平台协议和核心消息模型之间的双向翻译。
- 第 19 章讲过 `MessageEnvelope`——那条贯穿全链路的统一信封。

但这两章加起来，回答的还是“消息怎么进来、消息怎么发出去”。

而真正写插件写到一定阶段，你会撞上一类新需求：

> **我不只想收发消息，我还想直接调平台的能力。**

比如：

- 想拿到当前 Bot 加入的所有群
- 想查某个群成员的群名片、角色
- 想禁言某人、撤回某条消息、戳一戳某人
- 想拿 Bot 的 cookies、登录信息

这些事，平台 SDK 通常提供专门的 HTTP API。但插件作者不该自己去连平台 SDK——那是 Adapter 的职责。

所以这一章要讲的，正是：

> **插件怎样通过 `adapter_api`，让适配器替自己去调这些平台 API。**

## 21.1 先把一句话记住：适配器命令不是“发消息”，是“调平台能力”

第一次看到 `adapter_api.send_adapter_command()`，很多人会下意识把它当成另一种发送函数：

- “不就是给适配器发一条消息吗？”

这么理解不算完全错，但会漏掉最关键的一层。

更准确的说法是：

> **`send_adapter_command` 是一次请求/响应调用——你让适配器替你执行某个平台动作，并等适配器把结果带回来。**

也就是说，它不是“发完就走”的单向消息，而是：

1. 你给适配器一个命令名 + 一组参数
2. 适配器翻译成平台 API 调用
3. 适配器把平台返回的结果原样带回来
4. 你拿到结果继续往下做事

这层“带结果回来”的能力，才是适配器命令真正不同于普通消息发送的地方。

## 21.2 这一层 API 的导入边界，先说清楚

按前面一直在遵循的入口原则，插件作者优先从 `plugin_system.api` 这一层拿 API：

```python
from src.app.plugin_system.api import adapter_api
```

`adapter_api` 这一模块本身，对插件作者暴露的就是一组扁平函数。你不需要自己去 new 一个 `AdapterManager`，也不需要直接 import `src.core.managers.adapter_manager`。

也就是说，从你的插件代码视角看，整个适配器命令层只是：

```python
result = await adapter_api.send_adapter_command(
    adapter_sign="onebot:adapter:napcat",
    command_name="get_group_list",
    command_data={},
)
```

至于背后怎么做请求/响应配对、怎么走 `MessageEnvelope`、怎么在 `MessageReceiver` 里被分发回来——这些都是 `adapter_api` 已经替你处理好的内部细节。

## 21.3 先看一个最小用法：拿到 Bot 加入的群列表

为了让这层 API 不悬空，我们用一个最小例子先把它跑起来。

假设你写了一个 `group_inspector` 插件，想在某个命令里打印当前 Bot 加入的所有群。最朴素的写法是这样的：

```python
from __future__ import annotations

from src.app.plugin_system.api import adapter_api
from src.app.plugin_system.base import BaseCommand, BasePlugin, cmd_route, register_plugin


class InspectGroupsCommand(BaseCommand):
    """打印当前 Bot 加入的所有群。"""

    @cmd_route("groups", alias=["群列表"])
    async def handle_groups(self, ctx) -> None:
        # 1. 选一个已启动的 onebot 适配器签名
        active = adapter_api.list_active_adapters()
        target_sign = next((s for s in active if "onebot" in s), None)
        if target_sign is None:
            await ctx.reply("没有可用的 onebot 适配器")
            return

        # 2. 通过适配器命令调用平台 API
        result = await adapter_api.send_adapter_command(
            adapter_sign=target_sign,
            command_name="get_group_list",
            command_data={},
            timeout=20.0,
        )

        # 3. 处理结果
        if result.get("status") != "ok":
            await ctx.reply(f"获取群列表失败：{result.get('message')}")
            return

        groups = result.get("data") or []
        names = [str(g.get("group_name") or g.get("group_id")) for g in groups]
        await ctx.reply("当前群：" + "、".join(names))


@register_plugin
class GroupInspectorPlugin(BasePlugin):
    plugin_name = "group_inspector"
    plugin_version = "1.0.0"
    plugin_description = "演示适配器命令的最小插件"

    def get_components(self) -> list[type]:
        return [InspectGroupsCommand]
```

这个例子虽然小，但它已经把 `adapter_api` 的核心用法都串了一遍：

- `list_active_adapters()` 用来找当前可用的适配器签名
- `send_adapter_command()` 真正发起一次平台调用
- 返回值是一个 `dict`，按 `status / data / message` 三段式回来

记住这三步，后面所有更复杂的平台调用，本质上都只是换 `command_name` 和 `command_data`。

## 21.4 这条命令在系统里到底是怎么走完一圈的

这一节是理解整个机制最关键的部分。建议你先记流向，不要死记字段。

一次 `send_adapter_command` 的完整链路大致是这样：

```text
插件代码
  └─ adapter_api.send_adapter_command(adapter_sign, command_name, command_data, timeout)
      └─ AdapterManager.send_adapter_command(...)
          1. 生成 request_id（uuid）
          2. 注册一个 asyncio.Future，等待 request_id 对应的响应
          3. 构造 outgoing MessageEnvelope：
             message_segment.type = "adapter_command"
             message_segment.data = { request_id, action, params, timeout }
          4. 调用 adapter._send_platform_message(envelope)
                                      │
                                      ▼
                      适配器自己处理 adapter_command 段
                          - 把 action / params 翻译成平台 API 调用
                          - 真正调用平台 HTTP API
                          - 拿到平台返回结果
                          - 构造 incoming MessageEnvelope：
                              message_segment.type = "adapter_response"
                              message_segment.data = { request_id, response }
                          - 通过 adapter.core_sink.send(...) 把响应信封送回核心
                                      │
                                      ▼
                      MessageReceiver.receive_envelope(...)
                          - 检测到 message_segment.type == "adapter_response"
                          - 取出 request_id
                          - 调用 _set_adapter_response(request_id, response)
                                      │
                                      ▼
          5. Future 被解决，返回 response 给插件代码
```

你看完这张图，应该能立刻明白三件事：

1. **`adapter_command` 和 `adapter_response` 不是普通消息段类型**，它们是适配器和核心之间约定的“控制面”消息段，专门用来跑平台调用。
2. **配对靠的是 `request_id`**，不是 `message_id`。这也是为什么 AdapterManager 内部要维护一个 `_pending_adapter_responses` 字典。
3. **真正调用平台 API 的，是适配器自己**，不是 `adapter_api`。`adapter_api` 只是发起请求并等结果。

把这三件事立住，你后面再去看真实适配器（比如 `onebot_adapter`）里 `handle_adapter_command` 的实现，就不会觉得“凭空冒出来一段没头没尾的代码”。

## 21.5 适配器那一端，到底要做什么

这一节是写给“也想自己写适配器”的插件作者的。如果你只打算用现成适配器，可以跳过本节。

对一个真实适配器来说，要支持 `send_adapter_command`，它需要在 `_send_platform_message(envelope)` 里识别 `adapter_command` 段类型，并按以下流程处理：

```python
async def _send_platform_message(self, envelope: MessageEnvelope) -> None:
    segment = envelope.get("message_segment") or {}
    seg_type = segment.get("type")

    if seg_type == "adapter_command":
        # 这是核心发来的平台命令调用
        await self._handle_adapter_command(envelope)
        return

    # ... 否则走普通消息发送逻辑


async def _handle_adapter_command(self, envelope: MessageEnvelope) -> None:
    seg_data = (envelope.get("message_segment") or {}).get("data") or {}
    action = seg_data.get("action")        # 平台 API 名，如 "get_group_list"
    params = seg_data.get("params", {})    # 平台 API 参数
    request_id = seg_data.get("request_id")
    timeout = float(seg_data.get("timeout", 20.0))

    # 1. 真正调用平台 HTTP API
    response = await self._call_platform_api(action, params, timeout=timeout)

    # 2. 把结果包成 adapter_response 信封，发回核心
    if request_id and self.core_sink:
        response_envelope: MessageEnvelope = {
            "direction": "incoming",
            "message_info": {
                "message_id": str(request_id),
                "platform": self.platform,
                "time": 0,
            },
            "message_segment": {
                "type": "adapter_response",
                "data": {
                    "request_id": request_id,
                    "response": response,
                },
            },
        }
        await self.core_sink.send(response_envelope)
```

这段骨架你不用逐字背，但有一件事值得专门记住：

> **响应信封必须带回原来的 `request_id`。**

只要 `request_id` 对不上，核心这边对应的 Future 就永远不会被解决，最终会等到超时返回 `"error"`。

## 21.6 返回值长什么样

`send_adapter_command` 的返回值永远是一个 `dict`，按当前实现，它的结构是这样的：

| `status` | 含义 | 典型 `message` | `data` |
|----------|------|---------------|--------|
| `"ok"` | 命令执行成功 | 平台返回的成功说明 | 平台返回的原始数据 |
| `"failed"` | 平台报告失败 | 平台返回的错误说明 | 通常为 `None` |
| `"error"` | 框架层失败（超时、适配器未启动、异常） | 框架错误信息 | `None` |

也就是说，你在判断“这次调用到底成没成”时，通常这样写：

```python
result = await adapter_api.send_adapter_command(...)

if result.get("status") != "ok":
    # 失败，看 message 字段拿原因
    return False, result.get("message") or "未知错误"

# 成功，看 data 字段拿真正数据
data = result.get("data")
```

这里有一个非常容易踩的坑，我单独提一句：

> **不要直接 `if result:` 判断成功。**

因为一个空 `dict` 在 Python 里是 falsy，但 `{"status": "ok", "data": None}` 完全可能是一次成功的调用——只是这次调用的平台 API 本来就没返回 data。

所以最稳的判断永远是看 `status` 字段。

## 21.7 `command_name` 和 `command_data` 到底怎么填

这是新手最容易卡住的地方。答案其实很直接：

> **`command_name` 是平台 API 的名字，`command_data` 是平台 API 的参数。**

也就是说，这两个字段的合法取值，**完全由适配器背后的平台协议决定**，不是由 Neo-MoFox 决定。

举例来说，对接 OneBot 协议（NapCat 等）的适配器，常见 `command_name` 包括：

| `command_name` | `command_data` 关键字段 | 作用 |
|----------------|------------------------|------|
| `get_group_list` | `{}` | 获取 Bot 加入的所有群 |
| `get_group_member_list` | `{"group_id": int}` | 获取某群成员列表 |
| `get_group_member_info` | `{"group_id": int, "user_id": int, "no_cache": bool}` | 获取某成员的群名片、角色等 |
| `get_group_member_info` | 同上 | 也可以用来取群名片 |
| `get_login_info` | `{}` | 获取 Bot 自身登录信息 |
| `get_cookies` | `{"domain": str}` | 获取 Bot cookies |
| `set_group_ban` | `{"group_id": int, "user_id": int, "duration": int}` | 禁言某人 |
| `set_group_kick` | `{"group_id": int, "user_id": int, "reject_add_request": bool}` | 踢出某人 |
| `delete_msg` | `{"message_id": int}` | 撤回消息 |
| `send_poke` | `{"user_id": int, "group_id": int}` | 戳一戳某人 |

也就是说，你写插件时如果要调平台 API，**必须先查对应平台的协议文档**，确认 `action` 名和参数。

这一点也可以反过来理解：

> **`adapter_api` 不规定你能调什么，它只规定“怎么把一次调用送出去、把结果带回来”。**

至于能调什么，由适配器背后的平台协议说了算。

## 21.8 为什么这里要靠 `MessageEnvelope`，而不是直接调函数

你可能会问一个很自然的问题：

> 既然 `adapter_api` 内部已经能拿到 `AdapterManager`，`AdapterManager` 又能拿到适配器实例，为什么不直接 `adapter.call_platform_api(action, params)`，而要绕一圈 `MessageEnvelope`？

这是个好问题，答案有两个层面。

### 第一，平台 API 调用是异步的，而且经常很慢

真实平台 API 调一次可能要几百毫秒到几秒。如果直接同步等，调用方的协程会被卡住。

而用 `MessageEnvelope + request_id + Future` 这一套，调用方可以自然地用 `await`，适配器那边也可以在自己的异步任务里慢慢调，互不阻塞。

### 第二，这套机制天然兼容“远端适配器”

虽然当前实现里适配器和核心跑在同一个进程，但 `MessageEnvelope` 这条链路是按“跨进程也能跑”的方式设计的。

也就是说，未来如果某个适配器跑在独立进程或独立容器里，只要 `core_sink` 能把信封送回来，这套命令机制就能照常工作。

这就是为什么宁可绕一圈，也要走 `MessageEnvelope`：

> **它的成本是稍多一点封装，但换来的是平台无关、进程无关的可扩展性。**

## 21.9 适配器生命周期 API：不只是发命令

到这里为止，我们一直在讲 `send_adapter_command`。但 `adapter_api` 实际上还有另一组很常用的能力——适配器生命周期管理。

这一组 API 不用来调平台，用来“操作适配器本身”：

| 函数 | 作用 |
|------|------|
| `start_adapter(signature)` | 启动指定适配器 |
| `stop_adapter(signature)` | 停止指定适配器 |
| `restart_adapter(signature)` | 重启指定适配器 |
| `get_adapter(signature)` | 拿到适配器实例（同步，返回 `BaseAdapter \| None`） |
| `get_all_adapters()` | 拿到所有已启动适配器实例的 `{signature: instance}` 字典 |
| `list_active_adapters()` | 列出所有已启动适配器签名 |
| `is_adapter_active(signature)` | 检查某适配器是否已启动 |
| `stop_all_adapters()` | 停止所有适配器，返回 `{signature: bool}` |
| `get_bot_info_by_platform(platform)` | 按平台名拿 Bot 信息 |

这些函数什么时候用？举几个真实场景：

- **运维插件**：写一个 `/adapter restart onebot:adapter:napcat` 命令，平台连接挂了之后远程重启适配器。
- **状态查询插件**：暴露一个 HTTP 接口，列出当前所有已启动适配器和它们的 platform。
- **健康检查插件**：定期调 `is_adapter_active` 判断关键适配器是否还在。
- **多 Bot 插件**：当某个 stream 涉及到某个 platform 时，用 `get_bot_info_by_platform` 拿这个 platform 上的 Bot 身份。

值得注意的是，正常情况下你**不需要**手动 `start_adapter`——系统会在 `ON_ALL_PLUGIN_LOADED` 事件里自动启动所有注册的适配器。

也就是说，这一组生命周期 API，更多是给“运行时手动控制”用的，不是给“插件加载阶段”用的。

## 21.10 `get_adapter` 和 `send_adapter_command`，什么时候用哪个

这里有一个边界值得专门立住，因为它非常容易混淆。

### `send_adapter_command` 用来调平台能力

当你想做的是“让适配器替我调一个平台 API”，永远走 `send_adapter_command`。

哪怕你能拿到适配器实例，也不要直接调它的私有方法去绕开这套机制。因为这套请求/响应配对、`request_id`、超时保护，都是 `send_adapter_command` 替你包好的。

### `get_adapter` 用来读适配器自身的元信息

当你想读的是“适配器本身的属性”，比如：

- `adapter.platform`
- `adapter.name`
- `adapter.get_signature()`
- `await adapter.get_bot_info()`

这种情况下，用 `get_adapter(signature)` 拿到实例，再读属性，是合理的。

简而言之：

> **`send_adapter_command` 是“调平台”，`get_adapter` 是“看适配器自己”。**

把这两件事分开，你就不容易把“平台 API 调用”和“适配器元信息读取”搅成一锅。

## 21.11 一个完整一点的真实例子：禁言某人

为了让前面的概念落地，我们再写一个稍微完整一点的例子——一个禁言命令。

这个例子会同时用到生命周期 API（选适配器）和命令 API（真正调平台）：

```python
from __future__ import annotations

from typing import Any

from src.app.plugin_system.api import adapter_api
from src.app.plugin_system.base import BaseCommand, BasePlugin, cmd_route, register_plugin


class MuteCommand(BaseCommand):
    """禁言某人：/mute <user_id> <duration_seconds>"""

    @cmd_route("mute")
    async def handle_mute(self, ctx) -> None:
        user_id = ctx.args.get("user_id")
        duration = int(ctx.args.get("duration", 600))
        stream_id = ctx.stream_id

        if not user_id:
            await ctx.reply("用法：/mute <user_id> [duration]")
            return

        # 1. 通过 stream_id 反查 group_id（这里用 stream 信息拿）
        #    真实插件里通常用 stream_api 拿 group_id，这里简化处理
        group_id = await self._resolve_group_id(stream_id)
        if not group_id:
            await ctx.reply("当前不在群聊里，无法禁言")
            return

        # 2. 选一个 onebot 适配器
        target_sign = self._pick_onebot_adapter()
        if not target_sign:
            await ctx.reply("没有可用的 onebot 适配器")
            return

        # 3. 发起适配器命令
        result: dict[str, Any] = await adapter_api.send_adapter_command(
            adapter_sign=target_sign,
            command_name="set_group_ban",
            command_data={
                "group_id": int(group_id),
                "user_id": int(user_id),
                "duration": duration,
            },
            timeout=10.0,
        )

        if result.get("status") == "ok":
            await ctx.reply(f"已禁言 {user_id} {duration} 秒")
        else:
            await ctx.reply(
                f"禁言失败：{result.get('message') or result.get('msg') or '未知错误'}"
            )

    def _pick_onebot_adapter(self) -> str | None:
        active = adapter_api.list_active_adapters()
        return next((s for s in active if "onebot" in s), None)

    async def _resolve_group_id(self, stream_id: str) -> str | None:
        # 简化版：真实场景应通过 stream_api.get_stream_info 拿 group_id
        from src.core.managers.stream_manager import get_stream_manager

        info = await get_stream_manager().get_stream_info(stream_id)
        return str(info.get("group_id") or "") if info else None


@register_plugin
class MutePlugin(BasePlugin):
    plugin_name = "mute_helper"
    plugin_version = "1.0.0"
    plugin_description = "演示适配器命令——禁言某人"

    def get_components(self) -> list[type]:
        return [MuteCommand]
```

这个例子里有几件事值得专门留意：

- **`timeout=10.0`**：禁言这种动作通常很快，没必要给 20 秒默认超时。给一个更紧的超时，能让你更快感知平台异常。
- **同时检查 `message` 和 `msg`**：OneBot 平台返回里两个字段都可能存在，这是写跨平台插件时很常见的兼容写法。
- **先校验环境再发命令**：先确认 group_id、适配器都就绪，再发起调用。不要把校验和调用混在一起。

## 21.12 这里最容易踩的几个坑

写适配器命令时，下面这几个坑非常常见，提前知道能少走很多弯路。

### 坑一：把 `message_id` 当成 `request_id`

这两个东西在响应信封里都可能出现，但它们是不同的概念：

- `message_info.message_id` 是消息本身的标识
- `message_segment.data.request_id` 才是请求/响应配对用的标识

如果你写适配器时不小心把 `message_id` 当成 `request_id` 回传，核心这边的 Future 永远不会解决。

### 坑二：忘了处理超时

`send_adapter_command` 默认 20 秒超时。如果你调的是一个慢 API（比如某些平台拉文件列表），20 秒可能不够。

写代码时养成习惯：**显式传 `timeout`**，而不是依赖默认值。

### 坑三：在适配器命令处理里又调了一次 `send_adapter_command`

这会形成循环——你发命令→适配器处理→适配器又发命令→适配器又处理……

虽然不至于死锁，但会很快撑爆调用栈和超时。如果适配器在处理 `adapter_command` 时需要再调平台 API，应该直接用自己的平台客户端调，不要再绕 `adapter_api`。

### 坑四：以为 `adapter_command` 走的是普通消息发送路径

不是。`adapter_command` 是适配器在 `_send_platform_message` 里**单独识别并分流**的特殊段类型。

如果你写的自定义适配器只实现了普通消息发送，没识别 `adapter_command`，那 `send_adapter_command` 永远会超时，因为响应信封永远不会被发回来。

### 坑五：在插件加载阶段就发命令

插件加载时，适配器可能还没启动完。这时候 `list_active_adapters()` 返回空列表是正常的。

适配器命令相关的调用，应该放到运行时（命令触发、事件回调、HTTP 请求处理）去做，不要放到 `on_plugin_loaded` 里。

## 21.13 适配器命令 vs 普通消息发送，到底什么时候用哪个

这一节是这一章边界最值得收的一刀。

### 用 `send_api`（普通消息发送）的场景

- 你只是想把一段文本/图片/语音发到某个 stream
- 你不关心平台 API 返回什么，只关心“发出去没”
- 目标是“让用户看到这条消息”

### 用 `adapter_api.send_adapter_command` 的场景

- 你想调一个平台 API（拿信息、改状态、做平台动作）
- 你需要拿到平台返回的具体数据
- 你要做的事不是“发消息”，而是“调平台能力”

也就是说：

> **`send_api` 是“发消息给用户看”，`send_adapter_command` 是“调平台拿结果”。**

把这条边界立住，你就不容易把“我想发一段禁言提示”和“我想禁言某人”搅成同一个调用。

## 21.14 `adapter_api` 函数速查

`adapter_api` 定义于 `src/app/plugin_system/api/adapter_api.py`，所有函数都通过 `AdapterManager` 完成。

### 生命周期管理

| 函数 | 签名 | 返回 | 说明 |
|------|------|------|------|
| `start_adapter` | `(signature: str)` | `bool` | 启动指定适配器 |
| `stop_adapter` | `(signature: str)` | `bool` | 停止指定适配器 |
| `restart_adapter` | `(signature: str)` | `bool` | 重启指定适配器（先停后启，间隔 3 秒） |
| `stop_all_adapters` | `()` | `dict[str, bool]` | 停止所有已启动适配器 |
| `get_adapter` | `(signature: str)` | `BaseAdapter \| None` | 同步获取适配器实例 |
| `get_all_adapters` | `()` | `dict[str, BaseAdapter]` | 获取所有已启动适配器实例 |
| `list_active_adapters` | `()` | `list[str]` | 列出所有已启动适配器签名 |
| `is_adapter_active` | `(signature: str)` | `bool` | 检查适配器是否已启动 |
| `get_bot_info_by_platform` | `(platform: str)` 异步 | `dict[str, str] \| None` | 按平台名拿 Bot 信息 |

### 命令调用

| 函数 | 签名 | 返回 | 说明 |
|------|------|------|------|
| `send_adapter_command` | `(adapter_sign: str, command_name: str, command_data: dict, timeout: float = 20.0)` 异步 | `dict[str, Any]` | 向适配器发送命令并等待响应 |

`send_adapter_command` 返回字典结构：

```python
# 成功
{"status": "ok", "data": <平台返回>, "message": "..."}
# 平台报告失败
{"status": "failed", "message": "...", "data": None}
# 框架层失败（超时、适配器未启动、异常）
{"status": "error", "message": "...", "data": None}
```

### `signature` 格式

适配器签名格式统一为：

```text
{plugin_name}:adapter:{name}
```

例如：

- `onebot:adapter:napcat`
- `telegram_plugin:adapter:telegram_bot`

`list_active_adapters()` 返回的就是这种格式的字符串列表。

## 21.15 这一章先收在这里

如果把这一章压成最后几句话，我最希望你记住的是：

1. **`adapter_api.send_adapter_command` 是一次请求/响应调用**，不是发消息，它让你能调适配器背后的平台 API。
2. **它靠 `MessageEnvelope` 上的 `adapter_command` / `adapter_response` 段类型 + `request_id` 完成配对**，核心这边的 `MessageReceiver` 专门识别 `adapter_response` 并把结果送回调用方。
3. **`command_name` 和 `command_data` 的合法取值由平台协议决定**，`adapter_api` 只负责“把调用送出去、把结果带回来”。
4. **生命周期 API（`start_adapter` / `stop_adapter` / `list_active_adapters` 等）用来操作适配器本身**，正常启动由系统自动完成，你只在运维/控制场景才需要手动调。
5. **`send_adapter_command` 用来“调平台”，`get_adapter` 用来“看适配器自己”**——把这两个边界立住，就不会乱。

到这里为止，你已经能通过公共 API 真正触达平台能力了。下一章我们换一个方向，看插件系统里另一层很基础但同样重要的公共能力：

> **存储框架——`storage_api` 怎样让插件既能存简单 KV，又能开自己的 SQLite。**
