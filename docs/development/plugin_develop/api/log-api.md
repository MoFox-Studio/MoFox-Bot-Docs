# 日志 API

`src/app/plugin_system/api/log_api` 提供统一日志入口。

## 导入

```python
from src.app.plugin_system.api.log_api import get_logger, COLOR
```

## `get_logger`

```python
def get_logger(
    name: str,
    display: str | None = None,
    color: COLOR | str | None = None,
    enable_event_broadcast: bool = True,
) -> Logger
```

- `name`：日志实例唯一名称
- `display`：控制台显示名
- `color`：颜色
- `enable_event_broadcast`：是否广播到事件系统

## `COLOR`

```python
COLOR.BLACK
COLOR.RED
COLOR.GREEN
COLOR.YELLOW
COLOR.BLUE
COLOR.MAGENTA
COLOR.CYAN
COLOR.WHITE
COLOR.BRIGHT_RED
COLOR.BRIGHT_GREEN
COLOR.BRIGHT_BLUE
COLOR.GRAY
COLOR.ORANGE
COLOR.PURPLE
COLOR.PINK
COLOR.DEBUG
COLOR.INFO
COLOR.WARNING
COLOR.ERROR
COLOR.CRITICAL
```

## 基本示例

```python
from src.app.plugin_system.api.log_api import get_logger, COLOR

logger = get_logger("my_plugin.main", display="我的插件", color=COLOR.CYAN)

logger.debug("调试信息")
logger.info("运行信息")
logger.warning("警告信息")
logger.error("错误信息")
logger.critical("严重错误")
```

## EventHandler 中使用

```python
from src.core.components.base.event_handler import BaseEventHandler
from src.core.components.types import EventType

logger = get_logger("my_plugin.event", display="事件", color=COLOR.MAGENTA)


class NoticeHandler(BaseEventHandler):
    handler_name = "notice_logger"
    init_subscribe = [EventType.ON_NOTICE_RECEIVED]

    async def execute(self, kwargs: dict | None) -> tuple[bool, bool, str | None]:
        logger.info(f"收到通知事件: {kwargs}")
        return True, False, None
```

## Chatter 中使用

```python
from typing import AsyncGenerator

from src.core.components.base.chatter import BaseChatter, Wait, Success

logger = get_logger("my_plugin.chatter", display="Chatter", color=COLOR.CYAN)


class MyChatter(BaseChatter):
    chatter_name = "my_chatter"

    async def execute(self) -> AsyncGenerator[Wait | Success, None]:
        logger.debug(f"开始处理 stream={self.stream_id}")
        yield Wait()
        logger.info("处理完成")
        yield Success("done")
```
