# Prompt API

`src/app/plugin_system/api/prompt_api` 提供 PromptTemplate 的注册、检索与管理能力。

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
    # System Reminder 相关
    get_system_reminder_bucket,
    add_system_reminder,
    remove_system_reminder,
)
```

## 核心函数

### `register_template(template: PromptTemplate) -> None`

注册一个 PromptTemplate。

**参数：**
- `template`: PromptTemplate 实例

**使用示例：**
```python
from src.core.prompt import PromptTemplate

template = PromptTemplate(
    name="greeting",
    template="你好，{name}！欢迎使用 {app_name}。",
)

register_template(template)
```

---

### `unregister_template(name: str) -> bool`

注销一个 PromptTemplate。

**参数：**
- `name`: 模板名称

**返回值：**
- `True` 表示删除成功，`False` 表示模板不存在

**使用示例：**
```python
success = unregister_template("greeting")

if success:
    print("模板已删除")
else:
    print("模板不存在")
```

---

### `get_template(name: str) -> PromptTemplate | None`

获取模板副本。

**参数：**
- `name`: 模板名称

**返回值：**
- 模板副本，未找到则返回 `None`

**使用示例：**
```python
template = get_template("greeting")

if template:
    rendered = template.render(name="张三", app_name="MoFox")
    print(rendered)
    # 输出: 你好，张三！欢迎使用 MoFox。
else:
    print("模板不存在")
```

---

### `get_or_create(name: str, template: str, policies=None) -> PromptTemplate`

获取或创建模板。

**参数：**
- `name`: 模板名称
- `template`: 模板字符串
- `policies`: 可选渲染策略映射

**返回值：**
- 模板副本

**使用示例：**
```python
# 第一次调用时创建
template = get_or_create(
    name="user_prompt",
    template="用户 {user_name} 说: {message}",
)

# 后续调用直接返回
template = get_or_create(
    name="user_prompt",
    template="...",  # 会被忽略，返回已存在的模板
)
```

---

### `has_template(name: str) -> bool`

检查模板是否存在。

**参数：**
- `name`: 模板名称

**返回值：**
- `True` 表示存在，`False` 表示不存在

**使用示例：**
```python
if has_template("greeting"):
    print("模板已注册")
else:
    print("模板不存在")
```

---

### `list_templates() -> list[str]`

列出所有已注册模板名称。

**返回值：**
```python
["greeting", "user_prompt", "system_message"]
```

**使用示例：**
```python
templates = list_templates()
print(f"共有 {len(templates)} 个模板:")
for name in templates:
    print(f"  - {name}")
```

---

### `clear_templates() -> None`

清空所有已注册模板。

**使用示例：**
```python
clear_templates()
print("所有模板已清空")
```

## System Reminder 相关

### `get_system_reminder_bucket(bucket_name: str) -> SystemReminderBucket`

获取 System Reminder 存储桶。

**参数：**
- `bucket_name`: 存储桶名称

**返回值：**
- `SystemReminderBucket` 实例

**使用示例：**
```python
bucket = get_system_reminder_bucket("chatter_reminders")
```

---

### `add_system_reminder(bucket_name: str, key: str, content: str, priority: int = 0) -> None`

添加 System Reminder。

**参数：**
- `bucket_name`: 存储桶名称
- `key`: 提醒键名
- `content`: 提醒内容
- `priority`: 优先级（数字越小优先级越高）

**使用示例：**
```python
add_system_reminder(
    bucket_name="chatter_reminders",
    key="greeting_rule",
    content="回复时要保持友好、礼貌的语气。",
    priority=1,
)

add_system_reminder(
    bucket_name="chatter_reminders",
    key="length_limit",
    content="回复长度不超过 200 字。",
    priority=2,
)
```

---

### `remove_system_reminder(bucket_name: str, key: str) -> bool`

移除 System Reminder。

**参数：**
- `bucket_name`: 存储桶名称
- `key`: 提醒键名

**返回值：**
- `True` 表示移除成功，`False` 表示不存在

**使用示例：**
```python
success = remove_system_reminder(
    bucket_name="chatter_reminders",
    key="greeting_rule",
)
```

## 完整示例

### 示例 1：创建和使用 Prompt 模板

```python
from src.app.plugin_system.api.prompt_api import (
    register_template,
    get_template,
)
from src.core.prompt import PromptTemplate

class MyChatter(BaseChatter):
    async def initialize(self):
        # 注册系统消息模板
        system_template = PromptTemplate(
            name="my_chatter_system",
            template="""你是一个{role}。
当前对话类型: {chat_type}
当前平台: {platform}
请遵循以下规则：
{rules}""",
        )
        register_template(system_template)
    
    async def execute(self):
        # 使用模板
        template = get_template("my_chatter_system")
        
        system_message = template.render(
            role="友好的助手",
            chat_type=self.chat_type.value,
            platform=self.platform,
            rules="\n".join([
                "- 回复要简洁明了",
                "- 保持友好语气",
                "- 不要使用专业术语",
            ]),
        )
        
        # 使用 system_message 创建 LLM 请求
        # ...
```

### 示例 2：动态 Prompt 管理

```python
from src.app.plugin_system.api.prompt_api import (
    register_template,
    unregister_template,
    list_templates,
)
from src.core.prompt import PromptTemplate

class PromptManagerCommand(BaseCommand):
    name = "prompt"
    description = "管理 Prompt 模板"
    permission = PermissionLevel.ADMIN
    
    async def execute(self, action: str, name: str = "", template_text: str = ""):
        if action == "list":
            # 列出所有模板
            templates = list_templates()
            await self.send_text(
                f"已注册的 Prompt 模板:\n" +
                "\n".join(f"- {t}" for t in templates)
            )
        
        elif action == "add":
            # 添加模板
            if not name or not template_text:
                await self.send_text("请提供模板名称和内容")
                return
            
            template = PromptTemplate(name=name, template=template_text)
            register_template(template)
            await self.send_text(f"模板 {name} 已注册")
        
        elif action == "remove":
            # 删除模板
            success = unregister_template(name)
            if success:
                await self.send_text(f"模板 {name} 已删除")
            else:
                await self.send_text(f"模板 {name} 不存在")
        
        elif action == "show":
            # 显示模板内容
            template = get_template(name)
            if template:
                await self.send_text(f"模板 {name}:\n{template.template}")
            else:
                await self.send_text(f"模板 {name} 不存在")
```

### 示例 3：使用 System Reminder

```python
from src.app.plugin_system.api.prompt_api import (
    add_system_reminder,
    remove_system_reminder,
    get_system_reminder_bucket,
)

class AdvancedChatter(BaseChatter):
    async def initialize(self):
        # 添加默认提醒
        add_system_reminder(
            bucket_name=f"chatter_{self.name}",
            key="tone",
            content="保持友好、礼貌的语气",
            priority=1,
        )
        
        add_system_reminder(
            bucket_name=f"chatter_{self.name}",
            key="length",
            content="回复长度控制在 200 字以内",
            priority=2,
        )
    
    async def execute(self):
        # 获取所有提醒
        bucket = get_system_reminder_bucket(f"chatter_{self.name}")
        reminders = bucket.get_all()  # 按优先级排序
        
        # 构建系统消息
        reminder_text = "\n".join(f"- {r.content}" for r in reminders)
        system_message = f"请遵循以下规则:\n{reminder_text}"
        
        # 使用 system_message 创建 LLM 请求
        # ...
    
    async def cleanup(self):
        # 清理提醒
        remove_system_reminder(f"chatter_{self.name}", "tone")
        remove_system_reminder(f"chatter_{self.name}", "length")
```

### 示例 4：复杂 Prompt 组装

```python
from src.app.plugin_system.api.prompt_api import (
    get_or_create,
    add_system_reminder,
)
from src.app.plugin_system.api.message_api import (
    get_recent_messages,
    format_messages_for_display,
)

class ContextAwareChatter(BaseChatter):
    async def build_prompt(self):
        # 1. 基础系统消息
        base_template = get_or_create(
            name="base_system",
            template="你是{bot_name}，一个{bot_role}。当前时间: {current_time}",
        )
        
        base_prompt = base_template.render(
            bot_name="MoFox",
            bot_role="智能助手",
            current_time=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        )
        
        # 2. 上下文历史
        recent_messages = await get_recent_messages(
            stream_id=self.stream_id,
            hours=1.0,
            limit=10,
        )
        
        context = format_messages_for_display(recent_messages)
        
        # 3. System Reminder
        bucket = get_system_reminder_bucket(f"chatter_{self.name}")
        reminders = [r.content for r in bucket.get_all()]
        
        # 4. 组装最终 Prompt
        full_prompt = f"""{base_prompt}

最近对话:
{context}

请遵循以下规则:
{chr(10).join(f"- {r}" for r in reminders)}

现在请回复用户的消息。"""
        
        return full_prompt
```

### 示例 5：模板变量验证

```python
from src.core.prompt import PromptTemplate

class ValidatedPromptTemplate:
    def __init__(self, name: str, template: str, required_vars: list[str]):
        self.name = name
        self.template = template
        self.required_vars = set(required_vars)
    
    def register(self):
        """注册模板"""
        pt = PromptTemplate(name=self.name, template=self.template)
        register_template(pt)
    
    def render(self, **kwargs) -> str:
        """渲染并验证变量"""
        # 检查必需变量
        provided_vars = set(kwargs.keys())
        missing_vars = self.required_vars - provided_vars
        
        if missing_vars:
            raise ValueError(f"缺少必需变量: {missing_vars}")
        
        # 渲染模板
        template = get_template(self.name)
        return template.render(**kwargs)

# 使用
greeting_template = ValidatedPromptTemplate(
    name="greeting",
    template="你好，{name}！你是 {role}。",
    required_vars=["name", "role"],
)

greeting_template.register()

try:
    # 会抛出异常，因为缺少 role 变量
    greeting_template.render(name="张三")
except ValueError as e:
    print(e)

# 正确渲染
result = greeting_template.render(name="张三", role="管理员")
print(result)  # 你好，张三！你是管理员。
```

## Prompt 模板最佳实践

### 1. 使用语义化的模板名称

```python
# ✅ 好的命名
register_template(PromptTemplate(
    name="chatter_system_message",
    template="...",
))

# ❌ 不好的命名
register_template(PromptTemplate(
    name="template1",
    template="...",
))
```

### 2. 模板变量使用清晰的名称

```python
# ✅ 清晰的变量名
template = "用户 {user_name} 在 {platform} 平台发送了消息"

# ❌ 不清晰的变量名
template = "{a} 在 {b} 发送了 {c}"
```

### 3. 使用 System Reminder 分离规则

```python
# 将频繁变更的规则放在 System Reminder 中
# 而不是硬编码在模板里
add_system_reminder("rules", "tone", "保持友好")
add_system_reminder("rules", "length", "简洁回复")
```

## 相关文档

- [LLM API](./llm-api.md) — 使用 Prompt 创建 LLM 请求
- [Chatter 组件](../components/chatter.md) — 在 Chatter 中使用 Prompt
- [进阶开发](../advanced.md) — 高级 Prompt 技巧
