# 19. 消息模型：先把 MessageEnvelope、message_info、message_segment 看明白

> **导读** 本章介绍 Neo-MoFox 消息模型的三层结构：`MessageEnvelope`（线路层统一信封）、`message_info`（元信息层）、`message_segment`（内容层）。理解这三层，是读懂 Adapter、消息发送链路和平台适配器的前提。本章不会从字段表开始，而是先建立每一层的定位，再讲它们在系统中如何流动。

上一章我们讲 Adapter 时，一直在反复提一个词：

> `MessageEnvelope`

如果你当时只是先记住了“这是统一消息信封”，那完全没问题。

但写插件写到后面，你迟早会发现：

- Adapter 要产出它
- 核心接收器要读取它
- 转换器要解析它
- 发送链路也要重新构造它

也就是说，很多插件作者在真正理解插件系统之前，先会被消息模型这一层绊一下。

不是因为它特别难，而是因为它不像 Command、Tool 那样，一眼就能看出“我该实现什么方法”；
它更像一张贯穿全链路的数据地图。

所以这一章的目标很简单：

> **把 Neo-MoFox 当前消息模型里最关键的三层结构讲清楚：`MessageEnvelope`、`message_info`、`message_segment`。**

如果这三层你脑子里已经站稳了，后面你再看 Adapter、消息发送、事件流、平台适配器，就会顺很多。

## 19.1 先记住它在系统里的位置，再来看字段

第一次看消息模型，最常见的错误是一上来就逐个记字段。这样记忆效率很低，因为字段名背下来，但背后的设计意图仍然不清楚。

更有效的方式是先记住这句话：

> **`MessageEnvelope` 是 Adapter 和核心之间交换消息的统一线路格式。**

它不是数据库模型，不是 LLM 上下文对象，也不是插件作者平时直接操作最多的业务消息对象。

它处在更靠“线路”的位置。

大致可以这么看：

- 平台原始事件 -> Adapter -> `MessageEnvelope`
- `MessageEnvelope` -> `MessageConverter` -> 核心里的 `Message`
- 核心要发送 -> `Message` -> `MessageEnvelope` -> Adapter -> 平台

所以它是一个中间层结构。

如果你把它误当成“最终业务消息对象”，或者误当成“平台原始消息对象”，后面就很容易看乱。

## 19.2 `MessageEnvelope` 到底是什么

先用最短的话描述：

> **`MessageEnvelope` 是一条结构化消息的外壳。**

这个外壳里，最重要的是三块：

1. `direction`
2. `message_info`
3. `message_segment`

它们分别回答三件不同的事：

- 方向是什么
- 这条消息是谁、从哪来、发到哪类上下文里
- 消息内容本体长什么样

也就是说，`MessageEnvelope` 不是“一个字段包所有信息”的扁平 dict，
而是一个刻意拆层的数据结构。

这一点很重要。

因为插件作者第一次手搓消息时，最容易写成这种样子：

```python
{
    "platform": "qq",
    "user_id": "123",
    "message_id": "abc",
    "text": "你好",
}
```

这种写法当然直观，但它不符合当前统一消息模型的分层方式。

统一模型更像这样：

```python
{
    "direction": "incoming",
    "message_info": {
        "platform": "qq",
        "message_id": "abc",
        "user_info": {
            "platform": "qq",
            "user_id": "123",
        },
    },
    "message_segment": {
        "type": "text",
        "data": "你好",
    },
}
```

这就是这一章后面要一点点拆开的结构。

## 19.3 第一层：`direction` 不是点缀，它决定消息流向

先从最短的那个字段开始。

`direction` 表示这条消息信封的方向。

在当前实现里，最常见的是两个值：

- `incoming`
- `outgoing`

### `incoming`

表示这条消息是从平台进核心的。

典型场景是：

- 用户在 QQ 发来一条消息
- 平台推送一个 notice
- 适配器返回一个 command response

这类消息进入核心后，会先经过 `MessageReceiver`。

### `outgoing`

表示这条消息是核心准备发回平台的。

典型场景是：

- Chatter 决定要回复
- Action 触发发送
- `send_api` 构建了一条待发送消息

这类消息后面会交给对应的 Adapter 继续翻译和发出。

### 为什么这个字段不能乱填

因为当前接收管线会先做方向校验。

也就是说，接收器并不是“看见一个 envelope 就都当入站消息处理”，它会先看方向。

所以如果你在 Adapter 入站时把方向写错，后面整条链路就可能直接被忽略。

## 19.4 第二层：`message_info` 不是内容，它是元信息层

如果说 `message_segment` 是“消息说了什么”，那 `message_info` 更像：

> **这条消息是谁发的、从哪来的、属于什么上下文。**

你可以把它理解成消息头。

最常见、最该先记住的字段有这些。

### `platform`

消息来自哪个平台。

比如：

- `qq`
- `telegram`
- `discord`
- 你自己的自定义平台标识

这个字段很关键，因为后面很多地方都会拿它做路由和匹配。

### `message_id`

消息唯一标识。

它不一定是全局绝对唯一，但至少应该在你所接的平台语境里稳定可追踪。

这个字段通常会被用在：

- 日志追踪
- 回复关联
- 命令往返
- 平台专属调试

### `time`

消息时间。

这里更重要的是“有稳定时间信息”，而不是纠结必须精确到哪一位。

### `user_info`

用户信息层。

常见字段包括：

- `platform`
- `user_id`
- `user_nickname`
- `user_cardname`
- `user_avatar`

它回答的是：

> 这条消息是谁发的。

### `group_info`

群信息层。

常见字段包括：

- `platform`
- `group_id`
- `group_name`

它回答的是：

> 这条消息是不是发生在群上下文里。

在当前实现里，很多“群聊还是私聊”的判断，都不是靠某个单独的 `chat_type` 字段直接硬写死，而是会结合 `group_info` 是否存在来推断。

### `format_info`

这个字段很多人第一次会忽略，但它其实很有用。

它通常描述：

- 当前消息内容包含哪些格式
- 目标链路支持接收哪些格式

比如某个适配器把消息段解析完后，会同时记录：

- 这一条里有 text、image、reply
- 这个平台接受哪些输出段类型

这会让后面的处理更可预期。

## 19.5 第三层：`message_segment` 才是消息内容本体

真正表示“消息内容”的，不是 `message_info`，而是 `message_segment`。

这点一定要分清。

因为很多平台原始协议会把：

- 用户信息
- 群信息
- 消息类型
- 消息内容

全塞在同一个对象里。

但统一信封不是这么组织的。

在这里，`message_segment` 才是内容层。

它的基本形状很简单：

```python
{
    "type": "text",
    "data": "你好",
}
```

也就是说，每个消息段至少回答两件事：

- 这是什么类型的段
- 这段数据本体是什么

## 19.6 为什么消息内容不是一整段字符串，而是“分段”

这个设计决定了你后面很多理解会不会顺。

统一消息模型没有把内容简化成单个 `content: str`，而是用了 segment 模型。

原因很直接：

> **聊天消息在真实平台里，本来就不只是纯文本。**

一条消息里可能同时有：

- 文本
- 图片
- 回复
- @ 某人
- 语音
- 文件
- 平台专属结构

如果只用一个字符串去承载，很多结构要么会丢掉，要么会变得很难再反向还原。

所以 segment 模型的价值不是“形式更复杂”，而是“表达能力更真实”。

## 19.7 `message_segment` 可以是单段，也可以是段列表

这一点是很多人第一次看时最容易晕的地方。

当前模型里，`message_segment` 既可能是：

- 单个段对象

也可能是：

- 一组段对象的列表

也就是说，这两种都是合法的。

### 单段

```python
{
    "message_segment": {
        "type": "text",
        "data": "你好"
    }
}
```

### 多段

```python
{
    "message_segment": [
        {"type": "reply", "data": "msg_1"},
        {"type": "text", "data": "收到"},
        {"type": "image", "data": "base64|..."},
    ]
}
```

在接收转换时，当前实现会先把单段规范化成列表，再统一解析。

所以你可以把它理解成：

> **对外允许单段或多段两种写法，对内解析时会尽量归一。**

## 19.8 最常见的几个段类型，先记这些就够了

第一次不用试图把所有段类型背全。

先记最常见、最常用的这些：

### `text`

纯文本。

```python
{"type": "text", "data": "你好"}
```

### `reply`

回复某条消息。

```python
{"type": "reply", "data": "target_message_id"}
```

### `at`

@ 某个用户。

具体 `data` 形状会受平台适配策略影响，但语义上就是“提及一个人”。

### `image`

图片。

当前核心转换器对媒体数据有明确假设：

> **传进来的媒体内容已经是可直接处理的数据，不在转换器里做下载。**

所以很多适配器会在进入转换器之前，就把图片处理成 base64 或其他已准备好的形式。

### `emoji`、`voice`、`video`、`file`

这些都是常见媒体或附件段。

第一次不一定全都要支持，但你至少要知道统一模型给它们留了位置。

## 19.9 `message_chain` 是什么，和 `message_segment` 有什么关系

你有时还会看到另一个名字：`message_chain`。

这里最简单的理解是：

> **它是段列表的别名或兼容入口。**

当前转换器优先读 `message_segment`，如果没有，再尝试 `message_chain`。

所以对插件作者来说，更推荐的主写法仍然是：

- 优先使用 `message_segment`

`message_chain` 更多像兼容历史或不同调用习惯时保留的入口。

## 19.10 一个最小入站信封，应该长什么样

如果你是站在 Adapter 视角，最常写的是入站 envelope。

最小版本通常像这样：

```python
incoming_envelope = {
    "direction": "incoming",
    "message_info": {
        "platform": "demo",
        "message_id": "msg-001",
        "time": 1740000000.0,
        "user_info": {
            "platform": "demo",
            "user_id": "user-123",
            "user_nickname": "Alice",
        },
    },
    "message_segment": {
        "type": "text",
        "data": "你好"
    },
    "raw_message": {
        "source": "demo_gateway",
        "payload": "..."
    },
}
```

这个例子里最关键的是两层分工：

- `message_info` 放“是谁、从哪来”
- `message_segment` 放“内容是什么”

只要这两层别混，后面解析基本就好办很多。

## 19.11 一个最小出站信封，应该长什么样

如果你站在发送链路看，出站 envelope 会长得很像，只是方向和上下文意义变了。

比如：

```python
outgoing_envelope = {
    "direction": "outgoing",
    "message_info": {
        "platform": "demo",
        "message_id": "msg-002",
        "time": 1740000001.0,
        "user_info": {
            "platform": "demo",
            "user_id": "user-123",
        },
    },
    "message_segment": [
        {"type": "reply", "data": "msg-001"},
        {"type": "text", "data": "收到，我来处理"},
    ],
}
```

Adapter 在出站时，最重要的工作通常就是：

- 看 `message_info` 判断该发到谁
- 看 `message_segment` 把内容翻译成平台格式

所以你可以把 `message_info` 理解成“路由线索”，把 `message_segment` 理解成“内容载荷”。

## 19.12 为什么 `MessageBuilder` 很适合拿来构造入站 envelope

你当然可以手写 dict。

但如果你每次都手搓，很快就会遇到这些问题：

- 忘记补 `message_id`
- `platform` 漏了
- 用户信息和群信息没补齐
- 单段 / 多段写法前后不一致

这也是为什么 mofox-wire 提供了 `MessageBuilder`。

它的价值不在于“更高级”，而在于它帮你把最常见的拼装顺序固定下来。

例如入站时，你可以按这种思路构造：

```python
from mofox_wire import MessageBuilder

envelope = (
    MessageBuilder()
    .direction("incoming")
    .message_id("msg-001")
    .from_user("user-123", platform="demo", nickname="Alice")
    .text("你好")
    .build()
)
```

这样写的好处是：

- 结构层次更清楚
- 更不容易漏掉基础信息
- 对新手来说更像“搭积木”而不是“徒手拼协议”

## 19.13 统一信封进入核心后，会发生什么

这一段对插件作者很重要，因为它决定了你该把哪些字段填得更认真。

当前接收链路里，`MessageReceiver` 大致会做这些事：

1. 检查 `direction`
2. 检查 `message_info` 是否存在
3. 看是不是特殊段，比如 `adapter_response`
4. 再根据 `message_type` 或消息段情况决定走标准消息路径，还是走其他事件路径

接着，`MessageConverter` 会把 envelope 转成核心里的 `Message` 对象。

这里会真正消费掉的内容包括：

- `message_info.platform`
- `message_info.message_id`
- `user_info`
- `group_info`
- `message_segment`
- `raw_message`

也就是说，对插件作者来说，真正值得认真对待的是：

> **这些字段不是“看起来填一下”，而是后面真的会被消费。**

## 19.14 一个很容易忽略的点：消息类型不只看段，还可能看扩展字段

这里要专门提醒你一下。

如果你只看最基础的 TypedDict，会以为消息模型就是严格固定的那几项。

但当前运行时实际还会使用一些更宽的扩展字段，比如：

- `message_info.message_type`
- `message_info.extra`
- 用户信息里的 `role`

这些字段并不是这一章建议你第一次就大量依赖的东西，
但你需要知道：

> **当前实现里的运行时消息结构，比最窄的静态类型定义更宽。**

最典型的例子就是：

- 接收器会看 `message_info.message_type` 决定走标准消息还是 other message 路径
- 转换器会读取 `message_info.extra` 里的扩展元数据
- 有些平台适配器会把用户角色信息也塞进 `user_info`

所以更稳妥的理解方式是：

- 先把 TypedDict 当成核心骨架
- 再把真实运行时里常见的扩展字段当成“骨架外的常用补充”

这样你既不会把结构讲得过宽，也不会误以为只有文档里那几个字段能存在。

## 19.15 `message_info` 和 `Message` 不是一回事

这里再帮你拆一个很容易混的点。

前面说过，envelope 进入核心后，通常会变成 `Message`。

那是不是说 `message_info` 就等于 `Message`？

不是。

更准确地说：

- `message_info` 是线路元信息
- `message_segment` 是线路内容
- `Message` 是核心业务模型

转换器会把这两层重新整理成核心里更方便使用的对象，比如：

- `sender_id`
- `sender_name`
- `platform`
- `stream_id`
- `message_type`
- `processed_plain_text`
- `media`
- `at_users`

所以它们不是同一层的东西。

这个区分一旦建立起来，你就不会再问：

- “为什么这里不用直接传 Message？”
- “为什么这里又多包了一层 envelope？”

因为两者根本服务于不同层次。

## 19.16 平台适配器为什么常常要先规范段，再交给核心

真实平台来的原始消息段通常很乱。

比如某个平台原始协议里，图片、回复、@、表情、转发消息，常常都长得完全不一样。

这时候 Adapter 真正要做的，不是把原始平台结构原封不动塞进 envelope，
而是先把它们翻译成统一段类型。

比如：

- 平台原始文本段 -> `{"type": "text", "data": ...}`
- 平台原始图片段 -> `{"type": "image", "data": ...}`
- 平台原始回复结构 -> `{"type": "reply", "data": ...}`

也就是说，segment 模型真正帮到插件系统的地方是：

> **让不同平台的内容，在进入核心前先收敛到一组统一表达。**

## 19.17 对新手最实用的写法建议：先守住这四条

这一章收束之前，我更建议你记住写消息模型时最实用的四条，而不是字段大全。

### 第一，别把内容塞进 `message_info`

内容就放 `message_segment`。

`message_info` 只放元信息。

### 第二，先优先支持 `text`、`reply`、`image` 这类常见段

第一次不需要全段型毕业。

先把最常见的段跑通，比一口气支持十几种段更重要。

### 第三，能保留 `raw_message` 就尽量保留

这对调试和平台专属功能都很有价值。

### 第四，优先把 envelope 写正确，再考虑漂亮封装

别一开始就追求“我写一个超完整的 builder 封装”。

先确保结构本身稳定，再考虑包装体验。

## 19.18 这一章先收在这里：你真正要先看懂的不是字段表，而是分层

如果把整章再压成最后几句话，我最希望你记住的是：

1. `MessageEnvelope` 是线路层统一信封，不是业务消息对象。
2. `message_info` 负责元信息，`message_segment` 负责内容。
3. segment 模型存在的原因，是为了让真实平台里的复杂消息结构有统一表达。
4. 当前运行时实际使用的字段，比最窄的静态类型定义更宽，理解时要分清“骨架”和“扩展”。

只要这四点立住，后面你再回头看：

- Adapter 为什么要产出 envelope
- MessageConverter 为什么要先归一化 segment
- 发送链路为什么又要把 `Message` 重新转回 envelope

这些问题就会自然顺起来。

沿着这条线，下一步自然会涉及：

> **专门讲“消息发送链路”，也就是核心里的 `Message` 怎样被重新装回 envelope，再交给 Adapter 发出去。**