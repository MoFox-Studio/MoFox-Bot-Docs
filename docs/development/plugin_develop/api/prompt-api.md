# Prompt API

`src.app.plugin_system.api.prompt_api` 提供提示词模板的注册、查询和系统提醒管理。

## 导入

```python
from src.app.plugin_system.api.prompt_api import (
    register_template,
    unregister_template,
    get_template,
    get_or_create,
    has_template,
    list_templates,
    clear_templates,
    count_templates,
    add_system_reminder,
    get_system_reminder,
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

### 系统提醒

| 函数 | 说明 |
|------|------|
| `add_system_reminder(bucket, name: str, content: str, insert_type, consume) -> None` | 添加系统提醒 |
| `get_system_reminder(bucket, names: list[str] \| None = None) -> str` | 获取系统提醒内容 |

```python
add_system_reminder("chat", "rules", "请保持友好的语气。", "append", "once")
reminder = get_system_reminder("chat")
```

## 相关文档

- [提示词系统](../guide/mechanism.md)
