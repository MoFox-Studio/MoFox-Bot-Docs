# <iconify-icon icon="mdi:linux" height="30"></iconify-icon> MoFox-Core Linux 部署指南 (内置适配器版)

## 概述

欢迎使用 MoFox-Core，一个高度可定制化的 AI Bot 框架。

本指南将引导您在 Linux 环境下，使用项目**内置的 Napcat 适配器插件**完成 MoFox-Core 的全部署流程。该方式是官方推荐的最佳实践，具有以下优势：

*   **部署简化**：仅需下载和运行 MoFox-Core 主项目。
*   **操作便捷**：只需管理单个进程。
*   **配置统一**：所有相关设置均在主项目的配置文件中完成。

本教程将覆盖从环境准备到成功运行的每一个步骤，旨在为初学者提供一条清晰、高效的部署路径。

## 第一章：准备工作——万丈高楼平地起

在正式开始部署之前，我们需要先搭建好稳固的地基。请确保你的系统中已正确安装并配置了以下软件。

### 1.1 系统要求

*   **操作系统**: 任何主流的 Linux 发行版 (如 Ubuntu, Debian, CentOS)

### 1.2 软件三件套：Python、Git 与 uv

这三款软件是部署流程的核心工具，缺一不可。

#### 1.2.1 Python (版本 >= 3.11)

Python 是 MoFox-Core 运行的编程语言环境。

1.  **安装**:
    *   打开终端，根据你的 Linux 发行版，使用包管理器安装 Python 3.10 或更高版本。
    *   **对于 Debian/Ubuntu**:
        ```bash
        sudo apt update
        sudo apt install python3 python3-pip python3-venv
        ```
    *   **对于 CentOS/RHEL**:
        ```bash
        sudo dnf install python3 python3-pip
        ```

2.  **验证**:
    *   在终端中输入以下命令并回车：
        ```bash
        python3 --version
        ```
    *   如果屏幕上显示出 Python 版本号（如 `Python 3.10.6`），则证明安装成功。

#### 1.2.2 Git

Git 是一个版本控制工具，我们用它来从 GitHub 上获取 MoFox-Core 的项目代码。

1.  **安装**:
    *   **对于 Debian/Ubuntu**:
        ```bash
        sudo apt install git
        ```
    *   **对于 CentOS/RHEL**:
        ```bash
        sudo dnf install git
        ```

2.  **验证**:
    *   在终端中输入以下命令并回车：
        ```bash
        git --version
        ```
    *   如果显示出 Git 的版本号（如 `git version 2.34.1`），则证明安装成功。

#### 1.2.3 uv (推荐的 Python 包管理器)

uv 是一个速度极快的 Python 包管理器，可以把它看作是 `pip` 和 `venv` 的“高速升级版”。我们强烈推荐使用它来管理项目依赖，能节省大量时间。

1.  **安装**:
    *   在终端中，输入以下命令并回车：
        ```bash
        pip3 install uv --break-system-packages -i https://repo.huaweicloud.com/repository/pypi/simple
        ```
    *   为了让系统能找到 `uv` 命令，需要将它所在的路径添加到环境变量中。执行以下命令：
        ```bash
        echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
        source ~/.bashrc
        ```

2.  **验证**:
    *   输入以下命令并回车：
        ```bash
        uv --version
        ```
    *   如果显示出 uv 的版本号，则证明安装成功。

### 1.3 Napcat QQ 客户端

Napcat QQ 是一个 QQ 客户端，也是 MoFox-Core 与 QQ 平台沟通的桥梁。

在继续下一步之前，请**务必参考 [NapCatQQ 官方文档](https://napcat.napneko.icu/)，完成客户端的安装、配置，并确保你的 QQ 账号能够成功登录**。这是整个部署流程的重要前置条件。

## 第二章：获取核心——请君入瓮

万事俱备，现在我们正式开始请“君”入瓮——将 MoFox-Core 的核心代码下载到你的电脑中。

### 2.1 创建你的“机器人基地”

首先，我们需要为机器人创建一个专属的“家”。

1.  **打开终端**。
2.  **创建并进入文件夹**：执行以下命令，这会在你的用户主目录下创建一个名为 `MoFox-Core_Deployment` 的文件夹，并进入该目录。
    ```bash
    cd ~
    mkdir MoFox-Core_Deployment
    cd MoFox-Core_Deployment
    ```

> **⚠️ 重要提示**: 为了避免未来可能出现的奇怪问题，请确保文件夹的**完整路径中不包含任何中文、空格或特殊字符**。

### 2.2 `git clone` 神威

现在，我们在这个“基地”里执行代码下载命令。

*   在终端中，粘贴并执行以下命令：
    ```bash
    git clone https://github.com/MoFox-Studio/MoFox-Core.git
    ```

> **🌐 网络小贴士**:
> 如果你发现下载速度极慢或连接失败，这通常是由于网络问题。可以尝试使用以下备用镜像地址：
> ```bash
> # 备用地址1
> git clone https://kgithub.com/MoFox-Studio/MoFox-Core.git
> # 备用地址2
> git clone https://xget.xi-xu.me/gh/MoFox-Studio/MoFox-Core.git
> ```

执行命令后，Git 会开始下载项目文件。当克隆完成后，你的 `MoFox-Core_Deployment` 文件夹里会多出一个名为 `MoFox-Core` 的新文件夹。恭喜，你已经成功获取了机器人的“素体”！

## 第三章：激活环境——注入灵魂

我们已经有了机器人的“素体”（项目代码），现在需要为它创建一个纯净的生存空间，并注入“灵魂”——安装所有必需的程序库。

### 3.1 虚拟环境：干净又卫生

在安装程序库之前，我们要先创建一个“虚拟环境”。你可以把它想象成一个**专属工具箱**，所有 MoFox-Core 需要的工具（程序库）都放在这个箱子里，以避免和你系统中的其他 Python 程序产生冲突。

### 3.2 `uv` 的魔法时刻

接下来，我们将使用 `uv` 这个神器来完成环境的创建和激活。

1.  **进入项目目录**:
    *   首先，确保你的终端路径在 `MoFox-Core_Deployment` 文件夹下。
    *   我们需要进入刚刚克隆下来的 `MoFox-Core` 文件夹。执行以下命令：
        ```bash
        cd MoFox-Core
        ```

2.  **创建虚拟环境**:
    *   执行以下命令来创建工具箱：
        ```bash
        uv venv
        ```
    *   命令执行后，你会发现 `MoFox-Core` 文件夹里多出了一个名为 `.venv` 的新文件夹。这就是我们的“专属工具箱”。

3.  **激活虚拟环境 (核心步骤)**:
    *   光有工具箱还不行，我们得把它“打开”，这个动作就叫做“激活”。
    *   执行以下命令来激活环境：
        ```bash
        source .venv/bin/activate
        ```
    *   **观察变化！** 成功激活后，你会看到命令行提示符的最前面，多出了一个 `(.venv)` 的标记。这表示你已经成功进入了 MoFox-Core 的专属环境。

> **⚠️ 重要提示**:
> 之后所有的安装、运行操作，都**必须**在这个带有 `(.venv)` 标记的命令行窗口中进行。如果某天你关闭了窗口，下次想继续操作时，需要重新进入项目文件夹并执行 `source .venv/bin/activate` 命令来激活环境。

### 3.3 依赖安装：一行代码搞定

环境激活好了，现在我们可以开始安装 MoFox-Core 所需的所有程序库了。项目文件夹里的 `requirements.txt` 文件，就是一张详细的“购物清单”。

*   在**已激活虚拟环境**的命令行窗口中，执行以下命令：

    ```bash
    uv pip install -r requirements.txt -i https://mirrors.aliyun.com/pypi/simple
    ```

*   **命令解析**:
    *   `uv pip install`: 使用 uv 来安装包。
    *   `-r requirements.txt`: `-r` 表示 read，即读取“购物清单”文件。
    *   `-i https://...`: `-i` 表示 index，即指定从哪个“商店”下载。这里我们使用了阿里云的镜像源，可以极大地提高国内用户的下载速度。

命令执行后，请耐心等待，直到它全部完成。

> **💡 依赖安装失败怎么办？**
> 如果安装过程中出现大量红色错误，通常是网络问题或缺少系统级依赖。可以尝试重新执行一遍安装命令，或检查错误日志寻找线索。

至此，机器人的“灵魂”已经注入完毕。

## 第四章：核心配置——让机器人“认识”你

环境和依赖都已就绪，现在到了最激动人心的环节——通过修改配置文件，赋予机器人身份和智慧。

> **🔧 编辑器推荐**:
> 建议使用终端内的文本编辑器如 `nano` 或 `vim`，或者图形化的代码编辑器如 **VS Code** 来修改配置文件。

在本章，我们只修改三个最核心的文件，以保证机器人能顺利启动并响应。所有配置文件都可以在 `MoFox-Core` 文件夹内的 `template` 文件夹中找到模板。

### 4.1 `.env` 文件：最初的约定

这个文件负责最基础的环境变量设置。

1.  **复制与重命名**:
    *   在 `MoFox-Core` 文件夹的根目录下，执行以下命令：
        ```bash
        cp template/template.env .env
        ```

2.  **修改内容**:
    *   用编辑器打开 `.env` 文件 (例如: `nano .env`)。
    *   找到 `EULA_CONFIRMED=false` 这一行，将 `false` 修改为 `true`。这代表你同意并遵守项目的用户许可协议。
        ```
        EULA_CONFIRMED=true
        ```
    *   文件中的 `HOST` 和 `PORT` 选项通常保持默认 (`127.0.0.1` 和 `8000`) 即可，暂时无需修改。

### 4.2 `bot_config.toml`：机器人的“身份证”

这个文件定义了机器人的基本身份信息和主人。

1.  **创建文件夹**:
    *   执行以下命令：
        ```bash
        mkdir config
        ```

2.  **复制与重命名**:
    *   执行以下命令：
        ```bash
        cp template/bot_config_template.toml config/bot_config.toml
        ```

3.  **修改内容 (至少修改以下两项)**:
    *   用编辑器打开 `config/bot_config.toml` 文件。
    *   **机器人 QQ 号**: 找到 `[bot]` 配置节下的 `qq_account`，将其值修改为你准备用于运行机器人的 QQ 号。
        ```toml
        [bot]
        platform = "qq"
        qq_account = 123456789 # <--- 修改这里
        ```
    *   **主人 QQ 号**: 找到 `[permission]` 配置节下的 `master_users`，将其配置为你的 QQ 号。
        > **⚠️ 格式注意**: 请严格按照 `[["platform", "user_id"]]` 的格式填写，注意**双层方括号**和**英文引号**。
        ```toml
        [permission]
        master_users = [["qq", "987654321"]] # <--- 修改这里的QQ号
        ```

### 4.3 `model_config.toml`：机器人的“大脑”

这个文件用于配置机器人使用的大语言模型（LLM），是机器人能否思考和回答问题的关键。

1.  **复制与重命名**:
    *   执行以下命令：
        ```bash
        cp template/model_config_template.toml config/model_config.toml
        ```

2.  **进行配置 (关键步骤)**:
    *   为了让机器人能够开口说话，你必须至少配置一个可用的大语言模型服务。
    *   我们已经为您准备了一份专门的快速上手指南，请**点击并参照以下链接**完成模型配置：
        *   **[模型配置快速上手指南](./quick_start_model_config.md)**
    *   对于初次部署的用户，**只需完成上述快速上手指南中的步骤即可**。

## 第五章：连接世界——内置适配器插件配置

现在，机器人的“身份证”和“大脑”都有了，我们需要为它接上“神经”，让它能够连接到 QQ 平台。这一步，我们通过配置官方内置的 **Napcat 适配器插件**来完成。

### 5.1 生成插件配置文件

MoFox-Core 会在第一次启动时，自动为所有内置插件创建默认的配置文件。

1.  **首次启动**:
    *   确保你的命令行终端**已激活虚拟环境** (前面带有 `(.venv)` 标记)。
    *   确保你当前的目录是 `MoFox-Core` 文件夹。
    *   执行以下命令，来启动一次 MoFox-Core：
        ```bash
        uv run python bot.py
        ```
    *   程序启动后，你会看到大量的日志信息。当日志滚动停止，并且没有新的信息出现时，说明程序已经完成了初始化工作。

    > **💡 第一次启动就失败了怎么办？**
    > 如果程序在启动过程中直接报错并退出了，**99% 的可能性是第四章的核心配置有误**。请回头仔细检查。

2.  **生成配置并关闭**:
    *   当程序稳定运行后，这次启动的目的就已经达成。现在，请在命令行窗口中，按下 `Ctrl + C` 来关闭程序。

### 5.2 启用并配置插件

经过上一步，所有内置插件的默认配置文件都已经被自动创建好了。

1.  **找到配置文件**:
    *   配置文件位于 `config/plugin_config/napcat_adapter_plugin/config.toml`。

2.  **启用插件 (第一步)**:
    *   用编辑器打开该文件，找到 `[plugin]` 配置节，将 `enabled` 的值从 `false` 修改为 `true`。
        ```toml
        [plugin]
        enabled = true # < 修改这里
        ```

3.  **配置 Napcat 连接 (核心)**:
    *   找到 `[napcat_server]` 配置节。
    *   确认 `port` 的值（默认为 `8095`）与你在 **Napcat QQ 客户端**的 `OneBot v11` 设置中，添加的**反向 WebSocket** 地址中的端口号**完全一致**。
    *   如果不一致，请修改此处的 `port` 值。

    > **示例**: 如果你在 Napcat 客户端中设置的 URL 是 `ws://127.0.0.1:12345`，那么这里的 `port` 就应该修改为 `12345`。

4.  **检查内部服务连接**:
    *   找到 `[maibot_server]` 配置节。
    *   确认 `port` 的值（默认为 `8000`）与你在 `MoFox-Core` 根目录下的 `.env` 文件中设置的 `PORT` 值一致。通常无需修改。

## 第六章：启动！——见证奇迹的时刻

所有准备工作和配置都已完成，现在，是时候唤醒你的机器人了！

### 6.1 启动顺序

1.  **第一步：启动并登录 Napcat QQ**
    *   打开你已经安装好的 Napcat QQ 客户端，并确保机器人 QQ 账号**成功登录**。

2.  **第二步：运行 MoFox-Core**
    *   回到你的命令行终端窗口。
    *   **检查两件事**:
        1.  确认命令行提示符最左边有 `(.venv)` 标记。
        2.  确认当前路径在 `MoFox-Core` 文件夹内。
    *   执行最终的启动命令：
        ```bash
        uv run python bot.py
        ```

> **⚠️ 重要提示**:
> 这个命令行窗口就是机器人的“生命维持系统”。**请不要关闭它**，可以新开一个终端窗口进行其他操作。

### 6.2 观察日志，判断成功

当你在日志中看到类似以下几条关键信息时，就代表你的机器人已经成功启动并连接到了 QQ 平台：

```log
10-17 19:58:31 [Napcat 适配器] 启动消息重组器...
10-17 19:58:31 [Napcat 适配器] 开始启动Napcat Adapter
10-17 19:58:31 [Napcat 适配器] 正在启动 adapter，连接模式: reverse
10-17 19:58:31 [Napcat 适配器] 正在启动反向连接模式，监听地址: ws://localhost:8095
10-17 19:58:31 [Napcat 适配器] 消息处理器已启动
10-17 19:58:31 [主程序] 初始化完成，神经元放电1889次
10-17 19:58:31 [主程序]
全部系统初始化完成，{bot_name}已成功唤醒
=========================================================
MoFox-Core(第三方修改版)
全部组件已成功启动!
=========================================================
🌐 项目地址: https://github.com/MoFox-Studio/MoFox-Core
🏠 官方项目: https://github.com/MaiM-with-u/MaiBot
=========================================================
这是基于原版MMC的社区改版，包含增强功能和优化(同时也有更多的'特性')
=========================================================
小贴士:温馨提示：请不要在代码中留下任何魔法数字，除非你知道它的含义。

10-17 19:58:31 [lpmm] LPMM知识库已禁用，跳过初始化
10-17 19:58:31 [主程序] 多年以后，面对AI行刑队，张三将会回想起他2023年在会议上讨论人工智能的那个下午
10-17 19:58:31 [主程序] 麦麦机器人启动完成，开始运行主任务...
10-17 19:58:31 [主程序] 程序执行完成，按 Ctrl+C 退出...
2025-10-17 19:58:31,252 - maim_message - INFO - {'logger_name': 'maim_message', 'event': '使用外部FastAPI应用，仅注册WebSocket路由', 'level': 'info', 'timestamp': '10-17 19:58:31', 'color': '\x1b[38;5;140m'}
10-17 19:58:33 [Server] 将在 127.0.0.1:8000 上启动服务器
10-17 19:58:33 [Napcat 适配器] 反向连接服务器已启动，监听地址: ws://localhost:8095
10-17 19:58:36 [Napcat 适配器] 尝试连接MoFox-Bot (第1次)
2025-10-17 19:58:36,240 - maim_message - INFO - {'logger_name': 'maim_message', 'event': '正在连接到 ws://127.0.0.1:3001/ws', 'level': 'info', 'timestamp': '10-17 19:58:36', 'color': '\x1b[38;5;140m'}
2025-10-17 19:58:36,243 - maim_message - INFO - {'logger_name': 'maim_message', 'event': '平台 qq WebSocket已连接', 'level': 'info', 'timestamp': '10-17 19:58:36', 'color': '\x1b[38;5;140m'}
2025-10-17 19:58:36,244 - maim_message - INFO - {'logger_name': 'maim_message', 'event': '已成功连接到 ws://127.0.0.1:3001/ws', 'level': 'info', 'timestamp': '10-17 19:58:36', 'color': '\x1b[38;5;140m'}
10-17 19:58:46 [Napcat 适配器] Napcat 客户端已连接: ('127.0.0.1', 38207)
10-17 19:58:46 [Napcat 适配器] Bot xxxxxxx(botQQ号) 连接成功
```

### 6.3 测试机器人

现在，打开你的 QQ，向你的机器人账号发送一条消息。如果它回复了你，那么……

**恭喜你，部署成功！**

## 第七章：故障排除

<details>
<summary><b>Q1: 启动成功，但日志里迟迟没有 `Napcat client connected` 信息？</b></summary>

这通常意味着 MoFox-Core 和 Napcat QQ 客户端之间的“神经”没有接上。请按以下步骤排查：

1.  **检查 Napcat QQ**: 确保 Napcat QQ 客户端本身已成功登录并处于在线状态。
2.  **检查端口号**: 这是最常见的原因。请再次核对 `config/plugin_config/napcat_adapter_plugin/config.toml` 文件中 `[napcat_server]` 下的 `port` 值，是否与你 Napcat QQ 客户端里设置的**反向 WebSocket 端口**完全一致。
3.  **检查防火墙**: 确保防火墙或安全组没有阻止相应的端口。
4.  **检查 IP 地址**: 确保 `config.toml` 中的 `host` (`localhost`) 和 Napcat 中的 IP (`127.0.0.1`) 是匹配的。

</details>

<details>
<summary><b>Q2: 机器人成功连接，但在 QQ 里不回复？</b></summary>

这通常是配置问题或模型服务问题。

1.  **检查模型配置**: 确认 `config/model_config.toml` 里的 API Key 是**有效且可用**的。
2.  **检查白名单**: 检查 `config/plugin_config/napcat_adapter_plugin/config.toml` 文件中 `[features]` 部分的 `group_list` 和 `private_list`。如果你开启了白名单，请确保你测试的群聊或私聊已经被加了进去。
3.  **查看日志**: 观察机器人后台的命令行窗口。当你给机器人发消息时，看看日志是否刷新，是否有 `ERROR` 级别的红色错误信息。

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

*   请在命令行窗口中，按下 `Ctrl + C` 关闭机器人。
*   待程序完全退出后，再重新执行 `uv run python bot.py` 命令来启动机器人。

</details>

## 结语：你的冒险才刚刚开始

至此，你已经成功走完了 MoFox-Core 的部署全程。但这仅仅是一个开始。MoFox-Core 的真正魅力，在于其强大的可塑性和扩展性。你可以像搭乐高一样，通过调整配置文件，来塑造它的性格、学习它的表达、开启或关闭它的各项功能。

祝你玩得开心！