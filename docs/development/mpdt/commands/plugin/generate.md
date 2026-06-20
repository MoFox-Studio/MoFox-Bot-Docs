# mpdt plugin generate

快速生成插件组件代码，避免手写样板代码。

## 用法

```bash
mpdt plugin generate [component_type] [component_name] [path] [options]
```

## 参数

### component_type

组件类型（可选）。如果不提供，将进入交互式模式。

**可选值**：
- `action` - Action 组件（动作组件）
- `tool` - Tool 组件（工具组件）
- `event` - Event Handler（事件处理器）
- `adapter` - Adapter 组件（适配器）
- `plus-command` - Plus Command 组件
- `router` - Router 组件（路由器）
- `chatter` - Chatter 组件（聊天器）
- `service` - Service 组件（服务组件）
- `config` - Config 组件（配置组件）

### component_name

组件名称（可选）。如果不提供，将进入交互式模式。

- **格式要求**：使用 `PascalCase`（大驼峰命名）
- **示例**：`MyAction`、`HelloWorld`、`MusicPlayer`

### path

插件根目录路径（可选）。默认为当前目录。

```bash
mpdt plugin generate action MyAction /path/to/plugin
```

## 选项

### --description, -d

组件描述，用于注释和文档。

```bash
mpdt plugin generate action MyAction --description "执行某个操作"
```

### --force, -f

覆盖已存在的文件。

```bash
mpdt plugin generate action MyAction --force
```

### --root

在插件根目录生成组件文件，而不是 `components/` 文件夹。

```bash
mpdt plugin generate config AppConfig --root
```

## 示例

### 交互式生成

不提供任何参数，进入交互式模式：

```bash
mpdt plugin generate
```

系统会询问：
- 组件类型
- 组件名称
- 组件描述

### 覆盖已有文件

```bash
mpdt plugin generate action MyAction --force
```

### 在根目录生成

```bash
mpdt plugin generate service DatabaseService --root
```

生成文件：`database_service.py`（而不是 `components/services/database_service.py`）

## 生成规则

### 文件命名

组件名称会自动转换为 snake_case 作为文件名：

| 组件名称 | 文件名 |
|---------|--------|
| `MyAction` | `my_action.py` |
| `HelloWorld` | `hello_world.py` |
| `MusicPlayer` | `music_player.py` |

### 文件位置

默认生成位置：

| 组件类型 | 生成路径 |
|---------|---------|
| `action` | `components/actions/<name>.py` |
| `tool` | `components/tools/<name>.py` |
| `event` | `components/events/<name>.py` |
| `adapter` | `components/adapters/<name>.py` |
| `plus-command` | `components/plus_command/<name>.py` |
| `router` | `components/routers/<name>.py` |
| `chatter` | `components/chatters/<name>.py` |
| `service` | `components/services/<name>.py` |
| `config` | `components/configs/<name>.py` |

使用 `--root` 选项时，生成在插件根目录。

### 自动注册

生成组件后，需要在 `plugin.py` 中注册：

```python
from mofox.plugin import BasePlugin
from components.actions.my_action import MyAction

class MyPlugin(BasePlugin):
    plugin_name = "my_plugin"
    
    def get_actions(self):
        return [MyAction]
```

## 下一步

生成组件后：

1. **编辑组件文件**
   实现 `execute()` 或 `call()` 方法中的业务逻辑

2. **启动开发模式测试**
```bash
   mpdt plugin dev
```

3. **检查代码质量**
```bash
   mpdt plugin check
```

## 相关命令

- [mpdt plugin init](./init) - 初始化插件
- [mpdt plugin dev](./dev) - 开发模式
- [mpdt plugin check](./check) - 检查插件

## 相关文档

- [插件组件](/docs/development/plugin_develop/components/)
- [Action 组件](/docs/development/plugin_develop/components/action)
- [Tool 组件](/docs/development/plugin_develop/components/tool)
