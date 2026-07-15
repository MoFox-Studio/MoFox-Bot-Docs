# Service API

`src.app.plugin_system.api.service_api` 提供 Service 组件的查询与实例获取。

Service 是给其他插件或组件直接调用能力的组件，不服务于 LLM schema。

::: warning 非单例语义
`get_service()` 每次调用都会创建一个新的 Service 实例。不要把 Service 设计成依赖实例级缓存且假设跨调用复用。如果需要共享状态，放到持久化存储、外部资源或显式的全局管理对象里。
:::

## 导入

```python
from src.app.plugin_system.api.service_api import (
    get_all_services,
    get_services_for_plugin,
    get_service_class,
    get_service,
)
```

## 函数

### `get_all_services() -> dict[str, type[BaseService]]`

获取所有已注册的 Service 组件，返回签名到类的映射。

### `get_services_for_plugin(plugin_name: str) -> dict[str, type[BaseService]]`

获取指定插件的所有 Service。

### `get_service_class(signature: str) -> type[BaseService] | None`

通过签名获取 Service 类。未找到返回 `None`。

### `get_service(signature: str) -> BaseService | None`

获取 Service 实例。每次调用都会创建一个新的实例。未找到返回 `None`。

```python
service = get_service("my_plugin:service:my_service")
```

## 相关文档

- [Service 组件](../components/service.md)
- [跨插件通信](../advanced/cross-plugin-communication.md)
