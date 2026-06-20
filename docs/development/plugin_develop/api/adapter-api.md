# Adapter API

`src.app.plugin_system.api.adapter_api` 提供适配器的查询与状态检查。

## 导入

```python
from src.app.plugin_system.api.adapter_api import (
    get_adapter,
    get_all_adapters,
    list_active_adapters,
    is_adapter_active,
)
```

## 函数

### `get_adapter(signature: str) -> BaseAdapter | None`

通过签名获取适配器实例（已启动的）。未找到返回 `None`。

```python
adapter = get_adapter("onebot_adapter:adapter:onebot_adapter")
```

### `get_all_adapters() -> dict[str, BaseAdapter]`

获取所有已启动的适配器实例，返回签名到实例的映射。

### `list_active_adapters() -> list[str]`

列出所有已启动的适配器签名列表。

```python
active = list_active_adapters()
# ["onebot_adapter:adapter:onebot_adapter", ...]
```

### `is_adapter_active(signature: str) -> bool`

检查指定适配器是否已启动。

```python
if is_adapter_active("onebot_adapter:adapter:onebot_adapter"):
    print("适配器运行中")
```

## 相关文档

- [Adapter 组件](../components/adapter.md)
