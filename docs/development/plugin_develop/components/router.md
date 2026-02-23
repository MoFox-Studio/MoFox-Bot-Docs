# Router — 路由组件

`BaseRouter` 为插件提供基于 FastAPI 的 HTTP 路由能力。

## 类属性

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `router_name` | `str` | `""` | 路由名称 |
| `router_description` | `str` | `""` | 描述 |
| `custom_route_path` | `str | None` | `None` | 自定义挂载路径 |
| `cors_origins` | `list[str] | None` | `None` | CORS 白名单；`None` 表示不启用 |
| `dependencies` | `list[str]` | `[]` | 组件级依赖 |

## 必须实现

### `register_endpoints() -> None`

在该方法内通过 `self.app` 注册接口。

## 示例

```python
from fastapi import HTTPException
from pydantic import BaseModel

from src.core.components.base.router import BaseRouter


class WebhookPayload(BaseModel):
    event: str
    data: dict


class WebhookRouter(BaseRouter):
    router_name = "webhook"
    router_description = "Webhook 接收"
    custom_route_path = "/api/webhook"
    cors_origins = ["*"]

    def register_endpoints(self) -> None:
        @self.app.post("/github")
        async def github_webhook(payload: WebhookPayload):
            if payload.event not in {"push", "pull_request"}:
                raise HTTPException(status_code=400, detail="不支持的事件")
            return {"ok": True, "event": payload.event}

        @self.app.get("/health")
        async def health():
            return {"status": "ok"}
```

默认挂载路径示例：`/router/webhook`。
