# <iconify-icon icon="material-symbols:android" height="36"></iconify-icon> MoFox-Core Android 部署指南 (内置适配器版)

## 概述

欢迎使用 MoFox-Core，一个高度可定制化的 AI Bot 框架。

本指南将引导您在 Android (Termux) 环境下，使用项目**内置的 Napcat 适配器插件**完成 MoFox-Core 的全部署流程。该方式是官方推荐的最佳实践，具有以下优势：

*   **部署简化**：仅需下载和运行 MoFox-Core 主项目。
*   **操作便捷**：只需管理单个后台进程。
*   **配置统一**：所有相关设置均在主项目的配置文件中完成。

本教程将覆盖从环境准备到成功运行的每一个步骤，旨在为初学者提供一条清晰、高效的部署路径。

## 第一章：准备工作——在手机上开辟新天地

在正式开始部署之前，我们需要先在你的安卓设备上搭建好一个功能完备的 Linux 环境。

### 1.1 系统要求

*   **Android 版本**: >= 7.0
*   **芯片架构**: AArch64 (目前主流手机均满足)
*   **存储空间**: 至少 2GB 可用空间

### 1.2 Termux 环境 -> Ubuntu 虚拟机

我们需要借助 `Termux` 这个强大的终端模拟器，并在其中安装一个 Ubuntu 系统，来为 MoFox-Core 提供一个稳定、完整的运行环境。

1.  **安装 ZeroTermux**:
    *   前往 [ZeroTermux Github Releases](https://github.com/hanxinhao000/ZeroTermux/releases/tag/release) 下载并安装最新的 `ZeroTermux` 安装包。
    *   > **注意**: 使用其他版本的 Termux 可能会导致部分步骤不适用。
    *   安装后，打开 ZeroTermux，按照提示完成初始化设置。建议在侧边栏菜单中选择“切换源”，并选择一个国内的镜像源（如清华源）以提高后续的下载速度。

2.  **安装 proot 和 Ubuntu**:
    *   在 ZeroTermux 中，逐行执行以下命令来安装 `proot` 和 Ubuntu 环境。
        ```bash
        pkg install proot-distro      # 安装 proot
        proot-distro install ubuntu   # 安装 Ubuntu
        ```

3.  **登录 Ubuntu**:
    *   安装完成后，执行以下命令登录到 Ubuntu 环境：
        ```bash
        proot-distro login ubuntu
        ```
    *   成功登录后，你将处于 Ubuntu 的 shell 环境中。**后续的所有命令行操作，都将在这个 Ubuntu 环境中进行。**

### 1.3 软件三件套：Python、Git 与 uv

这三款软件是部署流程的核心工具，缺一不可。

1.  **安装基础软件包**:
    *   在 Ubuntu 环境中，首先更新包列表并安装核心工具：
        ```bash
        apt update
        apt install sudo git curl python3-pip python3-dev python3.12-venv build-essential screen
        ```
    *   > 在后续步骤中，如果出现 `(Y/I/N/O/D/Z)[default=?]` 或 `[Y/N]` 的提示，直接按回车键选择默认选项即可。

2.  **验证 Python (版本 >= 3.11)**:
    *   在终端中输入 `python3 --version` 并回车。如果显示出版本号（如 `Python 3.10.6`），则证明安装成功。

3.  **验证 Git**:
    *   在终端中输入 `git --version` 并回车。如果显示出版本号（如 `git version 2.34.1`），则证明安装成功。

4.  **安装 uv (推荐的 Python 包管理器)**:
    *   uv 是一个速度极快的 Python 包管理器，我们强烈推荐使用它来管理项目依赖。
    *   执行以下命令安装 uv：
        ```bash
        pip3 install uv --break-system-packages -i https://repo.huaweicloud.com/repository/pypi/simple/
        ```
    *   为了让系统能找到 `uv` 命令，需要将它所在的路径添加到环境变量中。执行以下命令：
        ```bash
        echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
        source ~/.bashrc
        ```
    *   **验证**: 输入 `uv --version` 并回车，如果显示出版本号，则证明安装成功。

### 1.4 Napcat QQ 客户端

Napcat QQ 是一个 QQ 客户端，也是 MoFox-Core 与 QQ 平台沟通的桥梁。

在继续下一步之前，请**务必参考 [NapCatQQ 官方文档](https://napcat.napneko.icu/)，在你的安卓手机上完成客户端 App 的安装、配置，并确保你的 QQ 账号能够成功登录**。这是整个部署流程的重要前置条件。

## 第二章：获取核心——请君入瓮

万事俱备，现在我们正式开始将 MoFox-Core 的核心代码下载到你的手机中。

1.  **创建并进入文件夹**:
    *   在 Ubuntu 终端中，执行以下命令，这会在你的用户主目录下创建一个名为 `MoFox-Core_Deployment` 的文件夹，并进入该目录。
        ```bash
        cd ~
        mkdir MoFox-Core_Deployment
        cd MoFox-Core_Deployment
        ```
    *   > **⚠️ 重要提示**: 为了避免未来可能出现的奇怪问题，请确保文件夹的**完整路径中不包含任何中文、空格或特殊字符**。

2.  **`git clone` 神威**:
    *   在终端中，粘贴并执行以下命令：
        ```bash
        git clone https://github.com/MoFox-Studio/MoFox-Core.git
        ```
    *   > **🌐 网络小贴士**:
    *   > 如果你发现下载速度极慢或连接失败，可以尝试使用备用镜像地址，例如 `https://kgithub.com/MoFox-Studio/MoFox-Core.git`。

## 第三章：激活环境——注入灵魂

我们已经有了机器人的“素体”（项目代码），现在需要为它创建一个纯净的生存空间（虚拟环境），并注入“灵魂”（安装所有必需的程序库）。

1.  **进入项目目录**:
    *   执行 `cd MoFox-Core` 进入刚刚克隆下来的文件夹。

2.  **创建并激活虚拟环境**:
    *   我们将使用 `uv` 来完成环境的创建和激活。
        ```bash
        # 创建虚拟环境
        uv venv
        # 激活虚拟环境 (核心步骤)
        source .venv/bin/activate
        ```
    *   **观察变化！** 成功激活后，你会看到命令行提示符的最前面，多出了一个 `(.venv)` 的标记。这表示你已经成功进入了 MoFox-Core 的专属环境。
    *   > **⚠️ 重要提示**: 之后所有的安装、运行操作，都**必须**在这个带有 `(.venv)` 标记的命令行窗口中进行。

3.  **依赖安装：一行代码搞定**:
    *   在**已激活虚拟环境**的命令行窗口中，执行以下命令：
        ```bash
        uv pip install -r requirements.txt -i https://mirrors.aliyun.com/pypi/simple
        ```
    *   请耐心等待，直到它全部完成。

## 第四章：核心配置——让机器人“认识”你

此步骤与 [Linux 部署指南](./mmc_deploy_linux.md) 中的配置过程 **完全相同**。请参考该指南的第四章，或按以下摘要步骤完成配置：

1.  **`.env` 文件**:
    *   执行 `cp template/template.env .env`。
    *   编辑 `.env` 文件，将 `EULA_CONFIRMED` 修改为 `true`。

2.  **创建文件夹**:
    *   执行 `mkdir config`。

3.  **`bot_config.toml` 文件**:
    *   执行 `cp template/bot_config_template.toml config/bot_config.toml`。
    *   编辑 `config/bot_config.toml` 文件，至少修改 `[bot]` 下的 `qq_account` (机器人QQ号) 和 `[permission]` 下的 `master_users` (主人QQ号)。

4.  **`model_config.toml` 文件**:
    *   执行 `cp template/model_config_template.toml config/model_config.toml`。
    *   参照 **[模型配置快速上手指南](./quick_start_model_config.md)**，编辑 `config/model_config.toml` 文件，至少配置一个可用的大语言模型。

## 第五章：连接世界——内置适配器插件配置

现在，机器人的“身份证”和“大脑”都有了，但它还活在自己的世界里。我们需要为它接上“神经”，让它能够连接到 QQ 平台，接收和发送消息。这一步，我们通过配置官方内置的 **Napcat 适配器插件**来完成。

### 5.1 生成插件配置文件

MoFox-Core 拥有强大的插件管理系统。在我们第一次启动程序时，它会自动检测所有内置插件，并为它们创建默认的配置文件。

1.  **首次启动**:
    *   确保你的命令行终端**已激活虚拟环境** (前面带有 `(.venv)` 标记)。
    *   确保你当前的目录是 `MoFox-Core` 文件夹。
    *   执行以下命令，来启动一次 MoFox-Core：
        ```bash
        uv run python bot.py
        ```
    *   程序启动后，你会看到大量的日志信息在屏幕上滚动。当日志滚动停止，并且没有新的信息出现时，说明程序已经完成了初始化工作。

    > **💡 第一次启动就失败了怎么办？**
    > 如果程序在启动过程中直接报错并退出了，**99% 的可能性是第四章的核心配置有误**。请回头仔细检查：
    > *   `.env` 文件中的 `EULA_CONFIRMED` 是否为 `true`？
    > *   `bot_config.toml` 中的 `qq_account` 和 `master_users` 是否已正确填写？
    > *   `model_config.toml` 中是否至少配置好了一个**可用**的 API Key？
    > 解决了这些问题后，再重新尝试启动。

2.  **生成配置并关闭**:
    *   当程序稳定运行后，这次启动的主要目的——生成配置文件——就已经达成了。现在，请在命令行窗口中，按下 `Ctrl + C` 来关闭程序。程序会进行“优雅关闭”，请稍等片刻直至其完全退出。

### 5.2 启用并配置插件

经过上一步，所有内置插件的默认配置文件都已经被自动创建好了。

1.  **找到配置文件**:
    *   现在，请查看 `MoFox-Core/config/plugins/` 目录。你会发现里面出现了很多以插件名命名的文件夹。
    *   我们当前的目标是找到 `napcat_adapter_plugin` 文件夹，并用你的文本编辑器打开其中的 `config.toml` 文件 (例如: `nano config/plugins/napcat_adapter_plugin/config.toml`)。

2.  **启用插件 (第一步)**:
    *   在打开的 `config.toml` 文件中，找到 `[plugin]` 配置节，将 `enabled` 的值从 `false` 修改为 `true`。这是启动适配器的总开关。
        ```toml
        [plugin]
        enabled = true # < 修改这里
        ```

3.  **配置连接 (核心)**:
    *   这是整个部署流程中最关键的一步，目的是让 MoFox-Core (服务端) 与 Napcat QQ (客户端) 能够互相通信。我们将分别配置两端，并确保它们的“接头”信息完全一致。

    *   **第一部分：配置 MoFox-Core 监听端口**
        *   用你的文本编辑器打开 `MoFox-Core/config/plugins/napcat_adapter_plugin/config.toml` 文件。
        *   找到 `[napcat_server]` 配置节，这里定义了 MoFox-Core 将在哪个端口上“监听”来自 Napcat 客户端的连接请求。
            ```toml
            [napcat_server]
            # MoFox-Core 监听的端口
            port = 8095
            ```
        *   **请记下这个 `port` 值 (默认为 `8095`)**。除非 `8095` 端口已被其他程序占用，否则我们推荐保持默认设置。如果需要修改，请确保选择一个未被占用的端口。

    *   **第二部分：配置 Napcat 客户端连接地址**
        *   现在，回到你手机上的 Napcat QQ 客户端 App，我们将告诉它去连接 MoFox-Core 正在监听的端口。
        *   在 Napcat 客户端的 `OneBot v11` 设置中，添加一个新的**反向 WebSocket** 连接。
        ![点击新建 Websocket 客户端](/napcat_add_ws_client.png)
        *   在 `URL` 地址栏中，填写 `ws://127.0.0.1:8095`。
        *   **核心要点**：此处的 IP 地址 (`127.0.0.1` 代表本机) 和端口号 (`8095`) **必须**与你在**第一部分**中 MoFox-Core 配置文件里看到的 `port` 值**完全一致**。如果两边不一致，通信将百分之百失败。
        ![配置反向 WebSocket](/napcat_ws_config.png)
        *   保存设置。

完成以上步骤，机器人的“神经系统”就已经成功搭建。它现在知道了该如何与 QQ 世界进行通信。

## 第六章：启动！——见证奇迹的时刻

在 Android (Termux) 环境下，由于没有图形化桌面，我们需要使用 `screen` 工具来确保程序在后台持续运行。

1.  **第一步：启动并登录 Napcat QQ App**
    *   打开你已经安装好的 Napcat QQ 客户端 App，并确保机器人 QQ 账号**成功登录**。

2.  **第二步：运行 MoFox-Core (后台运行)**
    *   回到你的 Termux 终端窗口 (Ubuntu 环境内)。
    *   **检查两件事**:
        1.  确认命令行提示符最左边有 `(.venv)` 标记。
        2.  确认当前路径在 `MoFox-Core` 文件夹内。
    *   执行以下命令，创建并进入一个名为 `mofox` 的后台会话：
        ```bash
        screen -S mofox
        ```
    *   在 `screen` 会话中，执行最终的启动命令：
        ```bash
        uv run python bot.py
        ```
    *   当你在日志中看到成功连接的信息后，可以按下 `Ctrl + A` 然后再按 `D` 键，将此会话分离到后台。程序将继续运行。

### 每次启动时要输的命令

为了方便每次启动 MoFox-Core，你只需要在 Termux 的 Ubuntu 环境中执行以下命令即可喵～★

```bash
# 1. 登录 Ubuntu 环境
proot-distro login ubuntu

# 2. 进入 MoFox-Core 项目目录
cd ~/MoFox-Core_Deployment/MoFox-Core

# 3. 激活虚拟环境
source .venv/bin/activate

# 4. 启动 MoFox-Core (在 screen 会话中)
screen -dmS mofox bash -c "uv run python bot.py; exec bash"

# 5.启动napcat
自行启动
```

*   **查看日志**: 如果你想查看 MoFox-Core 的实时日志，可以使用 `screen -r mofox` 命令重新连接到 `mofox` 会话哦喵～★
*   **关闭机器人**: 在 `screen` 会话中，按下 `Ctrl + C` 就可以关闭机器人程序了喵～★

3.  **测试机器人**:
    *   现在，打开你的 QQ，向你的机器人账号发送一条消息。如果它回复了你，那么……
    *   **恭喜你，部署成功！**

### 如何管理后台会话

*   `screen -ls`: 列出所有正在运行的 `screen` 会话。
*   `screen -r mofox`: 重新连接到名为 `mofox` 的会话，查看程序实时日志。
*   在会话内按 `Ctrl + C` 可以关闭机器人程序。

## 第七章：故障排除

<details>
<summary><b>Q1: 启动成功，但日志里迟迟没有 `Napcat client connected` 信息？</b></summary>

这通常意味着 MoFox-Core 和 Napcat QQ 客户端之间的“神经”没有接上。请按以下步骤排查：

1.  **检查 Napcat QQ App**: 确保 Napcat QQ 客户端 App 本身已成功登录并处于在线状态，没有被系统后台杀死。
2.  **检查端口号**: 这是最常见的原因。请再次核对 `config/plugins/napcat_adapter_plugin/config.toml` 文件中 `[napcat_server]` 下的 `port` 值，是否与你 Napcat QQ 客户端里设置的**反向 WebSocket 端口**完全一致。
3.  **检查 Termux 网络权限**: 确保 Termux 具有访问网络的权限。

</details>

<details>
<summary><b>Q2: 机器人成功连接，但在 QQ 里不回复？</b></summary>

这通常是配置问题或模型服务问题。

1.  **检查模型配置**: 确认 `config/model_config.toml` 里的 API Key 是**有效且可用**的。
2.  **检查白名单**: 检查 `config/plugins/napcat_adapter_plugin/config.toml` 文件中 `[features]` 部分的 `group_list` 和 `private_list`。如果你开启了白名单，请确保你测试的群聊或私聊已经被加了进去。
3.  **查看日志**: 使用 `screen -r mofox` 连接回后台，当你给机器人发消息时，看看日志是否刷新，是否有 `ERROR` 级别的红色错误信息。

</details>

<details>
<summary><b>Q3: 日志里出现关于 `API KEY`、`authentication` 或 `401` 的错误？</b></summary>

这个错误非常明确，就是你的大语言模型配置出了问题。

*   请打开 `config/model_config.toml` 文件，仔细检查你配置的 `api_key` 和 `base_url` 是否有误。
*   登录你的模型服务商网站，检查 Key 是否被禁用、账户是否到期或欠费。

</details>

<details>
<summary><b>Q4: 我修改了配置文件，但好像没有生效？</b></summary>

MoFox-Core 在启动时会加载所有配置文件。如果你在机器人运行中修改了配置，需要**重启**才能生效。

*   使用 `screen -r mofox` 连接回后台。
*   按下 `Ctrl + C` 关闭机器人。
*   待程序完全退出后，再重新执行 `uv run python bot.py` 命令来启动机器人。

</details>

## 结语：你的冒险才刚刚开始

至此，你已经成功在安卓设备上走完了 MoFox-Core 的部署全程。但这仅仅是一个开始。去探索、去定制，让你的专属 AI 伙伴在你的手机里大放异彩吧！
