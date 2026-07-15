# Router API

`src.app.plugin_system.api.router_api` 提供 HTTP Router 组件的查询、挂载、卸载和信息获取。

Router 用于 HTTP 接口，基于 FastAPI。查询类函数为同步函数；挂载/卸载操作为**异步函数**，调用时需 `await`。

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
    mount_all_routers,
    unmount_all_routers,
    get_router_info,
    get_all_router_info,
    reload_router,
)
```

## 函数

### 查询

#### `get_all_routers() -> dict[str, type[BaseRouter]]`

获取所有已注册的 Router 组件。

#### `get_routers_for_plugin(plugin_name: str) -> dict[str, type[BaseRouter]]`

获取指定插件的所有 Router。

#### `get_router_class(signature: str) -> type[BaseRouter] | None`

通过签名获取 Router 类。

#### `get_mounted_router(signature: str) -> BaseRouter | None`

获取已挂载到 HTTP 服务的 Router 实例。

#### `get_all_mounted_routers() -> dict[str, BaseRouter]`

获取所有已挂载的 Router 实例。

#### `get_router_info(signature: str) -> dict[str, Any] | None`

获取单个 Router 的信息（路径、方法等）。

#### `get_all_router_info() -> list[dict[str, Any]]`

获取所有 Router 信息列表。

### 挂载与卸载

#### `mount_router(signature: str, plugin: BasePlugin) -> BaseRouter`

挂载单个 Router。此函数为**异步函数**。

#### `unmount_router(signature: str) -> None`

卸载单个 Router。此函数为**异步函数**。

#### `mount_plugin_routers(plugin: BasePlugin) -> list[BaseRouter]`

挂载插件的所有 Router 组件。此函数为**异步函数**。

#### `unmount_plugin_routers(plugin_name: str) -> None`

卸载插件的所有 Router 组件。此函数为**异步函数**。

#### `mount_all_routers() -> None`

挂载所有 Router 组件。此函数为**异步函数**。

#### `unmount_all_routers() -> None`

卸载所有 Router 组件。此函数为**异步函数**。

#### `reload_router(signature: str, plugin: BasePlugin) -> BaseRouter`

重新加载 Router。此函数为**异步函数**。

## 相关文档

- [Router 组件](../components/router.md)
