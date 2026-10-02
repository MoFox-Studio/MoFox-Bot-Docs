# Docker 部署

本页带你从头到尾，用 [Docker 与镜像](/docs/guides/glossary#docker-与镜像)把 Neo-MoFox 跑起来。照着做，你将依次完成：装好 Docker → 拿到部署文件 → 启动容器 → 接入 QQ → 配置 AI 模型 → 设置主人。

整个过程只需要复制粘贴命令和点几次网页，不需要编译任何东西。

## 这套部署长什么样

官方的 `docker-compose.yml` 会帮你启动**两个容器**，它们各司其职：

| 容器 | 镜像 | 干什么用的 |
| --- | --- | --- |
| `snowluma` | `motricseven7/snowluma:latest` | QQ 协议桥接框架，负责登录 QQ、收发消息（相当于 Bot 的"耳朵和嘴"） |
| `mofox`（容器名叫 `mofox-bot`） | `ikun11451/neo-mofox-dev:latest` | Neo-MoFox 本体，负责思考和回复（相当于 Bot 的"大脑"） |

启动后会在服务器上开放这些端口（"端口"可以理解为服务器上的一扇门，每个服务占一扇）：

| 端口 | 用途 |
| --- | --- |
| `5099` | SnowLuma WebUI——配置 QQ 连接的管理网页 |
| `6081` | noVNC——浏览器里的远程桌面，能看到 SnowLuma 里面那台"虚拟电脑"的屏幕 |
| `3000` | OneBot HTTP 接口 |
| `3001` | OneBot WebSocket 接口 |
| `8000` | MoFox WebUI——Neo-MoFox 自己的网页控制台 |

## 开始之前：装好 Docker

1. 准备一台能联网的 Linux 服务器（云服务器、家里的主机都行）。
2. 安装 Docker Engine 和 docker compose 插件，跟着官方文档走最稳：
   - Docker Engine：<https://docs.docker.com/engine/install/>
   - Compose 插件：<https://docs.docker.com/compose/install/>
3. 装完检查一下，两条命令都能打印版本号就说明好了：
```bash

docker -v                # 查看 Docker 版本
docker compose version   # 能打印版本号，说明 compose 插件装好了
```

::: tip 权限提示
如果运行 `docker` 提示没有权限，在命令前面加 `sudo`，或者按 Docker 官方文档把你的用户加入 `docker` 组，之后就不需要 sudo 了。
:::

::: details 国内服务器：Docker Hub 拉取镜像慢怎么办？
国内访问 Docker Hub 经常很慢或超时，可以给 Docker 配置"镜像加速"：编辑 `/etc/docker/daemon.json`，加入可用的加速地址后重启 Docker 服务。公共加速地址经常变动失效，建议搜索"docker 镜像加速"找近期可用的地址。如果不方便配置，也可以给服务器设置代理。
:::

## 第一步：拿到部署文件

部署所需的 `docker-compose.yml` 和几个协议文件都在 Neo-MoFox 仓库里。推荐直接克隆整个仓库：
```bash

# 克隆仓库到 mofox-deploy 目录（--depth 1 表示只拉最新一版，省时间省流量）
git clone --depth 1 https://github.com/MoFox-Studio/Neo-MoFox.git mofox-deploy

# 进入这个目录，之后的命令都在这里执行
cd mofox-deploy
```

如果不想克隆整个仓库，只下载部署必需的 4 个文件也行：
```bash

mkdir mofox-deploy && cd mofox-deploy

BASE=https://raw.githubusercontent.com/MoFox-Studio/Neo-MoFox/dev
curl -fLO $BASE/docker-compose.yml   # 部署清单
curl -fLO $BASE/eula.md              # 用户协议
curl -fLO $BASE/PRIVACY.md           # 隐私政策
curl -fLO $BASE/LICENSE              # 开源许可证
```

::: warning 三个协议文件必须真实存在
compose 文件会把 `eula.md`、`PRIVACY.md`、`LICENSE` 以"单文件挂载"的方式放进容器。如果宿主机上这几个文件不存在，Docker 启动时会自动创建**同名的空文件夹**来顶替，导致容器启动失败。所以用第二种方式下载时，这 4 个文件一个都不能少。
:::

## 第二步：设置 VNC 密码（必改项）

compose 文件里有一个必须由你自己提供的 [环境变量](/docs/guides/glossary#环境变量)：`SNOWLUMA_VNC_PASSWORD`。它是 SnowLuma 远程桌面（noVNC，`6081` 端口）的登录密码，第四步登录 QQ 时要用它——不设置的话，执行 `docker compose up` 时会直接报错拒绝启动，这是官方故意的，防止你用公开的默认密码裸奔。

在 compose 文件同目录下创建一个 `.env` 文件写入密码即可（`docker compose` 会自动读取它）：
```bash

# 把"换成你的强密码"替换成你自己的密码，再执行
echo 'SNOWLUMA_VNC_PASSWORD=换成你的强密码' > .env
```

::: warning 这是保密码，不是随便填的
`5099` 和 `6081` 端口开放在公网上，任何拿到这个密码的人都能连上你的远程桌面、进到 SnowLuma 管理界面。请务必用足够长的随机密码，并建议在云服务器安全组里限制这两个端口只允许你自己的 IP 访问。
:::

**数据放在哪？** 之后的聊天记录、配置、日志都会落在 compose 文件旁边的这几个文件夹里：`config/`、`data/`、`logs/`、`plugins/`（首次启动时自动创建）。SnowLuma 自己的数据则存放在 Docker 命名卷里，不需要你操心。备份时把整个部署目录打包即可。

## 第三步：启动容器
```bash

docker compose up -d         # 拉取镜像并后台启动两个容器，第一次会下载一段时间
docker compose ps            # 查看容器状态，两个都应该是 Up / running
docker compose logs -f mofox # 持续查看 Neo-MoFox 的日志，按 Ctrl+C 退出（不影响容器运行）
```

看到什么算启动成功？日志里出现这两行就稳了：

- `Neo-MoFox Bot 启动成功`
- `输入 /help 查看可用命令`

启动过程中你还会看到 `LLM 预检` 相关日志——这是程序在试着连一次你配置的 AI 接口。**首次启动时你还没填 API Key，预检失败是正常的**，配置好模型后它会变绿。

![图片：终端中 docker compose logs -f mofox 显示启动成功日志](/guide/docker/docker-first-start-logs.png)
<!-- TODO-SCREENSHOT: 终端运行 docker compose logs -f mofox 的截图，需完整显示「Neo-MoFox Bot 启动成功」与「输入 /help 查看可用命令」两行日志，深色终端主题，字体清晰。 -->

::: tip 关于用户协议
compose 文件里已经设置了 `MOFOX_ACCEPT_STARTUP_AGREEMENTS=1`，代表自动同意用户协议，所以你不会看到协议确认界面。协议内容就是部署目录里的 `eula.md`，有空的可以读一读。
:::

## 第四步：登录 QQ，接入 Neo-MoFox

现在两个容器都跑起来了。接下来做两件事：先让 SnowLuma 里的 QQ 登录上号，再告诉 SnowLuma「把 QQ 收到的消息发给 Neo-MoFox」。第二步用到的就是[反向 WebSocket](/docs/guides/glossary#反向-websocket)——由 SnowLuma 主动连到 Neo-MoFox 留好的接口上。

### 第 1 步：进 noVNC，扫码登录 QQ

SnowLuma 只支持扫码登录，没有账号密码登录。SnowLuma 容器里自带一台「虚拟电脑」（Linux 桌面），QQ 已经在里面自动启动了；你要做的是用浏览器看到它的屏幕，然后扫码：

1. 浏览器打开 `http://服务器IP:6081`，进入 noVNC 远程桌面页，点「连接」，密码填第二步设置的 `SNOWLUMA_VNC_PASSWORD`；
2. 连上后会看到一台 Linux 桌面，QQ 已经自动启动，弹窗里就是登录二维码（没看到就等几秒，或点一下桌面里的 QQ 窗口）；
3. 用**手机 QQ**（就是 Bot 要登录的那个号，强烈建议小号）扫这个码，在 QQ 里确认登录；
4. 登录完成后不用守着桌面：容器启动时已经自动把 hook 注入 QQ 进程，扫码成功后自动开始工作，把 QQ 窗口最小化即可。

> 第二步设置的 VNC 密码忘了？查看部署目录下的 `.env` 文件即可找回；也可以执行 `docker logs snowluma 2>&1 | grep -E "远程桌面密码:|remote desktop password:" | tail -n 1` 碰碰运气（密码在生成或更换时打印一次，重启后日志里找不到是正常的，用第一次记下的那串）。

::: tip noVNC 里是什么样？
一台完整的 Linux 桌面（画面因机器而异，这里就不放截图了）。只要能连上并看到 QQ 窗口和二维码，这一步就成功了。
:::

### 第 2 步：在 WebUI 配置反向 WebSocket

1. 浏览器打开 `http://服务器IP:5099`，进入 SnowLuma WebUI。首次登录的密码**不在第二步的 `.env` 里**，而是 SnowLuma 第一次启动时在日志里打印的一次性临时密码：
```bash

docker logs snowluma 2>&1 | grep -E "临时密码|initial credentials" | tail -n 1
```
   它只在全新数据目录的第一次启动时输出一次，**看到就存好**，之后重启不会再打印。

![图片：浏览器打开 SnowLuma WebUI（5099 端口）的登录页](/guide/snowluma/login.png)

2. 进入「节点配置 → OneBot 协议端点 → WS 客户端」，点「新建 WS 客户端」。表单里的**「目标 URL」输入框**，填的就是 Neo-MoFox 那台机器的 ip:port（写成 `ws://` 开头的地址），按你的情况填：
   - **照本篇用 Docker 跑**：填 `ws://mofox-bot:8095`。`mofox-bot` 是 Neo-MoFox 容器的名字，两个容器在同一个 compose 网络里可以直接用容器名互访；`8095` 是 Neo-MoFox OneBot 适配器的默认反向 WS 端口（compose 里没有把它映射到公网，外部访问不到，这是正常且安全的）。
   - **Neo-MoFox 跑在宿主机**（没走 Docker）：填 `ws://<宿主机IP>:8095`。

   表单其他选项保持默认即可（截图里的 `ws://127.0.0.1:8080/ws` 只是 SnowLuma 自带的占位示例，别照抄它）。
4. 保存后，客户端列表里显示「已连接」即接入成功。

![SnowLuma 节点配置中的 WS 客户端列表](/guide/snowluma/snowluma_node_config.png)

![新建 WebSocket 反向客户端表单](/guide/snowluma/snowluma_ws_client_form.png)

两边都就绪，接入就完成了：QQ 侧在「进程注入」页显示「qq 已在线」，WS 客户端显示「已连接」。

![图片：SnowLuma 进程注入页显示 qq 已在线](/guide/snowluma/snowluma_processes.png)

::: tip 更多 SnowLuma 的用法
SnowLuma 有自己的[官方文档](https://snowluma.github.io/zh/)，多账号、环境变量自启、WebUI 的其他功能都在那里讲，本篇只覆盖接入 Neo-MoFox 所需的最少步骤。
:::

## 第五步：配置模型

Neo-MoFox 回复消息要靠大模型 API，所以得告诉它：用哪家的接口、什么模型、API Key 是什么。有两种方式：

- **改配置文件**：编辑部署目录下的 `config/model.toml`（首次启动时自动生成，自带一份硅基流动 SiliconFlow 的示例）；
- **用网页配**：浏览器打开 `http://服务器IP:8000` 进入 MoFox WebUI，在界面里填。

以改文件为例。`model.toml` 最少需要三段内容：`api_providers`（接口在哪、Key 是什么）、`models`（有哪些模型可用）、`model_tasks`（每类任务用哪个模型）。下面是一份最小可用示例，换成你自己的服务商和 Key 即可：
```toml

# API 服务商：告诉 Neo-MoFox 去哪里调用模型
[[api_providers]]
name = "my-provider"                              # 随便起名，下面的模型通过它引用
base_url = "https://api.example.com/v1"           # 服务商的接口地址（OpenAI 兼容格式）
api_key = "sk-xxxxxxxxxxxxxxxx"                   # 你的 API Key
client_type = "openai"                            # 接口类型：OpenAI 兼容填 openai；
                                                  # 还有 anthropic / gemini / bedrock 等可选
max_retry = 2                                     # 失败重试次数
timeout = 30                                      # 单次请求超时（秒）
retry_interval = 10                               # 重试间隔（秒）

# 模型列表：声明一个可用的模型
[[models]]
name = "my-model"                                 # 模型别名，任务配置里用这个名字
model_identifier = "vendor/model-name"            # 服务商的真实模型 ID
api_provider = "my-provider"                      # 对应上面的 name
price_in = 1.0                                    # 每百万 token 输入价格（用于统计，可估填）
price_out = 2.0                                   # 每百万 token 输出价格

# 任务分配：每类活儿用哪个模型
# actor 是主会话（负责回复消息），sub_actor 负责判定，
# utils / utils_small 是工具类小任务
[model_tasks.actor]
model_list = ["my-model"]                         # 可以填多个模型做负载均衡
max_tokens = 800                                  # 单次最大输出 token 数
temperature = 0.7                                 # 温度，越高越发散

[model_tasks.sub_actor]
model_list = ["my-model"]

[model_tasks.utils]
model_list = ["my-model"]

[model_tasks.utils_small]
model_list = ["my-model"]
```

::: tip 用硅基流动最省事
首次启动生成的默认 `model.toml` 里已经预置了硅基流动（SiliconFlow）的服务商和一批模型，各任务也分配好了。如果你正好用硅基流动，只需要把文件里的 `api_key` 占位符换成自己的 Key，重启即可。识图（vlm）、语音（voice）等高级任务默认也指向硅基流动的模型，可以以后按需调整。
:::

改完记得重启让配置生效：
```bash

docker compose restart mofox   # 重启 Neo-MoFox 容器
```

![图片：浏览器打开 8000 端口的 MoFox WebUI 配置界面](/guide/webui/config-model.png)

## 第六步：设置主人

"主人"是这张 QQ 号里权限最高的用户，可以执行管理命令。编辑部署目录下的 `config/core.toml`，找到 `[permissions]` 一节，把你的 QQ 号填进去：
```toml

[permissions]
owner_list = ["qq:123456789"]   # 格式是 平台:QQ号；有多个主人就写成 ["qq:xxx", "qq:yyy"]
```

改完同样执行 `docker compose restart mofox` 生效。

## 更新与切换镜像

Neo-MoFox 的 Docker 镜像由 GitHub Actions 自动构建：`main` 分支的代码构建成 `ikun11451/neo-mofox-main:latest`，`dev` 分支构建成 `ikun11451/neo-mofox-dev:latest`，都同时支持 amd64 和 arm64 架构（常见的 x86 服务器和小主机、ARM 开发板都能跑）。compose 文件默认使用 dev 镜像，新功能和修复会先出现在这里。

日常更新到最新版：
```bash

docker compose pull    # 拉取最新镜像
docker compose up -d   # 用新镜像重建容器，数据都留在宿主机目录，不会丢
```

想切换到 main（更稳定）的镜像，编辑 `docker-compose.yml`，把 mofox 服务的 `image` 改成：
```yaml

    image: ikun11451/neo-mofox-main:latest
```

保存后执行 `docker compose up -d` 重建即可。关于更新策略的更多说明见 [更新与回滚](/docs/guides/update)；更换协议端或接入其他聊天渠道见 [消息渠道](/docs/guides/channels)。

## 常见问题

### 端口被占用，容器起不来

报错含 `address already in use` 或 `port is already allocated`，说明服务器上已有程序占用了 `5099`、`6081`、`3000`、`3001` 或 `8000` 中的某个端口。
```bash

ss -lntp | grep 8000   # 查看是哪个进程占用了 8000 端口
```

解决：编辑 `docker-compose.yml`，把冲突端口的映射 `"8000:8000"` 改成 `"18000:8000"` 这样的形式（冒号左边的宿主机端口随你改，右边不能动），然后 `docker compose up -d` 重建。注意浏览器访问时也要换成新端口。

### SnowLuma 一直连不上 mofox-bot（WS 客户端显示未连接）

按顺序检查：

1. 目标 URL 是否填的 `ws://mofox-bot:8095`——必须用容器名 `mofox-bot`，填 `localhost` 或 `127.0.0.1` 是连到 SnowLuma 自己去了；
2. 两个容器是否都是同一次 `docker compose up -d` 启动的（`docker compose ps` 两个都在运行）——只有同一个 compose 项目里的容器才互相可达；
3. 刚改过 Neo-MoFox 配置的话，执行 `docker compose restart mofox` 后再等几秒，让反向 WS 重连。

### 容器里的时间不对

compose 文件已给 mofox 容器设置 `TZ: Asia/Shanghai`（东八区），正常无需改动。如果你的业务在其他时区，改 compose 里 mofox 服务的 `TZ` 值后执行 `docker compose up -d` 重建。

### 重建 / 更新容器，数据会丢吗？

不会。`config/`、`data/`、`logs/`、`plugins/` 都挂载在宿主机上，容器只是"租客"，删掉重开家具还在；SnowLuma 的数据则在 Docker 命名卷（`snowluma-data` 等）里，`docker compose pull` 和 `up -d` 都不会动它。真正要小心的是别去删部署目录本身和 `.env` 文件。

### 忘了 SNOWLUMA_VNC_PASSWORD

它是 noVNC 远程桌面的密码（不是 SnowLuma WebUI 的登录密码）。查看部署目录下的 `.env` 文件即可找回；也可以执行 `docker logs snowluma 2>&1 | grep -E "远程桌面密码:|remote desktop password:" | tail -n 1` 碰碰运气（密码在生成或更换时打印一次，之后日志里没有是正常的）。改密码也是编辑 `.env`，然后 `docker compose up -d` 重建 snowluma 容器生效。

另外注意：SnowLuma WebUI 的登录密码是首次启动日志里的一次性临时密码，和这个 VNC 密码是两回事，第一次启动时看到就要存好。

## 下一步

Bot 已经跑起来了，接下来可以：

- 塑造它的性格：见 [人格定制](/docs/guides/persona)；
- 给它装新能力：见 [插件使用](/docs/guides/plugins)；
- 遇到本页没覆盖的问题：见 [常见问题 FAQ](/docs/guides/faq)。
