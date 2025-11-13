# Prompt 组件管理 API

Prompt 组件管理 API (`prompt_component_manager`) 是整个提示词动态注入系统的核心，它负责管理、应用和观测所有与提示词相关的注入规则。

## 导入方式
```python
from src.chat.utils.prompt_component_manager import prompt_component_manager
```

## 功能概述

该管理器主要提供以下几类功能：
- **规则管理** - 在运行时动态地添加、更新或移除注入规则。
- **注入应用** - 在构建提示词时，根据规则动态地装配模板。
- **状态观测** - 查询系统当前完整的注入状态、所有可用的组件和核心提示词。

---

## 核心 API 详解

### 1. 动态添加或更新注入规则
```python
async def add_injection_rule(
    self,
    prompt_name: str,
    rule: InjectionRule,
    content_provider: Callable[..., Awaitable[str]],
    source: str = "runtime",
) -> bool:
```
动态添加或更新一条注入规则。如果已存在同名组件针对同一目标的规则，此方法会覆盖旧规则。

**Args:**
- `prompt_name` (str): 动态注入组件的唯一名称。
- `rule` (InjectionRule): 描述注入行为的 `InjectionRule` 对象。
- `content_provider` (Callable[..., Awaitable[str]]): 一个异步函数，用于动态生成注入内容。函数签名应为: `async def provider(params: "PromptParameters") -> str`。
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

### 4. 获取所有核心提示词名称
```python
def get_core_prompts(self) -> list[str]:
```
获取所有已注册的核心提示词模板名称列表（即所有可注入的目标）。

**Returns:**
- `list[str]`: 核心提示词名称的列表。


### 5. 获取所有核心提示词内容
```python
def get_core_prompt_contents(self) -> dict[str, str]:
```
获取所有核心提示词模板的原始内容。

**Returns:**
- `dict[str, str]`: 一个字典，键是提示词名称，值是模板原始内容。


### 6. 获取所有已注册的 Prompt 组件信息
```python
def get_registered_prompt_component_info(self) -> list[PromptInfo]:
```
获取所有在 `ComponentRegistry` 中注册的 Prompt 组件信息。

**Returns:**
- `list[PromptInfo]`: `PromptInfo` 对象的列表。


### 7. 获取完整的注入映射图
```python
async def get_full_injection_map(self) -> dict[str, list[dict]]:
```
获取当前完整的注入映射图，展示了每个核心提示词被哪些注入组件以何种优先级注入。

**Returns:**
- `dict[str, list[dict]]`: 一个字典，键是目标提示词名称，值是按优先级排序的注入信息列表 `[{"name": str, "priority": int, "source": str}]`。


### 8. 获取指定提示词的注入信息
```python
async def get_injections_for_prompt(self, target_prompt_name: str) -> list[dict]:
```
获取指定核心提示词模板的所有注入信息（包含详细规则）。

**Args:**
- `target_prompt_name` (str): 目标核心提示词的名称。

**Returns:**
- `list[dict]`: 一个包含注入规则详细信息的列表，已按优先级排序。

### 9. 获取所有动态规则
```python
def get_all_dynamic_rules(self) -> dict[str, dict[str, "InjectionRule"]]:
```
获取所有当前的动态注入规则，以 `InjectionRule` 对象形式返回。此方法返回一个深拷贝的副本，适合用于展示或序列化。

**Returns:**
- `dict[str, dict[str, "InjectionRule"]]`: 嵌套字典，外层键是目标名称，内层键是组件名称。

### 10. 获取注入到指定目标的规则
```python
def get_rules_for_target(self, target_prompt: str) -> dict[str, InjectionRule]:
```
获取所有注入到指定核心提示词的动态规则。

**Args:**
- `target_prompt` (str): 目标核心提示词的名称。

**Returns:**
- `dict[str, InjectionRule]`: 一个字典，键是注入组件的名称，值是 `InjectionRule` 对象。

### 11. 获取由指定组件定义的所有规则
```python
def get_rules_by_component(self, component_name: str) -> dict[str, InjectionRule]:
```
获取由指定的单个注入组件定义的所有动态规则。

**Args:**
- `component_name` (str): 注入组件的名称。

**Returns:**
- `dict[str, InjectionRule]`: 一个字典，键是目标核心提示词的名称，值是 `InjectionRule` 对象。
