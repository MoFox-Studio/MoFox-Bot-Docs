# 23. 消息 API：怎样查历史消息，怎样把消息真正发出去

> **导读** 本章介绍插件系统里和“消息”打交道的两层公共 API——`message_api`（消息查找）和 `send_api`（消息发送）。前者只读，从数据库里按时间、按聊天流、按用户查历史消息，并把行结果映射成统一的扁平 `dict`；后者只写，通过 `MessageSender` 把一条消息送到指定 `stream_id`，并自动处理平台推断、Bot 信息、群/私聊目标解析。本章会先把“查”和“发”这两条链路分别讲清楚，再帮你立住“什么时候用 `message_api`，什么时候用 `send_api`，什么时候又该走 `send_adapter_command`”这条边界。

前面几章里，消息其实一直隐含在场：

- 第 19 章讲过消息模型
- 第 21 章讲过用 `adapter_api` 调平台
- 第 22 章的例子里甚至顺手用过 `message_api.get_recent_messages`

但直到现在，我们还没有正面把“插件作者到底怎样和消息这条线打交道”讲清楚。

这一章就把这件事补上。

要讲清楚它，必须先看明白一件事：在 Neo-MoFox 里，“消息”和“消息”不是同一种东西：

- 有一类是 **已经落库的历史消息**——你想查、想统计、想拼成上下文给模型看
- 有一类是 **现在要发出去的新消息**——你想生成、想发送、想批量推到多个群

这两类事背后走的是完全不同的链路，所以它们对应两套不同的 API：

| 关注点 | API | 操作 | 数据来源 / 目的地 |
|--------|-----|------|------------------|
| 已经存在的历史消息 | `message_api` | 只读（查、数、拼文本） | 主数据库 `Messages` 表 |
| 要发出去的新消息 | `send_api` | 只写（构造 + 发送） | `MessageSender` → 适配器 → 平台 |

这一章要讲的，就是这两套 API 各自的用法、它们内部的链路，以及那条最容易混淆的边界。

## 23.1 先把一句话记住：`message_api` 只读，`send_api` 只写

这一句话听起来像废话，但它其实是这一章最值得先立住的边界。

因为很多插件作者第一次接触消息 API，会下意识找一个“既能查又能发”的统一入口。但当前设计不是这条路：

> **`message_api` 里的所有函数都是只读的——它们不会写入、不会修改、不会发送任何消息。**

> **`send_api` 里的所有函数都是只写的——它们不会查历史、不会统计、不会读任何消息。**

也就是说，你在 `message_api` 里找不到任何“把这条消息发出去”的函数；同理，`send_api` 里也没有任何“查最近 N 条”的函数。

把这条边界立住，你后面看代码时，就不会出现“我明明调了一个叫 `get_messages` 的函数，怎么没人收到消息”这种混淆——`get_messages` 是查询，不是发送。

## 23.2 这两层 API 的导入边界

按前面一直在遵循的入口原则：

```python
from src.app.plugin_system.api import message_api, send_api
```

也就是说，你从 `plugin_system.api` 这一层就能同时拿到两套 API。它们在 `api/__init__.py` 里已经被聚合好，不需要再分别下钻到 `src.core.transport` 或 `src.core.models`。

需要用到 `Message` / `MessageType` 这类常用类型时，按第 20 章的指引从 `plugin_system.types` 拿：

```python
from src.app.plugin_system.types import Message, MessageType
```

## 23.3 在开始之前：`stream_id` 是哈希，不是原始平台 ID

在正式讲两个 API 之前，有一件事必须先说清楚，否则你后面所有例子都会踩坑：

> **`message_api` 和 `send_api` 里出现的 `stream_id`，永远是 SHA-256 哈希值，不是 `"qq_group_123456"` 这种原始字符串。**

这一点对这两个 API 都成立，而且原因不同：

- 对 `message_api`：`Messages` 表里存的 `stream_id` 列就是哈希值，所以你查的时候也必须传哈希值，否则永远查不到。
- 对 `send_api`：`stream_id` 已哈希化，无法从字符串本身反推 platform，所以要么显式传 `platform` / `adapter_signature`，要么由 `stream_manager` 反查。

哈希值由 `ChatStream.generate_stream_id(platform, user_id, group_id)` 生成，规则是：

```python
# 群聊
key = f"{platform}_{group_id}"
stream_id = sha256(key.encode()).hexdigest()

# 私聊
key = f"{platform}_{user_id}_private"
stream_id = sha256(key.encode()).hexdigest()
```

也就是说，**你没法手写一个 `stream_id` 字符串**（它是 64 位十六进制哈希），只能通过以下方式拿到：

| 场景 | 怎么拿 `stream_id` |
|------|-------------------|
| 在 Command 里 | `ctx.stream_id`（命令上下文自带，已经是哈希） |
| 在 Chatter / Tool / Agent 里 | `self.stream_id`（字符串 ID） |
| 在 Action 里 | `self.chat_stream.stream_id`（Action 拿到的是 `ChatStream` 对象本身） |
| 收到一条 `Message` | `message.stream_id`（已经填好） |
| 想按 platform + group_id 现算一个 | `ChatStream.generate_stream_id("qq", group_id="123456")` |
| 想反查 stream 信息 | `stream_api.get_stream_info(stream_id)` 或 `stream_manager.get_stream_info(stream_id)` |

本章后面所有示例里的 `stream_id` 变量，都默认它是上面任一方式拿到的哈希值，而不是原始字符串。

::: tip 一个判断方法
如果你看到的 `stream_id` 字符串里包含下划线、字母群组号、`group`、`private` 这些人类可读词——它几乎肯定不是合法 stream_id，而是原始 ID。真正的 stream_id 是一串 64 位十六进制字符，看起来像 `a1b2c3d4...`。
:::

## 23.4 先看 `message_api`：查历史消息

`message_api` 是一组只读的扁平函数，背后走的是主数据库的 `Messages` 表，使用和第 22 章讲的一样的 `QueryBuilder`，但封装成了对插件作者更友好的语义化接口。

它要回答的问题大致是：

- “指定时间范围内，有哪些消息？”
- “指定 stream 里、指定用户、最近 N 条消息是什么？”
- “这个 stream 最近 24 小时有多少新消息？”
- “把这些消息拼成一段可读文本给我，我要塞给模型当上下文。”

### 23.4.1 一个最小例子：拉最近 24 小时群消息

为了让这层 API 不悬空，先看一个最小用法：

```python
from src.app.plugin_system.api import message_api


async def summarize_recent(stream_id: str) -> str:
    # 拉最近 24 小时、最多 200 条、过滤掉 Bot 自己的消息
    messages = await message_api.get_recent_messages(
        stream_id=stream_id,
        hours=24,
        limit=200,
        filter_bot=True,
    )

    if not messages:
        return "最近没有可用的消息"

    # 拼成可读文本
    text = await message_api.build_readable_messages_to_str(
        messages,
        merge_messages=True,        # 同一人的连续消息合并
        timestamp_mode="relative",  # "5分钟前" 这种相对时间
    )
    return text
```

这个例子已经把 `message_api` 最常用的两个函数串起来了：

- `get_recent_messages()` 按 stream + 时间窗拉历史
- `build_readable_messages_to_str()` 把结构化消息拼成可读文本

接下来我们看看每个函数到底怎么用。

### 23.4.2 查询函数家族

`message_api` 的查询函数可以分成三组，按“约束维度”组合：

#### 第一组：按时间范围查

| 函数 | 约束 | 说明 |
|------|------|------|
| `get_messages_by_time(start, end, ...)` | 只按时间 | 全局所有 stream 在该范围内的消息 |
| `get_messages_by_time_in_chat(stream_id, start, end, ...)` | 时间 + stream | 某 stream 在该范围内的消息（开区间） |
| `get_messages_by_time_in_chat_inclusive(stream_id, start, end, ...)` | 时间 + stream | 同上，但闭区间（包含边界时间） |
| `get_messages_by_time_for_users(start, end, person_ids, ...)` | 时间 + 用户 | 全局所有 stream 里这些用户的消息 |
| `get_messages_by_time_in_chat_for_users(stream_id, start, end, person_ids, ...)` | 时间 + stream + 用户 | 某 stream 里这些用户的消息 |

#### 第二组：按“某时间点之前”查

| 函数 | 约束 | 说明 |
|------|------|------|
| `get_messages_before_time(timestamp, ...)` | 只按时间 | 全局该时间点之前的消息 |
| `get_messages_before_time_in_chat(stream_id, timestamp, ...)` | 时间 + stream | 某 stream 该时间点之前的消息 |
| `get_messages_before_time_for_users(timestamp, person_ids, ...)` | 时间 + 用户 | 全局这些用户该时间点之前的消息 |

#### 第三组：常用便捷函数

| 函数 | 说明 |
|------|------|
| `get_recent_messages(stream_id, hours=24, limit=100, ...)` | “最近 N 小时”的便捷写法 |
| `get_random_chat_messages(start, end, ...)` | 随机选一个 stream，返回该 stream 在范围内的消息 |
| `count_new_messages(stream_id, start, end=None)` | 统计某 stream 在时间窗内的新消息数 |
| `count_new_messages_for_users(stream_id, start, end, person_ids)` | 同上，但只算这些用户 |

这些函数有几个共享参数值得专门记：

| 参数 | 取值 | 说明 |
|------|------|------|
| `limit` | `int`（默认 0） | 0 表示不限制；正数表示最多取 N 条 |
| `limit_mode` | `"latest"` / `"earliest"` | 命中 `limit` 时取最新的 N 条还是最早的 N 条 |
| `filter_bot` | `bool` | 是否过滤掉 Bot 自己发的消息 |
| `filter_command` | `bool` | 是否过滤掉命令消息（仅 `in_chat` 系列支持） |

### 23.4.3 返回的消息字典长什么样

`message_api` 的所有查询函数返回的都是 `list[dict]`，不是 ORM 对象。每个 `dict` 的字段是统一的：

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `int` | 数据库主键 |
| `message_id` | `str` | 平台消息 ID |
| `time` | `float` | 消息时间戳（秒） |
| `stream_id` | `str` | 聊天流 ID |
| `person_id` | `str` | 发送者的 person_id |
| `sender_id` | `str` | 发送者平台 user_id（从 person_info 反查） |
| `sender_name` | `str` | 发送者显示名（昵称 / 群名片 / user_id） |
| `sender_cardname` | `str \| None` | 群名片 |
| `message_type` | `str` | 消息类型，如 `"text"` |
| `content` | `Any` | 原始内容 |
| `processed_plain_text` | `str` | 人类可读纯文本（最有用） |
| `reply_to` | `str \| None` | 回复目标消息 ID |
| `platform` | `str` | 平台名 |
| `extra` | `dict` | 扩展字段（当前固定为 `{}`） |

这里有几个字段值得专门说一下：

- **`processed_plain_text`** 是你拼上下文时最该用的字段。它已经是平台无关的可读文本，不用你再解析 `content`。
- **`sender_id` 和 `sender_name`** 是 `message_api` 内部帮你 join 了 `PersonInfo` 表后填上的，所以你拿到的不只是冷冰冰的 `person_id`，而是真正能显示的发送者信息。
- **`time`** 是 `float`（秒级时间戳），方便你排序和计算时间差。

### 23.4.4 把消息拼成可读文本

拉到消息后，最常见的下一步是拼成一段文本塞给模型。`message_api` 提供了两个函数：

| 函数 | 返回 | 用途 |
|------|------|------|
| `build_readable_messages_to_str(messages, ...)` | `str` | 只要可读文本 |
| `build_readable_messages_with_details(messages, ...)` | `tuple[str, list[tuple[float, str, str]]]` | 文本 + 每行 `(time, sender, content)` 明细 |

它们支持的参数：

| 参数 | 取值 | 说明 |
|------|------|------|
| `replace_bot_name` | `bool`（默认 `True`） | 把 `Bot` / `机器人` 之类名字替换成 `你` |
| `merge_messages` | `bool`（默认 `False`） | 同一发送者的连续消息用 `/` 合并 |
| `timestamp_mode` | `"relative"` / `"absolute"` | 相对时间（“5分钟前”）或绝对时间（`2024-01-01 12:00:00`） |
| `truncate` | `bool`（默认 `False`） | 单条超 120 字符截断 |
| `read_mark` | `float`（默认 0） | 插入 `--- 未读消息 ---` 分隔线 |
| `show_actions` | `bool`（默认 `False`） | 是否包含动作消息（仅 `to_str`） |

`build_readable_messages_to_str` 输出长这样：

```text
[5分钟前] 张三: 你好啊
[4分钟前] 李四: / 早 / 中饭吃了吗
[刚刚] 你: 收到，我看看
```

这个格式对喂给模型做对话总结、上下文压缩非常友好。

### 23.4.5 辅助函数

`message_api` 还有两个小辅助函数：

| 函数 | 作用 |
|------|------|
| `get_person_ids_from_messages(messages)` | 从消息列表里去重提取 `person_id` |
| `filter_bot_messages(messages)` | 过滤掉 Bot 自己的消息（和 `filter_bot=True` 等价，但可单独调用） |

这两个函数主要是给“你已经拿到一批消息，想做后续处理”的场景用的。

### 23.4.6 `message_api` 一个稍完整的例子

下面是一个“找出某 stream 里过去 1 小时最活跃的用户”的完整片段：

```python
from collections import Counter

from src.app.plugin_system.api import message_api


async def top_speakers(stream_id: str, hours: float = 1.0, top_n: int = 5):
    import time
    now = time.time()
    start = now - hours * 3600

    messages = await message_api.get_messages_by_time_in_chat(
        stream_id=stream_id,
        start_time=start,
        end_time=now,
        filter_bot=True,
        filter_command=True,
    )

    counter: Counter[str] = Counter()
    name_by_id: dict[str, str] = {}
    for msg in messages:
        sender_id = str(msg.get("sender_id") or "unknown")
        counter[sender_id] += 1
        name_by_id.setdefault(sender_id, str(msg.get("sender_name") or sender_id))

    return [
        (name_by_id[sid], count)
        for sid, count in counter.most_common(top_n)
    ]
```

注意几件事：

- 同时用 `filter_bot=True` 和 `filter_command=True`，把命令消息和 Bot 自己发的消息一起排除掉，统计才更准
- 用 `sender_id` 做聚合 key，用 `sender_name` 做展示——因为同一用户在不同群可能有不同群名片，但 `sender_id` 在同一平台是稳定的
- 没有指定 `limit`，默认取全部

## 23.5 现在看 `send_api`：把消息发出去

讲完查询，我们来看发送。

`send_api` 是一组只写的扁平函数，背后走的是 `MessageSender`。它要回答的问题是：

- “我想给某 stream 发一段文本”
- “我想发一张图、一段语音、一个文件”
- “我想批量把同一条消息推到多个群”
- “我想直接发一个 `Message` 对象”

### 23.5.1 一个最小例子：回一段文本

```python
from src.app.plugin_system.api import send_api


async def reply_hello(stream_id: str) -> None:
    ok = await send_api.send_text("你好！", stream_id)
    if not ok:
        # 发送失败的处理
        ...
```

就这么简单。`send_text` 接收文本内容 + stream_id，剩下的（平台推断、bot 信息、群/私聊目标）`send_api` 内部会替你处理。

### 23.5.2 各类型消息的发送函数

`send_api` 为每种常见消息类型都提供了一个便捷函数，签名高度一致：

| 函数 | 关键参数 | 说明 |
|------|---------|------|
| `send_text(content, stream_id, ...)` | `content: str` | 文本 |
| `send_image(image_data, stream_id, ...)` | `image_data: str`（base64 或 URL） | 图片 |
| `send_emoji(emoji_data, stream_id, ...)` | `emoji_data: str` | 表情包 |
| `send_voice(voice_data, stream_id, ...)` | `voice_data: str` | 语音 |
| `send_video(video_data, stream_id, ...)` | `video_data: str` | 视频 |
| `send_file(file_path, stream_id, ...)` | `file_path: str`，可选 `file_name` | 文件 |
| `send_custom(content, message_type, stream_id, ...)` | 任意 `content`，类型可自定义 | 自定义类型（如 `music`） |
| `send_message(message, ...)` | 一个 `Message` 对象 | 直接发送已构造好的 Message |

这些函数共有的几个参数：

| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `stream_id` | `str` | 必填 | 目标聊天流 ID |
| `platform` | `str \| None` | `None` | 平台名；不传时从 stream_info 推断 |
| `reply_to` | `str \| None` | `None` | 要回复的消息 ID（`send_text` / `send_image` 支持） |
| `processed_plain_text` | `str` | 各类型有默认值 | 人类可读文本，会落库，建议显式传 |
| `adapter_signature` | `str \| None` | `None` | 直接指定目标适配器签名，绕过平台推断 |

这里有几个值得专门记的点。

### 23.5.3 `adapter_signature`：什么时候要显式指定

默认情况下，`send_api` 会从 `stream_id` 反查 `stream_info`，拿到 `platform`，再找这个 platform 上已启动的适配器。

但有两种情况你会想显式传 `adapter_signature`：

1. **多适配器同平台**：你有两个 OneBot 适配器（两个 Bot），想指定通过哪一个发。
2. **`stream_id` 无法反查 platform**：当前 `stream_id` 已哈希化，如果 `stream_manager` 里没有这条流的信息，`send_api` 会因为推不出 platform 而失败。

显式传 `adapter_signature` 时，`platform` 参数会被忽略——以适配器自身的 `platform` 为准：

```python
# stream_id 这里应是哈希值（从 ctx.stream_id / message.stream_id 等渠道拿到）
ok = await send_api.send_text(
    "通过指定适配器发送",
    stream_id,
    adapter_signature="onebot:adapter:napcat",
)
```

格式和第 21 章一致：`{plugin_name}:adapter:{adapter_name}`。

### 23.5.4 `processed_plain_text`：别忽略这个字段

很多新手会忽略 `processed_plain_text`，觉得“我发图片，这个字段没什么用”。

但实际上它非常重要：

> **`processed_plain_text` 是这条消息的人类可读文本表示，会被落库，也会被 `message_api` 查出来当上下文。**

如果你发图片不传这个字段，库里存的可能是默认值 `"[图片]"`，后面 `message_api.build_readable_messages_to_str` 拼出来的上下文里就只有 `[图片]` 三个字——模型完全不知道这张图是什么。

所以养成习惯：**发非文本消息时，显式传一个有意义的 `processed_plain_text`**。

```python
await send_api.send_image(
    image_data=img_b64,
    stream_id=stream_id,
    processed_plain_text="[图片：一张猫咪表情包]",  # 显式描述
)
```

这样后面拼上下文时模型能“看见”这张图是什么。

### 23.5.5 内部到底怎么把消息送出去的

这一节是理解 `send_api` 最关键的部分。建议先记流向。

一次 `send_api.send_text(content, stream_id, ...)` 的内部链路大致是这样：

```text
send_api.send_text(content, stream_id, ...)
  └─ _send_message(content, message_type=TEXT, stream_id, platform, ...)
      1. 从 stream_manager.get_stream_info(stream_id) 拿 stream 真实信息
         - platform
         - chat_type（group / private）
         - group_id 或 person_id
      2. 解析 bot 信息
         - 若指定 adapter_signature：从该适配器实例拿 platform + bot_info
         - 否则：按 platform 调 adapter_manager.get_bot_info_by_platform
      3. 解析目标
         - group → extra["target_group_id"] = str(group_id)
         - private → 通过 person_id 反查 user_id，填 extra["target_user_id"]
      4. 构造 Message 对象
         - message_id 自动生成（f"api_{type}_{uuid4().hex}"）
         - sender_id = bot_info["bot_id"]
         - sender_name = bot_info["bot_name"]
      5. 调用 MessageSender.send_message(message, adapter_signature=...)
                                      │
                                      ▼
                      MessageSender 找到目标适配器
                          → 调用 adapter._send_platform_message(envelope)
                          → 适配器把统一消息翻译成平台格式
                          → 真正调平台 API 发送
```

你看完这张图应该能立刻明白几件事：

1. **`send_api` 不直接调平台**——它只是把一条 `Message` 构造好，再交给 `MessageSender`，`MessageSender` 再交给适配器。
2. **stream_id 是必须的**——`send_api` 通过它反查 `platform` / `chat_type` / 目标 ID。
3. **私聊目标要靠 person_id → user_id 反查**——所以如果 person_info 缺失，私聊可能发不出去或发给 bot 自己。
4. **bot 信息来自适配器**——这就是为什么“适配器没启动”时发送会失败。

### 23.5.6 批量与广播

除了单条发送，`send_api` 还提供三个组合发送函数：

| 函数 | 签名 | 说明 |
|------|------|------|
| `send_batch(messages, adapter_signature=None)` | `list[Message]` → `list[bool]` | 顺序发送，保证顺序 |
| `send_batch_parallel(messages, adapter_signature=None)` | `list[Message]` → `list[bool]` | 并行发送，更快但顺序不保证 |
| `broadcast_text(content, stream_ids, platform=None)` | `str` + `list[str]` → `dict[str, bool]` | 把同一段文本广播到多个 stream |

注意 `broadcast_text` 有一个特别的地方：

> **`broadcast_text` 必须显式传 `platform`，或保证每个 stream 在 stream_manager 里有 platform 信息。**

因为 `stream_id` 已经哈希化，`broadcast_text` 无法从 `stream_id` 字符串本身反推 platform。如果某 stream 反查失败，对应位置会返回 `False`。

例子：

```python
from src.core.models.stream import ChatStream


async def broadcast_reboot_notice() -> dict[str, bool]:
    # 1. 用 ChatStream.generate_stream_id 把平台 + 群号转成哈希 stream_id
    #    （真实项目里这些群号通常来自配置或数据库）
    stream_ids = [
        ChatStream.generate_stream_id("qq", group_id="111111"),
        ChatStream.generate_stream_id("qq", group_id="222222"),
        ChatStream.generate_stream_id("qq", group_id="333333"),
    ]

    # 2. 显式传 platform，避免逐个反查
    results = await send_api.broadcast_text(
        "系统通知：服务即将重启",
        stream_ids,
        platform="qq",  # 显式指定，最稳
    )
    return results
    # results = {"<hash_a>": True, "<hash_b>": True, "<hash_c>": False}
```

### 23.5.7 组合发送：文本 + 图片

`send_api` 还提供了一个组合函数：

| 函数 | 说明 |
|------|------|
| `send_text_with_image(text, image_data, stream_id, ...)` | 先发文本，成功后再发图片 |

注意它内部其实是顺序调用两次 `send_text` + `send_image`，不是一次发一条“图文混合消息”。所以如果文本发送失败，图片不会发；如果文本成功但图片失败，返回 `False` 但文本已经发出去了。

## 23.6 一个完整一点的真实例子：消息总结 + 发送

把 `message_api` 和 `send_api` 串起来，写一个“总结最近聊天”的小工具：

```python
from __future__ import annotations

from src.app.plugin_system.api import llm_api, message_api, send_api
from src.app.plugin_system.base import BaseCommand, BasePlugin, cmd_route, register_plugin
from src.app.plugin_system.types import LLMPayload, ROLE, TaskType, Text


class SummarizeCommand(BaseCommand):
    """总结最近聊天：/summary [hours]"""

    @cmd_route("summary", alias=["总结"])
    async def handle_summary(self, ctx) -> None:
        hours = float(ctx.args.get("hours", 1))
        stream_id = ctx.stream_id

        # 1. 拉历史消息（用 message_api）
        messages = await message_api.get_recent_messages(
            stream_id=stream_id,
            hours=hours,
            limit=300,
            filter_bot=True,
            filter_command=True,
        )

        if not messages:
            await ctx.reply("最近没有可总结的消息")
            return

        # 2. 拼成可读文本
        transcript = await message_api.build_readable_messages_to_str(
            messages,
            merge_messages=True,
            timestamp_mode="relative",
            truncate=True,
        )

        # 3. 让模型总结（用 llm_api，第 10 章讲过）
        model_set = llm_api.get_model_set_by_task(TaskType.UTILS.value)
        request = llm_api.create_llm_request(model_set)
        request.add_payload(LLMPayload(role=ROLE.SYSTEM, content=[Text(
            "你是一个聊天总结助手，请用 3-5 条要点总结以下聊天记录，语言简练。"
        )]))
        request.add_payload(LLMPayload(role=ROLE.USER, content=[Text(
            f"以下是最近 {hours} 小时的聊天记录：\n\n{transcript}"
        )]))

        response = await request.send()
        summary = response.get_first_text() or "（模型没有返回内容）"

        # 4. 发回群里（用 send_api）
        await send_api.send_text(
            f"📋 最近 {hours} 小时聊天总结：\n\n{summary}",
            stream_id,
        )


@register_plugin
class SummarizePlugin(BasePlugin):
    plugin_name = "chat_summary"
    plugin_version = "1.0.0"
    plugin_description = "演示 message_api + llm_api + send_api 三层协作"

    def get_components(self) -> list[type]:
        return [SummarizeCommand]
```

这个例子把这一章和前面几章串得很完整：

- `message_api.get_recent_messages` 拉历史
- `message_api.build_readable_messages_to_str` 拼文本
- `llm_api` 调模型（第 10 章）
- `send_api.send_text` 把结果发回去

它也展示了插件系统里很典型的一条链路：

> **查历史 → 组织上下文 → 调模型 → 把结果发回去。**

这条链路你写熟了，绝大多数“基于聊天记录的智能功能”都能套这个骨架。

## 23.7 这里最容易踩的几个坑

### 坑一：把 `message_id` 当主键

`message_api` 返回的字典里有两个 ID：

- `id`：数据库主键（int，自增）
- `message_id`：平台消息 ID（str）

它们不一样。如果你要回复某条消息，用 `message_id`；如果你要做去重、做映射，用 `id` 更稳。

### 坑二：忽略 `limit_mode`

如果你 `limit=100` 但不传 `limit_mode`，默认是 `"latest"`——会取最新的 100 条。

如果你其实想要“最早的 100 条”（比如做历史归档），要显式传 `limit_mode="earliest"`。

### 坑三：私聊发送失败还不知道为什么

`send_api._send_message` 在解析私聊目标时，会通过 `person_id` 反查 `user_id`。如果查不到 `user_id`，会打 warning 但还是会往下走，最终可能把消息发给 bot 自己。

如果你写私聊场景，记得先确认 person_info 已落库（用户至少给 bot 发过一条消息）。

### 坑四：用原始平台 ID 当 `stream_id` 传进去

这是本章开头 23.3 节反复强调过、但还是要再提一次的坑，因为它对 `message_api` 和 `send_api` **都**成立。

对 `send_api`：`stream_id` 已哈希化，**不能**从字符串内容推断 platform。如果你不传 `platform` 也不传 `adapter_signature`，`send_api` 会从 `stream_manager` 查 platform——查不到就失败。最稳的做法：要么显式传 `adapter_signature`，要么保证 stream 已经在 stream_manager 注册过。

对 `message_api`：`Messages` 表里存的 `stream_id` 列**就是哈希值**。如果你传一个像 `"qq_group_123456"` 的原始字符串去查，永远查不到任何消息——不会报错，只会返回空列表。

最稳的源头永远是：

- 命令里用 `ctx.stream_id`
- Chatter / Tool / Agent 里用 `self.stream_id`（字符串 ID）
- Action 里用 `self.chat_stream.stream_id`（Action 拿到的是 `ChatStream` 对象，不是字符串 ID）
- 收到的 `Message` 对象上读 `message.stream_id`
- 实在要现算，用 `ChatStream.generate_stream_id(platform, user_id=..., group_id=...)`

只要你的 `stream_id` 是从这些地方拿的，就不会踩这个坑。

### 坑五：把 `send_adapter_command` 当 `send_api` 用

这是和第 21 章边界最容易混的一刀。

记住：

> **`send_api` 是“把消息发出去给用户看”，`send_adapter_command` 是“调平台 API 拿结果”。**

如果你想做的是“禁言某人”、“撤回消息”、“拿群列表”——那不是 `send_api` 的事，是 `adapter_api.send_adapter_command` 的事。

### 坑六：发了非文本消息不传 `processed_plain_text`

前面已经讲过，这里再强调一次：发图片 / 语音 / 视频时，**一定要传 `processed_plain_text`**，否则后续 `message_api` 拼上下文时模型看不到这些内容是什么。

### 坑七：以为 `send_batch_parallel` 顺序安全

`send_batch_parallel` 用 `asyncio.gather` 并行发送，顺序不保证。如果你的消息有顺序（比如“先发说明再发图片”），用 `send_batch` 或自己顺序 `await`。

## 23.8 `send_api` 和 `message_api` 怎么和别的 API 配合

这一节帮你把插件系统里和“消息”相关的几层 API 关系理一遍。

| 你想做的事 | 用什么 |
|-----------|--------|
| 查历史消息 | `message_api.get_*` |
| 统计消息数 | `message_api.count_*` |
| 把消息拼成可读文本 | `message_api.build_readable_*` |
| 发一条文本 / 图片 / 语音 | `send_api.send_*` |
| 批量广播同一条文本 | `send_api.broadcast_text` |
| 调平台 API（禁言 / 撤回 / 拿群列表） | `adapter_api.send_adapter_command`（第 21 章） |
| 操作适配器（启停 / 列表） | `adapter_api.start_adapter` 等（第 21 章） |
| 聊天流本身的信息 | `chat_api` / `stream_api` |
| 把消息存成自己的结构化数据 | `storage_api`（第 22 章） |

也就是说，`message_api` 和 `send_api` 解决的是“消息这条线”上的查和发；其它维度有别的 API 接。

## 23.9 `message_api` 速查

`message_api` 定义于 `src/app/plugin_system/api/message_api.py`，所有函数都是异步的扁平函数。

### 按时间范围查询

| 函数 | 签名要点 | 返回 |
|------|---------|------|
| `get_messages_by_time` | `(start_time, end_time, limit=0, limit_mode="latest", filter_bot=False)` | `list[dict]` |
| `get_messages_by_time_in_chat` | `(stream_id, start_time, end_time, limit=0, limit_mode="latest", filter_bot=False, filter_command=False)` | `list[dict]` |
| `get_messages_by_time_in_chat_inclusive` | 同上，但闭区间 | `list[dict]` |
| `get_messages_by_time_for_users` | `(start_time, end_time, person_ids, limit=0, limit_mode="latest")` | `list[dict]` |
| `get_messages_by_time_in_chat_for_users` | `(stream_id, start_time, end_time, person_ids, limit=0, limit_mode="latest")` | `list[dict]` |

### 按时间点之前查询

| 函数 | 签名要点 | 返回 |
|------|---------|------|
| `get_messages_before_time` | `(timestamp, limit=0, filter_bot=False)` | `list[dict]` |
| `get_messages_before_time_in_chat` | `(stream_id, timestamp, limit=0, filter_bot=False)` | `list[dict]` |
| `get_messages_before_time_for_users` | `(timestamp, person_ids, limit=0)` | `list[dict]` |

### 便捷函数

| 函数 | 签名要点 | 返回 |
|------|---------|------|
| `get_recent_messages` | `(stream_id, hours=24, limit=100, limit_mode="latest", filter_bot=False)` | `list[dict]` |
| `get_random_chat_messages` | `(start_time, end_time, limit=0, limit_mode="latest", filter_bot=False)` | `list[dict]` |
| `count_new_messages` | `(stream_id, start_time=0.0, end_time=None)` | `int` |
| `count_new_messages_for_users` | `(stream_id, start_time, end_time, person_ids)` | `int` |

### 文本构建

| 函数 | 签名要点 | 返回 |
|------|---------|------|
| `build_readable_messages_to_str` | `(messages, replace_bot_name=True, merge_messages=False, timestamp_mode="relative", read_mark=0.0, truncate=False, show_actions=False)` | `str` |
| `build_readable_messages_with_details` | `(messages, replace_bot_name=True, merge_messages=False, timestamp_mode="relative", truncate=False)` | `tuple[str, list[tuple[float, str, str]]]` |

### 辅助

| 函数 | 签名要点 | 返回 |
|------|---------|------|
| `get_person_ids_from_messages` | `(messages)` | `list[str]` |
| `filter_bot_messages` | `(messages)` | `list[dict]` |

## 23.10 `send_api` 速查

`send_api` 定义于 `src/app/plugin_system/api/send_api.py`，所有发送函数都是异步的，返回 `bool`（是否发送成功）。

### 单条发送

| 函数 | 签名要点 | 返回 |
|------|---------|------|
| `send_text` | `(content, stream_id, platform=None, reply_to=None, adapter_signature=None)` | `bool` |
| `send_image` | `(image_data, stream_id, platform=None, processed_plain_text="[图片]", reply_to=None, adapter_signature=None)` | `bool` |
| `send_emoji` | `(emoji_data, stream_id, platform=None, processed_plain_text="", adapter_signature=None)` | `bool` |
| `send_voice` | `(voice_data, stream_id, platform=None, processed_plain_text="[语音]", adapter_signature=None)` | `bool` |
| `send_video` | `(video_data, stream_id, platform=None, processed_plain_text="[视频]", adapter_signature=None)` | `bool` |
| `send_file` | `(file_path, stream_id, platform=None, file_name=None, adapter_signature=None)` | `bool` |
| `send_custom` | `(content, message_type, stream_id, platform=None, processed_plain_text="", adapter_signature=None)` | `bool` |
| `send_message` | `(message: Message, adapter_signature=None)` | `bool` |

### 批量与组合

| 函数 | 签名要点 | 返回 |
|------|---------|------|
| `send_batch` | `(messages: list[Message], adapter_signature=None)` | `list[bool]` |
| `send_batch_parallel` | `(messages: list[Message], adapter_signature=None)` | `list[bool]` |
| `send_text_with_image` | `(text, image_data, stream_id, platform=None, adapter_signature=None)` | `bool` |
| `broadcast_text` | `(content, stream_ids: list[str], platform=None)` | `dict[str, bool]` |

### 通用参数说明

| 参数 | 说明 |
|------|------|
| `stream_id` | 目标聊天流 ID（必填，**SHA-256 哈希值**，不是原始平台 ID） |
| `platform` | 平台名；不传时从 stream_info 推断；指定 `adapter_signature` 时被忽略 |
| `reply_to` | 要回复的消息 ID（仅 `send_text` / `send_image` 支持） |
| `processed_plain_text` | 人类可读文本，会落库，发非文本消息时强烈建议显式传 |
| `adapter_signature` | 目标适配器签名（`plugin:adapter:name`），指定后绕过 platform 推断 |

## 23.11 这一章先收在这里

如果把这一章压成最后几句话，我最希望你记住的是：

1. **`message_api` 只读、`send_api` 只写**——这是这两层 API 最基础的边界，不要找“既能查又能发”的统一入口。
2. **`stream_id` 是 SHA-256 哈希，不是原始平台 ID**——`message_api` 查的和 `send_api` 发的都是哈希值；永远从 `ctx.stream_id` / `self.stream_id` / `message.stream_id` / `ChatStream.generate_stream_id(...)` 拿，别手写。
3. **`message_api` 返回的是统一的扁平 `dict`**，不是 ORM 对象；最该用的是 `processed_plain_text` 和 `sender_name`，拼上下文用 `build_readable_messages_to_str`。
4. **`send_api` 通过 `MessageSender → 适配器` 把消息真正发出去**，`stream_id` 是必填的，`adapter_signature` 是可选的“绕过平台推断”开关。
5. **发非文本消息时，务必显式传 `processed_plain_text`**——否则后续 `message_api` 拼出来的上下文里模型“看不见”这条消息是什么。
6. **`send_api` 是“发消息给用户看”，`send_adapter_command` 是“调平台 API 拿结果”**——这两件事不要搅在一起。

到这里为止，你已经能从“查历史 → 组织上下文 → 发消息”完整跑通一条消息链路了。这三层 API（`message_api` / `send_api`，以及第 21 章的 `adapter_api`）合起来，构成了插件作者真正日常会高频使用的那一层“运行时入口”。

下一章我们会把整个插件编写指南收束一下，给一份完整的索引和进阶路线图。
