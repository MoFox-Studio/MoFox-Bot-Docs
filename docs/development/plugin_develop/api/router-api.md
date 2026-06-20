# Router API

`src.app.plugin_system.api.router_api` 提供 HTTP Router 组件的查询、挂载和信息获取。

## 导入

```python
from src.app.plugin_system.api.router_api import (
    get_all_routers,
    get_routers_for_plugin,
    get_router_class,
    get_mounted_router,
    get_all_mounted_routers,
    get_router_info,
    get_all_router_info,
)
```

## 函数

### `get_all_routers() -> dict[str, type[BaseRouter]]`

获取所有已注册的 Router 组件。

### `get_routers_for_plugin(plugin_name: str) -> dict[str, type[BaseRouter]]`

获取指定插件的所有 Router。

### `get_router_class(signature: str) -> type[BaseRouter] | None`

通过签名获取 Router 类。

### `get_mounted_router(signature: str) -> BaseRouter | None`

获取已挂载到 HTTP 服务的 Router 实例。

### `get_all_mounted_routers() -> dict[str, BaseRouter]`

获取所有已挂载的 Router 实例。

### `get_router_info(signature: str) -> dict[str, Any] | None`

获取单个 Router 的信息（路径、方法等）。

### `get_all_router_info() -> list[dict[str, Any]]`

获取所有 Router 信息列表。

## 相关文档

- [Router 组件](../components/router.md)
