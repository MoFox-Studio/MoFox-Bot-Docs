# Logging API

Logging API模块提供了获取本体logger的功能，允许插件记录日志信息。

## 导入方式

```python
from src.plugin_system.apis import get_logger
# 或者
from src.plugin_system import get_logger
```

## 主要功能
### 1. 获取本体logger
```python
def get_logger(name: str | None, *, color: str | None = None) -> structlog.stdlib.BoundLogger:
```
获取本体logger实例。

**Args:**
- `name` (str): 日志记录器的名称(不能为空)
- `color` (str | None): 传入 ANSI / #RRGGBB / rgb(r,g,b) 以注册显示颜色(可选)

**Returns:**
- 一个logger实例，有以下方法:
    - `debug`
    - `info`
    - `warning`
    - `error`
    - `critical`