

# Neo-MoFox Android 部署指南 (内置适配器版)
# 概述 
本教程适合零基础小白（当然，会比一键包麻烦很多，但是脱离电脑部署，对家里没有电脑的朋友非常友好）
# 第一章：准备工作
在正式开始部署之前，我们需要先在你的安卓设备上搭建好一个功能完备的 Linux 环境。
# 1.1 系统要求

- Android 版本: >= 7.0

一般在手机设置里面我的设备或我的手机中可以找到，如果没找到也没有关系，除了上古设备以外现在市面上你能买到的二手手机也几乎都用着安卓7.0以上的系统。

- 芯片架构: AArch64 (目前主流手机均满足)
- 存储空间: 至少 8GB 可用空间
- 运行内存：最低 6GB 推荐12GB

买手机时的存储配置比如说8+256这里加号前面的数字代表运行内存，加号后面的代表存储空间。

# 1.2Termux 环境 -> Ubuntu 虚拟机

我们需要借助 Termux 这个强大的终端模拟器，并在其中安装一个 Ubuntu 系统，来为 Neo-MoFox 提供一个稳定、完整的运行环境。

### 1.安装 ZeroTermux:
- 可以前往[ZeroTermux的github](https://github.com/hanxinhao000/ZeroTermux/releases/tag/release)下载安装包。
- 我个人测试下来换源没什么用建议使用流量部署，部署完在用wifi，全程大概消耗1.5G流量。

### 2.安装 proot 和 Ubuntu:
- 在 ZeroTermux 中，逐行执行以下命令来安装 proot 和 Ubuntu 环境。
```bash
pkg install proot-distro      # 安装 proot
proot-distro install ubuntu   # 安装 Ubuntu
```
### 3.登录 Ubuntu:
- 安装完成后，执行以下命令登录到 Ubuntu 环境：
```bash
proot-distro login ubuntu
```
- 成功登录后，你将处于 Ubuntu 的 shell 环境中。后续的所有命令行操作，都将在这个 Ubuntu 环境中进行。成功登录后，你将处于 Ubuntu 的 shell 环境中。后续的所有命令行操作，都将在这个 Ubuntu 环境中进行。

# 1.3 软件三件套：Python、Git 与 uv
### 1.安装基础软件包:
- 在 Ubuntu 环境中，首先更新包列表并安装核心工具：
```bash
apt update
apt install sudo git curl python3 python3-pip python3-venv build-essential screen
```


### 2.安装 uv (推荐的 Python 包管理器):
- uv 是一个速度极快的 Python 包管理器，我们强烈推荐使用它来管理项目依赖。
```bash
pip3 install uv --break-system-packages -i https://repo.huaweicloud.com/repository/pypi/simple
```
- 为了让系统能找到 uv 命令，需要将它所在的路径添加到环境变量中。执行以下命令：

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```
### 3.验证
- 输入以下命令并回车：
```bash
python3 --version
```
- 如果屏幕上显示出 Python 版本号（如 Python 3.13.6），则证明安装成功。
- 输入以下命令并回车：
```bash
git --version
```
- 如果显示出 Git 的版本号（如 git version 2.34.1），则证明安装成功。
- 输入以下命令并回车：
```bash
uv --version
```
- 如果显示出 uv 的版本号，则证明安装成功。

# 1.4 Napcat QQ 

Napcat QQ 是一个 QQ 客户端，也是 Neo-MoFox 与 QQ 平台沟通的桥梁。

```bash
curl -o \
napcat.sh \
https://nclatest.znin.net/NapNeko/NapCat-Installer/main/script/install.sh \
&& sudo bash napcat.sh \
--docker n \
--cli y
```

# 第二章：获取核心——请君入瓮
### 1.创建并进入文件夹:
- 在 Ubuntu 终端中，执行以下命令，这会在你的用户主目录下创建一个名为 MoFox_Bot_Deployment 的文件夹，并进入该目录。

```bash
cd ~
mkdir Neo-MoFox_Deployment
cd Neo-MoFox_Deployment
```
- ⚠️ 重要提示: 为了避免未来可能出现的奇怪问题，请确保文件夹的完整路径中不包含任何中文、空格或特殊字符。
### 2.git clone 神威:

- 在终端中，粘贴并执行以下命令：
```bash
git clone https://github.com/MoFox-Studio/Neo-MoFox.git
```
# 第三章：激活环境——注入灵魂
我们已经有了机器人的“素体”（项目代码），现在需要为它创建一个纯净的生存空间（虚拟环境），并注入“灵魂”（安装所有必需的程序库）。
### 1.进入项目目录:
- 输入并回车喵~
```bash
cd Neo-MoFox
```
### 2.创建并激活虚拟环境:
- 我们将使用 uv 来完成环境的创建和激活。
```bash
# 创建虚拟环境
uv venv
# 激活虚拟环境 (核心步骤)
source .venv/bin/activate
```

- 观察变化！ 成功激活后，你会看到命令行提示符的最前面，多出了一个 (Neo-MoFox) 的标记。这表示你已经成功进入了 Neo-MoFox 的专属环境。
- ⚠️ 重要提示: 之后所有的安装、运行操作，都必须在这个带有 (Neo-MoFox) 标记的命令行窗口中进行。
### 3.依赖安装：一行代码搞定:
- 在已激活虚拟环境的命令行窗口中，执行以下命令：

```bash
uv sync
```

- 这个命令会自动读取项目中的依赖配置文件，并安装所有必需的 Python 库。整个过程可能需要几分钟时间，请耐心等待。
# 第四章：核心配置——让机器人“认识”你

环境和依赖都已就绪，现在到了最激动人心的环节——通过修改配置文件，赋予机器人身份和智慧。

在开始配置之前，我们需要先运行一次程序，让 Neo-MoFox 自动生成所有必需的配置文件。这是部署流程中的重要一步，因为配置文件需要程序首次运行时自动创建。

### 4.1 生成配置文件

Neo-MoFox 拥有强大的配置管理系统。在我们第一次启动程序时，它会创建默认的配置文件以供我们修改。

1.  **首次启动**:
    *   确保你的命令行终端**已激活虚拟环境** (前面带有 `(Neo-MoFox)` 标记)。
    *   确保你当前的目录是 `Neo-MoFox` 文件夹。
    *   执行以下命令，来启动一次 Neo-MoFox：
        ```bash
        uv run main.py
        ```
    *   程序启动后，你会看到大量的日志信息在屏幕上滚动。当日志滚动停止，并且没有新的信息出现时，说明程序已经完成了初始化工作，并且生成了所有的配置文件。

2.  **生成配置并关闭**:
    *   当你看到 `config` 文件夹被创建，这次启动的主要目的——生成配置文件——就已经达成了。如果程序还在运行，请在命令行窗口中，按下 `Ctrl + C` 来关闭程序。程序会进行"优雅关闭"，请稍等片刻直至其完全退出。

## 第五章：核心配置——让机器人"认识"你

现在配置文件已经生成，我们可以开始修改它们，赋予机器人身份和智慧。


在本章，我们只修改两个最核心的文件，以保证机器人能顺利启动并响应。

### 5.1 `core.toml`：机器人的"身份"

这个文件定义了机器人的基本身份信息和主人。

1.  **修改内容 (至少修改以下一项)**:
    *   用编辑器打开 `config/core.toml` 文件。
      ```bash
      nano config/core.toml
      ```
      :::tip
      - 点击第一行第三个摁键 CTRL 在点击键盘上面的x y 在点击回车即可保存文件。
      :::
    *   **主人 QQ 号**: 找到 `[permissions]` 配置节下的 `owner_list`，将其配置为你的 QQ 号。
        > **⚠️ 格式注意**: 请严格按照 `['platform:user_id', ...]` 的格式填写，注意**英文引号**。
        ```toml
        [permissions]
        # Bot所有者列表，格式：['platform:user_id', ...]
        # 值类型：list, 默认值：[]
        owner_list = []
        ```

### 5.2 `model.toml`：机器人的"大脑"

这个文件用于配置机器人使用的大语言模型（LLM），是机器人能否思考和回答问题的关键。

1.  **修改内容 (关键步骤)**:
    *   为了让机器人能够开口说话，你必须至少配置一个可用的大语言模型服务。
    *   我们已经为您准备了一份专门的快速上手指南，请**点击并参照以下链接**完成模型配置：
        *   **[模型配置快速上手指南](quick_start_model_config.md)**
    *   对于初次部署的用户，**只需完成上述快速上手指南中的步骤即可**。更详细和高级的模型配置方法，可以在机器人成功运行后，再参考 [模型配置进阶指南](model_configuration_guide.md).

## 第六章：连接世界——内置适配器插件配置

现在，机器人的“身份”和“大脑”都有了，但我们还需要让它能够连接到 QQ 平台，让它能够接收和发送消息，我们通过配置官方内置的 **Napcat 适配器插件**来完成。

### 6.1 启用并配置插件

经过第四章的首次启动，所有内置插件的默认配置文件都已经被自动创建好了。

1.  **找到配置文件**:
    *   现在，请打开 `Neo-MoFox/config/plugins/` 文件夹。你会发现里面出现了很多以插件名命名的文件夹。
    *   这说明 Neo-MoFox 的所有内置插件的配置文件都在这里生成了，方便你未来探索和开启更多功能。
    *   我们当前的目标是找到 `napcat_adapter` 文件夹，进入后用你的代码编辑器打开 `config.toml` 文件。

2.  **启用插件**:
    *   在打开的 `config.toml` 文件中，找到 `[plugin]` 配置节，将 `enabled` 的值从 `false` 修改为 `true`。这是启动适配器的总开关。
        ```toml
        [plugin]
        # 是否启用 Napcat 适配器
        # 值类型：bool, 默认值：true
        enabled = true # < 修改这里
        ```

### 6.2 配置连接参数

这是整个部署流程中关键的一步，目的是让 Neo-MoFox (服务端) 与 Napcat QQ (客户端) 能够互相通信。我们将分别配置两端，并确保它们的信息完全一致。

*   **第一部分：配置 Neo-MoFox 监听端口**
        *   找到 `[napcat_server]` 配置节的 `port` 小节，这里定义了 Neo-MoFox 将在哪个端口上“监听”来自 Napcat 客户端的连接请求。
        ```toml
        # Napcat WebSocket 服务器配置
        [napcat_server]
        # ws 连接模式: reverse/direct
        # 值类型：str, 默认值："reverse"
        mode = "reverse"

        # Napcat WebSocket 服务地址
        # 值类型：str, 默认值："localhost"
        host = "localhost"

        # Napcat WebSocket 服务端口
        # 值类型：int, 默认值：8095
        port = 8095
        ```
    *   **请记下这个 `port` 值 (默认为 `8095`)**。除非 `8095` 端口已被其他程序占用，否则我们推荐保持默认设置。如果需要修改，请确保选择一个未被占用的端口。

*   **第二部分：配置 Napcat 客户端连接地址**
    *   现在，回到 Napcat QQ 客户端，我们将告诉它去连接 Neo-MoFox 正在监听的端口。
    *   **步骤一：新建 Websocket 客户端**
        *   在 Napcat 客户端中，点击左侧菜单的"网络配置"。
        *   在右侧选择 `Websocket客户端` 标签页，然后点击"新建"按钮。

        ![点击新建 Websocket 客户端](/napcat_add_ws_client.png)

    *   **步骤二：填写反向 WebSocket 地址**
        *   在弹出的配置窗口中，将 `URL` 填写为 `ws://127.0.0.1:8095`。
        *   **核心要点**：此处的端口号 (`8095`) **必须**与你在**第一部分**中 Neo-MoFox 配置文件里看到的 `port` 值**完全一致**。如果两边不一致，通信将百分之百失败。
        *   填写完毕后，点击"保存"。

        ![配置反向 WebSocket](/napcat_ws_config.png)

# 第六章：启动！——见证奇迹的时刻
所有准备工作和配置都已完成，现在，是时候唤醒你的机器人了！
### 1.第一步：启动并登录 Napcat QQ
- 执行以下内容
```bash
xvfb-run -a /root/Napcat/opt/QQ/qq --no-sandbox
```
- - 你可以在这个目录找到Web Ui的登陆token/root/Napcat/opt/QQ/resources/app/app_launcher/napcat/config/webui.json  摁音量上键-查看IP-浏览器输入ip:6099（建议使用平板或电脑连接手机热点之后进入）-输入token-扫码登陆-右侧网络配置-新建-Websocket客户端-随便取一个名字-改url ws://localhost:8082（最后4个数字替换成自己设置的端口号）-保存

### 2.第二步：运行 Neo-MoFox
- 回到你的命令行终端窗口。
- 检查两件事
  - 确认命令行提示符最左边有 (Neo-MoFox) 标记。
  - 确认当前路径在 Neo-MoFox 文件夹内。
- 执行最终的启动命令：
```bash
uv run main.py
```
# 6.2 观察日志，判断成功

当你在日志中看到类似以下几条关键信息时，就代表你的机器人已经成功启动并连接到了 QQ 平台：


```log
[14:29:12] plugin_manager | INFO | 插件管理器初始化完成
[14:29:12] plugin_manager | INFO | ✅ 插件 'default_chatter' 的组件注册完成
[14:29:12] plugin_manager | INFO | ✅ 插件加载成功: default_chatter v1.0.0
  ✓ 已加载插件: default_chatter (#1)
[14:29:12] plugin_manager | INFO | ✅ 插件 'napcat_adapter' 的组件注册完成
[14:29:12] plugin_manager | INFO | ✅ 插件加载成功: napcat_adapter v2.0.0
  ✓ 已加载插件: napcat_adapter (#2)
[14:29:13] adapter_manager | INFO | 适配器启动成功: napcat_adapter:adapter:napcat_adapter
[14:29:13] adapter_manager | INFO | 适配器启动完成: 成功 1/1
[14:29:13] router_manager | INFO | 发现 1 个 Router，开始挂载...
[14:29:13] router_manager | INFO | Router 管理器初始化完成
[14:29:13] router_manager | INFO | 插件 default_chatter 的 Router 挂载完成: 0/0
[14:29:13] router_manager | INFO | 插件 napcat_adapter 的 Router 挂载完成: 0/0
[14:29:13] router_manager | INFO | 所有插件 Router 挂载完成: plugins=2, mounted_routers=0
[14:29:13] router_manager | INFO | ✅ 所有 Router 挂载完成
[14:29:13] event_manager | INFO | 开始构建事件订阅映射...
[14:29:13] event_manager | INFO | 事件管理器初始化完成
[14:29:13] event_manager | INFO | 订阅映射表构建完成，共处理 2 个 事件处理器
[14:29:13] event_manager | INFO | ✅ 事件订阅映射构建完成
[14:29:13] 流循环 | INFO | StreamLoopManager 已启动
[14:29:13] 消息分发 | INFO | StreamLoopManager 已随插件加载完成而启动
╭────────────────────────────────────────────────────── Success ───────────────────────────────────────────────────────╮
│  ✅ Bot 初始化成功，加载了 2 个插件                                                                                  │
╰──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯
[19:58:46] [Napcat 适配器] Napcat 客户端已连接: ('127.0.0.1', 38207)
[19:58:46] [Napcat 适配器] Bot xxxxxxx(botQQ号) 连接成功
```

> **💡 日志解读**:
> *   看到 `[19:58:46] [Napcat 适配器] Bot xxxxxxx(botQQ号) 连接成功` 是最关键的一步，它标志着机器人与 QQ 的“神经连接”已打通。

# 6.3 测试机器人

现在，打开你的 QQ，向你的机器人账号发送一条消息。如果它回复了你，那么……

恭喜你，部署成功！
:::tip 每次启动时要输的命令
```bash
# 1. 登录 Ubuntu 环境
proot-distro login ubuntu
# 2. 启动napcat
xvfb-run -a /root/Napcat/opt/QQ/qq --no-sandbox
# 3. 进入 Neo-MoFox 项目目录
cd ~/Neo-MoFox_Deployment/Neo-MoFox-Core
# 4. 激活虚拟环境
source .venv/bin/activate
# 5. 启动 Neo-MoFox (在 screen 会话中)
screen -dmS neomofox bash -c "uv run python bot.py; exec bash"
```
:::

# 结语：你的冒险才刚刚开始
至此，你已经成功走完了 Neo-MoFox 的部署全程。但这仅仅是一个开始。Neo-MoFox 的真正魅力，在于其强大的可塑性和扩展性。你可以像搭乐高一样，通过调整配置文件，来塑造它的性格、学习它的表达、开启或关闭它的各项功能。

（ps：作为一个高三学生，寻思在armbian或者手机这种不会被家长找茬的低功耗设备中部署，却发现教程一堆错误，而且napcat使用起来也是各种不会，故重写这个教程。）
