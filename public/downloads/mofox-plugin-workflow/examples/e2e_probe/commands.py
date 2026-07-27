"""e2e_probe 命令。"""

from __future__ import annotations

from typing import cast

from src.app.plugin_system.api import service_api
from src.app.plugin_system.base import BaseCommand, cmd_route
from src.app.plugin_system.types import ChatType, PermissionLevel

from .services import ProbeService


class ProbeCommand(BaseCommand):
    """关键词管理命令。"""

    name = "probe"
    description = "管理关键词提醒列表"
    command_prefix = "/"
    permission_level = PermissionLevel.USER
    associated_platforms: list[str] = []
    chat_type = ChatType.ALL
    dependencies = ["e2e_probe:service:probe_service"]

    def _service(self) -> ProbeService | None:
        """获取服务实例。"""
        svc = service_api.get_service("e2e_probe:service:probe_service")
        return cast(ProbeService, svc) if svc is not None else None

    @cmd_route("list")
    async def list_keywords(self) -> tuple[bool, str]:
        """列出所有关键词。"""
        svc = self._service()
        if svc is None:
            return False, "服务不可用"
        items = await svc.list_keywords()
        if not items:
            return True, "当前没有关键词"
        return True, "关键词：\n" + "\n".join(f"- {x}" for x in items)

    @cmd_route("add")
    async def add_keyword(self, keyword: str) -> tuple[bool, str]:
        """添加关键词。"""
        svc = self._service()
        if svc is None:
            return False, "服务不可用"
        ok = await svc.add_keyword(keyword)
        return (True, f"已添加：{keyword}") if ok else (False, f"已存在：{keyword}")

    @cmd_route("remove")
    async def remove_keyword(self, keyword: str) -> tuple[bool, str]:
        """删除关键词。"""
        svc = self._service()
        if svc is None:
            return False, "服务不可用"
        ok = await svc.remove_keyword(keyword)
        return (True, f"已删除：{keyword}") if ok else (False, f"不存在：{keyword}")
