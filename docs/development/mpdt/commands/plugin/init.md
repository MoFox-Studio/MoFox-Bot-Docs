# mpdt plugin init

初始化新插件项目，创建标准的插件目录结构和配置文件。

## 用法

```bash
mpdt plugin init [plugin_name] [options]
```

## 参数

### plugin_name

插件名称（可选）。如果不提供，将进入交互式模式。

- **格式要求**：使用 `snake_case`（小写字母、数字、下划线，以字母开头）
- **示例**：`my_plugin`、`hello_world`、`music_player`

## 选项

### --template, -t

插件模板类型，决定初始生成的组件。

**可选值**：
- `basic` - 基础插件（仅包含根组件）*默认*
- `action` - Action 插件（包含示例 Action）
- `tool` - Tool 插件（包含示例 Tool）
- `collection` - Collection 插件
- `router` - Router 插件
- `plus_command` - Plus Command 插件
- `event_handler` - Event Handler 插件
- `adapter` - Adapter 插件
- `chatter` - Chatter 插件
- `full` - 完整插件（包含所有类型的示例组件）

```bash
mpdt plugin init my_plugin --template full
```

### --author, -a

作者名称。默认从 Git 配置中读取。

```bash
mpdt plugin init my_plugin --author "Your Name"
```

### --email, -e

作者电子邮箱。默认从 Git 配置中读取。

```bash
mpdt plugin init my_plugin --email "you@example.com"
```

### --license, -l

开源协议类型。

**可选值**：
- `GPL-v3.0` *默认*
- `MIT`
- `Apache-2.0`
- `BSD-3-Clause`

```bash
mpdt plugin init my_plugin --license MIT
```

### --with-docs

创建文档文件（`docs/` 目录和 README）。

```bash
mpdt plugin init my_plugin --with-docs
```

### --init-git / --no-init-git

是否初始化 Git 仓库。默认会询问用户。

```bash
# 初始化 Git
mpdt plugin init my_plugin --init-git

# 不初始化 Git
mpdt plugin init my_plugin --no-init-git
```

### --output, -o

输出目录路径。默认为当前目录。

```bash
mpdt plugin init my_plugin --output /path/to/workspace
```

## 示例

### 交互式创建

不提供任何参数，进入交互式模式：

```bash
mpdt plugin init
```

系统会依次询问：
- 插件名称
- 插件描述
- 模板类型
- 作者信息
- 分类和标签
- 开源协议
- 是否创建文档
- 是否初始化 Git

### 快速创建基础插件

```bash
mpdt plugin init my_plugin
```

### 创建完整插件

包含所有类型的示例组件：

```bash
mpdt plugin init my_plugin --template full --with-docs --init-git
```

### 创建 Action 插件

```bash
mpdt plugin init greeting_plugin --template action --author "Developer" --license MIT
```

## 生成的文件结构

### 基础模板（basic）

```
my_plugin/
├── plugin.py           # 插件主文件
├── manifest.json       # 插件元数据
├── LICENSE             # 许可证文件
├── README.md           # 说明文档
├── pyproject.toml      # Python 项目配置
├── requirements.txt    # Python 依赖
├── components/         # 组件目录
│   └── __init__.py
└── utils/              # 工具函数目录
    └── __init__.py
```

### 完整模板（full）

```
my_plugin/
├── plugin.py
├── manifest.json
├── LICENSE
├── README.md
├── pyproject.toml
├── requirements.txt
├── components/
│   ├── __init__.py
│   ├── actions/        # Action 组件
│   │   ├── __init__.py
│   │   └── example_action.py
│   ├── tools/          # Tool 组件
│   │   ├── __init__.py
│   │   └── example_tool.py
│   ├── collections/    # Collection 组件
│   ├── routers/        # Router 组件
│   ├── adapters/       # Adapter 组件
│   ├── chatters/       # Chatter 组件
│   ├── events/         # Event Handler
│   ├── plus_command/   # Plus Command
│   ├── services/       # Service 组件
│   └── configs/        # Config 组件
├── utils/
│   └── __init__.py
└── docs/               # 文档目录（如果使用 --with-docs）
    └── README.md
```

## 下一步

创建插件后，你可以：

1. **进入插件目录**
 ```bash
   cd my_plugin
 ```

2. **生成新组件**
 ```bash
   mpdt plugin generate action MyAction
 ```

3. **启动开发模式**
 ```bash
   mpdt plugin dev
 ```

4. **检查插件质量**
 ```bash
   mpdt plugin check
 ```

## 相关命令

- [mpdt plugin generate](./generate) - 生成组件
- [mpdt plugin dev](./dev) - 开发模式
- [mpdt plugin check](./check) - 检查插件

## 相关文档

- [插件结构与最佳实践](/docs/development/plugin_develop/structure)
- [manifest.json 格式说明](/docs/development/plugin_develop/manifest)
