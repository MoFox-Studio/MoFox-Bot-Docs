# 手动命令行部署

这一章是「全流程一条龙」：假设你的电脑上什么都没装，我们从零开始，用命令行把 Neo-MoFox 完整跑起来。全程只需要三个动作——**打开[终端](/docs/guides/glossary#终端与命令行)、粘贴命令、按回车**，不用怕。

> 遇到看不懂的词？先去[名词小课堂](/docs/guides/glossary)查一查，大部分疑惑一句话就能解开。

## 这章你会做什么

整个过程拆开就是 6 步：

1. 装好三个基础工具：**Python**（运行 Neo-MoFox 用的编程语言环境）、**uv**（帮我们自动装依赖的工具）、**Git**（用来下载和更新代码的工具）。
2. 把 Neo-MoFox 的源码从 GitHub 下载到你的电脑上（这个动作叫「克隆仓库」）。
3. 第一次启动，阅读并同意用户协议。
4. 填好模型的 API Key，给机器人装上「大脑」。
5. 接入 QQ 协议端，给它装上「耳朵和嘴」。
6. 设置主人，让它认得谁是老板。

顺利的话 20～40 分钟搞定，其中大部分时间在等下载。

下面按系统准备了两份**完整流程**，用切换器选你的系统，选一次，整篇都会跟着切：

<MethodTabs dimension="os" :options="[{ value: 'windows', label: 'Windows', icon: 'mdi:microsoft-windows' }, { value: 'linux', label: 'Linux', icon: 'mdi:linux' }]">

<MethodTab value="windows">

**你的工具是 PowerShell**（开始菜单搜索「PowerShell」打开）。下文的命令都在 PowerShell 里执行。

## 第 1 步：安装基础工具（Python、uv、Git）

三个工具一次装齐。**Python** 是 Neo-MoFox 的运行环境（项目要求 **3.11 或更新版本**，写在源码 `pyproject.toml` 的 `requires-python = ">=3.11"` 里）；**[uv](/docs/guides/glossary#包管理器-uv)** 是「装机管家」，Neo-MoFox 需要的几十个第三方组件（也就是[依赖](/docs/guides/glossary#依赖)）由它照着清单自动装好；**Git** 负责下载和更新代码。

1. 装 **Python**：打开 [Python 官网下载页](https://www.python.org/downloads/)，下载最新的 Windows 安装包；也可以在**微软商店**里搜索「Python」直接安装。运行安装包时，第一屏**务必勾选「Add python.exe to PATH」**（把 Python 加入系统路径，否则命令行找不到它），然后点 Install Now。
2. 装 **uv**：打开 PowerShell，执行：
```powershell

irm https://astral.sh/uv/install.ps1 | iex   # 运行官方安装脚本，uv 会装到你的用户目录
```
3. 装 **Git**：打开 [Git 官网](https://git-scm.com/downloads)，下载 Windows 版安装包，双击安装，一路点 Next 用默认设置即可。
4. **关掉当前 PowerShell，重新开一个**（让系统认识新装的命令），然后逐条验证：
```powershell

python --version   # 应显示 Python 3.11 或更高（3.12、3.13 都行）
uv --version       # 应打印 uv 的版本号
git --version      # 应打印 git 的版本号
```

::: tip Python 这步可以偷懒
Neo-MoFox 用 uv 管理运行环境，uv 发现没有合适的 Python 时，会**自动下载一个**。所以就算不装 Python，第 3 步也能正常启动。不过自己装一份更踏实，以后跑别的 Python 小工具也方便。
:::

::: warning 国内网络提示
安装 uv 的脚本从国外服务器下载，慢的话换个时间段再试。好消息是：**装依赖这一步不用愁**——Neo-MoFox 项目里已经默认配置了华为云 PyPI 镜像（写在 `pyproject.toml` 的 `[[tool.uv.index]]` 里），下载依赖会自动走国内线路，通常很快。
:::

## 第 2 步：下载 Neo-MoFox（克隆仓库）

选个你喜欢的位置存放项目：
```powershell

cd D:\            # 示例：进入 D 盘根目录，也可以换成任何你喜欢的文件夹
```

然后克隆官方仓库：
```bash

git clone https://github.com/MoFox-Studio/Neo-MoFox.git   # 把官方仓库完整下载到当前目录，会生成 Neo-MoFox 文件夹
cd Neo-MoFox                                              # 进入项目目录——之后的命令都要在这个目录里执行
```

::: details 克隆很慢或失败怎么办？
GitHub 在国内访问时快时慢，可以：

1. 换个时间段重试，或挂上你自己的网络代理；
2. 使用你**信任**的 GitHub 加速镜像：在仓库地址前拼上镜像前缀，例如
   `git clone https://<镜像前缀>/https://github.com/MoFox-Studio/Neo-MoFox.git`。
   镜像站不是官方维护的，注意甄别安全。

<!-- VERIFY: 官方是否提供 Gitee 镜像或其他官方加速渠道？目前仅确认官方地址 https://github.com/MoFox-Studio/Neo-MoFox（与仓库 .git/config 中 origin 一致），如有官方镜像应在此补充。 -->
:::

::: tip 实在不想装 Git？
也可以在 GitHub 仓库页面点绿色「Code」按钮 →「Download ZIP」下载压缩包解压。但以后更新就得每次重新下载整个 ZIP；用 Git 的话，见下文[「以后怎么更新」](#以后怎么更新)，一条命令搞定。推荐还是装上。
:::

## 第 3 步：第一次启动

第一次启动时，uv 会自动做两件事：创建一个叫 `.venv` 的虚拟环境（一个隔离的「工具箱」文件夹，把本项目要用的依赖都装在里面，不污染系统），然后按照清单把依赖下载齐全（走华为云镜像，一般几分钟）。之后就不用再等了。

最省事的启动方式：在文件管理器里打开 Neo-MoFox 文件夹，**直接双击 `start.bat`**——它里面其实只有一行命令：`uv run main.py`。

喜欢用命令行的话，效果一样：
```powershell

cd D:\Neo-MoFox      # 换成你的实际项目路径
uv run main.py       # 启动 Neo-MoFox
```

::: warning 双击 start.bat 一闪就没了？
多半是 uv 没装好，或者装完 uv 后没重开过窗口。别慌——改用上面的命令行方式启动，报错信息会留在终端里，照着文末「常见问题」排查即可。
:::

### 阅读并同意用户协议

第一次启动（以及协议文本更新后的第一次），终端会先停下来让你确认两份文件。

**第一份是 EULA（最终用户许可协议）**：

1. 输入 `view` 可以在终端里查看协议全文；
2. 输入 `agree` 表示同意；
3. 输入 `decline` 表示拒绝——**拒绝 EULA 程序会直接退出**，无法继续。

（输中文「查看 / 同意 / 拒绝」也认。）

**第二份是云端遥测隐私协议**（问你是否允许程序发送匿名统计数据帮开发者改进）：

1. 输入 `agree`：打开本地和云端遥测；
2. 输入 `decline`：云端遥测保持关闭，**程序照常继续运行**，不影响使用。

你的选择会记录在 `data/system/agreements/` 文件夹里，之后启动不会再问。

![图片：终端中 Neo-MoFox 首次启动时的协议确认界面](/guide/manual/first-start-agreement.png)

::: warning 服务器/进阶用户：一键跳过协议确认
启动前在 PowerShell 里设置环境变量 `MOFOX_ACCEPT_STARTUP_AGREEMENTS=1`，程序会自动视为「已同意全部协议」。注意：只要**设置了这个变量**就会自动同意（与值是多少无关），并且**会同时自动打开云端遥测**，介意的话请走手动确认流程。
```powershell

$env:MOFOX_ACCEPT_STARTUP_AGREEMENTS = "1"   # 临时设置环境变量（仅当前窗口有效）
uv run main.py                               # 启动
```
:::

### 看到什么算成功

启动正常的话，你会按顺序看到：

1. 一个启动阶段面板：内核、配置、日志、数据库等逐项变成「已初始化」；
2. 「发现插件」显示**已发现 N 个插件**，随后每个插件一行加载进度；
3. 「HTTP服务器 已启动」——默认地址是 `http://127.0.0.1:8000`，这是留给 WebUI（网页控制台）用的 API 服务，暂时不用管它；
4. 最后日志里出现 **「Neo-MoFox Bot 启动成功」** 和 **「输入 /help 查看可用命令」**——看到这两行，就成了。

![图片：终端中 Neo-MoFox 启动成功后的日志输出](/guide/manual/first-start-success.png)

::: tip 现在机器人还不会回 QQ 消息，是正常的
此刻它有了「大脑」，但还没有「耳朵和嘴」（QQ 协议端）。按 `Ctrl+C` 把它先关掉，我们继续往下配置。
:::

## 认识自动生成的目录

首次启动后，项目文件夹里会多出这些东西，先混个脸熟：

| 路径 | 是什么 |
| --- | --- |
| `config/core.toml` | 总配置：主人名单、数据库、WebUI 服务地址等 |
| `config/model.toml` | 模型配置：API Key、可用模型、每个任务用哪个模型 |
| `config/mcp.toml` | MCP 外部工具接入配置（进阶玩法，默认不用动） |
| `config/plugins/` | 各插件自己的配置文件，比如 QQ 适配器的 |
| `data/` | 机器人的「记忆」：数据库 `MoFox.db`、统计数据、协议同意记录等 |
| `logs/` | 运行日志，默认自动清理（保留 30 天、最多 100 个文件） |
| `plugins/` | 插件本体（官方自带的 onebot_adapter 等都在这），别随手删 |
| `.venv/` | uv 建的虚拟环境，程序全自动管理，别动它 |

::: tip 想备份？
把 `config/` 和 `data/` 两个文件夹整个拷走，就等于备份了机器人的全部设置和记忆。
:::

## 第 4 步：填模型 API Key

机器人「思考」靠的是大语言模型（LLM）服务，你需要去模型服务商那里申请一个 [API Key](/docs/guides/glossary#api-key)——它就像一把钥匙，程序拿着它才能调用模型，费用按用量记在你的账户上。项目的默认配置以硅基流动（SiliconFlow）为例，注册后在后台就能创建 Key。

![图片：文本编辑器打开 config/model.toml 文件](/guide/manual/model-toml-editor.png)

<MethodTabs dimension="config" :options="[{ value: 'file', label: '配置文件', icon: 'mdi:file-document-outline' }, { value: 'webui', label: 'WebUI', icon: 'mdi:monitor-dashboard' }]">

<MethodTab value="file">

用文本编辑器（记事本、VS Code 都行）打开 `config/model.toml`，找到最上方的 `[[api_providers]]` 一节，把 `api_key` 换成你自己的钥匙：
```toml

[[api_providers]]
name = "SiliconFlow"                          # 服务商代号，随便起，但要和下面 models 里的 api_provider 对得上
base_url = "https://api.siliconflow.cn/v1"    # 服务商的接口地址
api_key = "sk-xxxxxxxxxxxxxxxx"               # ← 把这里换成你自己的 API Key
client_type = "openai"                        # 接口协议类型，OpenAI 兼容的服务（如硅基流动）就用 openai
```

保存文件，**重启程序**（`Ctrl+C` 后重新启动）生效。

默认文件里已经写好了一组硅基流动的模型清单和任务分配（`model_tasks`），不改也能直接用。**想换成别家服务商**时，参考下面这个最小结构，字段名以源码 `model_config.py` 为准：
```toml

[[api_providers]]
name = "MyProvider"                        # 你起的服务商代号
base_url = "https://api.example.com/v1"    # 服务商的接口地址
api_key = "sk-xxxxxxxx"                    # 它家的 API Key
client_type = "openai"                     # 可选值：openai / openai_response / anthropic / gemini / aiohttp_gemini / bedrock

[[models]]
name = "my-model"                          # 模型代号（给 Neo-MoFox 内部用，任务里引用它）
model_identifier = "vendor/model-name"     # 服务商真实的模型 ID（调用 API 时用的名字）
api_provider = "MyProvider"                # 指向上面 api_providers 里写的 name

[model_tasks.actor]                        # 「动作器」任务：日常聊天主要由它完成
model_list = ["my-model"]                  # 这个任务用哪些模型（填上面 models 里的 name）
# max_tokens = 800                         # 可选：单次回复的最大长度
# temperature = 0.7                        # 可选：发挥的随机程度，越高越天马行空
```

::: warning 用记事本改配置的两条铁律
1. 保存时编码选 **UTF-8**（记事本右下角可以看到），否则中文会变乱码；
2. 改之前先复制一份原文件备份，改坏了随时换回来。
:::

::: tip Key 没填对会怎样？
程序启动时默认会做一次「LLM 接口连通性预检」，Key 填错或没填，日志里会有相应报错提示，照着改就行。
:::

</MethodTab>

<MethodTab value="webui">

装好 [WebUI（网页控制台）](/docs/guides/webui)之后，可以直接在浏览器里选择服务商、粘贴 API Key、给各个任务分配模型，保存即时生效，不用手动编辑文件，更适合不喜欢碰配置文件的玩家。

→ 配置入口和截图详见 [WebUI 指南](/docs/guides/webui)。

</MethodTab>

</MethodTabs>

## 第 5 步：接入 QQ

机器人自己上不了 QQ，需要一个「代练」帮它登录 QQ、收发消息，这个代练就叫[协议端](/docs/guides/glossary#协议端)。Neo-MoFox 和协议端通过[反向 WebSocket](/docs/guides/glossary#反向-websocket) 连接：Neo-MoFox 在本机开一个服务端口等着，协议端主动连上来。好消息是：Neo-MoFox 这边已经内置了 QQ 适配器并默认开好了端口，你只需要做三件事：**装好协议端 → 登录 QQ 并把反向 WS 指向 Neo-MoFox → 告诉 Neo-MoFox 它的 QQ 号**。

### 安装协议端（SnowLuma）

本篇以 [SnowLuma](https://snowluma.github.io/) 为例——它自带网页管理界面，配置直观，也是官方 Docker 方案的默认搭配。SnowLuma 的安装部署有自己的官方文档，覆盖 Windows、Linux、Docker 等各种环境，写得很全，照着它装即可，本篇不再重复展开：

→ **SnowLuma 官方部署文档**：<https://snowluma.github.io/zh/docs/guide/deploy/>

也可以换用 NapCat 等其他 [OneBot 11](/docs/guides/glossary#onebot) 协议端，对 Neo-MoFox 来说效果一样，但各有各的装法，本篇不展开——装好后按下面两小节配置即可。

### 登录 QQ，配置反向 WebSocket

装好 SnowLuma 后先登录 QQ：用**机器人要用的那个 QQ 号**（强烈建议小号）在 SnowLuma 里扫码登录。登录状态可以在 SnowLuma 的网页管理界面（默认 `http://localhost:5099`）的「进程注入」页确认，显示「qq 已在线」就行：

![图片：SnowLuma 进程注入页显示 qq 已在线](/guide/snowluma/snowluma_processes.png)

然后在 SnowLuma 的「节点配置 → WS 客户端」里点「新建 WS 客户端」。表单里的**「目标 URL」输入框**，填的就是 Neo-MoFox 那台机器的 IP 和端口（ip:port），写成 `ws://` 开头的地址：
```

ws://127.0.0.1:8095
```

> `ws://` 是固定前缀；`127.0.0.1` 表示「这台电脑自己」，`8095` 是 Neo-MoFox QQ 适配器的默认监听端口。也就是说，这个框里填的本质就是 Neo-MoFox 的 ip:port。表单其他选项保持默认即可。

![图片：SnowLuma 新建反向 WS 客户端表单，目标 URL 一栏填 Neo-MoFox 的 ip:port](/guide/snowluma/snowluma_ws_client_form.png)

> 表单截图里的 `ws://127.0.0.1:8080/ws` 只是 SnowLuma 自带的占位示例，别照抄它——你要填的是 `ws://127.0.0.1:8095`。

保存后，WS 客户端列表里这条记录显示「已连接」就成了：

![图片：SnowLuma 节点配置中的 WS 客户端列表](/guide/snowluma/snowluma_node_config.png)

::: tip 协议端和 Neo-MoFox 装在不同电脑？
把 `127.0.0.1` 换成运行 Neo-MoFox 那台电脑的局域网 IP（例如 `ws://192.168.1.10:8095`），并确认那台电脑的防火墙放行了 8095 端口。
:::

### 告诉 Neo-MoFox 它的 QQ 号

![图片：文本编辑器打开 onebot_adapter 插件配置文件](/guide/manual/onebot-config-editor.png)

首次启动后，程序会在 `config/plugins/onebot_adapter/config.toml` 生成适配器配置。用文本编辑器打开它：
```toml

[bot]
qq_id = "123456789"        # 必填：机器人的 QQ 号（就是协议端登录的那个号）
qq_nickname = "小狐狸"      # 机器人的昵称

[onebot_server]
mode = "reverse"           # 连接模式，默认反向 WebSocket，不用改
host = "127.0.0.1"         # 监听地址，和协议端在同一台电脑就保持默认
port = 8095                # 监听端口，必须和协议端里填的一致
access_token = ""          # 可选：访问令牌，两边留空，或两边填同一个值
```

把 `qq_id` 改成机器人的 QQ 号（**必填**，不填收不到消息），`qq_nickname` 起个你喜欢的名字，保存。

::: warning 启动顺序有讲究
建议**先启动 Neo-MoFox，再启动协议端**。Neo-MoFox 的启动日志里出现「适配器启动完成」，说明它这边已经开始监听 8095；协议端连上后，它的管理界面/日志会显示反向 WS 已连接。连不上？看文末[常见问题](#常见问题)里「QQ 连不上」一条。
:::

## 第 6 步：设置主人

「主人」是拥有最高权限的 QQ 用户——可以执行管理命令、调整机器人行为。建议把**你自己的 QQ 号**设成主人。

用文本编辑器打开 `config/core.toml`，找到 `[permissions]` 一节：

![图片：文本编辑器打开 config/core.toml 并定位到 permissions 一节](/guide/manual/core-toml-owner.png)
```toml

[permissions]
owner_list = ["qq:你的QQ号"]   # 格式固定为 平台:QQ号，例如 "qq:123456789"
```

想设多个主人就往列表里加：`owner_list = ["qq:111111", "qq:222222"]`。保存后**重启程序生效**。

## 挂到后台跑

关掉 PowerShell 窗口，机器人就下线了。想让它长期在线：

最省心的常驻方式就是**开个 PowerShell 窗口跑着别关**。想开机自动启动的话：

1. 开始菜单搜「任务计划程序」，右侧点「创建基本任务」；
2. 名称随便填（如「Neo-MoFox」），触发器选「当前用户登录时」；
3. 操作选「启动程序」，程序一栏填 `start.bat` 的完整路径（例如 `D:\Neo-MoFox\start.bat`）；
4. 完成向导后，在任务列表双击它打开「属性」→「操作」→「编辑」，在**「起始于（可选）」里填项目目录**（例如 `D:\Neo-MoFox`）——这步不能省，否则启动时会找不到配置文件；
5. 确定保存，右键任务选「运行」测试一下。

## 以后怎么更新

三步走：

1. 先停掉正在运行的程序（在 PowerShell 按 `Ctrl+C`，或关掉那个窗口）；
2. 在 Neo-MoFox 项目目录里执行：
```powershell

git pull    # 拉取最新代码
```

3. 重新启动（`uv run main.py` 或双击 `start.bat`）——uv 发现依赖清单有变化时，会自动补装新依赖，不用你操心。

新版本新增了配置项也不用怕：启动时程序会自动把新增配置补进你的 `config` 文件，**你已经改过的值全部保留**。

更多玩法见 [更新指南](/docs/guides/update)；想尝鲜开发中的新功能，可以参考 [更新渠道说明](/docs/guides/channels) 切换[分支](/docs/guides/glossary#分支main-与-dev)（分支 = 开发中的平行版本，类似「体验服」）。

## 常见问题

#### 提示「uv 不是内部或外部命令」或「无法识别 uv」

多半是装完 uv 后**没有重开 PowerShell**，或者压根没装成功。关掉所有 PowerShell 窗口重新开一个，再输 `uv --version` 试试；还不行就回到第 1 步重装一遍。

#### 报错说 Python 版本不对（要求 3.11 及以上）

系统里的 Python 太旧了。按第 1 步装个新版；或者干脆什么都不装——uv 会自动下载合适版本的 Python，也可以手动执行 `uv python install 3.12` 让它装一个。

#### `git clone` 卡住不动 / 速度很慢

见第 2 步末尾的折叠说明：换个时段重试，或使用你信任的 GitHub 加速镜像。

#### QQ 连不上（协议端反复重连 / 收不到消息）

按顺序检查：

1. 协议端里的反向 WS 地址是不是 `ws://127.0.0.1:8095`（IP 和端口都不能错）；
2. Neo-MoFox 是不是已经启动了（要**先启动它**，协议端才连得上）；
3. `access_token` 两边是否一致（要么都留空，要么填同一个值）；
4. `config/plugins/onebot_adapter/config.toml` 里的 `qq_id` 是否已经填了；
5. 打开协议端的日志看具体报错——大部分原因都会写在那里。

#### 提示端口被占用（8095 或 8000）

8095 是 QQ 适配器的端口，8000 是 WebUI/API 的端口。先找出是谁占的：
```powershell

netstat -ano | findstr :8095   # 查看 8095 端口被哪个进程占用（最后一列是 PID）
```

要么关掉占用端口的程序，要么换端口：8095 在 `config/plugins/onebot_adapter/config.toml` 的 `port`（改完协议端那边也要同步改）；8000 在 `config/core.toml` 的 `[http_router]` 小节 `http_router_port`。

#### 启动报 LLM 相关错误，或机器人不回话

九成是模型配置问题，按顺序检查 `config/model.toml`：

1. `api_key` 填了没有、有没有多余的空格或引号；
2. `base_url` 和你用的服务商是否匹配；
3. `model_tasks` 里引用的模型名，是不是都在 `[[models]]` 里定义过。

装好 WebUI 之后也可以直接在网页上检查和修改，见 [WebUI 指南](/docs/guides/webui)。

</MethodTab>

<MethodTab value="linux">

**你的工具是终端**（一般按 `Ctrl+Alt+T` 打开）。下文的命令都在终端里执行。

## 第 1 步：安装基础工具（Python、uv、Git）

三个工具一次装齐。**Python** 是 Neo-MoFox 的运行环境（项目要求 **3.11 或更新版本**，写在源码 `pyproject.toml` 的 `requires-python = ">=3.11"` 里）；**[uv](/docs/guides/glossary#包管理器-uv)** 是「装机管家」，Neo-MoFox 需要的几十个第三方组件（也就是[依赖](/docs/guides/glossary#依赖)）由它照着清单自动装好；**Git** 负责下载和更新代码。

优先用系统自带的包管理器，把 **Python** 和 **Git** 一次装齐：
```bash

# Ubuntu / Debian
sudo apt update                  # 刷新软件源列表
sudo apt install python3 git     # 一次装好 Python 3 和 Git
```
```bash

# Fedora
sudo dnf install python3 git
```
```bash

# Arch / Manjaro
sudo pacman -S python git
```

再装 **uv**：
```bash

curl -LsSf https://astral.sh/uv/install.sh | sh   # 运行官方安装脚本，uv 会装到你的用户目录
```

装完**关掉终端，重新开一个**，然后验证：
```bash

python3 --version   # 应显示 3.11 或更高
uv --version        # 应打印 uv 的版本号
git --version       # 应打印 git 的版本号
```

::: tip 发行版自带的 Python 太旧？
低于 3.11 不用费劲升级系统 Python——uv 可以自己下载管理新版，执行 `uv python install 3.12` 装一个就行，启动时 uv 会自动用它。
:::

::: warning 国内网络提示
安装 uv 的脚本从国外服务器下载，慢的话换个时间段再试。好消息是：**装依赖这一步不用愁**——Neo-MoFox 项目里已经默认配置了华为云 PyPI 镜像（写在 `pyproject.toml` 的 `[[tool.uv.index]]` 里），下载依赖会自动走国内线路，通常很快。
:::

## 第 2 步：下载 Neo-MoFox（克隆仓库）

选个你喜欢的位置存放项目：
```bash

cd ~              # 示例：回到用户主目录，也可以换成任何你喜欢的文件夹
```

然后克隆官方仓库：
```bash

git clone https://github.com/MoFox-Studio/Neo-MoFox.git   # 把官方仓库完整下载到当前目录，会生成 Neo-MoFox 文件夹
cd Neo-MoFox                                              # 进入项目目录——之后的命令都要在这个目录里执行
```

::: details 克隆很慢或失败怎么办？
GitHub 在国内访问时快时慢，可以：

1. 换个时间段重试，或挂上你自己的网络代理；
2. 使用你**信任**的 GitHub 加速镜像：在仓库地址前拼上镜像前缀，例如
   `git clone https://<镜像前缀>/https://github.com/MoFox-Studio/Neo-MoFox.git`。
   镜像站不是官方维护的，注意甄别安全。

<!-- VERIFY: 官方是否提供 Gitee 镜像或其他官方加速渠道？目前仅确认官方地址 https://github.com/MoFox-Studio/Neo-MoFox（与仓库 .git/config 中 origin 一致），如有官方镜像应在此补充。 -->
:::

::: tip 实在不想装 Git？
也可以在 GitHub 仓库页面点绿色「Code」按钮 →「Download ZIP」下载压缩包解压。但以后更新就得每次重新下载整个 ZIP；用 Git 的话，见下文[「以后怎么更新」](#以后怎么更新-1)，一条命令搞定。推荐还是装上。
:::

## 第 3 步：第一次启动

第一次启动时，uv 会自动做两件事：创建一个叫 `.venv` 的虚拟环境（一个隔离的「工具箱」文件夹，把本项目要用的依赖都装在里面，不污染系统），然后按照清单把依赖下载齐全（走华为云镜像，一般几分钟）。之后就不用再等了。
```bash

cd ~/Neo-MoFox       # 换成你的实际项目路径
uv run main.py       # 启动 Neo-MoFox
```

### 阅读并同意用户协议

第一次启动（以及协议文本更新后的第一次），终端会先停下来让你确认两份文件。

**第一份是 EULA（最终用户许可协议）**：

1. 输入 `view` 可以在终端里查看协议全文；
2. 输入 `agree` 表示同意；
3. 输入 `decline` 表示拒绝——**拒绝 EULA 程序会直接退出**，无法继续。

（输中文「查看 / 同意 / 拒绝」也认。）

**第二份是云端遥测隐私协议**（问你是否允许程序发送匿名统计数据帮开发者改进）：

1. 输入 `agree`：打开本地和云端遥测；
2. 输入 `decline`：云端遥测保持关闭，**程序照常继续运行**，不影响使用。

你的选择会记录在 `data/system/agreements/` 文件夹里，之后启动不会再问。

![图片：终端中 Neo-MoFox 首次启动时的协议确认界面](/guide/manual/first-start-agreement.png)

::: warning 服务器/进阶用户：一键跳过协议确认
启动前设置环境变量 `MOFOX_ACCEPT_STARTUP_AGREEMENTS=1`，程序会自动视为「已同意全部协议」。注意：只要**设置了这个变量**就会自动同意（与值是多少无关），并且**会同时自动打开云端遥测**，介意的话请走手动确认流程。
```bash

MOFOX_ACCEPT_STARTUP_AGREEMENTS=1 uv run main.py   # 临时设置环境变量并启动
```
:::

### 看到什么算成功

启动正常的话，你会按顺序看到：

1. 一个启动阶段面板：内核、配置、日志、数据库等逐项变成「已初始化」；
2. 「发现插件」显示**已发现 N 个插件**，随后每个插件一行加载进度；
3. 「HTTP服务器 已启动」——默认地址是 `http://127.0.0.1:8000`，这是留给 WebUI（网页控制台）用的 API 服务，暂时不用管它；
4. 最后日志里出现 **「Neo-MoFox Bot 启动成功」** 和 **「输入 /help 查看可用命令」**——看到这两行，就成了。

![图片：终端中 Neo-MoFox 启动成功后的日志输出](/guide/manual/first-start-success.png)

::: tip 现在机器人还不会回 QQ 消息，是正常的
此刻它有了「大脑」，但还没有「耳朵和嘴」（QQ 协议端）。按 `Ctrl+C` 把它先关掉，我们继续往下配置。
:::

## 认识自动生成的目录

首次启动后，项目文件夹里会多出这些东西，先混个脸熟：

| 路径 | 是什么 |
| --- | --- |
| `config/core.toml` | 总配置：主人名单、数据库、WebUI 服务地址等 |
| `config/model.toml` | 模型配置：API Key、可用模型、每个任务用哪个模型 |
| `config/mcp.toml` | MCP 外部工具接入配置（进阶玩法，默认不用动） |
| `config/plugins/` | 各插件自己的配置文件，比如 QQ 适配器的 |
| `data/` | 机器人的「记忆」：数据库 `MoFox.db`、统计数据、协议同意记录等 |
| `logs/` | 运行日志，默认自动清理（保留 30 天、最多 100 个文件） |
| `plugins/` | 插件本体（官方自带的 onebot_adapter 等都在这），别随手删 |
| `.venv/` | uv 建的虚拟环境，程序全自动管理，别动它 |

::: tip 想备份？
把 `config/` 和 `data/` 两个文件夹整个拷走，就等于备份了机器人的全部设置和记忆。
:::

## 第 4 步：填模型 API Key

机器人「思考」靠的是大语言模型（LLM）服务，你需要去模型服务商那里申请一个 [API Key](/docs/guides/glossary#api-key)——它就像一把钥匙，程序拿着它才能调用模型，费用按用量记在你的账户上。项目的默认配置以硅基流动（SiliconFlow）为例，注册后在后台就能创建 Key。

![图片：文本编辑器打开 config/model.toml 文件](/guide/manual/model-toml-editor.png)

<MethodTabs dimension="config" :options="[{ value: 'file', label: '配置文件', icon: 'mdi:file-document-outline' }, { value: 'webui', label: 'WebUI', icon: 'mdi:monitor-dashboard' }]">

<MethodTab value="file">

用文本编辑器打开 `config/model.toml`，找到最上方的 `[[api_providers]]` 一节，把 `api_key` 换成你自己的钥匙：
```toml

[[api_providers]]
name = "SiliconFlow"                          # 服务商代号，随便起，但要和下面 models 里的 api_provider 对得上
base_url = "https://api.siliconflow.cn/v1"    # 服务商的接口地址
api_key = "sk-xxxxxxxxxxxxxxxx"               # ← 把这里换成你自己的 API Key
client_type = "openai"                        # 接口协议类型，OpenAI 兼容的服务（如硅基流动）就用 openai
```

保存文件，**重启程序**（`Ctrl+C` 后重新启动）生效。

默认文件里已经写好了一组硅基流动的模型清单和任务分配（`model_tasks`），不改也能直接用。**想换成别家服务商**时，参考下面这个最小结构，字段名以源码 `model_config.py` 为准：
```toml

[[api_providers]]
name = "MyProvider"                        # 你起的服务商代号
base_url = "https://api.example.com/v1"    # 服务商的接口地址
api_key = "sk-xxxxxxxx"                    # 它家的 API Key
client_type = "openai"                     # 可选值：openai / openai_response / anthropic / gemini / aiohttp_gemini / bedrock

[[models]]
name = "my-model"                          # 模型代号（给 Neo-MoFox 内部用，任务里引用它）
model_identifier = "vendor/model-name"     # 服务商真实的模型 ID（调用 API 时用的名字）
api_provider = "MyProvider"                # 指向上面 api_providers 里写的 name

[model_tasks.actor]                        # 「动作器」任务：日常聊天主要由它完成
model_list = ["my-model"]                  # 这个任务用哪些模型（填上面 models 里的 name）
# max_tokens = 800                         # 可选：单次回复的最大长度
# temperature = 0.7                        # 可选：发挥的随机程度，越高越天马行空
```

::: warning 改配置文件的两条铁律
1. 确保文件编码是 **UTF-8**，否则中文会变乱码；
2. 改之前先复制一份原文件备份，改坏了随时换回来。
:::

::: tip Key 没填对会怎样？
程序启动时默认会做一次「LLM 接口连通性预检」，Key 填错或没填，日志里会有相应报错提示，照着改就行。
:::

</MethodTab>

<MethodTab value="webui">

装好 [WebUI（网页控制台）](/docs/guides/webui)之后，可以直接在浏览器里选择服务商、粘贴 API Key、给各个任务分配模型，保存即时生效，不用手动编辑文件，更适合不喜欢碰配置文件的玩家。

→ 配置入口和截图详见 [WebUI 指南](/docs/guides/webui)。

</MethodTab>

</MethodTabs>

## 第 5 步：接入 QQ

机器人自己上不了 QQ，需要一个「代练」帮它登录 QQ、收发消息，这个代练就叫[协议端](/docs/guides/glossary#协议端)。Neo-MoFox 和协议端通过[反向 WebSocket](/docs/guides/glossary#反向-websocket) 连接：Neo-MoFox 在本机开一个服务端口等着，协议端主动连上来。好消息是：Neo-MoFox 这边已经内置了 QQ 适配器并默认开好了端口，你只需要做三件事：**装好协议端 → 登录 QQ 并把反向 WS 指向 Neo-MoFox → 告诉 Neo-MoFox 它的 QQ 号**。

### 安装协议端（SnowLuma）

本篇以 [SnowLuma](https://snowluma.github.io/) 为例——它自带网页管理界面，配置直观，也是官方 Docker 方案的默认搭配。SnowLuma 的安装部署有自己的官方文档，覆盖 Windows、Linux、Docker 等各种环境，写得很全，照着它装即可，本篇不再重复展开：

→ **SnowLuma 官方部署文档**：<https://snowluma.github.io/zh/docs/guide/deploy/>

也可以换用 NapCat 等其他 [OneBot 11](/docs/guides/glossary#onebot) 协议端，对 Neo-MoFox 来说效果一样，但各有各的装法，本篇不展开——装好后按下面两小节配置即可。

### 登录 QQ，配置反向 WebSocket

装好 SnowLuma 后先登录 QQ：用**机器人要用的那个 QQ 号**（强烈建议小号）在 SnowLuma 里扫码登录。登录状态可以在 SnowLuma 的网页管理界面（默认 `http://localhost:5099`）的「进程注入」页确认，显示「qq 已在线」就行：

![图片：SnowLuma 进程注入页显示 qq 已在线](/guide/snowluma/snowluma_processes.png)

然后在 SnowLuma 的「节点配置 → WS 客户端」里点「新建 WS 客户端」。表单里的**「目标 URL」输入框**，填的就是 Neo-MoFox 那台机器的 IP 和端口（ip:port），写成 `ws://` 开头的地址：
```

ws://127.0.0.1:8095
```

> `ws://` 是固定前缀；`127.0.0.1` 表示「这台电脑自己」，`8095` 是 Neo-MoFox QQ 适配器的默认监听端口。也就是说，这个框里填的本质就是 Neo-MoFox 的 ip:port。表单其他选项保持默认即可。

![图片：SnowLuma 新建反向 WS 客户端表单，目标 URL 一栏填 Neo-MoFox 的 ip:port](/guide/snowluma/snowluma_ws_client_form.png)

> 表单截图里的 `ws://127.0.0.1:8080/ws` 只是 SnowLuma 自带的占位示例，别照抄它——你要填的是 `ws://127.0.0.1:8095`。

保存后，WS 客户端列表里这条记录显示「已连接」就成了：

![图片：SnowLuma 节点配置中的 WS 客户端列表](/guide/snowluma/snowluma_node_config.png)

::: tip 协议端和 Neo-MoFox 装在不同电脑？
把 `127.0.0.1` 换成运行 Neo-MoFox 那台电脑的局域网 IP（例如 `ws://192.168.1.10:8095`），并确认那台电脑的防火墙放行了 8095 端口。
:::

### 告诉 Neo-MoFox 它的 QQ 号

![图片：文本编辑器打开 onebot_adapter 插件配置文件](/guide/manual/onebot-config-editor.png)

首次启动后，程序会在 `config/plugins/onebot_adapter/config.toml` 生成适配器配置。用文本编辑器打开它：
```toml

[bot]
qq_id = "123456789"        # 必填：机器人的 QQ 号（就是协议端登录的那个号）
qq_nickname = "小狐狸"      # 机器人的昵称

[onebot_server]
mode = "reverse"           # 连接模式，默认反向 WebSocket，不用改
host = "127.0.0.1"         # 监听地址，和协议端在同一台电脑就保持默认
port = 8095                # 监听端口，必须和协议端里填的一致
access_token = ""          # 可选：访问令牌，两边留空，或两边填同一个值
```

把 `qq_id` 改成机器人的 QQ 号（**必填**，不填收不到消息），`qq_nickname` 起个你喜欢的名字，保存。

::: warning 启动顺序有讲究
建议**先启动 Neo-MoFox，再启动协议端**。Neo-MoFox 的启动日志里出现「适配器启动完成」，说明它这边已经开始监听 8095；协议端连上后，它的管理界面/日志会显示反向 WS 已连接。连不上？看文末[常见问题](#常见问题-1)里「QQ 连不上」一条。
:::

## 第 6 步：设置主人

「主人」是拥有最高权限的 QQ 用户——可以执行管理命令、调整机器人行为。建议把**你自己的 QQ 号**设成主人。

用文本编辑器打开 `config/core.toml`，找到 `[permissions]` 一节：

![图片：文本编辑器打开 config/core.toml 并定位到 permissions 一节](/guide/manual/core-toml-owner.png)
```toml

[permissions]
owner_list = ["qq:你的QQ号"]   # 格式固定为 平台:QQ号，例如 "qq:123456789"
```

想设多个主人就往列表里加：`owner_list = ["qq:111111", "qq:222222"]`。保存后**重启程序生效**。

## 挂到后台跑

关掉终端窗口，机器人就下线了。想让它长期在线，用 systemd 实现开机自启 + 崩溃自动拉起：

1. 记下 uv 的完整路径：
```bash

which uv    # 输出类似 /home/你的用户名/.local/bin/uv，复制保存下来
```

2. 创建服务文件 `~/.config/systemd/user/mofox.service`（目录不存在就新建）：
```ini

[Unit]
Description=Neo-MoFox Bot

[Service]
WorkingDirectory=/home/你的用户名/Neo-MoFox           # ← 改成你的项目目录
ExecStart=/home/你的用户名/.local/bin/uv run main.py   # ← 改成上面记下的 uv 路径
Restart=on-failure                                   # 程序崩溃时自动重启

[Install]
WantedBy=default.target
```

3. 启用并启动服务：
```bash

systemctl --user daemon-reload                # 重新加载服务定义
systemctl --user enable --now mofox.service   # 设置开机自启并立即启动
journalctl --user -u mofox.service -f         # 实时查看运行日志（Ctrl+C 退出查看）
```

## 以后怎么更新

三步走：

1. 先停掉正在运行的程序（在终端按 `Ctrl+C`，或停掉 systemd 服务：`systemctl --user stop mofox.service`）；
2. 在 Neo-MoFox 项目目录里执行：
```bash

git pull    # 拉取最新代码
```

3. 重新启动（`uv run main.py`，或用 systemd 的话执行 `systemctl --user start mofox.service`）——uv 发现依赖清单有变化时，会自动补装新依赖，不用你操心。

新版本新增了配置项也不用怕：启动时程序会自动把新增配置补进你的 `config` 文件，**你已经改过的值全部保留**。

更多玩法见 [更新指南](/docs/guides/update)；想尝鲜开发中的新功能，可以参考 [更新渠道说明](/docs/guides/channels) 切换[分支](/docs/guides/glossary#分支main-与-dev)（分支 = 开发中的平行版本，类似「体验服」）。

## 常见问题

#### 提示 `command not found: uv`

多半是装完 uv 后**没有重开终端**，或者压根没装成功。关掉所有终端窗口重新开一个，再输 `uv --version` 试试；还不行就回到第 1 步重装一遍。

#### 报错说 Python 版本不对（要求 3.11 及以上）

系统里的 Python 太旧了。按第 1 步装个新版；或者干脆什么都不装——uv 会自动下载合适版本的 Python，也可以手动执行 `uv python install 3.12` 让它装一个。

#### `git clone` 卡住不动 / 速度很慢

见第 2 步末尾的折叠说明：换个时段重试，或使用你信任的 GitHub 加速镜像。

#### QQ 连不上（协议端反复重连 / 收不到消息）

按顺序检查：

1. 协议端里的反向 WS 地址是不是 `ws://127.0.0.1:8095`（IP 和端口都不能错）；
2. Neo-MoFox 是不是已经启动了（要**先启动它**，协议端才连得上）；
3. `access_token` 两边是否一致（要么都留空，要么填同一个值）；
4. `config/plugins/onebot_adapter/config.toml` 里的 `qq_id` 是否已经填了；
5. 打开协议端的日志看具体报错——大部分原因都会写在那里。

#### 提示端口被占用（8095 或 8000）

8095 是 QQ 适配器的端口，8000 是 WebUI/API 的端口。先找出是谁占的：
```bash

ss -ltnp | grep 8095           # 查看 8095 端口被哪个进程占用
```

要么关掉占用端口的程序，要么换端口：8095 在 `config/plugins/onebot_adapter/config.toml` 的 `port`（改完协议端那边也要同步改）；8000 在 `config/core.toml` 的 `[http_router]` 小节 `http_router_port`。

#### 启动报 LLM 相关错误，或机器人不回话

九成是模型配置问题，按顺序检查 `config/model.toml`：

1. `api_key` 填了没有、有没有多余的空格或引号；
2. `base_url` 和你用的服务商是否匹配；
3. `model_tasks` 里引用的模型名，是不是都在 `[[models]]` 里定义过。

装好 WebUI 之后也可以直接在网页上检查和修改，见 [WebUI 指南](/docs/guides/webui)。

</MethodTab>

</MethodTabs>

到这里，你的 Neo-MoFox 已经完成部署并接入 QQ 了。接下来推荐：装上 [WebUI](/docs/guides/webui)，在浏览器里可视化调教人格和配置；以及了解 [日常更新](/docs/guides/update) 的正确姿势。
