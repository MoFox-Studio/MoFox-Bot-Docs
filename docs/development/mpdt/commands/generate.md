# `mpdt generate`

`generate` (或简写 `gen`) 命令是你的代码复印机。当你需要添加一个新的组件时，用它就对了，它可以帮你生成遵循最佳实践的样板代码。

## 命令用途

在插件开发过程中，你需要不断添加新的组件来承载不同的功能。`mpdt generate` 的核心价值在于：
- 快速生成 11 种标准组件的 `.py` 文件。
- 自动包含必要的导入、类定义和异步方法。
- 遵循 Neo-MoFox 的命名和结构规范。
- 将你从重复的“复制-粘贴-重命名”劳动中解放出来。

## 语法格式

```bash
mpdt generate [OPTIONS] COMPONENT_TYPE COMPONENT_NAME
```

- `COMPONENT_TYPE`: 要生成的组件类型（见下表）。
- `COMPONENT_NAME`: 组件的名称，通常使用大驼峰命名法 (PascalCase)。

## 选项详解

| 选项 | 缩写 | 描述 | 默认值 |
|---|---|---|---|
| `--description` | `-d` | 为组件添加简短的描述，会生成在文档字符串中。 | `""` |
| `--output` | `-o` | 指定生成文件的相对路径。 | `components/` |
| `--force` | `-f` | 如果文件已存在，则覆盖它。 | `False` |

### 组件类型 (`COMPONENT_TYPE`)

`mpdt generate` 支持生成以下 11 种组件：

| 类型 | 描述 | 常见用途 |
|---|---|---|
| `action` | 主动行为组件 | 发送消息、调用 API |
| `tool` | LLM 工具组件 | 计算、查询数据、格式化文本 |
| `plus-command` | 增强命令 | 带复杂参数和权限控制的命令 |
| `adapter` | 平台适配器 | 对接新的聊天平台 |
| `event` | 事件处理器 | 监听系统或插件事件 |
| `router` | Web 路由 | 提供 HTTP API 接口 |
| `chatter` | 对话逻辑核心 | 定义 Bot 的对话策略 |
| `service` | 跨插件服务 | 暴露功能给其他插件调用 |
| `config` | 插件配置模型 | 定义插件的配置文件结构 |

## 使用示例

### 基础用法

为你的插件生成一个用于发送消息的 `Action` 组件：

```bash
mpdt generate action SendMessage
```
这会在 `components/` 目录下创建一个 `send_message.py` 文件，里面包含一个名为 `SendMessage` 的 `Action` 类。

### 带描述和指定路径

生成一个用于搜索网页的 `Tool`，并添加描述，同时把它放在 `components/tools/` 目录下：

```bash
mpdt generate tool WebSearch -d "一个用于搜索网页的工具" -p "components/tools/"
```
这会在 `components/tools/` 目录下创建 `web_search.py`，并且类定义上方会自动生成文档字符串。

## 常见场景

### 场景一：为插件添加一个新命令

你的插件需要一个 `/weather` 命令来查询天气。

```bash
mpdt generate plus_command WeatherQuery -d "查询指定城市的天气"
```
`mpdt` 会生成一个 `PlusCommand` 组件，你只需要在 `handle` 方法里实现查询天气的逻辑即可。

### 场景二：插件需要监听用户入群事件

你想在用户加入群聊时发送一条欢迎消息。

```bash
mpdt generate event OnMemberJoin -d "处理新成员入群事件"
```
`mpdt` 会生成一个 `EventHandler` 组件，并默认监听 `ON_MEMBER_JOIN` 事件，你只需在 `handle` 方法中编写发送欢迎语的逻辑。

---

`generate` 命令是提升开发效率的利器。当你熟悉了所有组件类型后，它能帮你以惊人的速度搭建起插件的功能骨架。
