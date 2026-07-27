"""e2e_probe 插件入口。"""

from __future__ import annotations

from src.app.plugin_system.api.log_api import get_logger
from src.app.plugin_system.base import BasePlugin, register_plugin

from .commands import ProbeCommand
from .config import ProbeConfig
from .handlers import ProbeHandler
from .services import ProbeService

logger = get_logger("e2e_probe")


@register_plugin
class ProbePlugin(BasePlugin):
    """关键词提醒插件。"""

    plugin_name: str = "e2e_probe"
    plugin_description: str = "关键词命中提醒"
    plugin_version: str = "1.0.0"

    configs: list[type] = [ProbeConfig]
    dependent_components: list[str] = []

    def __init__(self, config: ProbeConfig | None = None) -> None:
        """初始化插件。"""
        super().__init__(config)

    def get_components(self) -> list[type]:
        """返回组件类列表（不含配置类）。"""
        return [ProbeService, ProbeHandler, ProbeCommand]

    async def on_plugin_loaded(self) -> None:
        """插件加载完成。"""
        logger.info("e2e_probe 已加载")

    async def on_plugin_unloaded(self) -> None:
        """插件卸载，清理资源。"""
        logger.info("e2e_probe 已卸载")
