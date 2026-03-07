# Service API

`src/app/plugin_system/api/service_api` 提供 Service 查询与实例获取能力。

## 导入

```python
from src.app.plugin_system.api.service_api import (
    get_all_services,
    get_services_for_plugin,
    get_service_class,
    get_service,
)
```

## 核心函数

### `get_all_services() -> dict[str, type[BaseService]]`

获取所有已注册的 Service 组件。

**返回值：**
```python
{
    "my_plugin:service:data_processor": DataProcessorService,
    "another_plugin:service:cache": CacheService,
}
```

**使用示例：**
```python
services = get_all_services()
print(f"共有 {len(services)} 个 Service 组件")

for signature, service_class in services.items():
    print(f"- {signature}")
```

---

### `get_services_for_plugin(plugin_name: str) -> dict[str, type[BaseService]]`

获取指定插件的所有 Service 组件。

**参数：**
- `plugin_name`: 插件名称

**返回值：**
```python
{
    "my_plugin:service:data_processor": DataProcessorService,
    "my_plugin:service:cache": CacheService,
}
```

**使用示例：**
```python
services = get_services_for_plugin("my_plugin")

for signature, service_class in services.items():
    print(f"Service: {signature}")
```

---

### `get_service_class(signature: str) -> type[BaseService] | None`

通过签名获取 Service 类。

**参数：**
- `signature`: Service 组件签名（格式：`plugin_name:service:service_name`）

**返回值：**
- Service 类，未找到则返回 `None`

**使用示例：**
```python
service_class = get_service_class("my_plugin:service:data_processor")

if service_class:
    print(f"找到 Service: {service_class.__name__}")
else:
    print("Service 不存在")
```

---

### `get_service(signature: str) -> BaseService | None`

获取 Service 实例（单例）。

**参数：**
- `signature`: Service 组件签名

**返回值：**
- Service 实例，未找到则返回 `None`

**返回值说明：**
- Service 实例是**单例**，同一个签名返回同一个实例
- 实例在首次调用时自动创建
- 实例在插件卸载时自动销毁

**使用示例：**
```python
# 获取 Service 实例
service = get_service("my_plugin:service:data_processor")

if service:
    # 调用 Service 方法
    result = await service.process_data(data={"key": "value"})
    print(result)
else:
    print("Service 不存在")
```

## 完整示例

### 示例 1：创建 Service 组件

```python
from src.core.components.base.service import BaseService

class CacheService(BaseService):
    """缓存服务"""
    
    name = "cache"
    description = "提供数据缓存功能"
    
    async def initialize(self):
        """初始化缓存"""
        self.cache = {}
        self.logger.info("缓存服务已初始化")
    
    async def get(self, key: str) -> Any:
        """获取缓存"""
        return self.cache.get(key)
    
    async def set(self, key: str, value: Any, ttl: int = 3600):
        """设置缓存"""
        self.cache[key] = value
        # 可以添加 TTL 逻辑
        self.logger.debug(f"缓存已设置: {key}")
    
    async def delete(self, key: str):
        """删除缓存"""
        if key in self.cache:
            del self.cache[key]
            self.logger.debug(f"缓存已删除: {key}")
    
    async def clear(self):
        """清空缓存"""
        self.cache.clear()
        self.logger.info("缓存已清空")
    
    async def cleanup(self):
        """清理资源"""
        await self.clear()
        self.logger.info("缓存服务已清理")
```

### 示例 2：在其他组件中使用 Service

```python
from src.app.plugin_system.api.service_api import get_service

class MyChatter(BaseChatter):
    async def execute(self):
        # 获取缓存服务
        cache_service = get_service("my_plugin:service:cache")
        
        if not cache_service:
            self.logger.error("缓存服务不可用")
            return
        
        # 使用缓存
        cache_key = f"user_context_{self.sender_id}"
        
        # 尝试从缓存获取
        cached_data = await cache_service.get(cache_key)
        
        if cached_data:
            self.logger.info("使用缓存数据")
            context = cached_data
        else:
            self.logger.info("缓存未命中，重新加载")
            # 加载数据
            context = await self.load_user_context()
            
            # 存入缓存
            await cache_service.set(cache_key, context, ttl=3600)
        
        # 使用 context 继续处理
        # ...
```

### 示例 3：跨插件使用 Service

```python
from src.app.plugin_system.api.service_api import get_service

class ExternalPluginAction(BaseAction):
    """在其他插件中使用 Service"""
    
    async def execute(self):
        # 使用另一个插件的 Service
        cache_service = get_service("cache_plugin:service:cache")
        data_service = get_service("data_plugin:service:processor")
         
        if not cache_service or not data_service:
            return {"error": "所需服务不可用"}
        
        # 使用多个 Service 协作
        cached_result = await cache_service.get("processed_data")
        
        if not cached_result:
            # 处理数据
            raw_data = {"key": "value"}
            processed = await data_service.process(raw_data)
            
            # 缓存结果
            await cache_service.set("processed_data", processed)
            cached_result = processed
        
        return {"data": cached_result}
```

### 示例 4：数据处理 Service

```python
from src.core.components.base.service import BaseService
import asyncio

class DataProcessorService(BaseService):
    """数据处理服务"""
    
    name = "data_processor"
    description = "提供数据处理和转换功能"
    
    async def initialize(self):
        """初始化处理器"""
        self.processors = {
            "json": self._process_json,
            "text": self._process_text,
            "binary": self._process_binary,
        }
        self.logger.info("数据处理服务已初始化")
    
    async def process(self, data: Any, format: str = "json") -> Any:
        """处理数据"""
        processor = self.processors.get(format)
        
        if not processor:
            raise ValueError(f"不支持的格式: {format}")
        
        self.logger.debug(f"处理数据，格式: {format}")
        result = await processor(data)
        return result
    
    async def batch_process(self, items: list[Any], format: str = "json") -> list[Any]:
        """批量处理数据"""
        self.logger.info(f"批量处理 {len(items)} 条数据")
        
        tasks = [self.process(item, format) for item in items]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # 过滤错误
        valid_results = [r for r in results if not isinstance(r, Exception)]
        
        return valid_results
    
    async def _process_json(self, data: dict) -> dict:
        """处理 JSON 数据"""
        # 实现 JSON 处理逻辑
        return data
    
    async def _process_text(self, data: str) -> str:
        """处理文本数据"""
        # 实现文本处理逻辑
        return data.strip().lower()
    
    async def _process_binary(self, data: bytes) -> bytes:
        """处理二进制数据"""
        # 实现二进制处理逻辑
        return data
```

### 示例 5：Service 依赖管理

```python
from src.app.plugin_system.api.service_api import get_service

class AdvancedService(BaseService):
    """依赖其他 Service 的高级服务"""
    
    name = "advanced"
    description = "高级数据服务"
    
    async def initialize(self):
        """初始化，获取依赖的 Service"""
        # 获取依赖的 Service
        self.cache = get_service("my_plugin:service:cache")
        self.processor = get_service("my_plugin:service:data_processor")
        
        if not self.cache or not self.processor:
            raise RuntimeError("依赖的 Service 不可用")
        
        self.logger.info("高级服务已初始化")
    
    async def process_with_cache(self, key: str, data: Any) -> Any:
        """带缓存的数据处理"""
        # 检查缓存
        cached = await self.cache.get(key)
        if cached:
            self.logger.debug(f"缓存命中: {key}")
            return cached
        
        # 处理数据
        self.logger.debug(f"处理数据: {key}")
        processed = await self.processor.process(data)
        
        # 存入缓存
        await self.cache.set(key, processed)
        
        return processed
```

### 示例 6：Service 状态监控

```python
from src.app.plugin_system.api.service_api import (
    get_all_services,
    get_service,
)

class ServiceStatusCommand(BaseCommand):
    name = "service.status"
    description = "查看 Service 状态"
    
    async def execute(self, plugin_name: str = ""):
        if plugin_name:
            # 查看指定插件的 Service
            services = get_services_for_plugin(plugin_name)
        else:
            # 查看所有 Service
            services = get_all_services()
        
        if not services:
            await self.send_text("没有可用的 Service")
            return
        
        result = ["Service 状态:"]
        
        for signature, service_class in services.items():
            # 尝试获取实例
            instance = get_service(signature)
            
            if instance:
                status = "✅ 运行中"
            else:
                status = "❌ 未初始化"
            
            result.append(f"{status} {signature}")
            result.append(f"  描述: {service_class.description}")
        
        await self.send_text("\n".join(result))
```

## Service 组件最佳实践

### 1. Service 应当是无状态或状态独立的

```python
# ✅ 好的设计：状态独立
class CacheService(BaseService):
    async def get(self, key: str):
        return self.cache.get(key)

# ❌ 不好的设计：依赖外部状态
class BadService(BaseService):
    async def get(self, key: str):
        return some_global_variable.get(key)
```

### 2. 使用依赖注入而不是硬编码

```python
# ✅ 好的设计
class MyService(BaseService):
    async def initialize(self):
        self.cache = get_service("cache_plugin:service:cache")
    
    async def process(self, data):
        if self.cache:
            # 使用缓存
            pass

# ❌ 不好的设计
class BadService(BaseService):
    async def process(self, data):
        from some_module import cache
        cache.get(...)  # 硬编码依赖
```

### 3. 提供清晰的接口

```python
class DataService(BaseService):
    """数据服务提供明确的方法"""
    
    async def get_user(self, user_id: str) -> dict:
        """获取用户信息"""
        pass
    
    async def update_user(self, user_id: str, data: dict) -> bool:
        """更新用户信息"""
        pass
    
    async def delete_user(self, user_id: str) -> bool:
        """删除用户"""
        pass
```

### 4. 正确处理错误

```python
class RobustService(BaseService):
    async def process(self, data: Any) -> Any:
        try:
            result = await self._do_process(data)
            return result
        except Exception as e:
            self.logger.error(f"处理失败: {e}", exc_info=True)
            raise  # 或返回默认值
```

## 相关文档

- [Service 组件](../components/service.md) — Service 组件的详细说明
- [插件结构](../structure.md) — Service 在插件中的组织
- [进阶开发](../advanced.md) — Service 高级用法
