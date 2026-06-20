# Service API

`src.app.plugin_system.api.service_api` 提供 Service 组件的查询。

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

获取所有已注册的 Service 组件。

### `get_services_for_plugin(plugin_name: str) -> dict[str, type[BaseService]]`

获取指定插件的所有 Service。

### `get_service_class(signature: str) -> type[BaseService] | None`

通过签名获取 Service 类。

### `get_service(signature: str) -> BaseService | None`

获取 Service 实例。

```python
service = get_service("my_plugin:service:my_service")
```

## 相关文档

- [Service 组件](../components/service.md)
