# 存储API (Storage API)

存储API为每个插件提供了一个独立、持久化的本地数据存储方案。你可以把它想象成一个专属的小仓库，用来存放插件的各种配置、状态或者需要记录的数据。

## 导入方式

```python
from src.plugin_system.apis import storage_api
# 或者
from src.plugin_system import storage_api
```

## 核心用法

### 1. 获取存储实例

要使用存储功能，首先需要为你的插件获取一个专属的 `PluginStorage` 实例。这就像是为你的小仓库领一把钥匙。

```python
def get_local_storage(name: str) -> "PluginStorage":
```

**Args**:
- `name`: 插件的唯一标识名。**强烈建议**使用插件的 `__name__` 或者一个不会重复的字符串，因为这个名字决定了你的数据存储文件名，直接关系到数据隔离。如果你的插件包含多个文件，请确保在所有文件中都使用**同一个`name`**来获取存储实例，这样才能访问到同一个数据文件，避免产生一堆不必要的json。

**Returns**:
- `PluginStorage`: 一个专属于你的插件的存储操作实例。

#### 示例：
```python
# 在你的插件代码中
from src.plugin_system.apis import storage_api

# 使用插件的名称作为标识
plugin_storage = storage_api.get_local_storage(__name__)
```

### 2. 数据操作方法

获取到 `plugin_storage` 实例后，你就可以使用以下方法来对你的数据为所欲为了：

| 方法 | 描述 |
| :--- | :--- |
| `get(key, default=None)` | 读取一个键(key)的值，如果键不存在，就返回你给的默认值(default)。 |
| `set(key, value)` | 设置一个键值对。如果键已存在，它的值会被无情覆盖；如果不存在，就创建一个新的。 |
| `add(key, value)` | **仅当**键(key)不存在时，添加一个新的键值对。要是键已经在了，它可什么都不会做哦。 |
| `update(data)` | 用一个字典(data)来批量更新或添加多个键值对。 |
| `delete(key)` | 删除一个键(key)和它对应的值。删了可就找不回来了，想清楚再动手。 |
| `get_all()` | 获取存储的所有数据，返回一个完整的字典。 |
| `clear()` | **（危险操作！）**清空该插件的所有存储数据。用之前请三思！ |


### 3. 完整示例

下面的示例将改造 `hello_world_plugin` 中的 `HelloCommand`，使其能够记录并回复 `/hello` 命令被使用了多少次。

```python
from src.plugin_system import PlusCommand, CommandArgs, storage_api
# 获取当前插件的本地存储实例
local_storage = storage_api.get_local_storage("hello_world_plugin")

class EnhancedHelloCommand(PlusCommand):
    """
    一个增强版的 /hello 命令。
    它不仅会发送问候，还会使用存储API来记录自己被执行了多少次。
    """
    command_name = "hello"
    command_description = "向机器人发送一个会计算次数的问候。"
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    async def execute(self, args: CommandArgs) -> tuple[bool, str | None, bool]:
        # 从存储中读取计数，如果不存在则默认为 0
        count = local_storage.get("hello_command_count", 0)

        # 计数加一
        count += 1
        
        # 将新的计数值存回去
        local_storage.set("hello_command_count", count)
        
        # 从配置文件读取问候语
        greeting = str(self.get_config("greeting.message", "Hello!"))
        
        # 发送带有计数的消息
        response_message = f"{greeting} 这是我第 {count} 次向你问好哦！"
        await self.send_text(response_message)
        
        return True, f"成功发送第 {count} 次问候", True

# 你需要在你的主插件类（例如 HelloWorldPlugin）的 get_plugin_components 方法中注册这个 Command
# components.append((EnhancedHelloCommand.get_plus_command_info(), EnhancedHelloCommand))
```

## 注意事项

1.  **数据隔离**：每个插件通过不同的 `name` 获取到的存储实例是完全隔离的，数据会保存在 `data/plugin_data/` 目录下对应名称的 `.json` 文件中，所以不用担心和其他插件搞混。
2.  **线程安全**：API内部已经处理了线程锁，你不需要关心多线程读写时的数据冲突问题。
3.  **数据类型**：由于底层是使用JSON文件存储，所以你只能存储Python中可以被序列化为JSON的数据类型（如 `dict`, `list`, `str`, `int`, `bool`, `None` 等）。
4.  **性能**：对于需要频繁读写的复杂数据，建议先用 `get_all()` 将数据一次性读入内存中的一个变量，在内存中完成所有修改后，再用 `set` 或 `update` 一次性写回，这样可以减少不必要的磁盘I/O。