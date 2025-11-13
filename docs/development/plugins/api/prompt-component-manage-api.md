# Prompt 组件管理 API

Prompt 组件管理 API (`prompt_component_manager`) 是整个提示词动态注入系统的核心。它是一个统一的、动态的、可观测的管理中心，以**全局单例**的形式存在，确保在整个应用中所有部分共享和操作同一份动态规则集。

## 核心职责

1.  **规则加载**: 在系统启动时，自动扫描所有已注册的 `BasePrompt` 组件，并将其静态定义的 `injection_rules` 加载为默认的动态规则。
2.  **动态管理**: 提供线程安全的 API，允许在运行时动态地添加、更新或移除注入规则，使得提示词的结构可以被实时调整。
3.  **状态观测**: 提供丰富的查询 API，用于观测系统当前完整的注入状态，例如查询所有注入到特定目标的规则、或查询某个组件定义的所有规则。
4.  **注入应用**: 在构建核心 Prompt 时，根据统一的、按优先级排序的规则集，动态地修改和装配提示词模板，实现灵活的提示词组合。

## 导入方式

```python
from src.chat.utils.prompt_component_manager import prompt_component_manager
```

---

## 运行时规则管理 API

这类 API 用于在运行时动态修改注入规则。

### 1. 动态添加或更新注入规则

```python
async def add_injection_rule(
    self,
    prompt_name: str,
    rules: List[InjectionRule],
    content_provider: Callable[..., Awaitable[str]],
    source: str = "runtime",
) -> bool:
```

动态添加或更新一条或多条注入规则。如果已存在同名组件针对同一目标的规则，此方法会覆盖旧规则。

**Args:**
- `prompt_name` (str): 动态注入组件的唯一名称。
- `rules` (List[InjectionRule]): 描述注入行为的 `InjectionRule` 对象列表。
- `content_provider` (Callable[..., Awaitable[str]]): 一个异步函数，用于动态生成注入内容。函数签名应为: `async def provider(params: "PromptParameters", target_prompt_name: str) -> str`。
- `source` (str, optional): 规则的来源标识，默认为 `"runtime"`。

**Returns:**
- `bool`: 如果成功添加或更新，则返回 `True`。

---

### 2. 移除注入规则

```python
async def remove_injection_rule(self, prompt_name: str, target_prompt: str) -> bool:
```

移除一条动态注入规则。

**Args:**
- `prompt_name` (str): 要移除的注入组件的名称。
- `target_prompt` (str): 该组件注入的目标核心提示词名称。

**Returns:**
- `bool`: 如果成功移除，则返回 `True`；如果规则不存在，则返回 `False`。

---

## 核心注入与预览 API

### 3. 预览注入结果

```python
async def preview_prompt_injections(
    self, target_prompt_name: str, params: PromptParameters
) -> str:
```

模拟应用所有注入规则，返回最终生成的模板字符串，而不实际修改任何状态。对于调试和测试非常有用。

**Args:**
- `target_prompt_name` (str): 希望预览的目标核心提示词名称。
- `params` (PromptParameters): 模拟的请求参数。

**Returns:**
- `str`: 模拟生成的最终提示词模板字符串。如果找不到模板，则返回错误信息。

---

## 状态观测与查询 API

### 4. 获取注入信息

```python
async def get_injection_info(
    self,
    target_prompt: str | None = None,
    detailed: bool = False,
) -> dict[str, list[dict]]:
```

获取当前生效的注入状态快照。此方法返回一个清晰的映射图，展示了哪些组件正在向哪些核心提示词注入内容，以及它们的应用优先级和来源。您可以将其用于监控和调试，以了解最终的提示词是如何被动态构建的。

- **`get_injection_info()`**: 返回所有目标的摘要注入信息。
- **`get_injection_info(target_prompt="...")`**: 返回指定目标的摘要注入信息。
- **`get_injection_info(detailed=True)`**: 返回所有目标的详细注入信息。
- **`get_injection_info(target_prompt="...", detailed=True)`**: 返回指定目标的详细注入信息。

**Args:**
- `target_prompt` (str, optional): 如果指定，仅返回该目标的注入信息。
- `detailed` (bool, optional): 如果为 `True`，返回包含注入类型和内容的详细信息。默认为 `False`，返回摘要信息。

**Returns:**
- `dict[str, list[dict]]`: 一个字典，键是目标提示词名称，值是按优先级排序的注入信息列表。
  - 摘要模式: `[{"name": str, "priority": int, "source": str}]`
  - 详细模式: `[{"name": str, "priority": int, "source": str, "injection_type": str, "target_content": str | None}]`

---

### 5. 获取注入规则对象

```python
def get_injection_rules(
    self,
    target_prompt: str | None = None,
    component_name: str | None = None,
) -> dict[str, dict[str, "InjectionRule"]]:
```

获取用于程序化操作的原始 `InjectionRule` 对象。与 `get_injection_info` 不同，此方法返回的是规则对象本身，而不是它们的描述性快照。这使得您可以在代码中读取、分析、甚至基于现有规则创建新的规则。返回的是一个深拷贝的副本，确保对返回值的修改不会影响管理器的内部状态。

- **`get_injection_rules()`**: 返回所有规则。
- **`get_injection_rules(target_prompt="...")`**: 仅返回注入到该目标的规则。
- **`get_injection_rules(component_name="...")`**: 仅返回由该组件定义的所有规则。

**Args:**
- `target_prompt` (str, optional): 按目标核心提示词名称筛选。
- `component_name` (str, optional): 按注入组件名称筛选。

**Returns:**
- `dict[str, dict[str, InjectionRule]]`: 嵌套字典，结构为 `{ "target_prompt": { "component_name": InjectionRule } }`。

---

## 辅助查询 API

### 6. 获取所有核心提示词名称

```python
def get_core_prompts(self) -> list[str]:
```

获取所有已注册的核心提示词模板名称列表（即所有可注入的目标）。

**Returns:**
- `list[str]`: 核心提示词名称的列表。

### 7. 获取所有核心提示词内容

```python
def get_core_prompt_contents(self) -> dict[str, str]:
```

获取所有核心提示词模板的原始内容。

**Returns:**
- `dict[str, str]`: 一个字典，键是提示词名称，值是模板原始内容。

### 8. 获取所有已注册的 Prompt 组件信息

```python
def get_registered_prompt_component_info(self) -> list[PromptInfo]:
```

获取所有在 `ComponentRegistry` 中注册的 Prompt 组件信息。

**Returns:**
- `list[PromptInfo]`: `PromptInfo` 对象的列表。
