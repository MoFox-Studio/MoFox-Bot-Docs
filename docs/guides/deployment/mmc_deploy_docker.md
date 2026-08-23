# <iconify-icon icon="mdi:docker" height="36"></iconify-icon> Neo-MoFox Docker 部署指南

## 概述

本指南介绍如何使用主项目提供的 Docker Compose 编排部署 Neo-MoFox。当前编排使用 **SnowLuma** 作为 QQ 协议桥接服务，不再使用 NapCat 容器。

Compose 会启动以下两个服务：

- `mofox`：Neo-MoFox 主程序；
- `snowluma`：QQ 客户端、SnowLuma WebUI、noVNC 和 OneBot 11 服务。

配置、数据、日志和插件目录会保存在宿主机中；SnowLuma 数据则保存在 Docker 命名卷中。

## 1. 准备环境

### 1.1 系统要求

- 支持 Docker Desktop 或 Docker Engine 的 64 位操作系统；
- 至少 2 核 CPU、4 GB 内存和 10 GB 可用磁盘空间；
- 已安装 Git、Docker Engine 和 Docker Compose；
- 能够访问 GitHub、Docker Hub 及所使用的模型 API 服务。

执行以下命令确认 Docker 可用：

```bash
docker --version
docker compose version
```

### 1.2 端口说明

| 端口 | 用途 | 是否建议公网开放 |
| --- | --- | --- |
| `8000` | Neo-MoFox WebUI | 否，建议仅在可信网络使用 |
| `5099` | SnowLuma WebUI | 否 |
| `6081` | noVNC 网页 | 否 |
| `3000` | OneBot HTTP | 否 |
| `3001` | OneBot WebSocket | 否 |

> [!WARNING]
> 不要把 noVNC、WebUI 或 OneBot 端口直接暴露到公网。确需远程访问时，请使用防火墙白名单、VPN 或带身份认证的反向代理。

## 2. 获取项目

当前 Docker 编排位于 Neo-MoFox 的 `dev` 分支。克隆项目并进入目录：

```bash
git clone -b dev https://github.com/MoFox-Studio/Neo-MoFox.git
cd Neo-MoFox
```

如果本地已有项目，请切换到 `dev` 分支并拉取最新内容：

```bash
git switch dev
git pull --ff-only
```

## 3. 启动前配置

### 3.1 设置 noVNC 密码

最新 Compose 不再内置默认密码。启动前必须通过 `SNOWLUMA_VNC_PASSWORD` 环境变量提供随机强密码，否则 Docker Compose 会拒绝启动。

:::code-group

```bash [Linux/macOS]
export SNOWLUMA_VNC_PASSWORD='请替换为随机强密码'
```

```powershell [Windows PowerShell]
$env:SNOWLUMA_VNC_PASSWORD = '请替换为随机强密码'
```

:::

该变量只在当前终端会话中有效，请在同一个终端中执行后续的 `docker compose` 命令。不要把真实密码写进公开脚本、截图或代码仓库。

### 3.2 确认数据挂载

Neo-MoFox 使用以下宿主机目录保存数据：

- `./config` → `/app/config`
- `./data` → `/app/data`
- `./logs` → `/app/logs`
- `./plugins` → `/app/plugins`

SnowLuma 使用以下 Docker 命名卷：

- `snowluma-data`
- `snowluma-config`
- `snowluma-local`

删除容器不会自动删除这些数据。请勿在没有备份的情况下执行 `docker compose down -v`。

## 4. 启动服务

在 Neo-MoFox 项目根目录执行：

```bash
docker compose pull
docker compose up -d
```

检查容器状态：

```bash
docker compose ps
```

正常情况下，`mofox` 和 `snowluma` 均应显示为 `Up` 或 `Running`。如需观察首次启动过程，可执行：

```bash
docker compose logs -f mofox snowluma
```

Compose 已设置 `MOFOX_ACCEPT_STARTUP_AGREEMENTS=1`，用于在无交互环境中确认 Neo-MoFox 的 EULA 与遥测隐私协议。部署前仍应自行阅读项目根目录中的 `eula.md`、`PRIVACY.md` 和 `LICENSE`。

## 5. 登录 QQ

1. 在浏览器打开 `http://服务器IP:6081` 进入 noVNC；
2. 使用第 3.1 节通过环境变量设置的密码登录；
3. 在 QQ 客户端中完成扫码或账号登录；
4. 打开 `http://服务器IP:5099`，确认 SnowLuma 已正常运行。

当前 Compose 不再向宿主机发布 `5900` 端口。完成登录后，请及时关闭不需要的外部端口访问规则。

## 6. 连接 SnowLuma 与 Neo-MoFox

Neo-MoFox 使用反向 WebSocket 模式监听 `8095` 端口，SnowLuma 作为 WebSocket 客户端主动连接。两个容器位于同一个 Compose 默认网络中，因此 SnowLuma 应使用 Neo-MoFox 的容器名 `mofox-bot`，不能填写 `localhost` 或宿主机地址。

首次启动 Neo-MoFox 后，编辑 `config/plugins/onebot_adapter/config.toml`：

```toml
[plugin]
enabled = true

[bot]
qq_id = "你的机器人QQ号"
qq_nickname = "机器人昵称"

[onebot_server]
mode = "reverse"
host = "0.0.0.0"
port = 8095
access_token = ""
```

随后在 SnowLuma WebUI 中完成以下设置：

1. 打开“节点配置”，选择已经登录的 QQ 账号；
2. 进入“WS 客户端”，新建一个 WebSocket 反向客户端；
3. 将目标 URL 设置为 `ws://mofox-bot:8095`；
4. 消息格式选择“数组”，角色选择 `Universal`；
5. 如果 Neo-MoFox 设置了 Access Token，两端填写相同的值；留空时两端都不设置；
6. 保存并启用节点。

`8095` 只用于 Compose 内部网络通信，不需要映射到宿主机或在公网防火墙中放行。

修改后重启 Neo-MoFox：

```bash
docker compose restart mofox
docker compose logs -f mofox
```

日志中不再出现 OneBot 连接错误，并且机器人能够正常收发消息，即表示连接成功。

## 7. Neo-MoFox WebUI

Compose 为 Neo-MoFox WebUI 预留了 `8000` 端口。若当前镜像尚未安装 WebUI，请按照 [WebUI 部署指南](../usage/webui_guide.md) 安装后，再访问 `http://服务器IP:8000`。

## 8. 日常管理

| 操作 | 命令 |
| --- | --- |
| 启动服务 | `docker compose up -d` |
| 停止并删除容器 | `docker compose down` |
| 重启全部服务 | `docker compose restart` |
| 重启 Neo-MoFox | `docker compose restart mofox` |
| 重启 SnowLuma | `docker compose restart snowluma` |
| 查看全部日志 | `docker compose logs -f` |
| 查看 Neo-MoFox 日志 | `docker compose logs -f mofox` |
| 查看 SnowLuma 日志 | `docker compose logs -f snowluma` |
| 更新并重建容器 | `docker compose pull && docker compose up -d` |

更新前建议备份 `config`、`data`、`plugins` 和 SnowLuma 命名卷中的重要数据。

## 9. 常见问题

### 容器启动后立即退出

如果提示 `Set SNOWLUMA_VNC_PASSWORD to a strong password`，说明当前终端没有设置 `SNOWLUMA_VNC_PASSWORD`。按照第 3.1 节设置后，在同一终端重新启动。

其他情况可执行 `docker compose logs mofox snowluma`，从第一条明确错误开始排查。常见原因包括镜像拉取失败、端口冲突、文件权限错误或宿主机资源不足。

### 无法打开 noVNC 或 SnowLuma WebUI

- 使用 `docker compose ps` 确认 `snowluma` 正在运行；
- 检查 `6081`、`5099` 端口是否被占用；
- 检查本机防火墙或云服务器安全组；
- 确认访问的是 Docker 宿主机地址，而不是容器内部地址。

### QQ 已登录但机器人没有响应

- 确认 Neo-MoFox 使用 `reverse` 模式监听 `0.0.0.0:8095`；
- 确认 SnowLuma 的 WS 客户端目标为 `ws://mofox-bot:8095`；
- 确认两端 Access Token 一致；
- 检查 `qq_id` 是否与 SnowLuma 中登录的 QQ 一致；
- 同时查看 `docker compose logs -f mofox snowluma`。

### 修改配置后没有生效

配置文件保存在宿主机的 `config` 目录。保存修改后执行：

```bash
docker compose restart mofox
```

至此，Neo-MoFox、SnowLuma 与 OneBot 连接均已完成。建议在正式使用前测试 QQ 消息收发、模型调用、WebUI 登录和容器重启后的数据持久化。
