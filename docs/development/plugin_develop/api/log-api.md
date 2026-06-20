# Log API

`src.app.plugin_system.api.log_api` 提供日志记录器的创建。

## 导入

```python
from src.app.plugin_system.api.log_api import get_logger
```

## 函数

### `get_logger(name: str, display: str | None = None, color: str | None = None, enable_event_broadcast: bool = False) -> Logger`

获取或创建日志记录器。

- `name`: 日志记录器名称
- `display`: 显示名称（可选）
- `color`: 日志颜色，支持 `COLOR` 枚举或颜色字符串
- `enable_event_broadcast`: 是否启用事件广播

```python
from src.app.plugin_system.api.log_api import get_logger, COLOR

logger = get_logger("my_plugin", color=COLOR.BLUE)
logger.info("插件已启动")
```
