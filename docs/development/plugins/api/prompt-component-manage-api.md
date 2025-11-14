# Prompt 组件管理 API (`prompt_component_manager`)

`prompt_component_manager` 是整个提示词动态注入系统的核心。它以**全局单例**的形式存在，作为一个统一的、动态的、可观测的管理中心，确保在整个应用中所有部分共享和操作同一份动态规则集。

## 核心概念

在深入了解 API 之前，理解以下几个核心概念至关重要：

-   **注入规则 (`InjectionRule`)**: 这是一个数据类，定义了“什么内容”要“如何”以及“在哪里”注入。它包含了注入的目标（`target_prompt`）、注入方式（`injection_type`，如 `PREPEND`、`REPLACE` 等）、优先级（`priority`）以及注入的具体位置（`target_content`，用于 `REPLACE` 等类型）。
-   **内容提供者 (`content_provider`)**: 这是一个异步函数，负责在注入时**动态生成**要注入的内容。管理器在应用规则时会调用它，并传入当前请求的参数。这使得注入内容可以根据上下文动态变化。
-   **规则来源 (`source`)**: 一个字符串，用于标识规则的来源。例如，`"static_default"` 表示来自组件类定义的静态规则，而 `"runtime"` 表示在运行时通过 API 动态添加的规则。这有助于调试和追踪规则的来源。
-   **优先级 (`priority`)**: 一个整数，决定了多条规则注入到同一目标时的应用顺序。**数字越小，优先级越高**，越先被应用。

## 生命周期

`prompt_component_manager` 的生命周期主要分为两个阶段：

1.  **静态规则加载 (启动时)**: 在系统首次需要应用注入时（通常是第一次构建核心 Prompt 时），管理器会自动调用 `load_static_rules()` 方法。该方法会扫描所有已在 `component_registry` 中注册并启用的 Prompt 组件，将其类中定义的静态 `injection_rules` 加载为管理器的初始动态规则集。此操作仅执行一次。
2.  **动态规则管理 (运行时)**: 系统启动后，插件、命令或其他业务逻辑可以通过调用管理器提供的 API，在任何时候动态地添加、更新或移除注入规则，从而实时地改变提示词的最终结构。

## 导入方式

```python
from src.chat.utils.prompt_component_manager import prompt_component_manager
```

---

## API 详解

### 运行时规则管理

这类 API 用于在运行时动态地修改注入规则。

#### 1. `add_injection_rule`

```python
async def add_injection_rule(
    self,
    prompt_name: str,
    rules: List[InjectionRule],
    content_provider: Callable[..., Awaitable[str]],
    source: str = "runtime",
) -> bool:
```

动态添加或更新一条或多条注入规则。如果已存在由同名组件 (`prompt_name`) 针对同一目标 (`target_prompt`) 的规则，此方法会**覆盖**旧规则。

**Args:**
-   `prompt_name` (str): 注入组件的唯一名称。
-   `rules` (List[InjectionRule]): 描述注入行为的 `InjectionRule` 对象列表。
-   `content_provider` (Callable[..., Awaitable[str]]): 一个异步函数，用于动态生成注入内容。函数签名应为: `async def provider(params: "PromptParameters", target_prompt_name: str) -> str`。
-   `source` (str, optional): 规则的来源标识，默认为 `"runtime"`。

**Returns:**
-   `bool`: 如果成功添加或更新，则返回 `True`。

#### 2. `remove_injection_rule`

```python
async def remove_injection_rule(self, prompt_name: str, target_prompt: str) -> bool:
```

精确地移除**一条**动态注入规则，即解除一个组件与一个特定目标之间的注入关系。此方法需要同时指定组件名称和目标名称，不能用于一次性移除某个组件的所有注入规则。

**Args:**
-   `prompt_name` (str): 要移除的注入组件的名称。
-   `target_prompt` (str): 该组件注入的目标核心提示词名称。

**Returns:**
-   `bool`: 如果成功移除，则返回 `True`；如果规则不存在，则返回 `False`。

### 核心注入与预览

#### 3. `preview_prompt_injections`

```python
async def preview_prompt_injections(
    self, target_prompt_name: str, params: PromptParameters
) -> str:
```

模拟应用所有注入规则，返回最终生成的模板字符串，而不实际修改任何内部状态。这个方法对于调试和测试插件的注入行为非常有用。

**Args:**
-   `target_prompt_name` (str): 希望预览的目标核心提示词名称。
-   `params` (PromptParameters): 模拟的请求参数，将传递给每个规则的 `content_provider`。

**Returns:**
-   `str`: 模拟生成的最终提示词模板字符串。如果找不到目标提示词，则返回错误信息。

### 状态观测与查询

#### 4. `get_injection_info`

```python
async def get_injection_info(
    self,
    target_prompt: str | None = None,
    detailed: bool = False,
) -> dict[str, list[dict]]:
```

获取当前生效的注入状态快照，用于监控和调试。此方法返回一个清晰的映射图，展示了哪些组件正在向哪些核心提示词注入内容，以及它们的优先级和来源。

-   **`get_injection_info()`**: 返回所有目标的摘要注入信息。
-   **`get_injection_info(target_prompt="...")`**: 返回指定目标的摘要注入信息。
-   **`get_injection_info(detailed=True)`**: 返回所有目标的详细注入信息。
-   **`get_injection_info(target_prompt="...", detailed=True)`**: 返回指定目标的详细注入信息。

**Args:**
-   `target_prompt` (str, optional): 如果指定，仅返回该目标的注入信息。
-   `detailed` (bool, optional): 如果为 `True`，返回包含注入类型和 `target_content` 的详细信息。默认为 `False`。

**Returns:**
-   `dict[str, list[dict]]`: 一个字典，键是目标提示词名称，值是按优先级排序的注入信息列表。
    -   摘要模式: `[{"name": str, "priority": int, "source": str}]`
    -   详细模式: `[{"name": str, "priority": int, "source": str, "injection_type": str, "target_content": str | None}]`

#### 5. `get_injection_rules`

```python
def get_injection_rules(
    self,
    target_prompt: str | None = None,
    component_name: str | None = None,
) -> dict[str, dict[str, "InjectionRule"]]:
```

获取用于程序化操作的原始 `InjectionRule` 对象。与 `get_injection_info` 不同，此方法返回的是规则对象本身，而不是它们的描述性快照。返回的是一个**深拷贝**的副本，确保对返回值的修改不会影响管理器的内部状态。

-   **`get_injection_rules()`**: 返回所有规则。
-   **`get_injection_rules(target_prompt="...")`**: 仅返回注入到该目标的规则。
-   **`get_injection_rules(component_name="...")`**: 仅返回由该组件定义的所有规则。

**Args:**
-   `target_prompt` (str, optional): 按目标核心提示词名称筛选。
-   `component_name` (str, optional): 按注入组件名称筛选。

**Returns:**
-   `dict[str, dict[str, InjectionRule]]`: 嵌套字典，结构为 `{ "target_prompt": { "component_name": InjectionRule } }`。

#### 6. `get_registered_prompt_component_info`

```python
def get_registered_prompt_component_info(self) -> list[PromptInfo]:
```

获取所有已注册和动态添加的 Prompt 组件信息，并**反映当前的注入规则状态**。该方法会合并静态注册的组件信息和运行时的动态注入规则，确保返回的 `PromptInfo` 列表能够准确地反映系统当前的完整状态。

**Returns:**
-   `list[PromptInfo]`: 一个包含所有静态和动态 Prompt 组件信息的 `PromptInfo` 对象列表。

### 辅助查询 API

#### 7. `get_core_prompts`

```python
def get_core_prompts(self) -> list[str]:
```

获取所有已注册的核心提示词模板名称列表（即所有可注入的目标）。

**Returns:**
-   `list[str]`: 核心提示词名称的列表。

#### 8. `get_core_prompt_contents`

```python
def get_core_prompt_contents(self, prompt_name: str | None = None) -> list[list[str]]:
```

获取核心提示词模板的原始内容。

**Args:**
-   `prompt_name` (str | None, optional): 如果指定，则只返回该名称对应的提示词模板。如果为 `None`，则返回所有核心提示词模板。默认为 `None`。

**Returns:**
-   `list[list[str]]`: 一个列表，每个子列表包含 `[prompt_name, template_content]`。如果指定了 `prompt_name` 但未找到，则返回空列表。
