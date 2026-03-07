# Agent — 代理组件

`BaseAgent` 定义了"任务代理"组件的行为。Agent 是 Chatter 的任务协助者,拥有专属的私有 usables 套件,可以编排多个工具完成复杂任务。

## 工作原理

1. Agent 向 LLM 暴露为一个可调用工具(类似 Action/Tool)
2. 框架自动解析 `execute()` 方法的参数注解,生成 JSON Schema
3. LLM 决定调用 Agent 时,Agent 内部可以使用自己的私有 usables 来完成任务
4. Agent 的 usables 是私有的,不会进入全局组件注册表,只能被当前 Agent 使用

## Agent vs Action vs Tool

| 特性 | Tool | Action | Agent |
| --- | --- | --- | --- |
| **作用** | 查询信息 | 执行操作 | 协助完成复杂任务 |
| **副作用** | 无 | 有 | 视任务而定 |
| **私有 usables** | 无 | 无 | 有 |
| **可调用其他组件** | 否 | 否 | 是(仅限私有 usables) |
| **典型场景** | 计算器、查询天气 | 发送消息、调用 API | 多步骤任务、复杂决策 |

## 类属性

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `agent_name` | `str` | `""` | Agent 名称(必须设置,在插件内唯一) |
| `agent_description` | `str` | `""` | 向 LLM 描述该 Agent 的功能 |
| `chatter_allow` | `list[str]` | `[]` | 允许调用的 Chatter 名称列表,空列表表示全部允许 |
| `chat_type` | `ChatType` | `ChatType.ALL` | 支持的聊天类型 |
| `associated_platforms` | `list[str]` | `[]` | 关联平台,空列表表示所有平台 |
| `associated_types` | `list[str]` | `[]` | 需要的内容类型列表 |
| `dependencies` | `list[str]` | `[]` | 组件级依赖的组件签名列表 |
| `usables` | `list[type[LLMUsable] \| str]` | `[]` | Agent 专属可调用组件类列表 |

## 必须实现的方法

### `execute(*args, **kwargs) -> tuple[bool, str | dict]`

Agent 的核心执行逻辑。

**返回值**: `(是否成功, 结果描述或数据)`

**重要**: `execute()` 的参数会被框架解析为 LLM Tool Schema。

- 推荐使用 `Annotated[type, "描述"]` 提供参数说明
- 若未提供 `Annotated`/docstring 参数描述,框架会回退为通用描述
- 描述文字会直接影响 LLM 调用质量

```python
from typing import Annotated

async def execute(
    self,
    task_name: Annotated[str, "要执行的任务名称"],
    params: Annotated[dict, "任务参数,JSON 格式"] = {},
) -> tuple[bool, str | dict]:
    ...
```

## 可选激活钩子

### `go_activate() -> bool`

动态判断该 Agent 是否在当前对话中可用。

常见场景:
- 按概率激活
- 按上下文条件激活
- 按外部状态(如配置开关、额外)激活

```python
class DataAnalysisAgent(BaseAgent):
    agent_name = "data_analysis"
    agent_description = "数据分析代理"

    async def go_activate(self) -> bool:
        # 仅在用户权限足够时激活
        config = self.plugin.config.data_analysis
        return config.enabled
```

## 实例属性

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `self.stream_id` | `str` | 当前聊天流 ID |
| `self.plugin` | `BasePlugin` | 所属插件实例 |

## 私有 Usables 系统

Agent 的核心特性是拥有私有 usables 套件,可以编排多个组件完成复杂任务。

### 定义私有 Usables

在类属性 `usables` 中声明:

```python
from src.core.components.base.agent import BaseAgent
from src.core.components.base.tool import BaseTool

class CalculatorTool(BaseTool):
    """计算器工具(Agent 私有)"""
    tool_name = "calculator"
    tool_description = "执行数学计算"
    
    async def execute(
        self,
        expression: Annotated[str, "数学表达式,如 '2 + 3 * 4'"]
    ) -> tuple[bool, str]:
        try:
            result = eval(expression)
            return True, str(result)
        except Exception as e:
            return False, f"计算失败: {e}"


class DataAnalysisAgent(BaseAgent):
    """数据分析代理"""
    agent_name = "data_analysis"
    agent_description = "分析数据并生成报告"
    
    # 定义私有 usables
    usables = [CalculatorTool]
    
    async def execute(
        self,
        data: Annotated[str, "要分析的数据,JSON 格式"]
    ) -> tuple[bool, str]:
        # Agent 内部可以调用私有 usables
        result = await self.execute_local_usable(
            usable_name="calculator",
            expression="sum([1,2,3])"
        )
        return result
```

### 引用已注册组件

除了直接定义类,还可以使用组件签名字符串引用全局注册表中的组件:

```python
class MyAgent(BaseAgent):
    agent_name = "my_agent"
    agent_description = "我的代理"
    
    # 引用其他插件的组件作为私有 usables
    usables = [
        "weather_plugin:tool:weather_query",  # 组件签名
        "translator_plugin:tool:translate",   # 组件签名
    ]
```

### 使用 LLM 编排 Usables

Agent 可以使用 `create_llm_request()` 方法创建 LLM 请求,并自动注入私有 usables:

```python
from typing import Annotated
from src.core.components.base.agent import BaseAgent
from src.kernel.llm import LLMPayload, ROLE

class SmartAgent(BaseAgent):
    agent_name = "smart_agent"
    agent_description = "智能代理,可以使用多个工具完成复杂任务"
    
    usables = [
        WeatherTool,
        TranslateTool,
        CalculatorTool,
    ]
    
    async def execute(
        self,
        task: Annotated[str, "任务描述"]
    ) -> tuple[bool, str]:
        from src.app.plugin_system.api.llm_api import get_default_model_set
        
        # 创建 LLM 请求,自动注入私有 usables
        model_set = await get_default_model_set()
        request = self.create_llm_request(
            model_set=model_set,
            request_name="smart_agent_task",
            with_usables=True  # 自动注入私有 usables
        )
        
        # 添加任务描述
        request.add_payload(LLMPayload(
            ROLE.USER,
            f"请帮我完成以下任务: {task}"
        ))
        
        # 调用 LLM,让它决定如何使用 usables
        response = await request.request()
        
        if response.success:
            return True, response.content
        else:
            return False, f"任务失败: {response.error}"
```

### 手动执行私有 Usable

使用 `execute_local_usable()` 方法:

```python
async def execute(
    self,
    text: Annotated[str, "要翻译的文本"]
) -> tuple[bool, str]:
    # 调用私有 usable
    success, result = await self.execute_local_usable(
        usable_name="translate",  # 对应 schema.function.name
        text=text,
        target_lang="en"
    )
    
    if success:
        return True, f"翻译结果: {result}"
    else:
        return False, f"翻译失败: {result}"
```

**注意事项**:
- `usable_name` 对应组件 schema 的 `function.name`
- 框架会自动去除 `tool-`/`action-`/`agent-` 前缀进行匹配
- 仅支持 `BaseTool`/`BaseAction`/`BaseAgent` 子类

## 完整示例

### 示例 1: 简单任务代理

```python
from typing import Annotated
from src.core.components.base.agent import BaseAgent
from src.core.components.base.tool import BaseTool

class WeatherTool(BaseTool):
    """天气查询工具"""
    tool_name = "weather"
    tool_description = "查询城市天气"
    
    async def execute(
        self,
        city: Annotated[str, "城市名称"]
    ) -> tuple[bool, str]:
        # 模拟查询天气
        return True, f"{city}的天气: 晴天,25°C"


class TravelAgent(BaseAgent):
    """旅行助手代理"""
    agent_name = "travel_agent"
    agent_description = "帮助用户规划旅行,查询天气、推荐景点等"
    
    usables = [WeatherTool]
    
    async def execute(
        self,
        city: Annotated[str, "目的地城市"],
        days: Annotated[int, "旅行天数"] = 3
    ) -> tuple[bool, str]:
        from src.app.plugin_system.api.log_api import get_logger
        
        logger = get_logger("travel_agent")
        logger.info(f"规划旅行: {city}, {days}天")
        
        # 查询天气
        success, weather = await self.execute_local_usable(
            usable_name="weather",
            city=city
        )
        
        if not success:
            return False, f"查询天气失败: {weather}"
        
        # 生成旅行建议
        plan = f"""
旅行规划 - {city} ({days}天)

天气情况: {weather}

建议行程:
第1天: 参观市区景点
第2天: 郊区游览
第3天: 购物和休闲

祝您旅途愉快!
"""
        return True, plan.strip()
```

### 示例 2: 使用 LLM 编排的智能代理

```python
from typing import Annotated
from src.core.components.base.agent import BaseAgent
from src.core.components.base.tool import BaseTool
from src.kernel.llm import LLMPayload, ROLE

class SearchTool(BaseTool):
    """搜索工具"""
    tool_name = "search"
    tool_description = "搜索网络信息"
    
    async def execute(
        self,
        query: Annotated[str, "搜索关键词"]
    ) -> tuple[bool, str]:
        return True, f"搜索结果: {query} 相关信息..."


class CalculatorTool(BaseTool):
    """计算器"""
    tool_name = "calculator"
    tool_description = "执行数学计算"
    
    async def execute(
        self,
        expression: Annotated[str, "数学表达式"]
    ) -> tuple[bool, str]:
        try:
            result = eval(expression)
            return True, str(result)
        except Exception as e:
            return False, str(e)


class ResearchAgent(BaseAgent):
    """研究助手代理"""
    agent_name = "research_agent"
    agent_description = "帮助用户进行资料研究,可以搜索信息、进行计算等"
    
    usables = [SearchTool, CalculatorTool]
    
    async def execute(
        self,
        topic: Annotated[str, "研究主题"]
    ) -> tuple[bool, str]:
        from src.app.plugin_system.api.llm_api import get_default_model_set
        
        # 获取模型配置
        model_set = await get_default_model_set()
        
        # 创建 LLM 请求,自动注入私有 usables
        request = self.create_llm_request(
            model_set=model_set,
            request_name="research_agent",
            with_usables=True
        )
        
        # 添加系统提示
        request.add_payload(LLMPayload(
            ROLE.SYSTEM,
            "你是一个研究助手,可以使用搜索和计算工具帮助用户研究主题。"
            "请合理使用工具,并生成详细的研究报告。"
        ))
        
        # 添加用户任务
        request.add_payload(LLMPayload(
            ROLE.USER,
            f"请帮我研究以下主题: {topic}"
        ))
        
        # 调用 LLM
        response = await request.request()
        
        if response.success:
            return True, response.content
        else:
            return False, f"研究失败: {response.error}"
```

### 示例 3: 引用外部组件

```python
from typing import Annotated
from src.core.components.base.agent import BaseAgent

class MultiPluginAgent(BaseAgent):
    """跨插件代理"""
    agent_name = "multi_plugin_agent"
    agent_description = "可以使用多个插件的功能"
    
    # 引用其他插件的组件
    usables = [
        "weather_plugin:tool:weather_query",
        "translator_plugin:tool:translate",
        "image_plugin:tool:image_search",
    ]
    
    async def execute(
        self,
        task: Annotated[str, "任务描述"]
    ) -> tuple[bool, str]:
        from src.app.plugin_system.api.llm_api import get_default_model_set
        
        model_set = await get_default_model_set()
        request = self.create_llm_request(
            model_set=model_set,
            request_name="multi_plugin_agent",
            with_usables=True
        )
        
        request.add_payload(LLMPayload(
            ROLE.USER,
            f"任务: {task}"
        ))
        
        response = await request.request()
        return response.success, response.content if response.success else response.error
```

## 最佳实践

### 1. 合理设计 Usables

- **小而专注**: 每个 usable 应该只做一件事
- **可组合**: usables 之间可以组合使用
- **独立性**: usables 不应该相互依赖

### 2. 使用 LLM 编排

对于复杂任务,推荐使用 LLM 来决定如何使用 usables:

```python
# ✅ 推荐: LLM 决定工具使用顺序
request = self.create_llm_request(
    model_set=model_set,
    with_usables=True
)
response = await request.request()

# ❌ 不推荐: 硬编码工具调用顺序
await self.execute_local_usable("tool1", ...)
await self.execute_local_usable("tool2", ...)
```

### 3. 提供清晰的描述

`agent_description` 和参数描述直接影响 LLM 的调用准确性:

```python
# ✅ 好的描述
class MyAgent(BaseAgent):
    agent_name = "my_agent"
    agent_description = (
        "帮助用户进行数据分析,支持: "
        "1. 统计计算 "
        "2. 数据可视化 "
        "3. 趋势预测"
    )
    
    async def execute(
        self,
        data: Annotated[str, "CSV 格式的数据,包含表头行"],
        analysis_type: Annotated[str, "分析类型: 'stats'(统计), 'visual'(可视化), 'predict'(预测)"]
    ) -> tuple[bool, str]:
        ...

# ❌ 不好的描述
class MyAgent(BaseAgent):
    agent_name = "my_agent"
    agent_description = "分析数据"  # 太简单
    
    async def execute(self, data: str, type: str) -> tuple[bool, str]:  # 缺少注解
        ...
```

### 4. 错误处理

```python
async def execute(
    self,
    task: Annotated[str, "任务描述"]
) -> tuple[bool, str]:
    try:
        # 执行任务
        result = await self.execute_local_usable("tool", task=task)
        return result
    except ValueError as e:
        # usable 不存在
        return False, f"工具未找到: {e}"
    except Exception as e:
        # 其他错误
        return False, f"执行失败: {e}"
```

### 5. 日志记录

```python
async def execute(
    self,
    task: Annotated[str, "任务描述"]
) -> tuple[bool, str]:
    from src.app.plugin_system.api.log_api import get_logger
    
    logger = get_logger(f"agent.{self.agent_name}")
    logger.info(f"开始执行任务: {task}")
    
    try:
        result = await self._do_task(task)
        logger.info(f"任务完成: {result}")
        return True, result
    except Exception as e:
        logger.error(f"任务失败: {e}", exc_info=True)
        return False, str(e)
```

## 常见问题

### Q: Agent 和 Action 有什么区别?

**A**: 
- **Action**: 执行单一操作,不能调用其他组件
- **Agent**: 可以编排多个私有 usables 完成复杂任务

### Q: Agent 的 usables 能被其他插件使用吗?

**A**: 不能。Agent 的 usables 是私有的,不会进入全局组件注册表,只能被当前 Agent 使用。

### Q: 如何引用其他插件的组件作为 usables?

**A**: 使用组件签名字符串:

```python
usables = [
    "other_plugin:tool:tool_name",
    MyLocalTool,  # 或直接使用类
]
```

### Q: Agent 可以调用另一个 Agent 吗?

**A**: 可以! 在 `usables` 中添加其他 Agent:

```python
usables = [
    "plugin:agent:other_agent",  # 引用其他 Agent
    SubAgent,  # 或私有定义的 Agent
]
```

### Q: 如何在 Agent 内部获取聊天流信息?

**A**: 使用 `self.stream_id` 和相关 API:

```python
async def execute(self, task: str) -> tuple[bool, str]:
    from src.app.plugin_system.api.stream_api import get_or_create_stream
    
    # 获取聊天流
    chat_stream = await get_or_create_stream(self.stream_id)
    platform = chat_stream.platform
    
    # 发送消息
    from src.app.plugin_system.api.send_api import send_text
    await send_text(
        stream_id=self.stream_id,
        platform=platform,
        content="任务进行中..."
    )
    
    # 继续执行任务
    ...
```

## 相关文档

- [Action 组件](./action) — 单一操作组件
- [Tool 组件](./tool) — 查询工具组件
- [Chatter 组件](./chatter) — 对话核心组件
- [Agent API](../api/agent-api) — Agent 组件 API 文档
