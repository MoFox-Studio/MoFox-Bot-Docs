# `mpdt config`

`config` 命令是 `mpdt` 的管家。它负责管理 `mpdt` 自身的配置，让你能够轻松地设置和查看工具链的工作参数。

## 命令用途

`mpdt` 的一些功能（尤其是 `dev` 命令）需要知道你的 Neo-MoFox 主项目在哪里。`config` 命令就是为了解决这个问题而存在的：
- **初始化配置**：通过交互式向导，帮助你创建全局配置文件。
- **显示配置**：让你随时查看当前的配置信息。
- **测试配置**：验证你配置的路径等是否有效。
- **编辑配置**：提供一个快捷方式来打开配置文件进行手动编辑。

## 语法格式

```bash
mpdt config [COMMAND]
```

## 命令详解

`mpdt config` 本身是一个命令组，包含以下子命令：

### `init`
**用途**：启动一个交互式配置向导，引导你设置必要的全局配置。这是你第一次使用 `mpdt` 时最先应该运行的命令。
**语法**：`mpdt config init`

### `show`
**用途**：在控制台打印出当前所有的配置项及其值。
**语法**：`mpdt config show`

### `test`
**用途**：检查配置的有效性，主要是测试 `neo_mofox_path` 是否指向一个有效的 Neo-MoFox 项目。
**语法**：`mpdt config test`

### `set-mofox`
**用途**：直接设置 Neo-MoFox 主程序的路径，是 `init` 的非交互式版本。
**语法**：`mpdt config set-mofox <PATH>`

## 配置文件

`mpdt` 的全局配置文件位于你的用户主目录下的 `.mpdt/config.toml`。

**路径示例**：
- **Windows**: `C:\Users\<YourUser>\.mpdt\config.toml`
- **Linux/macOS**: `/home/<YourUser>/.mpdt/config.toml`

**文件内容示例**：
```toml
# mpdt 全局配置文件

[core]
# Neo-MoFox 主项目的根目录路径
# 这是 mpdt dev 命令所必需的
neo_mofox_path = "E:\\delveoper\\mmc010\\Neo-MoFox"

[dev]
# 文件变化后的重载延迟（秒）
reload_delay = 1.0
# 每次重载前是否清空控制台
clear_screen = false
```

## 使用示例

### 首次配置

当你第一次安装完 `mpdt`，第一件事就是初始化配置：

```bash
mpdt config init
```
它会问你你的 Neo-MoFox 项目放在哪里，把路径告诉它就行。

### 查看当前配置

想确认一下 `mpdt` 当前用的是哪个 Neo-MoFox 项目？

```bash
mpdt config show
```

### 更换 Neo-MoFox 项目

你把 Neo-MoFox 项目换了个地方，或者想切换到另一个分支版本。

```bash
# 方式一：重新运行向导
mpdt config init

# 方式二：手动设置
mpdt config set-mofox <PATH>
# 将 <PATH> 替换为你的 Neo-MoFox 主程序路径
```

---

`mpdt config` 虽然不是开发流程中的核心命令，但它为你提供了必要的“后勤保障”。一个正确的配置是 `mpdt dev` 等高级功能顺利运行的基础。
