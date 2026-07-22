# Prompt API

`src.app.plugin_system.api.prompt_api` 提示词模板的注册、查询、系统提醒管理与流隔离 reminder 管理。

本模块是对 `PromptManager` 的薄封装，用于在插件系统侧以稳定的 API 形式访问 prompt 管理器。

## 导入

```python
from src.app.plugin_system.api.prompt_api import (
    # 模板管理
    register_template,
    unregister_template,
    get_template,
    get_or_create,
    has_template,
    list_templates,
    clear_templates,
    count_templates,
    # 全局系统提醒
    add_system_reminder,
    get_system_reminder,
    # 流隔离提醒
    add_stream_reminder,
    get_stream_reminder,
    delete_stream_reminder,
    clear_stream_reminders,
)
```

## 函数

### 模板管理

| 函数 | 说明 |
|------|------|
| `register_template(template: PromptTemplate) -> None` | 注册提示词模板 |
| `unregister_template(name: str) -> bool` | 注销模板 |
| `get_template(name: str) -> PromptTemplate \| None` | 获取模板副本 |
| `get_or_create(name: str, template: str, policies: dict \| None = None) -> PromptTemplate` | 获取或创建模板 |
| `has_template(name: str) -> bool` | 检查模板是否存在 |
| `list_templates() -> list[str]` | 列出所有模板名称 |
| `clear_templates() -> None` | 清空所有模板 |
| `count_templates() -> int` | 模板数量 |

### 全局系统提醒

::: warning 不会自动注入
`add_system_reminder` 仅负责把 reminder 写进 store。它**不会自动进入所有 LLM 请求**。实际是否注入，取决于调用方是否在创建请求时显式使用了 `with_reminder`（如 `create_llm_request(..., with_reminder="actor")`）。
:::

#### `add_system_reminder(bucket: str | SystemReminderBucket, name: str, content: str, insert_type: str | SystemReminderInsertType = SystemReminderInsertType.FIXED, consume: str | SystemReminderConsumeType = SystemReminderConsumeType.FOREVER) -> None`

添加（或覆盖）一条全局 system reminder。

- `bucket`: bucket 名称（推荐使用 `SystemReminderBucket` 预设值，如 `actor` / `sub_actor`）
- `name`: reminder 名称
- `content`: reminder 内容
- `insert_type`: 插入位置类型，支持字符串 `"fixed"` / `"dynamic"` 或 `SystemReminderInsertType` 枚举
- `consume`: 消费模式，支持字符串 `"forever"` / `"once"` 或 `SystemReminderConsumeType` 枚举

#### `get_system_reminder(bucket: str | SystemReminderBucket, names: list[str] | None = None) -> str`

获取指定 bucket 的 system reminder 内容。传入 `names` 时仅返回这些 name 对应的 reminder（按 `names` 顺序拼接）。

```python
add_system_reminder("chat", "rules", "请保持友好的语气。", "append", "once")
reminder = get_system_reminder("chat")
```

### 流隔离 reminder

以下函数以 `stream:{stream_id}:{bucket}` 作为 bucket key 实现按聊天流隔离的 reminder 读写。Chatter 通过 `create_request(with_reminder=...)` 调用时自动同时拾取全局 bucket 和当前流私有 bucket，无需插件感知底层命名约定。

#### `add_stream_reminder(stream_id: str, bucket: str, name: str, content: str, insert_type: str | SystemReminderInsertType = SystemReminderInsertType.FIXED, consume: str | SystemReminderConsumeType = SystemReminderConsumeType.FOREVER) -> None`

向指定聊天流的私有 bucket 写入（覆盖）一条 system reminder。仅对指定聊天流可见，其他流不受影响。

#### `get_stream_reminder(stream_id: str, bucket: str, names: list[str] | None = None) -> str`

从指定聊天流的私有 bucket 读取 reminder 文本。

#### `delete_stream_reminder(stream_id: str, bucket: str, name: str) -> bool`

从指定聊天流的私有 bucket 删除单条 reminder。删除成功返回 `True`，不存在时返回 `False`。

#### `clear_stream_reminders(stream_id: str) -> None`

清除指定聊天流在所有私有 bucket 下的 reminder。主要用于聊天流销毁或重置时清理资源，对全局 bucket 无影响。

```python
from src.app.plugin_system.api.prompt_api import (
    add_stream_reminder,
    get_stream_reminder,
    clear_stream_reminders,
)

# 为特定流添加 reminder
add_stream_reminder("qq_group_123", "actor", "topic", "当前话题：技术讨论")

# 读取
reminder = get_stream_reminder("qq_group_123", "actor")

# 流销毁时清理
clear_stream_reminders("qq_group_123")
```

## 相关文档

- [提示词系统](../guide/mechanism.md)
- [LLM API](./llm-api.md)
