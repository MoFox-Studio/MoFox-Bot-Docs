# 快速开始

本文将引导你在 5 分钟内创建一个最小化的 Neo-MoFox 插件,涵盖 Action、Chatter、Command、Tool、Service 和 EventHandler 六种组件类型，帮助你快速上手插件开发。

## 前置条件

- Python >= 3.11
- 已安装并配置好 Neo-MoFox 主框架（参见 [环境搭建](../../../guides/index.md)）

## 第一步：创建插件目录

在 `plugins/` 目录下新建插件文件夹：

```
plugins/
└── my_ping_plugin/
    ├── manifest.json
    └── plugin.py
```

## 第二步：编写 manifest.json

```json
{
    "name": "my_ping_plugin",
    "version": "1.0.0",
    "description": "一个演示多种组件类型的 Ping-Pong 插件",
    "author": "你的名字",
    "dependencies": {
        "plugins": [],
        "components": []
    },
    "include": [
        {
            "component_type": "action",
            "component_name": "send_pong",
            "dependencies": []
        },
        {
            "component_type": "chatter",
            "component_name": "ping_chatter",
            "dependencies": []
        },
        {
            "component_type": "command",
            "component_name": "ping",
            "dependencies": []
        },
        {
            "component_type": "tool",
            "component_name": "ping_counter",
            "dependencies": []
        },
        {
            "component_type": "service",
            "component_name": "ping_stats",
            "dependencies": []
        },
        {
            "component_type": "event_handler",
            "component_name": "ping_logger",
            "dependencies": []
        },
        {
            "component_type": "router",
            "component_name": "ping_api",
            "dependencies": []
        }
    ],
    "entry_point": "plugin.py",
    "min_core_version": "1.0.0"
}
```

## 第三步：编写 plugin.py

```python
"""My Ping Plugin - 演示多种组件类型的 Ping-Pong 插件"""

from __future__ import annotations
from typing import Annotated, AsyncGenerator, Any

from src.core.components.base import (
    BasePlugin,
    BaseAction,
    BaseChatter,
    BaseCommand,
    BaseTool,
    BaseService,
    BaseEventHandler,
    BaseRouter,
    cmd_route,
    Wait,
    Success,
    Failure,
)
from src.core.components.types import EventType
from src.core.components.loader import register_plugin
from src.app.plugin_system.api.log_api import get_logger
from src.app.plugin_system.api.send_api import send_text

logger = get_logger("my_ping_plugin")


# ─── Action：发送 Pong ────────────────────────────────────────

class SendPong(BaseAction):
    """发送 pong 消息"""

    action_name = "send_pong"
    action_description = "向用户回复 pong"
    primary_action = True  # 主动作，每次对话只能调用一次

    async def execute(
        self,
        content: Annotated[str, "回复内容，通常是 pong"] = "pong",
    ) -> tuple[bool, str]:
        stream_id = self.chat_stream.stream_id
        
        # 调用 Service 记录统计
        service = self.plugin.get_service("ping_stats")
        if service:
            await service.increment_pong_count()
        
        success = await send_text(content, stream_id)
        if success:
            return True, f"已发送: {content}"
        return False, "发送失败"


# ─── Chatter：Ping 对话器 ─────────────────────────────────────

class PingChatter(BaseChatter):
    """处理 Ping 消息的简单对话器"""

    chatter_name = "ping_chatter"
    chatter_description = "收到 ping 时回复 pong"

    async def execute(self) -> AsyncGenerator[Wait | Success | Failure, None]:
        # BaseChatter 通过 fetch_unreads() 获取未读消息快照
        _, unread_messages = await self.fetch_unreads(format_as_group=False)
        if not unread_messages:
            yield Wait()
            return

        should_reply = False
        for msg in unread_messages:
            text = str(msg.processed_plain_text or msg.content or "").lower()
            if "ping" in text:
                should_reply = True
                break

        if not should_reply:
            # 没有命中关键字，清理本次快照后继续等待
            await self.flush_unreads(unread_messages)
            yield Wait()
            return

        # 调用 Service 记录统计
        service = self.plugin.get_service("ping_stats")
        if service:
            await service.increment_ping_count()

        success = await send_text("pong", self.stream_id)
        if not success:
            yield Failure("发送失败")
            return

        await self.flush_unreads(unread_messages)
        yield Success("Pong 已发送")


# ─── Command：Ping 命令 ───────────────────────────────────────

class PingCommand(BaseCommand):
    """Ping 命令处理器"""

    command_name = "ping"
    command_description = "Ping 相关命令"
    command_prefix = "/"

    @cmd_route("test")
    async def handle_test(self) -> tuple[bool, str]:
        """测试 Ping 命令"""
        service = self.plugin.get_service("ping_stats")
        if service:
            await service.increment_ping_count()
        await send_text("pong (from command)", self.stream_id)
        return True, "命令执行成功"

    @cmd_route("stats")
    async def handle_stats(self) -> tuple[bool, str]:
        """查询 Ping 统计信息"""
        service = self.plugin.get_service("ping_stats")
        if service:
            stats = await service.get_stats()
            msg = f"Ping 统计:\n收到 ping: {stats['ping_count']} 次\n发送 pong: {stats['pong_count']} 次"
        else:
            msg = "统计服务不可用"
        
        await send_text(msg, self.stream_id)
        return True, msg


# ─── Tool：Ping 计数器 ────────────────────────────────────────

class PingCounterTool(BaseTool):
    """Ping 计数工具"""

    tool_name = "ping_counter"
    tool_description = "获取 Ping/Pong 计数统计"

    async def execute(
        self,
        stat_type: Annotated[str, "统计类型: ping 或 pong"] = "both",
    ) -> tuple[bool, str]:
        """获取统计信息"""
        service = self.plugin.get_service(f"{self.plugin.plugin_name}:service:ping_stats")
        if not service:
            return False, "统计服务不可用"

        stats = await service.get_stats()
        
        if stat_type == "ping":
            return True, f"收到 ping: {stats['ping_count']} 次"
        elif stat_type == "pong":
            return True, f"发送 pong: {stats['pong_count']} 次"
        else:
            return True, f"Ping: {stats['ping_count']}, Pong: {stats['pong_count']}"


# ─── Service：Ping 统计服务 ───────────────────────────────────

class PingStatsService(BaseService):
    """Ping 统计服务"""

    service_name = "ping_stats"
    service_description = "Ping/Pong 统计服务"
    version = "1.0.0"

    def __init__(self, plugin: BasePlugin) -> None:
        super().__init__(plugin)
        self._ping_count = 0
        self._pong_count = 0

    async def increment_ping_count(self) -> None:
        """增加 Ping 计数"""
        self._ping_count += 1
        logger.debug(f"Ping count: {self._ping_count}")

    async def increment_pong_count(self) -> None:
        """增加 Pong 计数"""
        self._pong_count += 1
        logger.debug(f"Pong count: {self._pong_count}")

    async def get_stats(self) -> dict[str, int]:
        """获取统计信息"""
        return {
            "ping_count": self._ping_count,
            "pong_count": self._pong_count,
        }

    async def reset_stats(self) -> None:
        """重置统计"""
        self._ping_count = 0
        self._pong_count = 0
        logger.info("统计已重置")


# ─── EventHandler：Ping 日志记录器 ────────────────────────────

class PingLoggerHandler(BaseEventHandler):
    """记录所有消息事件"""

    handler_name = "ping_logger"
    handler_description = "记录包含 ping 的消息"
    weight = 5  # 权重，数值越大优先级越高
    intercept_message = False  # 不拦截消息
    init_subscribe = [EventType.MESSAGE_RECEIVED]

    async def execute(self, kwargs: dict | None) -> tuple[bool, bool, str | None]:
        """处理消息事件"""
        if not kwargs:
            return True, False, None

        message = kwargs.get("message")
        if message:
            text = str(message.get("content", "")).lower()
            if "ping" in text:
                logger.info(f"检测到 ping 消息: {text}")
                return True, False, "已记录 ping 消息"

        return True, False, None


# ─── Router：HTTP API 路由 ────────────────────────────────────

class PingApiRouter(BaseRouter):
    """Ping API 路由"""

    router_name = "ping_api"
    router_description = "Ping/Pong HTTP API"
    custom_route_path = "/api/ping"  # 自定义路径，否则默认为 /router/ping_api
    cors_origins = ["*"]  # 允许跨域访问

    def register_endpoints(self) -> None:
        """注册 HTTP 端点"""
        from fastapi import HTTPException
        from pydantic import BaseModel

        class PingRequest(BaseModel):
            message: str = "ping"

        @self.app.post("/send")
        async def send_ping(request: PingRequest):
            """接收 Ping 请求"""
            service = self.plugin.get_service(f"{self.plugin.plugin_name}:service:ping_stats")
            if service:
                await service.increment_ping_count()
            
            return {
                "status": "ok",
                "received": request.message,
                "reply": "pong"
            }

        @self.app.get("/stats")
        async def get_stats():
            """获取统计信息"""
            service = self.plugin.get_service(f"{self.plugin.plugin_name}:service:ping_stats")
            if not service:
                raise HTTPException(status_code=503, detail="统计服务不可用")
            
            stats = await service.get_stats()
            return stats

        @self.app.get("/health")
        async def health():
            """健康检查"""
            return {"status": "healthy", "plugin": "my_ping_plugin"}


# ─── Plugin：根组件 ───────────────────────────────────────────

@register_plugin
class MyPingPlugin(BasePlugin):
    """Ping-Pong 插件 - 演示多种组件类型"""

    plugin_name = "my_ping_plugin"
    plugin_description = "演示 Action、Chatter、Command、Tool、Service、EventHandler、Router 的插件"
    plugin_version = "1.0.0"

    def get_components(self) -> list[type]:
        return [
            SendPong,
            PingChatter,
            PingCommand,
            PingCounterTool,
            PingStatsService,
            PingLoggerHandler,
            PingApiRouter,
        ]

    async def on_plugin_loaded(self) -> None:
        logger.info(f"插件 {self.plugin_name} 加载完成！")
        logger.info("包含组件: Action, Chatter, Command, Tool, Service, EventHandler, Router")
```

## 第四步：运行

```bash
uv run main.py
```

框架会自动扫描 `plugins/` 目录，发现并加载你的插件。

## 组件说明

这个示例插件包含了 7 种不同类型的组件：

1. **Action (SendPong)** - 执行发送消息的动作，可被 LLM 调用
2. **Chatter (PingChatter)** - 主动处理对话流程，监听包含 "ping" 的消息
3. **Command (PingCommand)** - 处理用户命令，如 `/ping test` 和 `/ping stats`
4. **Tool (PingCounterTool)** - 提供查询功能供 LLM 调用，获取统计信息
5. **Service (PingStatsService)** - 提供内部服务，被其他组件调用
6. **EventHandler (PingLoggerHandler)** - 监听系统事件，记录包含 "ping" 的消息
7. **Router (PingApiRouter)** - 提供 HTTP API 接口，支持外部系统调用

## 测试插件

启动框架后，你可以：

- 发送包含 `ping` 的消息 → Chatter 会自动回复 `pong`
- 执行命令 `/ping test` → 触发命令处理器
- 执行命令 `/ping stats` → 查看统计信息
- LLM 可以调用 `send_pong` Action 和 `ping_counter` Tool
- 通过 HTTP API 访问：
  - `POST http://localhost:8000/api/ping/send` - 发送 Ping 请求
  - `GET http://localhost:8000/api/ping/stats` - 查看统计信息
  - `GET http://localhost:8000/api/ping/health` - 健康检查

## 下一步

- [插件结构详解](./structure) — 了解更规范的插件项目组织方式
- [组件总览](./components/index.md) — 探索所有可用组件类型
- [Action API](./components/api/action.md) — 深入了解 Action 开发
- [Command API](./components/api/command.md) — 了解命令系统
- [Service API](./components/api/service.md) — 学习服务开发
