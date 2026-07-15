# 24. Stream API：插件作者怎样管聊天流

> **导读** 本章只讲 `plugin_system.api.stream_api` 的 API 用法——流的创建、查询、消息入库、上下文加载与清空。如果你还不知道"聊天流是什么"、`stream_id` / `ChatStream` / `StreamContext` / `ChatStreams` 表这四个名词分别指什么，请先读 [16.5 Stream：聊天流是什么](./16.5-stream)。

::: tip 本章只介绍 API
本章刻意不重复"聊天流是什么"的概念性介绍。关于 `ChatStream` / `StreamContext` 的结构、可读字段、以及 `stream_api` 和 `message_api` / `send_api` 的边界，概念部分统一在 [16.5 Stream](./16.5-stream) 里讲。本章专注于"每个函数怎么用、踩哪些坑"。
:::

## 24.1 这一层 API 的导入边界

按前面一直在遵循的入口原则：

```python
from src.app.plugin_system.api import stream_api
```

如果需要直接用 `ChatStream` / `StreamContext` 类型（比如调 `generate_stream_id`），从 `plugin_system.types` 拿：

```python
from src.app.plugin_system.types import ChatStream, StreamContext, ChatType
```

你不需要直接 import `src.core.managers.stream_manager`——`stream_api` 已经把 `StreamManager` 包好了。

## 24.2 流的创建与获取：`get_or_create_stream`

这是 `stream_api` 里最基础、也最常用的入口之一。它的语义是：

> **拿到一个流；如果还不存在，就创建它。**

有两种调用方式：

### 方式一：直接传 `stream_id`（你已经有了哈希值）

```python
stream = await stream_api.get_or_create_stream(stream_id=some_hashed_id)
```

这种方式通常用在"你从 `ctx.stream_id` / `message.stream_id` 拿到了哈希值，想确保这个流被加载进内存"的场景。

### 方式二：传 `platform` + `user_id` 或 `group_id`（让 stream_api 现算哈希）

```python
# 群聊流
stream = await stream_api.get_or_create_stream(
    platform="qq",
    group_id="123456",
    chat_type="group",
    # group_name 可选，传了会同步到 DB
)

# 私聊流
stream = await stream_api.get_or_create_stream(
    platform="qq",
    user_id="987654",
    chat_type="private",
)
```

这种方式更常见——你手里只有平台 + 群号 / 用户号，`stream_api` 内部会调 `ChatStream.generate_stream_id` 算出哈希，再去 DB 查 / 建。

`get_or_create_stream` 返回的是一个 `ChatStream` 对象，你可以直接读它的字段（字段含义见 [16.5 Stream](./16.5-stream#chatstream-可读字段)）：

```python
stream = await stream_api.get_or_create_stream(
    platform="qq", group_id="123456", chat_type="group", group_name="测试群",
)

print(stream.stream_id)        # 哈希值
print(stream.platform)         # "qq"
print(stream.chat_type)        # "group"
print(stream.stream_name)      # "测试群"
print(stream.bot_id)           # 由 stream_api 从适配器回填
print(stream.context)          # StreamContext 对象
```

这里有一件值得专门记的事：

> **`get_or_create_stream` 是幂等的。**

对同一个 `stream_id` 调多次，返回的是同一个全局单例 `ChatStream` 实例。`StreamManager` 内部用 `_streams` 字典保证了这一点，所以你不用担心"调一次就建一份"。

## 24.3 流信息查询：`get_stream_info`

如果你只想要"这个流是什么"的元信息，不需要拿到完整的 `ChatStream` 对象，用 `get_stream_info`：

```python
info = await stream_api.get_stream_info(stream_id)
# info = {
#   "stream_id": "...",
#   "platform": "qq",
#   "chat_type": "group",
#   "group_id": "123456",
#   "group_name": "测试群",
#   "person_id": "...",          # 关联的 person_id（哈希格式）
#   "message_count": 1234,       # 该流的消息总数
#   "last_active_time": 169...,
#   "created_at": 169...,
# }
```

返回 `None` 表示这个流在 DB 里没有记录。

这个函数特别值得注意的一点是：

> **`get_stream_info` 内部有 `alru_cache`（256 容量），而且是带 `stream_id` 做的缓存 key。**

也就是说，短时间内对同一个 `stream_id` 多次调，只有第一次会真的查 DB，后面都走缓存。这对你写高频调用的插件很有用——不用自己再加缓存。

但这也意味着：如果你直接改了 `ChatStreams` 表（比如用 `storage_api` 的 `db.session()` 改了 `group_name`），`get_stream_info` 可能短时间还返回旧值。这种情况调 `clear_stream_cache(stream_id)` 让缓存失效。

## 24.4 列出所有流：内存 vs 数据库

`stream_api` 提供两个"列出所有流 ID"的函数，但它们的来源不同：

| 函数 | 来源 | 含义 |
|------|------|------|
| `get_all_stream_ids()` | 内存中 `_streams` 字典 | 当前进程加载到内存的流（活跃的） |
| `get_stream_ids_from_db(chat_type="")` | DB 中 `ChatStreams` 表 | 历史上曾经创建过的所有流 |

这是个很重要的区别：

- **内存里的流**：进程重启会丢，只包含"被访问过 / 被消息激活过"的流。
- **DB 里的流**：永久保留，包含所有曾经有过对话的流（除非手动 `delete_stream`）。

也就是说，如果你写"列出所有群"，应该用 `get_stream_ids_from_db("group")`；如果你写"列出当前活跃的流"，才用 `get_all_stream_ids()`。

```python
# 当前内存里活跃的流 ID
active_ids = stream_api.get_all_stream_ids()

# DB 里所有群聊流 ID
group_stream_ids = await stream_api.get_stream_ids_from_db("group")

# DB 里所有流 ID（不分类型）
all_stream_ids = await stream_api.get_stream_ids_from_db("")
```

注意 `get_all_stream_ids()` 是同步函数（不加 `await`），因为它只读内存字典；而 `get_stream_ids_from_db` 是异步的。

## 24.5 流的消息：加载、查询、入库

`stream_api` 提供几组操作流内消息的函数。这里要把它们的边界和 `message_api` 划清楚——后面会专门讲。

### 加载内存上下文：`load_stream_context`

```python
context = await stream_api.load_stream_context(stream_id, max_messages=100)
```

返回一个 `StreamContext` 对象，里面 `history_messages` 是从 DB 加载的历史消息（运行时 `Message` 对象，不是 dict）。

`max_messages` 控制最多加载多少条，`None` 表示全部。需要注意：

> **如果这个流之前被清空过上下文（`context_cleared_at` 不为 None），`load_stream_context` 只会加载清空时间点之后的消息。**

这是 `bulk_clear_streams` / `load_and_clear_context` 的清空效果能跨重启生效的原因——清空不是真的删消息，而是给流打一个"时间戳分界线"，加载时自动过滤。

### 分页查消息：`get_stream_messages`

```python
messages = await stream_api.get_stream_messages(
    stream_id, limit=100, offset=0,
)
```

返回运行时 `Message` 对象列表，支持分页。和 `load_stream_context` 不同的是：

- `load_stream_context` 返回 `StreamContext`（含 history_messages 字段）
- `get_stream_messages` 直接返回 `list[Message]`，不分历史 / 未读

### 入库消息：`add_message` / `add_sent_message_to_history`

这两个函数让你把一条运行时 `Message` 对象写入 DB 并更新内存上下文：

```python
# 入站消息（用户发的）—— 进入 unread_messages
db_record = await stream_api.add_message(message)

# 出站消息（Bot 发的）—— 直接进 history_messages，不进 unread
db_record = await stream_api.add_sent_message_to_history(message)
```

注意它们的区别：

| 函数 | 写 DB | 进 unread | 进 history | 典型用途 |
|------|-------|-----------|-----------|---------|
| `add_message` | ✓ | ✓ | ✗（等 Chatter 消化后再 flush） | 处理一条入站消息 |
| `add_sent_message_to_history` | ✓ | ✗ | ✓ | 记录 Bot 自己发出去的消息 |

`add_message_to_stream` 是 `add_message` 的别名，行为完全一样。

::: warning 正常情况下你不需要手动调这两个函数
系统在收到平台消息时会自动调 `add_message`，`send_api` 在发送消息后也会自动调 `add_sent_message_to_history`。**只有你在做"重放历史消息"或"伪造一条消息入库"这种特殊场景，才需要手动调。**
:::

## 24.6 流的生命周期：激活、刷新、删除

`stream_api` 提供三个生命周期函数：

| 函数 | 作用 | 典型场景 |
|------|------|---------|
| `activate_stream(stream_id)` | 更新流的 `last_active_time` | 你想标记某流"刚被用过"，避免被 TTL 清理 |
| `refresh_stream(stream_id)` | 清掉内存实例，从 DB 重新构建 | 你改了 DB，想让内存里的流也同步 |
| `delete_stream(stream_id, delete_messages=True)` | 删除流（可选连消息一起删） | 用户注销 / 群解散 |

`refresh_stream` 在你用 `database_api` 直接改了 `ChatStreams` 表后很有用——它会让内存里的 `ChatStream` 实例丢掉旧数据，从 DB 重新加载。

`delete_stream` 默认会把这个流的所有 `Messages` 也一起删掉。如果你只想删流记录、保留消息（罕见），传 `delete_messages=False`。

## 24.7 清空上下文：`stream_api` 最有特色的一组能力

这一节单独讲，因为它是 `stream_api` 和 `message_api` 最不一样的地方，也是真实项目里用得最多的一组函数。

"清空上下文"回答的需求是：

> **让一个流"忘掉之前所有对话"，从空白重新开始，但不删数据库。**

`stream_api` 提供三种清空方式：

### `clear_context(stream_id)`：只清内存

```python
ok = stream_api.clear_context(stream_id)
# True 表示清成功，False 表示这个流当前不在内存里
```

只清内存里的 `history_messages` 和 `unread_messages`。**不写 DB**，所以进程重启后，上下文会从 DB 重新加载，清空效果丢失。

适合：你在调试时想立刻让某流的内存上下文归零。

### `load_and_clear_context(stream_id)`：瞬时清空 + 持久化标记

```python
ok = await stream_api.load_and_clear_context(stream_id)
# 始终返回 True
```

如果流已在内存，立即清空；如果不在内存，打个"待清空"标记，下次加载时自动应用。同时把 `context_cleared_at` 时间戳写到 DB，**重启后效果依然生效**。

适合：用户发 `/清空上下文` 命令时调用。

### `bulk_clear_streams(chat_type="")`：批量清空

```python
count = await stream_api.bulk_clear_streams("group")  # 清空所有群聊
count = await stream_api.bulk_clear_streams("")       # 清空所有流
```

通过一条 UPDATE SQL 批量设置 `context_cleared_at`，效率极高。返回受影响的流数量。

适合：管理员想一次性重置所有群 / 所有私聊的上下文。

### 这三种清空共同的关键点

> **清空不是删消息，是给流打一个时间戳分界线。**

`Messages` 表里的数据完全不动。只是后续 `load_stream_context` 加载消息时，会过滤掉 `time <= context_cleared_at` 的消息。这就是为什么清空能跨重启生效，且不破坏消息历史。

## 24.8 一个完整的真实例子：清空上下文命令

`utility_commands` 插件里有一个 `清空上下文` 命令，几乎用到了上面所有概念。这是一个简化版：

```python
from __future__ import annotations

from src.app.plugin_system.api import stream_api
from src.app.plugin_system.api.send_api import send_text
from src.app.plugin_system.base import BaseCommand, cmd_route
from src.app.plugin_system.types import ChatStream, PermissionLevel


class ClearContextCommand(BaseCommand):
    """清空聊天上下文命令（仅主人可用）。"""

    command_name = "清空上下文"
    permission_level: PermissionLevel = PermissionLevel.OWNER

    @cmd_route()
    async def handle_clear_current(self) -> tuple[bool, str]:
        """清空当前聊天流的上下文。"""
        # 1. 用 self.stream_id 拿到当前流的哈希 ID
        # 2. load_and_clear_context 会持久化清空时间戳，重启后依然生效
        await stream_api.load_and_clear_context(self.stream_id)
        await send_text("✓ 当前聊天上下文已清空。", stream_id=self.stream_id)
        return True, "cleared"

    @cmd_route("群", "<group_id>")
    async def handle_clear_group(self, group_id: str = "") -> tuple[bool, str]:
        """清空指定群的上下文；留空则清空所有群。"""
        if group_id:
            # 用平台 + 群号现算 stream_id（哈希）
            platform = self._message.platform if self._message else ""
            sid = ChatStream.generate_stream_id(platform, group_id=group_id)
            await stream_api.load_and_clear_context(sid)
            await send_text(
                f"✓ 群 {group_id} 的上下文已清空。", stream_id=self.stream_id
            )
            return True, "cleared"

        # 批量清空所有群聊流
        count = await stream_api.bulk_clear_streams("group")
        await send_text(
            f"✓ 已清空 {count} 个群聊的上下文。", stream_id=self.stream_id
        )
        return True, f"cleared {count} group streams"

    @cmd_route("all")
    async def handle_clear_all(self) -> tuple[bool, str]:
        """清空所有聊天流的上下文。"""
        count = await stream_api.bulk_clear_streams()
        await send_text(
            f"✓ 已清空 {count} 个流的上下文。", stream_id=self.stream_id
        )
        return True, f"cleared {count} streams"
```

这个例子把这一章最关键的几个点都串起来了：

- 命令里用 `self.stream_id` 拿当前流的哈希 ID
- 用 `ChatStream.generate_stream_id(platform, group_id=...)` 把群号转成哈希
- 用 `load_and_clear_context` 单流清空（持久化）
- 用 `bulk_clear_streams("group")` 批量清空（一条 SQL）
- 用 `send_text` 把结果发回去（第 23 章的 `send_api`）

## 24.9 `stream_api` vs `message_api` vs `send_api`：边界一次说清

这一节是这一章最值得收的一刀，因为这三层 API 都和"消息"有关，特别容易搅在一起。

| 维度 | `stream_api` | `message_api` | `send_api` |
|------|--------------|---------------|------------|
| 操作对象 | 流（容器） | 消息（内容） | 消息（要发的） |
| 读 / 写 | 读写都有 | 只读 | 只写 |
| 直接操作 DB | 是（`ChatStreams` + `Messages`） | 是（只读 `Messages`） | 否（通过 `MessageSender`） |
| 维护内存上下文 | 是（`ChatStream` + `StreamContext`） | 否 | 否（但 `add_sent_message_to_history` 会更新上下文） |
| 典型动作 | 创建 / 清空 / 刷新流 | 查 / 数 / 拼文本 | 发文本 / 发图 / 广播 |

简而言之：

> **`stream_api` 管"容器"，`message_api` 读"内容"，`send_api` 发"新内容"。**

更具体一点：

- 你想"查最近 N 条消息" → `message_api`（不要用 `stream_api.get_stream_messages`，那个返回运行时对象，不方便拼文本）
- 你想"发一条消息" → `send_api`（不要手动构造 `Message` 再调 `stream_api.add_message`，那是入库不是发送）
- 你想"让某流忘掉上下文" → `stream_api.load_and_clear_context`（这是 `message_api` / `send_api` 都做不到的）
- 你想"拿到一个流的 platform / group_id" → `stream_api.get_stream_info`（`send_api` 内部也是这么干的）

把这条边界立住，你就不会写出"想发消息却调了 `add_message`"、"想清上下文却去 `delete from messages`"这种错位代码。

## 24.10 这里最容易踩的几个坑

### 坑一：把 `add_message` 当发送函数用

名字看起来像"加一条消息"，但它是**入库**，不是发送。它只会把消息写到 `Messages` 表 + 进 `unread_messages`，不会触发任何对外发送。

想发送，用 `send_api.send_text` 等（系统会自动把发出的消息调 `add_sent_message_to_history` 入库）。

### 坑二：手动改 `stream.context.history_messages`

直接 `.clear()` 或 `.append()` 看起来能用，但它绕过了 `context_cleared_at` 的持久化机制。重启后，DB 里的消息会被 `load_stream_context` 重新加载，你的"清空"就丢了。

要清空，永远走 `load_and_clear_context` / `bulk_clear_streams`。

### 坑三：用 `get_all_stream_ids` 查"所有群"

`get_all_stream_ids()` 只返回**当前在内存里**的流。进程刚启动时，只有被访问过的流才在内存里——大量历史流还躺在 DB 里没被加载。

要查所有流，用 `get_stream_ids_from_db(chat_type)`。

### 坑四：`get_stream_info` 改了 DB 后还返回旧值

`get_stream_info` 有 `alru_cache`。如果你用 `storage_api.db.session()` 直接改了 `ChatStreams` 表的某行，紧接着调 `get_stream_info` 会拿到缓存里的旧数据。

解决：改完后调 `stream_api.clear_stream_cache(stream_id)`。

### 坑五：以为 `delete_stream` 只删流不删消息

默认 `delete_messages=True`，会把这个流的 `Messages` 全删。如果你只是想"重置流记录"而保留消息（罕见需求），必须显式传 `delete_messages=False`。

而且，删完消息后 `message_api` 也查不到了——因为消息真的从 `Messages` 表被删了，不是被打时间戳过滤。

### 坑六：在 `__init__` / 模块导入时调 `stream_api`

`stream_api` 内部延迟获取 `StreamManager`，但在插件加载极早期，数据库引擎可能还没就绪。`get_or_create_stream` 这种会写 DB 的调用，放到 `on_plugin_loaded` 或运行时回调里更稳。

### 坑七：私聊流忘了传 `chat_type`

`get_or_create_stream` 默认 `chat_type="private"`。如果你建的是群聊流却忘了传 `chat_type="group"`，会被当成私聊流建进 DB，后面 `send_api` 解析目标时会出错（按私聊去查 `person_id` 而不是 `group_id`）。

养成习惯：**建流时永远显式传 `chat_type`**。

## 24.11 `stream_api` 速查

`stream_api` 定义于 `src/app/plugin_system/api/stream_api.py`，所有异步函数标注 `异步`。

### 创建与获取

| 函数 | 签名要点 | 返回 | 说明 |
|------|---------|------|------|
| `get_or_create_stream` 异步 | `(stream_id="", platform="", user_id="", group_id="", chat_type="private")` | `ChatStream` | 获取或创建流（幂等） |
| `get_stream` 异步 | `(stream_id)` | `ChatStream \| None` | 只取内存中已有的流，不创建 |
| `build_stream_from_database` 异步 | `(stream_id)` | `ChatStream \| None` | 从 DB 重新构建流（不入单例字典） |

### 信息查询

| 函数 | 签名要点 | 返回 | 说明 |
|------|---------|------|------|
| `get_stream_info` 异步 | `(stream_id)` | `dict \| None` | 流综合信息（带 `alru_cache`） |
| `get_all_stream_ids` | `()` | `list[str]` | 内存中所有活跃流 ID（同步） |
| `get_stream_ids_from_db` 异步 | `(chat_type="")` | `list[str]` | DB 中所有流 ID，可按类型过滤 |

### 消息操作

| 函数 | 签名要点 | 返回 | 说明 |
|------|---------|------|------|
| `load_stream_context` 异步 | `(stream_id, max_messages=None)` | `StreamContext` | 从 DB 加载上下文（受 `context_cleared_at` 过滤） |
| `get_stream_messages` 异步 | `(stream_id, limit=100, offset=0)` | `list[Message]` | 分页取流的消息（运行时对象） |
| `add_message` 异步 | `(message)` | `Messages` | 入站消息入库 + 进 unread（系统自动调） |
| `add_message_to_stream` 异步 | `(message)` | `Messages` | `add_message` 的别名 |
| `add_sent_message_to_history` 异步 | `(message)` | `Messages` | 出站消息入库 + 进 history（系统自动调） |

### 生命周期

| 函数 | 签名要点 | 返回 | 说明 |
|------|---------|------|------|
| `activate_stream` 异步 | `(stream_id)` | `ChatStream \| None` | 更新 `last_active_time` |
| `refresh_stream` 异步 | `(stream_id)` | `ChatStream \| None` | 清内存 + 从 DB 重建 |
| `delete_stream` 异步 | `(stream_id, delete_messages=True)` | `bool` | 删除流（可选连消息删） |
| `clear_stream_cache` | `(stream_id=None)` | `None` | 清理流实例缓存（同步，让 `get_stream_info` 缓存失效） |

### 上下文清空

| 函数 | 签名要点 | 返回 | 说明 |
|------|---------|------|------|
| `clear_context` | `(stream_id)` | `bool` | 只清内存上下文（不写 DB，重启丢） |
| `load_and_clear_context` 异步 | `(stream_id)` | `bool`（恒 True） | 瞬时清空 + 持久化时间戳（跨重启生效） |
| `bulk_clear_streams` 异步 | `(chat_type="")` | `int` | 批量清空（一条 UPDATE SQL） |

### `ChatStream.generate_stream_id`

虽然不在 `stream_api` 里，但和它紧密相关。从 `plugin_system.types` 拿：

```python
from src.app.plugin_system.types import ChatStream

# 群聊
sid = ChatStream.generate_stream_id("qq", group_id="123456")
# 私聊
sid = ChatStream.generate_stream_id("qq", user_id="987654")
```

## 24.12 这一章先收在这里

本章只覆盖 `stream_api` 的 API 用法。把这一章压成最后几句话，我最希望你记住的是：

1. **`get_or_create_stream` 是幂等的**，对同一 `stream_id` 调多次返回同一单例；想拿元信息用 `get_stream_info`（带缓存），想列所有流用 `get_stream_ids_from_db`。
2. **清空上下文不是删消息，是打时间戳分界线**——`load_and_clear_context` 单流清空、`bulk_clear_streams` 批量清空，两者都跨重启生效。
3. **`add_message` 是入库不是发送**，想发消息走 `send_api`。
4. **不要手动改 `stream.context.history_messages`**，要清空走 `load_and_clear_context`。

至于"聊天流到底是什么"、`ChatStream` / `StreamContext` 的结构与可读字段，统一在 [16.5 Stream](./16.5-stream) 里讲。

到这里为止，`plugin_system.api` 这一层里和"运行时能力"相关的高频入口——`adapter_api` / `storage_api` / `message_api` / `send_api` / `stream_api`——都已经讲完了。它们合起来构成了插件作者真正日常会用的那层"系统能力入口"。

如果你想继续深入，下一站很自然的方向是看其它几个相对低频但同样有用的 API（`chat_api` / `event_api` / `permission_api` / `plugin_api` 等），或者回到 [指南总览](./) 看完整路线图。
