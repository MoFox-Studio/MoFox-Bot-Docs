# `mpdt init`

`init` 命令是你与 `mpdt` 的第一次亲密接触。它的作用是根据预设的模板，为你生成一个结构完整、开箱即用的插件项目。

## 命令用途

当你需要创建一个新的 Neo-MoFox 插件时，`mpdt init` 可以帮你完成所有初始设置，包括：
- 创建标准化的目录结构。
- 生成 `manifest.json` 并填入基本信息。
- 创建 `plugin.py` 入口文件。
- 根据模板添加示例组件。
- 初始化 `README.md`、`.gitignore` 和 `LICENSE` 文件。

简单来说，就是帮你把“架子”搭好，你只管往里填“灵魂”。

## 语法格式

```bash
mpdt init [OPTIONS] [PLUGIN_NAME]
```

- `PLUGIN_NAME`: 你要创建的插件目录名。如果省略，`mpdt` 会通过交互式问答让你输入。

## 选项详解

| 选项 | 缩写 | 描述 | 默认值 |
|---|---|---|---|
| `--template` | `-t` | 选择插件模板。 | `basic` |
| `--author` | `-a` | 设置作者名。 | (交互式输入) |
| `--email` | `-e` | 设置作者邮箱。 | (交互式输入) |
| `--license` | `-l` | 选择开源许可证。 | `GPL-3.0-or-later` |
| `--with-docs` | | 同时生成文档结构。 | `False` |
| `--init-git` | | 初始化 Git 仓库。 | `False` |
| `--non-interactive` | | 禁用交互式问答，使用默认值或命令行参数。 | `False` |

### 模板类型 (`--template`)

`mpdt` 内置了 6 种模板，以适应不同的开发起点：

- `basic`: 最精简的模板，只包含一个能被加载的空插件。
- `action`: 包含一个 `Action` 组件的示例。
- `tool`: 包含一个 `Tool` 组件的示例。
- `plus_command`: 包含一个 `PlusCommand` 组件的示例。
- `full`: “全家桶”模板，包含多种常用组件，适合学习和参考。
- `adapter`: 用于开发平台适配器的专用模板。

### 许可证类型 (`--license`)

支持以下常见的开源许可证：
- `GPL-v3.0`
- `MIT`
- `Apache-2.0`
- `BSD-3-Clause`

## 使用示例

### 基础用法

最简单的方式，让 `mpdt` 问你：

```bash
mpdt init
```
接下来会有一系列问题，比如插件叫什么、作者是谁等，跟着提示走就行。

### 一步到位

如果你不喜欢问答，可以直接在命令行里把所有信息给全：

```bash
mpdt init my-awesome-plugin -t full -a "YourName" -e "your@email.com" -l MIT --init-git
```
这条命令会创建一个名为 `my-awesome-plugin` 的插件，使用 `full` 模板，作者是 `YourName`，使用 `MIT` 许可证，并自动初始化 Git 仓库。

## 常见场景

### 场景一：快速原型验证

只想快速验证一个想法，不需要复杂的结构。

```bash
mpdt init quick-prototype -t basic
```
这会生成一个最简单的插件结构，让你能以最快速度开始写核心代码。

### 场景二：开发一个带 UI 的工具

计划开发一个给 LLM 用的工具，并且这个工具未来可能会有 Web 界面。

```bash
mpdt init web-search-tool -t tool --with-docs
```
使用 `tool` 模板，并带上 `--with-docs`，为将来的文档和可能的 Web UI 预留空间。

---

`init` 命令是你插件开发之旅的起点。一个好的开始是成功的一半，而 `mpdt init` 致力于给你一个完美的开局。
