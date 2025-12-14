

# MoFox_Bot Android 部署指南 (内置适配器版)
# 概述 
本教程适合零基础小白（当然，会比一键包麻烦很多，但是脱离电脑部署，对家里没有电脑的朋友非常友好）
# 第一章：准备工作——在手机上开辟新天地
在正式开始部署之前，我们需要先在你的安卓设备上搭建好一个功能完备的 Linux 环境。
# 1.1 系统要求

- Android 版本: >= 7.0

一般在手机设置里面我的设备或我的手机中可以找到，如果没找到也没有关系除了上古设备以外现在市面上你能买到的二手手机也几乎都用着安卓7.0以上的系统。

- 芯片架构: AArch64 (目前主流手机均满足)
- 存储空间: 至少 8GB 可用空间
- 运行内存：最低 6GB 推荐12GB

买手机时的存储配置比如说8+256这里加号前面的数字代表运行内存，加号后面的代表存储空间。

# 1.2Termux 环境 -> Ubuntu 虚拟机

我们需要借助 Termux 这个强大的终端模拟器，并在其中安装一个 Ubuntu 系统，来为 MoFox_Bot 提供一个稳定、完整的运行环境。

### 1.安装 ZeroTermux:
- 可以前往<a data-v-10225364="" class="VPNolebaseInlinePreviewLink" relative="" href="https://github.com/hanxinhao000/ZeroTermux/releases/tag/release" target="_blank" rel="noreferrer">ZeroTermux Github Releases</a>下载安装包。
- 我个人测试下来换源没什么用建议使用流量部署，部署完在用wifi，全程大概消耗1.5G流量。

### 2.安装 proot 和 Ubuntu:
- 在 ZeroTermux 中，逐行执行以下命令来安装 proot 和 Ubuntu 环境。
```
pkg install proot-distro      # 安装 proot
proot-distro install ubuntu   # 安装 Ubuntu
```
### 3.登录 Ubuntu:
- 安装完成后，执行以下命令登录到 Ubuntu 环境：
```
proot-distro login ubuntu
```
- 成功登录后，你将处于 Ubuntu 的 shell 环境中。后续的所有命令行操作，都将在这个 Ubuntu 环境中进行。成功登录后，你将处于 Ubuntu 的 shell 环境中。后续的所有命令行操作，都将在这个 Ubuntu 环境中进行。

# 1.3 软件三件套：Python、Git 与 uv
### 1.安装基础软件包:
- 在 Ubuntu 环境中，首先更新包列表并安装核心工具：
```
apt update
apt install sudo git curl python3 python3-pip python3-venv build-essential screen
```


### 2.安装 uv (推荐的 Python 包管理器):
- uv 是一个速度极快的 Python 包管理器，我们强烈推荐使用它来管理项目依赖。
```
pip3 install uv --break-system-packages -i https://repo.huaweicloud.com/repository/pypi/simple
```
- 为了让系统能找到 uv 命令，需要将它所在的路径添加到环境变量中。执行以下命令：

```
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```
### 3.验证
- 输入以下命令并回车：
```
python3 --version
```
- 如果屏幕上显示出 Python 版本号（如 Python 3.13.6），则证明安装成功。
- 输入以下命令并回车：
```
git --version
```
- 如果显示出 Git 的版本号（如 git version 2.34.1），则证明安装成功。
- 输入以下命令并回车：
```
uv --version
```
- 如果显示出 uv 的版本号，则证明安装成功。

# 1.4 Napcat QQ 

Napcat QQ 是一个 QQ 客户端，也是 MoFox_Bot 与 QQ 平台沟通的桥梁。

```
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

```
cd ~
mkdir MoFox_Bot_Deployment
cd MoFox_Bot_Deployment
```
- ⚠️ 重要提示: 为了避免未来可能出现的奇怪问题，请确保文件夹的完整路径中不包含任何中文、空格或特殊字符。
### 2.git clone 神威:

- 在终端中，粘贴并执行以下命令：
```
git clone https://github.com/MoFox-Studio/MoFox-Core.git
```
# 第三章：激活环境——注入灵魂
我们已经有了机器人的“素体”（项目代码），现在需要为它创建一个纯净的生存空间（虚拟环境），并注入“灵魂”（安装所有必需的程序库）。
### 1.进入项目目录:
- 输入并回车喵~
```
cd MoFox_Core
```
### 2.创建并激活虚拟环境:
- 我们将使用 uv 来完成环境的创建和激活。
```
# 创建虚拟环境
uv venv
# 激活虚拟环境 (核心步骤)
source .venv/bin/activate
```
- 观察变化！ 成功激活后，你会看到命令行提示符的最前面，多出了一个 (MoFox_Core) 的标记。这表示你已经成功进入了 MoFox_Bot 的专属环境。
- ⚠️ 重要提示: 之后所有的安装、运行操作，都必须在这个带有 (MoFox_Core) 标记的命令行窗口中进行。
### 3.依赖安装：一行代码搞定:
- 在已激活虚拟环境的命令行窗口中，执行以下命令：
```
uv pip install -r requirements.txt -i https://mirrors.aliyun.com/pypi/simple
```
- 请耐心等待，直到它全部完成。
- 好了看到那个犹如高考导数大题一样令人恶心的报错了吗？
- 输入以下内容并回车
```
# 方法A：使用环境变量
export UV_LINK_MODE=copy
uv pip install py-key-value-aio==0.2.8

# 方法B：直接使用参数
uv pip install --link-mode copy py-key-value-aio==0.2.8
# DeepSeek真是太好用了，解决报错？轻而易举！
```
# 第四章：核心配置——让机器人“认识”你

环境和依赖都已就绪，现在到了最激动人心的环节——通过修改配置文件，赋予机器人身份和智慧。

# 4.1.env 文件：最初的约定
这个文件负责最基础的环境变量设置。
### 1.复制与重命名:
- 在 MoFox_Bot 文件夹的根目录下，执行以下命令：
```
cp template/template.env .env
```
### 2.修改内容:

- 用编辑器打开 .env 文件 
```
nano .env
```
- 找到 EULA_CONFIRMED=false 这一行，将 false 修改为 true。这代表你同意并遵守项目的用户许可协议。（使用右下角键盘左上角的4个箭头控制光标移动，并保证光标在false后而不是在e上面，相信我零基础的人需要这句话，这里建议切换英文输入。）
```
EULA_CONFIRMED=true
```
- 点击第一行第三个摁键 CTRL 在点击键盘上面的x y 在点击回车即可保存文件。
- 文件中的 HOST 和 PORT 选项通常保持默认 (127.0.0.1 和 8000) 即可，暂时无需修改。
# 4.2 bot_config.toml：机器人的“身份证”
### 1.创建文件夹:
- 执行以下命令喵~
```
mkdir config
```
### 2。复制与重命名:
- 执行以下命令：
```
cp template/bot_config_template.toml config/bot_config.toml
```
### 3.修改内容 (至少修改以下两项):
- 用编辑器打开 config/bot_config.toml 文件。（已经教过一次了喵~再不会我要哈气了！）
- 机器人 QQ 号: 找到 [bot] 配置节下的 qq_account，将其值修改为你准备用于运行机器人的 QQ 号。
```
[bot]
platform = "qq"
qq_account = 123456789 # <--- 修改这里
```
-  主人 QQ 号: 找到 [permission] 配置节下的 master_users，将其配置为你的 QQ 号。
```
[permission]
master_users = [["qq", "987654321"]] # <--- 修改这里的QQ号
```
# 4.3 model_config.toml：机器人的“大脑”

 这个文件用于配置机器人使用的大语言模型（LLM），是机器人能否思考和回答问题的关键。
- 执行以下命令：
```
cp template/model_config_template.toml config/model_config.toml
```
- 我们已经为您准备了一份专门的快速上手指南，请点击并参照以下链接完成模型配置：[模型配置快速上手指南](/quick_start_model_config.md)

- 对于初次部署的用户，只需完成上述快速上手指南中的步骤即可。
# 第五章：连接世界——内置适配器插件配置
现在，机器人的“身份证”和“大脑”都有了，我们需要为它接上“神经”，让它能够连接到 QQ 平台。这一步，我们通过配置官方内置的 Napcat 适配器插件来完成。
# 5.1 生成插件配置文件

MoFox_Bot 会在第一次启动时，自动为所有内置插件创建默认的配置文件。
- 执行以下命令，来启动一次 MoFox_Bot：
```
uv run python bot.py
```
- 程序启动后，你会看到大量的日志信息。当日志滚动停止，并且没有新的信息出现时，说明程序已经完成了初始化工作。
- 当程序稳定运行后，这次启动的目的就已经达成。现在，请在命令行窗口中，按下 Ctrl + C 来关闭程序。

# 5.2 启用并配置插件
### 1.找到配置文件:
- 配置文件位于 config/plugis/napcat_adapter/config.toml。
- 用编辑器打开该文件，找到 [plugin] 配置节，将 enabled 的值从 false 修改为 true
```
[plugin]
enabled = true # < 修改这里
```
- 找到 [napcat_server] 配置节。
- 确认 port 的值（默认为 8095）这将与你在 Napcat QQ 的设置中所需要填写的端口号相同

# 第六章：启动！——见证奇迹的时刻
所有准备工作和配置都已完成，现在，是时候唤醒你的机器人了！
### 1.第一步：启动并登录 Napcat QQ
- 执行以下内容
```
xvfb-run -a /root/Napcat/opt/QQ/qq --no-sandbox
```
- - 你可以在这个目录找到Web Ui的登陆token/root/Napcat/opt/QQ/resources/app/app_launcher/napcat/config/webui.json  摁音量上键-查看IP-浏览器输入ip:6099（建议使用平板或电脑连接手机热点之后进入）-输入token-扫码登陆-右侧网络配置-新建-Websocket客户端-随便取一个名字-改url ws://localhost:8082（最后4个数字替换成自己设置的端口号）-保存
### 2.第二步：运行 MoFox_Bot
- 回到你的命令行终端窗口。
- 检查两件事
  - 确认命令行提示符最左边有 (MoFox_Core) 标记。
  - 确认当前路径在 MoFox_Core 文件夹内。
- 执行最终的启动命令：
```
uv run python bot.py
```
# 6.2 观察日志，判断成功

当你在日志中看到类似以下几条关键信息时，就代表你的机器人已经成功启动并连接到了 QQ 平台：


```
10-17 19:58:31 [Napcat 适配器] 启动消息重组器...
10-17 19:58:31 [Napcat 适配器] 开始启动Napcat Adapter
10-17 19:58:31 [Napcat 适配器] 正在启动 adapter，连接模式: reverse
10-17 19:58:31 [Napcat 适配器] 正在启动反向连接模式，监听地址: ws://localhost:8095
10-17 19:58:31 [Napcat 适配器] 消息处理器已启动
10-17 19:58:31 [主程序] 初始化完成，神经元放电1889次
10-17 19:58:31 [主程序]
全部系统初始化完成，{bot_name}已成功唤醒
=========================================================
MoFox_Bot(第三方修改版)
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
# 6.3 测试机器人

现在，打开你的 QQ，向你的机器人账号发送一条消息。如果它回复了你，那么……

恭喜你，部署成功！
# 每次启动时要输的命令
```
# 1. 登录 Ubuntu 环境
proot-distro login ubuntu
# 2. 启动napcat
xvfb-run -a /root/Napcat/opt/QQ/qq --no-sandbox
# 3. 进入 MoFox_Bot 项目目录
cd ~/MoFox_Bot_Deployment/MoFox_Core
# 4. 激活虚拟环境
source .venv/bin/activate
# 5. 启动 MoFox_Bot (在 screen 会话中)
screen -dmS mofox bash -c "uv run python bot.py; exec bash"
```
# 结语：你的冒险才刚刚开始
至此，你已经成功走完了 MoFox_Bot 的部署全程。但这仅仅是一个开始。MoFox_Bot 的真正魅力，在于其强大的可塑性和扩展性。你可以像搭乐高一样，通过调整配置文件，来塑造它的性格、学习它的表达、开启或关闭它的各项功能。

（ps：作为一个高三学生，寻思在armbian或者手机这种不会被家长找茬的低功耗设备中部署，却发现教程一堆错误，而且napcat使用起来也是各种不会，故重写这个教程。）