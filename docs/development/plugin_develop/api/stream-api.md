# Stream API

`src.app.plugin_system.api.stream_api` 提供聊天流缓存管理与上下文操作。

## 导入

```python
from src.app.plugin_system.api.stream_api import (
    clear_stream_cache,
    clear_context,
    get_all_stream_ids,
)
```

## 函数

### `clear_stream_cache(stream_id: str | None = None) -> None`

清理流实例缓存。传入 stream_id 清理单个，不传清理全部。

### `clear_context(stream_id: str) -> bool`

清空指定流的内存上下文（仅当流已在内存中时生效）。

### `get_all_stream_ids() -> list[str]`

获取当前内存中所有活跃流的 ID 列表。

```python
active = get_all_stream_ids()
print(f"活跃流数: {len(active)}")
```
