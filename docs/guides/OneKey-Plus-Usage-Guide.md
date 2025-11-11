# MoFox 一键包使用指南

## 简介

MoFox 一键包是一个集成了 Python 环境的多服务机器人管理工具，旨在为用户提供开箱即用的机器人部署、管理和维护体验。本指南将引导您完成从安装、配置到启动的完整流程，帮助您快速部署属于自己的机器人。

## 环境要求

在开始之前，请确保您的系统满足以下要求：

-   **操作系统**: Windows (推荐 Windows 10 及以上版本)
-   **Git**: 用于项目更新。请确保已正确安装并配置环境变量。
-   **网络连接**: 用于下载及更新依赖。


## 快速上手

### 1. 下载与解压

从QQ群下载 `OneKey-Plus.zip` 压缩包，并将其解压到您希望存放的任意目录。解压后，您会得到一个名为 `onekey-plus` 的文件夹。

**重要提示**: **请勿在压缩包内直接运行程序**，这会导致程序无法正确读写文件。

### 2. 启动程序

进入 `onekey-plus` 目录，找到并双击运行 **`启动一键包程序.bat`** 批处理文件。

![启动界面截图](/startup_screenshot.png)


程序首次启动时，会自动检测环境、安装所需依赖并启动主程序界面。这个过程可能需要一些时间，请耐心等待。

### 3. 初始化配置

首次运行成功后，程序会自动进入配置向导。请按照向导的命令行提示，一步步完成初始化设置。

### 4. 配置 Napcat WebSocket

> [!TIP]
> 如果Napcat中已经存在了WebSocket或者你的机器人可以正常收发消息就不用管它

1.  待一键包中的服务完全启动后，访问 Napcat 的 WebUI,它的网址通常是127.0.0.1:6099,TOKEN是napcat。
2.  在 WebUI 中找到并点击“网络配置”选项。
3.  新建一个 **WebSocket 客户端** (正向 WebSocket)。
4.  将端口号从默认的 `8082` 修改为 `8095` (或其他您指定的端口)。
5.  保存配置并启动该客户端。

![Napcat WebUI 网络配置](/napcat_ws_config.png)


## 目录结构与核心文件

整个一键包的所有文件都位于 `onekey-plus` 文件夹内。了解其内部结构有助于您进行个性化配置或问题排查。

```
onekey-plus/
├── core/
│   ├── Bot/              # <-- 核心 Bot (MoFox) 程序目录
│   └── Napcat/           # <-- Napcat 服务目录
├── python_embedded/      # <-- 内置的 Python 环境
├── SQLiteStudio/         # <-- 数据库管理工具
├── 启动一键包程序.bat     # <-- (推荐) 程序主入口
├── onekey.py             # <-- 核心控制脚本
├── config_wizard.py      # <-- 配置向导脚本
└── update.py             # <-- 更新脚本
```

-   **`启动一键包程序.bat`**: **（推荐）** 程序的主入口。双击即可启动。
-   **`onekey.py`**: 核心逻辑脚本，由 `启动一键包程序.bat` 调用。
-   **`python_embedded/`**: 内置的 Python 环境目录，与系统环境隔离。
-   **`core/Bot/`**: **核心 Bot (MoFox) 程序所在目录**。所有插件、配置和数据都存放于此。
-   **`core/Napcat/`**: Napcat 适配器目录，负责与 Napcat 服务通信。


### 使用内置 Python 执行命令

如果您需要手动执行某些 Python 脚本，可以直接调用 `python_embedded` 内的 `python.exe`。

**命令格式:**

```powershell
# 语法: .\python_embedded\python.exe [要执行的脚本路径] [可选参数]

# 示例: 从 onekey-plus 根目录手动执行核心控制脚本
.\python_embedded\python.exe onekey.py
# 示例: 手动安装一些需要的依赖
.\python_embedded\python.exe -m pip install requests
```


## 常见问题 (FAQ)

-   **Q: `pip` 安装依赖失败怎么办？**
    A: 通常是权限不足导致。请尝试以 **管理员身份** 重新运行 `启动一键包程序.bat`。

-   **Q: 仓库更新失败，提示权限或网络错误？**
    A: 请检查您的网络连接是否通畅，以及 Git 是否能正常访问 GitHub 等代码托管平台。

-   **Q: 服务启动失败？**
    A: 请首先检查 `core/Bot` 目录是否完整。然后，查看程序在命令行窗口输出的日志信息以定位问题。

---

*感谢使用 MoFox 一键包，祝您使用愉快！*