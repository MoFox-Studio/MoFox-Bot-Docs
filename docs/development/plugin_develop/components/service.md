# Service — 服务组件

`BaseService` 暴露特定功能供其他插件调用，是插件间通信的标准机制。

## 类属性

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `service_name` | `str` | `""` | 服务名称（插件内唯一）|
| `service_description` | `str` | `""` | 功能描述 |
| `version` | `str` | `"1.0.0"` | 服务版本 |
| `dependencies` | `list[str]` | `[]` | 组件级依赖 |

## 签名格式

```
plugin_name:service:service_name
```

## 实例生命周期说明

通过 `ServiceManager.get_service(signature)` 获取服务时，当前实现会**每次创建新实例**，并非全局单例。

这意味着：

- 不要假设 Service 内存字段会在多次调用间自动共享
- 需要共享状态时，请显式使用数据库、缓存或其他外部存储

## 完整示例

### 示例 1：内存存储服务

```python
from typing import Any
from src.core.components.base.service import BaseService
from src.app.plugin_system.api.log_api import get_logger

logger = get_logger("memory_service")


class MemoryStorageService(BaseService):
    """简单的内存键值存储服务"""

    service_name = "memory_storage"
    service_description = "提供简单的内存键值存储，支持 get/set/delete"
    version = "1.0.0"

    def __init__(self, plugin):
        super().__init__(plugin)
        self._store: dict[str, Any] = {}

    async def set(self, key: str, value: Any) -> bool:
        """存储键值对"""
        self._store[key] = value
        return True

    async def get(self, key: str, default: Any = None) -> Any:
        """获取值"""
        return self._store.get(key, default)

    async def delete(self, key: str) -> bool:
        """删除键"""
        if key in self._store:
            del self._store[key]
            return True
        return False

    async def keys(self) -> list[str]:
        """获取所有键"""
        return list(self._store.keys())
```

### 示例 2：在其他插件中调用服务

```python
# 在其他插件的 Action 或 Tool 中获取并使用 Service

class UseMemoryAction(BaseAction):
    action_name = "save_note"
    action_description = "保存一条笔记"

    async def execute(
        self,
        key: Annotated[str, "笔记的键"],
        content: Annotated[str, "笔记内容"],
    ) -> tuple[bool, str]:
        from src.core.managers import get_service_manager

        sm = get_service_manager()
        # 通过完整签名获取 Service 实例
        service = sm.get_service("memory_plugin:service:memory_storage")
        if not service:
            return False, "内存存储服务不可用"

        await service.set(key, content)
        return True, f"已保存笔记: {key}"
```

### 在 manifest.json 中声明服务依赖

```json
{
    "dependencies": {
        "plugins": ["memory_plugin"],
        "components": ["memory_plugin:service:memory_storage"]
    }
}
```
