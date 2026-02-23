# 进阶开发

本章介绍跨插件协作、LLM 进阶用法、并发任务与权限模型。

## 跨插件通信

## 通过 Service 调用

```python
from src.core.managers import get_service_manager

sm = get_service_manager()
translator = sm.get_service("translation_plugin:service:translator")
if translator:
    result = await translator.translate("hello", "zh")
```

在 `manifest.json` 中声明组件依赖：

```json
{
  "dependencies": {
    "components": ["translation_plugin:service:translator"]
  }
}
```

## 通过事件总线解耦

```python
from src.app.plugin_system.api.event_api import publish_event

await publish_event("my_plugin:user_action", {"user_id": "u1", "action": "buy"})
```

## LLM 进阶

## 上下文管理

```python
from src.app.plugin_system.api.llm_api import create_llm_request, get_model_set_by_task
from src.kernel.llm import LLMContextManager, LLMPayload, ROLE, Text

ctx = LLMContextManager()
model_set = get_model_set_by_task("actor")

req = create_llm_request(model_set, request_name="turn_1", context_manager=ctx)
req.add_payload(LLMPayload(ROLE.USER, Text("你叫什么？")))
resp = await req.send(stream=False)
```

## 工具注册与调用

```python
from src.app.plugin_system.api.llm_api import create_tool_registry
from src.kernel.llm import LLMPayload, ROLE

registry = create_tool_registry([SendTextAction, CalculatorTool])
req.add_payload(LLMPayload(ROLE.TOOL, registry))

resp = await req.send(stream=False)
for call in resp.call_list or []:
    ...
```

## 流式响应

```python
resp = await req.send(stream=True)
async for chunk in resp:
    print(chunk, end="", flush=True)
```

## 数据持久化

```python
from src.app.plugin_system.api.database_api import create, get_by, update, delete

row = await create(MyModel, {"key": "k1", "value": "v1"})
row = await get_by(MyModel, key="k1")
row = await update(MyModel, row.id, {"value": "v2"})
await delete(MyModel, row.id)
```

## 并发任务

不要直接使用 `asyncio.create_task()`，统一走任务管理器：

```python
from src.kernel.concurrency import get_task_manager

tm = get_task_manager()
tm.create_task(my_background_task(), name="my_plugin:background")

async with tm.group(name="batch", timeout=60, cancel_on_error=True) as tg:
    tg.create_task(task_a())
    tg.create_task(task_b())
```

## Collection 门控

Collection 可作为工具集合入口，按需解包内部组件。

```python
class PremiumCollection(BaseCollection):
    collection_name = "premium_tools"

    async def get_contents(self) -> list[str]:
        return [
            "my_plugin:action:vip_action",
            "my_plugin:tool:advanced_search",
        ]
```

## 权限系统

`Command.permission_level` 使用 `PermissionLevel`：

| 枚举 | 值 | 说明 |
| --- | --- | --- |
| `GUEST` | `1` | 访客 |
| `USER` | `2` | 普通用户 |
| `OPERATOR` | `3` | 管理操作 |
| `OWNER` | `4` | 所有者 |

```python
from src.core.components.types import PermissionLevel

class AdminCommand(BaseCommand):
    command_name = "admin"
    permission_level = PermissionLevel.OPERATOR
```
