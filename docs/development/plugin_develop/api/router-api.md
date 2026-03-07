# Router API

`src/app/plugin_system/api/router_api` 提供路由的查询、挂载与卸载能力。

## 导入

```python
from src.app.plugin_system.api.router_api import (
    get_all_routers,
    get_routers_for_plugin,
    get_router_class,
    get_mounted_router,
    get_all_mounted_routers,
    mount_router,
    unmount_router,
    mount_plugin_routers,
    unmount_plugin_routers,
)
```

## 核心函数

### `get_all_routers() -> dict[str, type[BaseRouter]]`

获取所有已注册的 Router 组件。

**返回值：**
```python
{
    "webui:router:api": WebUIRouter,
    "plugin:router:webhook": WebhookRouter,
}
```

**使用示例：**
```python
routers = get_all_routers()
print(f"共有 {len(routers)} 个 Router 组件")
```

---

### `get_routers_for_plugin(plugin_name: str) -> dict[str, type[BaseRouter]]`

获取指定插件的所有 Router 组件。

**参数：**
- `plugin_name`: 插件名称

**返回值：**
```python
{
    "my_plugin:router:api": MyAPIRouter,
    "my_plugin:router:webhook": MyWebhookRouter,
}
```

**使用示例：**
```python
routers = get_routers_for_plugin("my_plugin")
for signature, router_class in routers.items():
    print(f"Router: {signature}")
```

---

### `get_router_class(signature: str) -> type[BaseRouter] | None`

通过签名获取 Router 类。

**参数：**
- `signature`: Router 组件签名

**返回值：**
- Router 类，未找到则返回 `None`

**使用示例：**
```python
router_class = get_router_class("my_plugin:router:api")
if router_class:
    print(f"找到 Router: {router_class.__name__}")
```

---

### `get_mounted_router(signature: str) -> BaseRouter | None`

获取已挂载的 Router 实例。

**参数：**
- `signature`: Router 组件签名

**返回值：**
- Router 实例，未挂载则返回 `None`

**使用示例：**
```python
router = get_mounted_router("my_plugin:router:api")
if router:
    print(f"Router 已挂载: {router.prefix}")
else:
    print("Router 未挂载")
```

---

### `get_all_mounted_routers() -> dict[str, BaseRouter]`

获取所有已挂载的 Router 实例。

**返回值：**
```python
{
    "webui:router:api": <WebUIRouter instance>,
    "my_plugin:router:webhook": <MyWebhookRouter instance>,
}
```

**使用示例：**
```python
routers = get_all_mounted_routers()
print(f"已挂载 {len(routers)} 个 Router")

for signature, router in routers.items():
    print(f"- {signature}: {router.prefix}")
```

---

### `mount_router(signature: str, plugin: BasePlugin) -> BaseRouter`

挂载单个 Router。

**参数：**
- `signature`: Router 组件签名
- `plugin`: 插件实例

**返回值：**
- Router 实例

**使用示例：**
```python
router = await mount_router(
    signature="my_plugin:router:api",
    plugin=self.plugin,
)

print(f"Router 已挂载到路径: {router.prefix}")
```

---

### `unmount_router(signature: str) -> None`

卸载单个 Router。

**参数：**
- `signature`: Router 组件签名

**使用示例：**
```python
await unmount_router("my_plugin:router:api")
print("Router 已卸载")
```

---

### `mount_plugin_routers(plugin: BasePlugin) -> list[BaseRouter]`

挂载插件的所有 Router 组件。

**参数：**
- `plugin`: 插件实例

**返回值：**
- Router 实例列表

**使用示例：**
```python
routers = await mount_plugin_routers(self.plugin)
print(f"已挂载 {len(routers)} 个 Router")

for router in routers:
    print(f"- {router.prefix}")
```

---

### `unmount_plugin_routers(plugin_name: str) -> None`

卸载插件的所有 Router 组件。

**参数：**
- `plugin_name`: 插件名称

**使用示例：**
```python
await unmount_plugin_routers("my_plugin")
print("插件的所有 Router 已卸载")
```

## 完整示例

### 示例 1：创建 Router 组件

```python
from src.core.components.base.router import BaseRouter
from fastapi import APIRouter

class MyAPIRouter(BaseRouter):
    """自定义 API 路由器"""
    
    name = "api"
    prefix = "/api/my_plugin"
    tags = ["my_plugin"]
    
    def create_router(self) -> APIRouter:
        """创建路由器"""
        router = APIRouter(
            prefix=self.prefix,
            tags=self.tags,
        )
        
        @router.get("/status")
        async def get_status():
            return {"status": "ok", "plugin": self.plugin.name}
        
        @router.post("/action")
        async def execute_action(action_name: str, params: dict):
            # 执行动作逻辑
            return {"action": action_name, "params": params}
        
        return router
```

### 示例 2：动态挂载/卸载 Router

```python
from src.app.plugin_system.api.router_api import (
    mount_router,
    unmount_router,
    get_mounted_router,
)

class RouterManagerCommand(BaseCommand):
    name = "router"
    description = "管理 Router"
    permission = PermissionLevel.ADMIN
    
    async def execute(self, action: str, signature: str = ""):
        if action == "mount":
            # 挂载 Router
            if get_mounted_router(signature):
                await self.send_text(f"Router {signature} 已挂载")
                return
            
            try:
                router = await mount_router(
                    signature=signature,
                    plugin=self.plugin,
                )
                await self.send_text(
                    f"Router 已挂载到路径: {router.prefix}"
                )
            except Exception as e:
                await self.send_text(f"挂载失败: {e}")
        
        elif action == "unmount":
            # 卸载 Router
            if not get_mounted_router(signature):
                await self.send_text(f"Router {signature} 未挂载")
                return
            
            try:
                await unmount_router(signature)
                await self.send_text(f"Router {signature} 已卸载")
            except Exception as e:
                await self.send_text(f"卸载失败: {e}")
        
        elif action == "list":
            # 列出所有已挂载的 Router
            routers = get_all_mounted_routers()
            
            if not routers:
                await self.send_text("没有已挂载的 Router")
                return
            
            result = ["已挂载的 Router:"]
            for sig, router in routers.items():
                result.append(f"- {sig}: {router.prefix}")
            
            await self.send_text("\n".join(result))
```

### 示例 3：Router 状态监控

```python
from src.app.plugin_system.api.router_api import (
    get_all_routers,
    get_all_mounted_routers,
)

class RouterStatusCommand(BaseCommand):
    name = "router.status"
    description = "查看 Router 状态"
    
    async def execute(self):
        # 获取所有注册的 Router
        all_routers = get_all_routers()
        
        # 获取已挂载的 Router
        mounted_routers = get_all_mounted_routers()
        
        # 统计
        total = len(all_routers)
        mounted = len(mounted_routers)
        unmounted = total - mounted
        
        result = [
            "Router 状态:",
            f"- 总数: {total}",
            f"- 已挂载: {mounted}",
            f"- 未挂载: {unmounted}",
            "",
            "已挂载的 Router:",
        ]
        
        for signature, router in mounted_routers.items():
            result.append(f"- {signature}")
            result.append(f"  路径: {router.prefix}")
            result.append(f"  标签: {', '.join(router.tags)}")
        
        await self.send_text("\n".join(result))
```

### 示例 4：在插件中管理 Router

```python
from src.core.components.base.plugin import BasePlugin
from src.app.plugin_system.api.router_api import (
    mount_plugin_routers,
    unmount_plugin_routers,
)

class MyPlugin(BasePlugin):
    async def initialize(self):
        """插件初始化时挂载 Router"""
        try:
            routers = await mount_plugin_routers(self)
            self.logger.info(f"已挂载 {len(routers)} 个 Router")
            
            for router in routers:
                self.logger.info(f"Router: {router.prefix}")
        except Exception as e:
            self.logger.error(f"Router 挂载失败: {e}")
    
    async def cleanup(self):
        """插件清理时卸载 Router"""
        try:
            await unmount_plugin_routers(self.name)
            self.logger.info("Router 已卸载")
        except Exception as e:
            self.logger.error(f"Router 卸载失败: {e}")
```

### 示例 5：Webhook Router

```python
from src.core.components.base.router import BaseRouter
from fastapi import APIRouter, Request
from src.app.plugin_system.api.send_api import send_text
from src.app.plugin_system.api.stream_api import get_or_create_stream

class WebhookRouter(BaseRouter):
    """Webhook 路由器"""
    
    name = "webhook"
    prefix = "/webhook/my_plugin"
    tags = ["webhook"]
    
    def create_router(self) -> APIRouter:
        router = APIRouter(
            prefix=self.prefix,
            tags=self.tags,
        )
        
        @router.post("/notify")
        async def receive_webhook(request: Request):
            """接收 Webhook 通知"""
            data = await request.json()
            
            # 处理 Webhook 数据
            message = data.get("message", "")
            target_stream = data.get("stream_id", "")
            
            if message and target_stream:
                # 发送消息到指定会话
                success = await send_text(
                    content=f"Webhook 通知: {message}",
                    stream_id=target_stream,
                )
                
                return {
                    "success": success,
                    "message": "通知已发送" if success else "发送失败",
                }
            
            return {"success": False, "message": "缺少必需参数"}
        
        @router.get("/ping")
        async def ping():
            """健康检查"""
            return {"status": "ok", "plugin": self.plugin.name}
        
        return router
```

### 示例 6：多版本 API Router

```python
from src.core.components.base.router import BaseRouter
from fastapi import APIRouter, HTTPException

class APIv1Router(BaseRouter):
    """API v1 路由器"""
    
    name = "api_v1"
    prefix = "/api/v1/my_plugin"
    tags = ["my_plugin", "v1"]
    
    def create_router(self) -> APIRouter:
        router = APIRouter(
            prefix=self.prefix,
            tags=self.tags,
        )
        
        @router.get("/users")
        async def list_users():
            # V1 实现
            return {"version": "v1", "users": []}
        
        return router

class APIv2Router(BaseRouter):
    """API v2 路由器"""
    
    name = "api_v2"
    prefix = "/api/v2/my_plugin"
    tags = ["my_plugin", "v2"]
    
    def create_router(self) -> APIRouter:
        router = APIRouter(
            prefix=self.prefix,
            tags=self.tags,
        )
        
        @router.get("/users")
        async def list_users(
            page: int = 1,
            page_size: int = 20,
        ):
            # V2 实现（支持分页）
            return {
                "version": "v2",
                "page": page,
                "page_size": page_size,
                "users": [],
            }
        
        return router
```

## Router 组件最佳实践

### 1. 使用有意义的前缀

```python
# ✅ 清晰的路径
prefix = "/api/my_plugin/users"

# ❌ 不清晰的路径
prefix = "/p1/u"
```

### 2. 添加标签以便文档分组

```python
class MyRouter(BaseRouter):
    tags = ["my_plugin", "api", "users"]
```

### 3. 实现健康检查端点

```python
@router.get("/health")
async def health_check():
    return {"status": "ok"}
```

### 4. 统一错误处理

```python
from fastapi import HTTPException

@router.get("/resource/{id}")
async def get_resource(id: int):
    resource = await fetch_resource(id)
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    return resource
```

## 相关文档

- [Router 组件](../components/router.md) — Router 组件的详细说明
- [WebUI 使用指南](/docs/guides/webui_guide) — WebUI 路由使用
- [FastAPI 文档](https://fastapi.tiangolo.com/) — FastAPI 官方文档
