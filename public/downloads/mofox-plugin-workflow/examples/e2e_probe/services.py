"""e2e_probe 服务层。"""

from __future__ import annotations

from src.app.plugin_system.api import storage_api
from src.app.plugin_system.base import BaseService

_STORE = "e2e_probe"
_KEY = "keywords"


class ProbeService(BaseService):
    """关键词存储服务。

    注意：Service 每次通过 get_service() 获取都是新实例，
    因此状态必须落到 storage，不能只放实例字段。
    """

    name = "probe_service"
    description = "关键词的读写"

    async def list_keywords(self) -> list[str]:
        """返回当前关键词列表。"""
        data = await storage_api.load_json(_STORE, _KEY)
        if not data:
            return []
        items = data.get("items", [])
        return [str(x) for x in items] if isinstance(items, list) else []

    async def add_keyword(self, keyword: str) -> bool:
        """新增关键词，已存在时返回 False。"""
        items = await self.list_keywords()
        if keyword in items:
            return False
        items.append(keyword)
        await storage_api.save_json(_STORE, _KEY, {"items": items})
        return True

    async def remove_keyword(self, keyword: str) -> bool:
        """删除关键词，不存在时返回 False。"""
        items = await self.list_keywords()
        if keyword not in items:
            return False
        items.remove(keyword)
        await storage_api.save_json(_STORE, _KEY, {"items": items})
        return True
