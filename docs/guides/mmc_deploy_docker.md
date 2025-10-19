# MoFox_Bot Linux & Docker 部署指南

## 概述

欢迎使用 MoFox_Bot，一个高度可定制化的 AI Bot 框架。

本指南将引导您在 Linux 环境下，通过 Docker 和 Docker Compose 完成 MoFox_Bot 的全部署流程。该方式极大地简化了环境配置的复杂性，让你能快速启动并运行机器人。

**核心优势**:
*   **环境隔离**：所有依赖项均在 Docker 容器内，不污染你的宿主系统。
*   **一键部署**：使用 `docker-compose` 命令即可启动所有必需的服务。
*   **跨平台一致性**：无论在哪种 Linux 发行版上，部署体验都保持一致。

本教程将覆盖从环境准备到成功运行的每一个步骤，旨在为初学者提供一条清晰、高效的部署路径。

## 第一章：准备工作——地基搭建

在正式开始部署之前，我们需要先确保服务器环境满足要求。

### 1.1 系统要求

*   **操作系统**: 任何主流的 Linux 发行版 (本教程以 Ubuntu Server 24.04 LTS 为例)。
*   **硬件配置**:
    *   **CPU**: 2 核或以上
    *   **内存**: 2GB 或以上
    *   **磁盘空间**: 至少 5GB 可用空间

### 1.2 安装 Docker 和 Docker Compose

Docker 是容器化技术的核心，而 Docker Compose 则是管理多容器应用的利器。

1.  **安装 Docker**:
    *   不同 Linux 发行版的安装方式略有差异。我们推荐遵循 Docker 官方的安装文档，以确保安装最新、最稳定的版本。
    *   **对于 Ubuntu/Debian 用户**，可以执行以下命令一键安装：
        ```bash
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        ```
2.  **安装 Docker Compose**:
    *   通常，新版的 Docker Engine 已经内置了 `docker compose` 命令，无需额外安装。
3.  **验证安装**:
    *   执行以下两个命令，检查 Docker 和 Docker Compose 是否安装成功：
        ```bash
        docker --version
        docker compose version
        ```
    *   如果都能正确显示版本号，则证明环境已准备就绪。

## 第二章：获取核心——请君入瓮

现在，我们开始获取部署所需的核心文件。

### 2.1 创建你的“机器人基地”

首先，为机器人创建一个专属的目录。

```bash
# 创建项目目录并进入
mkdir -p mofox-bot/docker-config/core && cd mofox-bot
```
> **⚠️ 重要提示**: 为了避免未来可能出现的奇怪问题，请确保文件夹的**完整路径中不包含任何中文、空格或特殊字符**。

### 2.2 获取 Docker 编排文件

`docker-compose.yml` 文件是部署的“总指挥”，它定义了需要启动哪些服务以及它们之间的关系。

```bash
# 从项目仓库下载 docker-compose.yml 文件
wget https://raw.githubusercontent.com/MoFox-Studio/MoFox_Bot/dev/docker-compose.yml
```

> **🌐 网络小贴士**:
> 如果你发现从 GitHub 下载速度极慢或连接失败，可以尝试使用国内镜像源：
> ```bash
> wget https://ghproxy.com/https://raw.githubusercontent.com/MoFox-Studio/MoFox_Bot/dev/docker-compose.yml
> ```

## 第三章：核心配置——注入灵魂

在启动之前，我们需要对机器人进行一些基础配置，告诉它“你是谁”以及“如何思考”。

### 3.1 准备配置文件模板

我们需要下载两个核心的配置文件模板。

1.  **获取 `.env` 模板 (基础环境配置)**:
    ```bash
    wget https://raw.githubusercontent.com/MoFox-Studio/MoFox_Bot/dev/template/template.env -O docker-config/core/.env
    ```
    > **备用地址**: `https://ghproxy.com/https://raw.githubusercontent.com/MoFox-Studio/MoFox_Bot/dev/template/template.env`

### 3.2 修改核心配置

使用你熟悉的文本编辑器（如 `vim`, `nano`）来修改配置文件。

1.  **修改 `.env` 文件**:
    ```bash
    vim docker-config/core/.env
    ```
    *   找到 `EULA_CONFIRMED=false`，将其修改为 `true`。这代表你同意并遵守项目的用户许可协议。
        ```
        EULA_CONFIRMED=true
        ```
    *   **重要**: Docker 部署时，需要让服务监听所有网络接口，而不是仅监听本地回环地址。找到 `HOST="127.0.0.1"`，将其修改为：
        ```
        HOST="0.0.0.0"
        ```
2.  **首次启动以生成其他配置**:
    *   为了生成 `bot_config.toml` 和 `model_config.toml` 等详细配置文件，我们需要先“试运行”一次。
    *   执行以下命令：
        ```bash
        docker compose up -d
        ```
    *   等待约 15-30 秒，让容器完成初始化工作，然后关闭它：
        ```bash
        docker compose down
        ```
3.  **修改 `bot_config.toml` (机器人身份证)**:
    *   现在，配置文件已经生成在 `docker-config/core/` 目录下了。
    *   编辑 `bot_config.toml` 文件：
        ```bash
        vim docker-config/core/bot_config.toml
        ```
    *   **机器人 QQ 号**: 找到 `[bot]` 配置节下的 `qq_account`，修改为你的机器人 QQ 号。
    *   **主人 QQ 号**: 找到 `[permission]` 配置节下的 `master_users`，修改为你的 QQ 号。
        > **⚠️ 格式注意**: 请严格按照 `[["platform", "user_id"]]` 的格式填写，注意**双层方括号**和**英文引号**。
4.  **修改 `model_config.toml` (机器人大脑)**:
    *   这是最关键的一步，你需要为机器人配置一个可用的大语言模型（LLM）。
    *   编辑 `model_config.toml` 文件：
        ```bash
        vim docker-config/core/model_config.toml
        ```
    *   请**点击并参照以下链接**完成模型配置：
        *   **[模型配置快速上手指南](quick_start_model_config.md)**

## 第四章：启动！——见证奇迹的时刻

所有配置都已完成，现在，是时候唤醒你的机器人了！

### 4.1 启动顺序

1.  **第一步：启动并登录 Napcat QQ**
    *   Docker 部署会自动拉取并运行 Napcat 容器。你需要在启动后，通过浏览器访问 Napcat 的 WebUI 来登录 QQ。
2.  **第二步：运行 MoFox_Bot**
    *   在 `mofox-bot` 目录下，执行最终的启动命令：
        ```bash
        docker compose up -d
        ```

### 4.2 观察状态与日志

1.  **检查容器状态**:
    ```bash
    docker compose ps
    ```
    *   正常情况下，你应该能看到 `MoFox-Bot` 和 `mofox-napcat` 两个容器的状态都是 `running` 或 `up`。
2.  **实时监控日志**:
    ```bash
    docker compose logs -f
    ```
    *   通过日志，你可以实时看到机器人的运行状态。

### 4.3 配置 Napcat 并登录

1.  **访问 Napcat WebUI**:
    *   打开浏览器，访问 `http://<你的服务器IP>:6099`。
2.  **登录 QQ**:
    *   在 Napcat 界面中，按照提示完成机器人 QQ 账号的登录。
3.  **配置 WebSocket 连接**:
    *   在 Napcat 的设置中，找到 `OneBot v11` 相关设置。
    *   添加一个**正向 WebSocket** 连接。
    *   地址填写为：`ws://MoFox-Bot:8095/ws`
        > **💡 解析**: `MoFox-Bot` 是我们在 `docker-compose.yml` 中为核心服务定义的名字，Docker 的内部网络会自动解析它。`8095` 是核心服务监听的端口。

### 4.4 测试机器人

当你在日志中看到机器人与 Napcat 连接成功的提示后，就可以测试了。打开你的 QQ，向机器人账号发送一条消息，或者在一个它所在的群里 `@它`。

如果它回复了你，那么……

**恭喜你，部署成功！你的第一个 AI Bot 已经正式诞生！**

## 第五章：后续管理与故障排查

### 5.1 常用管理命令

| 操作         | 命令                               |
|--------------|------------------------------------|
| **启动服务** | `docker compose up -d`             |
| **停止服务** | `docker compose down`              |
| **重启服务** | `docker compose restart`           |
| **强制重建** | `docker compose up -d --force-recreate` |
| **查看日志** | `docker compose logs -f`           |
| **更新镜像** | `docker compose pull && docker compose up -d` |

### 5.2 常见问题排查

<details>
<summary><b>Q1: 容器启动失败，或状态为 `exited`？</b></summary>

*   **检查日志**: 执行 `docker compose logs core` 查看核心服务的日志，`docker compose logs napcat` 查看 Napcat 的日志。错误信息通常会直接显示在日志末尾。
*   **配置错误**: 90% 的启动失败是由于配置文件错误。请仔细检查 `docker-config/core/` 下的 `.env`, `bot_config.toml`, `model_config.toml` 是否都已正确配置。
*   **端口冲突**: 确保服务器的 `6099` 端口没有被其他程序占用。

</details>

<details>
<summary><b>Q2: 机器人成功连接，但在 QQ 里不回复？</b></summary>

*   **检查模型配置**: 确认 `model_config.toml` 里的 API Key 是**有效且可用**的。检查模型服务商后台，看看 Key 是否填错、账户是否欠费。
*   **查看核心日志**: `docker compose logs -f core`，当你给机器人发消息时，看看日志是否刷新。`ERROR` 级别的红色错误信息通常能定位到问题所在。
*   **检查 Napcat 连接**: 确认 Napcat 中的 WebSocket 地址 `ws://MoFox-Bot:8095/ws` 填写正确且连接成功。

</details>

<details>
<summary><b>Q3: 我修改了配置文件，但没有生效？</b></summary>

*   修改配置文件后，需要**重启**容器才能生效。
    ```bash
    docker compose restart
    ```
    *   如果改动较大，建议使用 `down` 和 `up` 来彻底重建：
    ```bash
    docker compose down
    docker compose up -d
    ```
</details>

## 结语：你的冒险才刚刚开始

至此，你已经成功走完了 MoFox_Bot 的 Docker 部署全程。但这仅仅是一个开始。MoFox_Bot 的真正魅力，在于其强大的插件系统和可塑性。现在，去探索和配置，打造一个独一无二的 AI 伙伴吧！