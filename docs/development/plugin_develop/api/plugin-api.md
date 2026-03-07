# Plugin API

`src/app/plugin_system/api/plugin_api` 提供插件的加载、卸载与查询能力。

## 导入

```python
from src.app.plugin_system.api.plugin_api import (
    load_plugin,
    unload_plugin,
    reload_plugin,
    get_plugin,
    get_all_plugins,
    list_loaded_plugins,
    get_manifest,
    is_plugin_loaded,
    get_plugin_status,
)
```

## 核心函数

### `load_plugin(plugin_path: str) -> bool`

按路径加载插件。

**参数：**
- `plugin_path`: 插件路径（绝对路径或相对于 plugins 目录）

**返回值：**
- `True` 表示加载成功，`False` 表示失败

**使用示例：**
```python
# 加载插件
success = await load_plugin("plugins/my_plugin")

if success:
    print("插件加载成功")
else:
    print("插件加载失败")

# 加载 .mfp 包
success = await load_plugin("plugins/my_plugin.mfp")
```

---

### `unload_plugin(plugin_name: str) -> bool`

卸载插件。

**参数：**
- `plugin_name`: 插件名称

**返回值：**
- `True` 表示卸载成功，`False` 表示失败

**使用示例：**
```python
success = await unload_plugin("my_plugin")

if success:
    print("插件已卸载")
else:
    print("插件卸载失败")
```

---

### `reload_plugin(plugin_name: str) -> bool`

重载插件（先卸载再加载）。

**参数：**
- `plugin_name`: 插件名称

**返回值：**
- `True` 表示重载成功，`False` 表示失败

**使用示例：**
```python
success = await reload_plugin("my_plugin")

if success:
    print("插件已重载")
else:
    print("插件重载失败")
```

---

### `get_plugin(plugin_name: str) -> BasePlugin | None`

获取插件实例。

**参数：**
- `plugin_name`: 插件名称

**返回值：**
- 插件实例，未找到则返回 `None`

**使用示例：**
```python
plugin = get_plugin("my_plugin")

if plugin:
    print(f"插件: {plugin.name}")
    print(f"版本: {plugin.version}")
else:
    print("插件未加载")
```

---

### `get_all_plugins() -> dict[str, BasePlugin]`

获取所有已加载插件。

**返回值：**
```python
{
    "my_plugin": <MyPlugin instance>,
    "another_plugin": <AnotherPlugin instance>,
}
```

**使用示例：**
```python
plugins = get_all_plugins()

for name, plugin in plugins.items():
    print(f"插件: {name} v{plugin.version}")
```

---

### `list_loaded_plugins() -> list[str]`

列出所有已加载插件名称。

**返回值：**
```python
["my_plugin", "another_plugin", "third_plugin"]
```

**使用示例：**
```python
plugin_list = list_loaded_plugins()
print(f"已加载 {len(plugin_list)} 个插件:")
for name in plugin_list:
    print(f"  - {name}")
```

---

### `get_manifest(plugin_name: str) -> PluginManifest | None`

获取插件清单（manifest.json）。

**参数：**
- `plugin_name`: 插件名称

**返回值示例：**
```python
{
    "name": "my_plugin",
    "version": "1.0.0",
    "description": "我的插件",
    "author": "作者",
    "license": "GPL-3.0",
    "dependencies": {...},
    "include": [...],
}
```
未找到则返回 `None`

**使用示例：**
```python
manifest = get_manifest("my_plugin")

if manifest:
    print(f"名称: {manifest['name']}")
    print(f"版本: {manifest['version']}")
    print(f"作者: {manifest['author']}")
else:
    print("清单不存在")
```

---

### `is_plugin_loaded(plugin_name: str) -> bool`

检查插件是否已加载。

**参数：**
- `plugin_name`: 插件名称

**返回值：**
- `True` 表示已加载，`False` 表示未加载

**使用示例：**
```python
if is_plugin_loaded("my_plugin"):
    print("插件已加载")
else:
    print("插件未加载")
```

---

### `get_plugin_status(plugin_name: str) -> dict[str, Any]`

获取插件状态信息。

**参数：**
- `plugin_name`: 插件名称

**返回值示例：**
```python
{
    "name": "my_plugin",
    "loaded": True,
    "version": "1.0.0",
    "components": {
        "chatter": 2,
        "command": 5,
        "action": 3,
    },
    "dependencies_met": True,
}
```
未找到则返回 `None`

**使用示例：**
```python
status = get_plugin_status("my_plugin")

if status:
    print(f"插件: {status['name']}")
    print(f"已加载: {status['loaded']}")
    print(f"组件数: {sum(status['components'].values())}")
else:
    print("插件不存在")
```

## 完整示例

### 示例 1：插件管理命令

```python
from src.app.plugin_system.api.plugin_api import (
    list_loaded_plugins,
    get_plugin_status,
    reload_plugin,
)

class PluginListCommand(BaseCommand):
    name = "plugin.list"
    description = "列出所有插件"
    
    async def execute(self):
        plugins = list_loaded_plugins()
        
        if not plugins:
            await self.send_text("没有已加载的插件")
            return
        
        result = ["已加载的插件:"]
        
        for plugin_name in plugins:
            status = get_plugin_status(plugin_name)
            if status:
                component_count = sum(status['components'].values())
                result.append(
                    f"- {plugin_name} v{status['version']} "
                    f"({component_count} 个组件)"
                )
        
        await self.send_text("\n".join(result))

class PluginReloadCommand(BaseCommand):
    name = "plugin.reload"
    description = "重载插件"
    permission = PermissionLevel.ADMIN
    
    async def execute(self, plugin_name: str):
        if not is_plugin_loaded(plugin_name):
            await self.send_text(f"插件 {plugin_name} 未加载")
            return
        
        await self.send_text(f"正在重载插件 {plugin_name}...")
        
        success = await reload_plugin(plugin_name)
        
        if success:
            await self.send_text(f"插件 {plugin_name} 重载成功")
        else:
            await self.send_text(f"插件 {plugin_name} 重载失败")
```

### 示例 2：插件加载/卸载命令

```python
from src.app.plugin_system.api.plugin_api import (
    load_plugin,
    unload_plugin,
    is_plugin_loaded,
)

class LoadPluginCommand(BaseCommand):
    name = "plugin.load"
    description = "加载插件"
    permission = PermissionLevel.ADMIN
    
    async def execute(self, plugin_path: str):
        await self.send_text(f"正在加载插件: {plugin_path}")
        
        success = await load_plugin(plugin_path)
        
        if success:
            await self.send_text("插件加载成功")
        else:
            await self.send_text("插件加载失败，请查看日志")

class UnloadPluginCommand(BaseCommand):
    name = "plugin.unload"
    description = "卸载插件"
    permission = PermissionLevel.ADMIN
    
    async def execute(self, plugin_name: str):
        if not is_plugin_loaded(plugin_name):
            await self.send_text(f"插件 {plugin_name} 未加载")
            return
        
        await self.send_text(f"正在卸载插件: {plugin_name}")
        
        success = await unload_plugin(plugin_name)
        
        if success:
            await self.send_text("插件卸载成功")
        else:
            await self.send_text("插件卸载失败，请查看日志")
```

### 示例 3：插件信息查询

```python
from src.app.plugin_system.api.plugin_api import (
    get_plugin,
    get_manifest,
    get_plugin_status,
)

class PluginInfoCommand(BaseCommand):
    name = "plugin.info"
    description = "查看插件详细信息"
    
    async def execute(self, plugin_name: str):
        plugin = get_plugin(plugin_name)
        
        if not plugin:
            await self.send_text(f"插件 {plugin_name} 不存在")
            return
        
        manifest = get_manifest(plugin_name)
        status = get_plugin_status(plugin_name)
        
        result = [
            f"插件信息: {plugin_name}",
            f"版本: {manifest.get('version', '未知')}",
            f"作者: {manifest.get('author', '未知')}",
            f"许可证: {manifest.get('license', '未知')}",
            f"描述: {manifest.get('description', '无')}",
            "",
            "组件统计:",
        ]
        
        if status:
            for comp_type, count in status['components'].items():
                if count > 0:
                    result.append(f"  - {comp_type}: {count}")
        
        await self.send_text("\n".join(result))
```

### 示例 4：插件依赖检查

```python
from src.app.plugin_system.api.plugin_api import (
    get_manifest,
    is_plugin_loaded,
)

class CheckPluginDependencies:
    async def check(self, plugin_name: str) -> tuple[bool, list[str]]:
        """检查插件依赖是否满足"""
        manifest = get_manifest(plugin_name)
        
        if not manifest:
            return False, [f"插件 {plugin_name} 不存在"]
        
        missing = []
        dependencies = manifest.get('dependencies', {})
        
        # 检查插件依赖
        plugin_deps = dependencies.get('plugins', [])
        for dep in plugin_deps:
            if not is_plugin_loaded(dep):
                missing.append(f"插件: {dep}")
        
        # 检查组件依赖
        component_deps = dependencies.get('components', [])
        for dep in component_deps:
            # 这里可以进一步检查组件是否存在
            pass
        
        if missing:
            return False, missing
        else:
            return True, []

class PluginDepsCommand(BaseCommand):
    name = "plugin.deps"
    description = "检查插件依赖"
    
    async def execute(self, plugin_name: str):
        checker = CheckPluginDependencies()
        met, missing = await checker.check(plugin_name)
        
        if met:
            await self.send_text(f"插件 {plugin_name} 的所有依赖都已满足")
        else:
            await self.send_text(
                f"插件 {plugin_name} 缺少以下依赖:\n" +
                "\n".join(f"  - {dep}" for dep in missing)
            )
```

### 示例 5：插件热重载监控

```python
from src.app.plugin_system.api.plugin_api import (
    reload_plugin,
    list_loaded_plugins,
)
import asyncio
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

class PluginWatcher(FileSystemEventHandler):
    def __init__(self, plugin_name: str):
        self.plugin_name = plugin_name
        self.last_reload = 0
    
    def on_modified(self, event):
        # 避免频繁重载
        import time
        now = time.time()
        if now - self.last_reload < 2:
            return
        
        if event.src_path.endswith('.py'):
            print(f"检测到文件变化: {event.src_path}")
            asyncio.create_task(self._reload())
            self.last_reload = now
    
    async def _reload(self):
        success = await reload_plugin(self.plugin_name)
        if success:
            print(f"插件 {self.plugin_name} 已热重载")
        else:
            print(f"插件 {self.plugin_name} 重载失败")
```

## 相关文档

- [Plugin 组件](../components/plugin.md) — Plugin 组件的详细说明
- [manifest.json 格式](../manifest.md) — 插件清单格式说明
- [插件安装指南](/docs/guides/plugin-installation-guide) — 插件安装方法
