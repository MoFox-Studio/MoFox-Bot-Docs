# LLM API

`src/app/plugin_system/api/llm_api` 提供面向插件开发的 LLM 请求构建接口。

## 导入

```python
from src.app.plugin_system.api.llm_api import (
    TaskType,
    get_model_set_by_task,
    get_model_set_by_name,
    create_llm_request,
    create_embedding_request,
    create_rerank_request,
    create_tool_registry,
)
```

## TaskType

| 枚举 | 值 | 说明 |
| --- | --- | --- |
| `TaskType.UTILS` | `"utils"` | 通用任务 |
| `TaskType.UTILS_SMALL` | `"utils_small"` | 轻量任务 |
| `TaskType.ACTOR` | `"actor"` | 主对话 |
| `TaskType.SUB_ACTOR` | `"sub_actor"` | 子任务/意图 |
| `TaskType.VLM` | `"vlm"` | 图像相关 |
| `TaskType.VOICE` | `"voice"` | 语音相关 |
| `TaskType.VIDEO` | `"video"` | 视频相关 |
| `TaskType.TOOL_USE` | `"tool_use"` | 工具调用优化 |

## 核心函数

### `get_model_set_by_task(name: str) -> ModelSet`

按任务名获取模型集合：

```python
model_set = get_model_set_by_task(TaskType.ACTOR.value)
```

### `get_model_set_by_name(model_name, *, temperature=None, max_tokens=None) -> ModelSet`

按模型名直接构造 `ModelSet`：

```python
model_set = get_model_set_by_name("gpt-4o", temperature=0.7, max_tokens=1024)
```

### `create_llm_request(model_set, request_name="", context_manager=None) -> LLMRequest`

创建对话请求对象。

### `create_tool_registry(tools=None) -> ToolRegistry`

把 Action/Tool/Collection 类注册为可调用工具。

### `create_embedding_request(...) -> EmbeddingRequest`

创建向量化请求。

### `create_rerank_request(...) -> RerankRequest`

创建重排请求。

## 基础用法

```python
from src.kernel.llm import LLMPayload, ROLE, Text

model_set = get_model_set_by_task("actor")
req = create_llm_request(model_set, request_name="chat")

req.add_payload(LLMPayload(ROLE.SYSTEM, Text("你是简洁中文助手")))
req.add_payload(LLMPayload(ROLE.USER, Text("介绍一下你自己")))

resp = await req.send(stream=False)
print(resp.message)      # 文本回复
print(resp.call_list)    # 工具调用列表（可能为空）
```

## 流式响应

```python
resp = await req.send(stream=True)

full_text = []
async for chunk in resp:
    full_text.append(chunk)
    print(chunk, end="", flush=True)
```

## Tool Calling 用法

关键约定：

- 工具声明使用 `ROLE.TOOL`
- 工具执行结果回传使用 `ROLE.TOOL_RESULT`
- 响应字段读取 `resp.call_list`

```python
from src.kernel.llm import LLMPayload, ROLE, Text, ToolResult

usables = [MyAction, MyTool]
registry = create_tool_registry(usables)
req.add_payload(LLMPayload(ROLE.TOOL, registry))

resp = await req.send(stream=False)

if resp.call_list:
    for tc in resp.call_list:
        # 这里执行你的工具逻辑，得到 result
        result = {"ok": True, "name": tc.name}
        req.add_payload(
            LLMPayload(
                ROLE.TOOL_RESULT,
                ToolResult(value=result, call_id=tc.id, name=tc.name),
            )
        )

    resp = await req.send(stream=False)
    print(resp.message)
```

## Embedding / Rerank 示例

```python
embedding_req = create_embedding_request(
    get_model_set_by_task("embedding"),
    request_name="embed_demo",
    inputs=["hello", "world"],
)
embedding_resp = await embedding_req.send()

rerank_req = create_rerank_request(
    get_model_set_by_task("rerank"),
    request_name="rerank_demo",
    query="异步编程",
    documents=["文档A", "文档B", "文档C"],
    top_n=2,
)
rerank_resp = await rerank_req.send()
```
