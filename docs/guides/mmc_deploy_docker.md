# <iconify-icon icon="mdi:docker" height="36"></iconify-icon> MoFox-Core Docker 部署指南

## 概述

欢迎使用 MoFox-Core，一个高度可定制化的 AI Bot 框架。

本指南将引导您在任何支持 Docker 的环境下，通过 Docker Compose 完成 MoFox-Core 与 Napcat 的全部署流程。该方式是**官方最推荐的部署方案**，具有无与伦比的优势：

*   **环境隔离**：所有依赖项均在 Docker 容器内，不污染你的宿主系统，告别繁琐的环境配置。
*   **一键部署**：使用 `docker compose up -d` 命令即可启动所有必需的服务（MoFox-Core + Napcat）。
*   **管理便捷**：将两个核心应用视为一个整体，统一启动、停止和更新。
*   **跨平台一致性**：无论在 Windows, macOS 还是各种 Linux 发行版上，部署体验都保持一致。

本教程将覆盖从环境准备到成功运行的每一个步骤，旨在为所有用户提供一条最清晰、最高效的部署路径。

## 第一章：准备工作——地基搭建

在正式开始部署之前，我们需要先确保系统环境满足要求。

### 1.1 系统要求

*   **操作系统**: 任何支持 Docker Desktop (Windows, macOS) 或 Docker Engine (Linux) 的操作系统。
*   **硬件配置**:
    *   **CPU**: 2 核或以上
    *   **内存**: 推荐 4GB 或以上
    *   **磁盘空间**: 至少 10GB 可用空间

### 1.2 安装 Docker 和 Docker Compose

Docker 是容器化技术的核心，而 Docker Compose 则是管理多容器应用的利器。

1.  **安装 Docker**:
    *   **对于 Windows/macOS 用户**:
        *   前往 [Docker 官方网站](https://www.docker.com/products/docker-desktop/) 下载并安装 **Docker Desktop**。它已经内置了 Docker Engine 和 Docker Compose，无需额外安装。
    *   **对于 Linux 用户**:
        *   我们推荐遵循 Docker 官方的安装文档，以确保安装最新、最稳定的版本。
        *   **对于 Ubuntu/Debian 用户**，可以执行以下命令一键安装：
            ```bash
            curl -fsSL https://get.docker.com -o get-docker.sh
            sudo sh get-docker.sh
            ```

2.  **验证安装**:
    *   打开你的终端 (Terminal, PowerShell, or CMD)。
    *   执行以下两个命令，检查 Docker 和 Docker Compose 是否安装成功：
        ```bash
        docker --version
        docker compose version
        ```
    *   如果都能正确显示版本号，则证明环境已准备就绪。

## 第二章：构建基地——文件准备

现在，我们开始构建部署所需的目录结构并获取核心文件。

### 2.1 创建项目目录

首先，为机器人创建一个专属的目录。

```bash
# 在你喜欢的位置创建项目目录并进入
mkdir mofox-bot && cd mofox-bot
```
> **⚠️ 重要提示**: 为了避免未来可能出现的奇怪问题，请确保文件夹的**完整路径中不包含任何中文、空格或特殊字符**。

### 2.2 获取 Docker 编排文件

`docker-compose.yml` 文件是部署的“总指挥”，它定义了需要启动 MoFox-Core 和 Napcat 两个服务以及它们之间的关系。

```bash
# Windows PowerShell 用户
Invoke-WebRequest -Uri https://raw.githubusercontent.com/MoFox-Studio/MoFox-Core/dev/docker-compose.yml -OutFile docker-compose.yml
# Linux/macOS/Git Bash 用户
curl -O https://raw.githubusercontent.com/MoFox-Studio/MoFox-Core/dev/docker-compose.yml
```

### 2.3 创建目录结构与预留文件

为了确保 Docker 容器能够正确挂载配置文件和数据文件，我们需要手动创建目录结构并预留关键文件。这一步至关重要，可以避免 Docker 自动将文件挂载点创建为目录。

1.  **创建配置与数据目录**:
    ```bash
    # 创建存放配置文件的目录
    mkdir -p docker-config/core
    mkdir -p docker-config/napcat
    
    # 创建存放数据的目录
    mkdir -p data/core
    mkdir -p data/qq
    mkdir -p data/app
    ```

2.  **拉取 .env 配置文件**:
    我们需要提前下载 `.env` 文件模板，以便在启动前进行配置。
    ```bash
    # Windows PowerShell 用户
    Invoke-WebRequest -Uri https://raw.githubusercontent.com/MoFox-Studio/MoFox-Core/dev/template/template.env -OutFile docker-config/core/.env
    # Linux/macOS/Git Bash 用户
    curl -o docker-config/core/.env https://raw.githubusercontent.com/MoFox-Studio/MoFox-Core/dev/template/template.env
    ```

3.  **预留统计报告文件**:
    MoFox-Bot 会生成运行统计报告，我们需要预先创建一个空文件，以便容器能够正确写入。
    ```bash
    # Windows PowerShell 用户
    New-Item -Path data/core/mofox_bot_statistics.html -ItemType File
    # Linux/macOS/Git Bash 用户
    touch data/core/mofox_bot_statistics.html
    ```

> **🌐 网络小贴士**:
> 如果你发现从 GitHub 下载速度极慢或连接失败，可以手动复制以下链接到浏览器中打开，然后将内容保存为对应的文件：
> *   `docker-compose.yml`: `https://ghproxy.com/https://raw.githubusercontent.com/MoFox-Studio/MoFox-Core/dev/docker-compose.yml`
> *   `.env`: `https://ghproxy.com/https://raw.githubusercontent.com/MoFox-Studio/MoFox-Core/dev/template/template.env`

## 第三章：核心配置——注入灵魂

在启动之前，我们需要对机器人进行一些基础配置。

### 3.1 修改 .env 环境配置

使用你喜欢的代码编辑器（如 VS Code）打开 `docker-config/core/.env` 文件。

1.  **签署 EULA**:
    *   找到 `EULA_CONFIRMED=false`，将其修改为 `true`，表示你同意最终用户许可协议。
        ```
        EULA_CONFIRMED=true
        ```

2.  **配置监听地址**:
    *   **重要**: Docker 部署时，需要让服务监听所有网络接口。找到 `HOST="127.0.0.1"`，将其修改为：
        ```
        HOST="0.0.0.0"
        ```

### 3.2 首次启动以生成其他配置

为了生成 `bot_config.toml` 和 `model_config.toml` 等详细配置文件，我们需要先“试运行”一次。

1.  **启动容器**:
    *   在 `mofox-bot` 目录下，执行以下命令：
        ```bash
        docker compose up -d
        ```
    *   这个命令会从 Docker Hub 拉取 MoFox-Core 和 Napcat 的最新镜像，并以后台模式启动它们。首次拉取镜像可能需要一些时间，请耐心等待。

2.  **检查并关闭**:
    *   等待约 30-60 秒，让容器完成初始化工作。你可以通过 `docker compose ps` 命令查看容器状态。
    *   然后，执行以下命令关闭并移除容器，为接下来的详细配置做准备：
        ```bash
        docker compose down
        ```

3.  **检查成果**:
    *   查看 `docker-config/core` 目录，你会发现 `config` 文件夹下已经生成了 `bot_config.toml`、`model_config.toml` 等配置文件。

### 3.3 完善详细配置

现在，我们需要修改生成的配置文件。

1.  **修改 `bot_config.toml` (机器人身份证)**:
    *   打开 `docker-config/core/config/bot_config.toml` 文件。
    *   **机器人 QQ 号**: 找到 `[bot]` 配置节下的 `qq_account`，修改为你的机器人 QQ 号。
    *   **主人 QQ 号**: 找到 `[permission]` 配置节下的 `master_users`，修改为你的 QQ 号。
        > **⚠️ 格式注意**: 请严格按照 `[["platform", "user_id"]]` 的格式填写。

2.  **修改 `model_config.toml` (机器人大脑)**:
    *   打开 `docker-config/core/config/model_config.toml` 文件。
    *   这是最关键的一步，你需要为机器人配置一个可用的大语言模型（LLM）。
    *   请**点击并参照以下链接**完成模型配置：
        *   **[模型配置快速上手指南](quick_start_model_config.md)**

3.  **修改 `config.toml` (Napcat 适配器插件)**:
    *   打开 `docker-config/core/config/plugins/napcat_adapter_plugin/config.toml` 文件。
    *   **启用插件**: 找到 `[plugin]` 配置节，将 `enabled` 修改为 `true`。
        ```toml
        [plugin]
        enabled = true
        ```

## 第四章：连接世界——配置 Napcat 通信

现在，我们需要配置 Napcat，让它主动连接到 MoFox-Core。

1.  **访问 Napcat WebUI**:
    *   首先，我们需要**单独启动 Napcat 服务**来获取其 WebUI 界面。
        ```bash
        docker compose up -d napcat
        ```
    *   等待 `napcat` 服务启动后，打开浏览器，访问 `http://127.0.0.1:6099` (如果在远程服务器上，请使用服务器 IP)。

2.  **登录 QQ**:
    *   在 Napcat WebUI 界面中，按照提示完成机器人 QQ 账号的登录。**请务必先完成登录**。

3.  **配置反向 WebSocket 连接**:
    *   登录成功后，在 Napcat 的设置中，找到 `OneBot v11` 或 `连接设置` 相关选项。
    *   添加一个**反向 WebSocket (Reverse WS)** 连接。
    *   地址填写为：`ws://core:8095`
        > **💡 关键解析**:
        > *   `core`: 这是我们在 `docker-compose.yml` 中为 MoFox-Core 服务定义的名字。在 Docker 的内部网络中，服务之间可以通过服务名直接通信，Docker 会自动将其解析到正确的容器 IP。**请不要将其修改为 `localhost` 或 `127.0.0.1`**。
        > *   `8095`: 这是 MoFox-Core 的 Napcat 适配器插件默认监听的端口。
    *   保存设置。

4.  **关闭 Napcat**:
    *   完成配置后，我们可以暂时关闭 Napcat 服务，准备统一启动。
        ```bash
        docker compose down
        ```

## 第五章：启动！——见证奇迹的时刻

所有配置都已完成，现在，是时候唤醒你的机器人了！

1.  **最终启动**:
    *   在 `mofox-bot` 目录下，执行最终的启动命令：
        ```bash
        docker compose up -d
        ```

2.  **观察状态与日志**:
    *   **检查容器状态**:
        ```bash
        docker compose ps
        ```
        正常情况下，你应该能看到 `core` 和 `napcat` 两个服务的状态都是 `running` 或 `up`。
    *   **实时监控日志**:
        ```bash
        docker compose logs -f
        ```
        通过日志，你可以实时看到机器人的运行状态。当你看到 `Napcat client connected` 的日志时，就代表连接成功了。

3.  **测试机器人**:
    *   打开你的 QQ，向机器人账号发送一条消息，或者在一个它所在的群里 `@它`。

如果它回复了你，那么……

**恭喜你，部署成功！你的第一个 AI Bot 已经正式诞生！**

## 第六章：后续管理与故障排查

### 6.1 常用管理命令

| 操作 | 命令 |
| :--- | :--- |
| **启动服务** | `docker compose up -d` |
| **停止服务** | `docker compose down` |
| **重启服务** | `docker compose restart` |
| **强制重建** | `docker compose up -d --force-recreate` |
| **查看日志** | `docker compose logs -f` |
| **查看指定服务日志** | `docker compose logs -f core` 或 `docker compose logs -f napcat` |
| **更新镜像** | `docker compose pull && docker compose up -d` |

### 6.2 常见问题排查

<details>
<summary><b>Q1: 容器启动失败，或状态为 `exited`？</b></summary>

*   **检查日志**: 执行 `docker compose logs core` 查看核心服务的日志，`docker compose logs napcat` 查看 Napcat 的日志。错误信息通常会直接显示在日志末尾。
*   **配置错误**: 90% 的启动失败是由于配置文件错误。请仔细检查 `docker-config/core/` 目录下的 `.env`, `bot_config.toml`, `model_config.toml` 和插件配置是否都已正确配置。
*   **端口冲突**: 确保宿主机的 `6099` 端口没有被其他程序占用。

</details>

<details>
<summary><b>Q2: 机器人成功连接，但在 QQ 里不回复？</b></summary>

*   **检查模型配置**: 确认 `docker-config/core/config/model_config.toml` 里的 API Key 是**有效且可用**的。
*   **查看核心日志**: `docker compose logs -f core`，当你给机器人发消息时，看看日志是否刷新。`ERROR` 级别的红色错误信息通常能定位到问题所在。
*   **检查 Napcat 连接**: 确认 Napcat 中的 WebSocket 地址 `ws://core:8095` 填写正确且连接成功。

</details>

<details>
<summary><b>Q3: 我修改了配置文件，但没有生效？</b></summary>

*   修改 `docker-config/core/` 或 `docker-config/napcat/` 目录下的配置文件后，需要**重启**对应的容器才能生效。
    ```bash
    # 重启所有服务
    docker compose restart
    # 或只重启 core 服务
    docker compose restart core
    ```
*   如果改动较大或不确定，建议使用 `down` 和 `up` 来彻底重建：
    ```bash
    docker compose down
    docker compose up -d
    ```
</details>

## 结语：你的冒险才刚刚开始

至此，你已经成功走完了 MoFox-Core 的 Docker 部署全程。但这仅仅是一个开始。MoFox-Core 的真正魅力，在于其强大的插件系统和可塑性。现在，去探索和配置，打造一个独一无二的 AI 伙伴吧！