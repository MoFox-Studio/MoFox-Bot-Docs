# Person API

`src.app.plugin_system.api.person_api` 提供用户身份标识生成、用户记录管理、名称变更历史、关联聊天流/消息查询，以及印象与态度维护能力。

身份标识生成函数为**同步函数**；涉及数据库读写的操作均为**异步函数**，调用时需 `await`。

## 导入

```python
from src.app.plugin_system.api.person_api import (
    # 身份标识
    generate_raw_person_id,
    generate_person_id,
    # 用户记录管理
    get_or_create_person,
    get_person,
    update_person_info,
    update_user_impression,
    update_user_attitude,
    # 名称变更历史
    get_nickname_history,
    get_cardname_history,
    # 用户关联查询
    get_user_streams,
    get_user_recent_messages,
    resolve_user_id,
    enrich_message_with_person_info,
)
```

## 函数

### 身份标识生成

#### `generate_raw_person_id(platform: str, user_id: str) -> str`

生成原始格式的 `person_id`（`platform:user_id`）。同步函数。

#### `generate_person_id(platform: str, user_id: str) -> str`

生成 SHA256 哈希后的 `person_id`，用于系统内部索引（`PersonInfo` 主键）。同步函数。

```python
pid = generate_person_id("qq", "123456789")
```

### 用户记录管理

#### `get_or_create_person(platform: str, user_id: str, nickname: str | None = None, cardname: str | None = None) -> tuple[PersonInfo, bool]`

获取或创建用户记录。此函数为**异步函数**。

- 用户存在时：刷新 `last_interaction` / `interaction_count` 并返回 `(person, False)`
- 用户不存在时：创建新记录并返回 `(person, True)`

::: warning 注意
该函数返回的 `PersonInfo` 在「用户已存在」分支下是更新前的快照——其 `interaction_count` / `last_interaction` 字段反映的是旧值，而非刚写入数据库的新值。需要最新值时请改用 `get_person`。
:::

#### `get_person(platform: str, user_id: str) -> PersonInfo | None`

获取用户记录（**只读**）。此函数为**异步函数**。

与 `get_or_create_person` 的关键区别：

| 行为 | `get_or_create_person` | `get_person` |
| --- | --- | --- |
| 用户不存在时 | 自动创建 | 返回 `None` |
| 是否刷新 `last_interaction` | 是 | 否 |
| 是否增加 `interaction_count` | 是 | 否 |

适合仅查询展示场景（如读用户当前昵称、态度分），避免污染交互统计。

#### `update_person_info(platform: str, user_id: str, nickname: str | None = None, cardname: str | None = None) -> bool`

更新用户信息。此函数为**异步函数**。每次调用都会：

1. 刷新 `last_interaction` / `interaction_count` / `updated_at`
2. 检测 `nickname` / `cardname` 是否变更（满足「新旧都非空且不同」时）
3. 把旧值推入对应的 `*_history` JSON 列表，再用新值替换当前字段
4. 用户不存在时自动创建

::: tip 系统已自动调用
消息接收流程会针对每条入站消息调用一次 `update_person_info`，你通常**不需要**手动调用。只有在自己的代码里产生了独立的用户标识来源（例如 webhook 推送）时，才需要显式调用此函数来同步昵称。
:::

#### `update_user_impression(platform: str, user_id: str, impression: str, short_impression: str | None = None) -> bool`

更新对用户的长期印象。此函数为**异步函数**。

- `impression`: 长期印象文本（写入 `PersonInfo.impression`）
- `short_impression`: 简短印象摘要，可选（写入 `PersonInfo.short_impression`，上限 500 字符）

#### `update_user_attitude(platform: str, user_id: str, attitude_delta: int) -> int | None`

更新对用户的态度评分（增减量）。此函数为**异步函数**。

- 评分会被自动限制在 `0-100` 范围内（默认 50）
- 返回更新后的分数；用户不存在时返回 `None`

```python
new_score = await update_user_attitude("qq", "123", attitude_delta=+5)
# 也可以传负数：attitude_delta=-10
```

### 名称变更历史

#### `get_nickname_history(platform: str, user_id: str) -> list[dict[str, Any]]`

获取用户昵称变更历史。此函数为**异步函数**。

返回列表按 `retired_at` 升序排列，每项形如：

```python
{"name": "旧昵称", "retired_at": 1719500000.0}
```

用户不存在或无历史时返回空列表。历史由 `update_person_info` 在检测到改名时自动追加，最多保留 50 条。

#### `get_cardname_history(platform: str, user_id: str) -> list[dict[str, Any]]`

获取用户群名片变更历史。此函数为**异步函数**。返回结构同 `get_nickname_history`。

```python
history = await get_cardname_history("qq", "123456")
for entry in history:
    print(f"{entry['name']}  在 {entry['retired_at']} 被替换")
```

::: info 历史记录格式
`nickname_history` / `cardname_history` 在数据库中以 `Text` 存储 JSON 字符串，格式为：

```json
[
  {"name": "Alice",    "retired_at": 1719500000.0},
  {"name": "Alyssa",   "retired_at": 1719600000.0}
]
```

`retired_at` 是旧名字被替换时的时间戳（Unix timestamp）。API 已自动处理 JSON 解析、损坏数据容错与按时间排序，调用方无需自行 `json.loads`。
:::

### 用户关联查询

#### `get_user_streams(platform: str, user_id: str) -> list[ChatStreams]`

获取用户的所有聊天流。此函数为**异步函数**。结果按 `last_active_time` 降序排列。

#### `get_user_recent_messages(platform: str, user_id: str, limit: int = 50) -> list[Messages]`

获取用户最近发送的消息。此函数为**异步函数**。

- `limit`: 最大返回条数，必须是非负整数，默认 50

#### `resolve_user_id(platform: str, keyword: str) -> str | None`

根据关键词解析平台 `user_id`。此函数为**异步函数**。解析规则：

1. 纯数字字符串：直接视为 `user_id`
2. 同平台按昵称/群名片**精确匹配**
3. 失败则尝试**包含匹配**；仅在唯一命中时返回
4. 无法定位或命中不唯一时返回 `None`

```python
uid = await resolve_user_id("qq", "Alice")
if uid:
    # 拿到 user_id 后再做后续操作
    person = await get_person("qq", uid)
```

#### `enrich_message_with_person_info(message: Message) -> dict[str, Any]`

为消息补充用户信息。此函数为**异步函数**。返回字典在原消息字段基础上追加：

- `user_nickname`: 昵称
- `user_cardname`: 群名片
- `user_attitude`: 态度评分
- `user_interaction_count`: 交互次数

## 典型用法

### 在 EventHandler 里识别老用户改名

```python
from src.app.plugin_system.api import person_api, event_api
from src.core.components.types import EventType, EventDecision

@event_api.event_handler(EventType.ON_MESSAGE_RECEIVED)
async def detect_rename(params):
    message = params["message"]

    # 只读获取当前数据库里的旧名
    old = await person_api.get_person(message.platform, message.sender_id)
    if old and old.nickname and old.nickname != message.sender_name:
        # 名字变了，update_person_info 会把旧名推入历史
        await person_api.update_person_info(
            platform=message.platform,
            user_id=message.sender_id,
            nickname=message.sender_name,
        )
        history = await person_api.get_nickname_history(
            message.platform, message.sender_id
        )
        logger.info(f"{old.nickname} → {message.sender_name}; 历史: {history}")

    return EventDecision.PASS, params
```

### 查询某用户的所有曾用名

```python
history = await person_api.get_nickname_history("qq", "123456")
names = [entry["name"] for entry in history]
print(f"曾用名: {names}")
```

### 给某个用户加分/扣分

```python
# 用户帮助了别人，加 5 分
new_score = await person_api.update_user_attitude("qq", "123456", attitude_delta=5)
if new_score is None:
    logger.warning("用户不存在")
```

## 数据模型参考

`PersonInfo` 表（`src.core.models.sql_alchemy.PersonInfo`）的核心字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `person_id` | `str` | 全局唯一标识（SHA256 哈希） |
| `platform` | `str` | 平台标识 |
| `user_id` | `str` | 平台内部用户 ID |
| `nickname` | `str \| None` | 当前昵称 |
| `cardname` | `str \| None` | 当前群名片 |
| `nickname_history` | `str \| None` | 昵称历史（JSON 列表） |
| `cardname_history` | `str \| None` | 群名片历史（JSON 列表） |
| `impression` | `str \| None` | 长期印象 |
| `short_impression` | `str \| None` | 简短印象（≤500 字符） |
| `attitude` | `int \| None` | 态度评分（0-100，默认 50） |
| `first_interaction` | `float \| None` | 首次交互时间戳 |
| `last_interaction` | `float \| None` | 最后交互时间戳 |
| `interaction_count` | `int` | 交互次数统计 |

## 相关文档

- [Permission API](./permission-api.md) — 用户身份标识生成与权限管理
- [Stream API](./stream-api.md) — 聊天流的创建、查询与上下文操作
- [Message API](./message-api.md) — 消息查询、计数与可读格式化
