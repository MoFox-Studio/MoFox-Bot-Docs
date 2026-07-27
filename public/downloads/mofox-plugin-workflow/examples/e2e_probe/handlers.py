"""e2e_probe 事件处理器。"""

from __future__ import annotations

from typing import Any, cast

from src.app.plugin_system.api import send_api, service_api
from src.app.plugin_system.api.log_api import get_logger
from src.app.plugin_system.base import BaseEventHandler
from src.core.components.types import EventType
from src.kernel.event import EventDecision

from .config import ProbeConfig
from .services import ProbeService

logger = get_logger("e2e_probe")


class ProbeHandler(BaseEventHandler):
    """监听消息，命中关键词时发提醒。"""

    name = "probe_handler"
    description = "关键词命中提醒"
    weight = 10
    intercept_message = False
    init_subscribe = [EventType.ON_MESSAGE_RECEIVED]
    dependencies = ["e2e_probe:service:probe_service"]

    async def execute(
        self, event_name: str, params: dict[str, Any]
    ) -> tuple[EventDecision, dict[str, Any]]:
        """处理收到的消息。

        Args:
            event_name: 事件名
            params: 事件参数，必须原样返回（key 集合不可变）

        Returns:
            (决策, 参数)
        """
        config = self.plugin.config
        if not isinstance(config, ProbeConfig) or not config.general.enabled:
            return EventDecision.PASS, params

        message = params.get("message")
        if message is None:
            return EventDecision.PASS, params

        text = str(getattr(message, "processed_plain_text", "") or "")
        if not text:
            return EventDecision.PASS, params

        svc = service_api.get_service("e2e_probe:service:probe_service")
        if svc is None:
            logger.warning("probe_service 不可用")
            return EventDecision.PASS, params

        keywords = await cast(ProbeService, svc).list_keywords()
        hit = next((k for k in keywords if k and k in text), None)
        if hit is None:
            return EventDecision.PASS, params

        stream_id = getattr(message, "stream_id", "")
        if stream_id:
            # 参数顺序：send_text(content, stream_id, ...)
            await send_api.send_text(
                config.general.notify_template.format(keyword=hit),
                stream_id,
            )

        return EventDecision.PASS, params
