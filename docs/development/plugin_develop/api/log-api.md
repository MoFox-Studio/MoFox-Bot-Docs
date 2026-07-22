# Log API

`src.app.plugin_system.api.log_api` 提供日志记录器的创建，并导出 `COLOR` 枚举与 `Logger` 类型（后者为 `src.kernel.logger.Logger` 的再导出，不在模块 `__all__` 中但可直接导入使用）。

## 导入

```python
from src.app.plugin_system.api.log_api import get_logger, COLOR, Logger
```

## 函数

### `get_logger(name: str, display: str | None = None, color: COLOR | str | None = None, enable_event_broadcast: bool = True) -> Logger`

获取或创建日志记录器。

- `name`: 日志记录器名称（唯一标识）
- `display`: 显示名称，如果为 `None` 则使用 `name`
- `color`: 日志颜色，支持 [`COLOR`](#color) 枚举或颜色字符串
- `enable_event_broadcast`: 是否启用事件广播（发布到 `on_log_output` 事件），默认 `True`

```python
from src.app.plugin_system.api.log_api import get_logger, COLOR

# 基本用法
logger = get_logger("my_plugin", color=COLOR.BLUE)
logger.info("插件已启动")

# 禁用事件广播
logger = get_logger("my_plugin", enable_event_broadcast=False)
logger.info("这条日志不会广播到事件系统")
```

## 类型

### `COLOR`

日志颜色枚举，支持多种预定义颜色。

### `Logger`

日志记录器实例类型，支持 `info`、`warning`、`error`、`debug` 等方法。
