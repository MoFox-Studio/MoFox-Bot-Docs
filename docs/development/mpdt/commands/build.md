# `mpdt build`

`build` 命令是你的插件打包工厂。它能将你的插件源代码、资源文件和元数据打包成一个标准的 `.mfp` (MoFox Plugin) 文件，方便分发和部署。

## 命令用途

当你完成了插件开发和测试，准备与世界分享你的杰作时，`mpdt build` 就派上用场了。它的主要工作包括：
- 将插件目录压缩成一个 `.zip` 或 `.mfp` 文件。
- 自动处理版本号，支持语义化版本升级。
- 智能排除不必要的文件（如 `.git`, `__pycache__`, `*.pyc`）。
- 生成干净、可直接部署的插件包。

## 语法格式

```bash
mpdt build [OPTIONS] [PATH]
```
- `PATH`: 要打包的插件项目路径。如果省略，默认为当前目录。

## 选项详解

| 选项 | 缩写 | 描述 | 默认值 |
|---|---|---|---|
| `--bump` | | 自动升级 `manifest.json` 中的版本号。 | (无) |
| `--format` | `-f` | 指定输出格式。 | `mfp` |
| `--output` | `-o` | 指定输出目录。 | `dist/` |
| `--with-docs` | | 将文档目录也打包进去。 | `False` |

### 版本升级 (`--bump`)

`--bump` 选项让你能轻松管理插件版本，遵循 [语义化版本](https://semver.org/lang/zh-CN/) 规范。

- `patch`: 补丁版本，例如 `1.0.0` -> `1.0.1`。用于 bug 修复。
- `minor`: 次版本，例如 `1.0.1` -> `1.1.0`。用于新增功能，且向后兼容。
- `major`: 主版本，例如 `1.1.0` -> `2.0.0`。用于不兼容的 API 修改。

### 输出格式 (`--format`)

- `mfp`: MoFox 插件标准格式，本质上是带 `.mfp` 后缀的 zip 文件。
- `zip`: 普通的 `.zip` 格式。

## 使用示例

### 基础用法

最简单的打包命令：

```bash
mpdt build
```
这会在 `dist/` 目录下生成一个与你插件同名的 `.mfp` 文件，版本号不变。

### 修复 Bug 后的补丁发布

你修复了一个小 bug，准备发布一个补丁版本。

```bash
mpdt build --bump patch
```
`mpdt` 会先将 `manifest.json` 中的版本号 `patch` 位加一，然后再执行打包。

### 发布一个带新功能的次版本

你为插件添加了一个很酷的新功能。

```bash
mpdt build --bump minor --with-docs
```
升级次版本号，并把你的文档也一并打包进去。

## 常见场景

### 场景一：自动化发布流程

在 CI/CD 脚本中，你可以这样使用 `mpdt build`：

```bash
# 假设你的版本号存储在环境变量 $RELEASE_VERSION 中
# 1. 先检查代码质量
mpdt check --level error

# 2. 更新 manifest.json 中的版本号 (这里用 sed 举例，你也可以用其他工具)
sed -i "s/\"version\": \".*\"/\"version\": \"$RELEASE_VERSION\"/" manifest.json

# 3. 打包
mpdt build -o release_builds/
```

### 场景二：发布一个带新功能的次版本

你为插件添加了一个很酷的新功能。

```bash
mpdt build --bump minor --with-docs
```
升级次版本号，并把你的文档也一并打包进去。


---

`mpdt build` 是插件从开发到部署的“最后一公里”。掌握它，你就能规范、高效地管理你的插件版本和发布流程。
