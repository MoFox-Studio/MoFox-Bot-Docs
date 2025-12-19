# MoFox-Bot WebUI 使用指南

欢迎来到 MoFox-Bot 的 Web 管理控制台！这份指南会手把手教你如何部署和使用这个可视化管理界面，让你告别纯命令行的操作方式，轻松管理你的机器人。

## 零、WebUI 是什么？能干啥？

MoFox-Bot WebUI 是一个基于 Web 的可视化管理控制台，让你通过浏览器就能完成对机器人的各种操作。

### ✨ 主要功能

**前端提供的功能**：
- 📊 **实时数据监控**：一目了然地查看消息统计、插件状态、系统资源使用情况
- 🔌 **插件管理**：查看所有插件、启用/禁用插件、查看和编辑插件配置
- 🛒 **插件市场**：浏览、搜索、安装社区开发的各类插件
- ⚙️ **配置管理**：可视化编辑各种配置文件，不用再手动改 TOML 了
- 📱 **响应式设计**：无论是电脑还是手机，都能流畅访问
- 🔐 **安全认证**：基于 API Key 的访问控制，保护你的机器人

**后端提供的能力**：
- 🔍 **服务发现**：自动发现 MoFox-Bot 主程序的 IP 和端口
- 🔑 **身份验证**：严格的 API Key 验证机制
- 📡 **RESTful API**：标准化的数据接口
- 🔌 **深度集成**：直接调用 MoFox-Bot 插件系统的各种 API

## 一、开始之前：你需要准备什么

在开始部署 WebUI 之前，请确认以下条件：

1. **MoFox-Bot 主程序**：已经正确安装并能正常运行
2. **Node.js 环境**：推荐使用当前 LTS 版本（Node.js 18 或更高）
3. **项目文件**：已经下载或克隆了 `MoFox-Core-Webui` 项目

## 二、第一步：安装后端插件

WebUI 的后端是以**插件**的形式集成到 MoFox-Bot 中的，所以第一步要先把后端插件装好。

### 2.1 复制后端文件

找到 `MoFox-Core-Webui` 项目中的 `backend` 文件夹，将它复制到 MoFox-Bot 的插件目录：

```
<MoFox-Bot安装目录>/
└── plugins/
    └── webui_backend/         ← 将 backend 文件夹重命名为 webui_backend 并放在这里
        ├── __init__.py
        ├── plugin.py
        ├── discovery_server.py
        ├── handlers/
        └── routers/
```

::: tip 目录结构示例
假设你的 MoFox-Bot 安装在 `E:\delveoper\mmc010`，那么完整路径应该是：
```
E:\delveoper\mmc010\plugins\webui_backend\
```
:::

### 2.2 配置 API Key（重要！）

打开 MoFox-Bot 的配置文件 `bot_config.toml`（通常在 `config` 目录下），找到 `plugin_api_valid_keys` 配置项：

```toml
# --- 插件API密钥认证 ---
# 用于访问需要认证的插件API的有效密钥列表
# 如果列表为空，则所有需要认证的API都将无法访问
# 例如: ["your-secret-key-1", "your-secret-key-2"]
plugin_api_valid_keys = ["your-secret-api-key-here"]
```

**重要说明**：
- 请将 `your-secret-api-key-here` 替换为**你自己的密钥**（强烈建议使用随机生成的长字符串）
- 可以配置多个密钥，例如：`["key1", "key2", "key3"]`
- 这个密钥将用于**登录 WebUI**，请妥善保管，不要泄露
- **如果列表为空 `[]`，则无法登录 WebUI**

::: warning 安全提醒
API Key 就像你家的钥匙，千万别把它写在公开的地方或分享给不信任的人。建议使用在线工具生成随机密钥，比如：`openssl rand -hex 32`
:::

### 2.3 重启 MoFox-Bot

保存配置文件后，**重启 MoFox-Bot 主程序**。插件会自动加载，并在固定端口 **12138** 启动服务发现服务器。

::: tip 如何确认插件加载成功？
重启后，在 MoFox-Bot 的日志中应该能看到类似这样的信息：
```
[INFO] 插件 webui_backend 已加载
[INFO] 发现服务器已启动，端口：12138
```
:::

## 三、第二步：访问 WebUI

根据你的情况，有两种方式访问 WebUI：

### 方式一：使用预编译版本（推荐新手）

如果你的 `backend/static/` 目录下**已经有编译好的前端文件**（通常是从 Release 下载的完整包，或者自己手动构建过），那么恭喜你，可以直接使用了！

**操作步骤**：

1. **确认静态文件存在**
   
   检查 `plugins/webui_backend/static/` 目录，应该能看到：
   ```
   plugins/webui_backend/static/
   ├── index.html
   ├── assets/
   └── BUILD_INFO.txt
   ```

2. **直接访问 WebUI**
   
   打开浏览器，访问：**http://localhost:12138**
   
   ::: tip 为什么是 12138？
   当 `backend/static/` 目录存在时，发现服务器会自动托管这些静态文件，你不需要再启动独立的前端开发服务器。
   :::

3. **登录**
   
   使用你在 `bot_config.toml` 中配置的 API Key 登录即可。

**如何获取预编译版本？**

- **方法一（推荐）**：访问 [GitHub Releases](https://github.com/ikun-11451/MoFox-Core-Webui/releases) 页面，下载最新的 `mofox-webui-backend.zip`，解压后就包含了完整的后端代码和编译好的前端。

- **方法二**：如果你已经有源码，可以手动构建前端：
  ```bash
  cd MoFox-Core-Webui/forward/mofox-webui
  npm install
  npm run build
  ```
  
  然后将 `dist/` 目录的内容复制到 `backend/static/`：
  ```powershell
  # Windows PowerShell
  Copy-Item -Path forward\mofox-webui\dist\* -Destination backend\static\ -Recurse -Force
  ```

::: tip 生产模式的优势
- 不需要安装 Node.js 和前端依赖
- 不需要运行两个服务器（前端+后端）
- 访问速度更快，资源占用更少
- 适合长期稳定运行
:::

---

### 方式二：前端开发模式（开发者使用）

如果你需要**修改前端代码**或者**调试前端功能**，那就需要启动前端开发服务器。

::: warning 注意
这种方式需要安装 Node.js 环境和前端依赖，适合开发者使用。如果你只是想使用 WebUI，强烈建议使用方式一。
:::

### 3.1 进入前端目录

打开终端（命令行），进入前端项目目录：

```bash
cd MoFox-Core-Webui/forward/mofox-webui
```

### 3.2 安装依赖

首次使用需要安装依赖包（只需要执行一次）：

```bash
npm install
```

如果你使用 `pnpm`（推荐，速度更快）：

```bash
pnpm install
```

::: tip 国内用户加速
如果下载速度很慢，可以使用国内镜像：
```bash
npm config set registry https://registry.npmmirror.com
npm install
```
:::

### 3.3 启动开发服务器

依赖安装完成后，启动前端开发服务器：

```bash
npm run dev
```

终端会输出类似这样的信息：

```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:11451/
➜  Network: use --host to expose
```

### 3.4 访问 WebUI

打开浏览器，访问：**http://localhost:11451**

如果一切顺利，你会看到 WebUI 的登录界面。

### 3.5 登录

输入你在 `bot_config.toml` 中配置的 API Key（`plugin_api_valid_keys` 中的任意一个），点击登录。

登录成功后，你就能看到 WebUI 的主界面了！

::: tip 开发模式 vs 生产模式对比
| 特性 | 开发模式（11451端口） | 生产模式（12138端口） |
|------|---------------------|---------------------|
| 需要 Node.js | ✅ 是 | ❌ 否 |
| 热重载 | ✅ 支持 | ❌ 不支持 |
| 启动速度 | 慢（需要编译） | 快（直接加载） |
| 资源占用 | 高 | 低 |
| 适用场景 | 前端开发调试 | 日常使用 |
:::

## 四、生产环境部署（可选）

如果你想让 WebUI 长期运行，或者部署在服务器上供多人访问，这里提供几种部署方案。

::: tip 最简单的方式
如果只是个人使用，直接使用**方式一（预编译版本）**就已经是生产环境了，不需要额外部署。本章节主要适用于需要使用独立 Web 服务器或自定义域名的场景。
:::

### 4.1 使用集成的静态文件托管（推荐）

这是最简单的生产部署方式，已经在"第三步 方式一"中介绍过了：

1. 将编译好的前端文件放在 `backend/static/` 目录
2. 启动 MoFox-Bot
3. 直接访问 http://localhost:12138

**优点**：
- 配置简单，开箱即用
- 不需要额外的 Web 服务器
- 前后端统一端口，无需处理跨域问题

**缺点**：
- 不支持自定义域名和 HTTPS（除非配置反向代理）
- 端口固定为 12138

### 4.2 手动构建前端

如果你需要自己构建前端（例如修改了前端代码），在前端目录下执行：

```bash
cd MoFox-Core-Webui/forward/mofox-webui
npm install
npm run build
```

构建完成后，静态文件会生成在 `forward/mofox-webui/dist` 目录中。

将构建产物复制到后端的 static 目录：

```powershell
# Windows PowerShell
Copy-Item -Path forward\mofox-webui\dist\* -Destination backend\static\ -Recurse -Force

# Linux/Mac
cp -r forward/mofox-webui/dist/* backend/static/
```

复制完成后，重启 MoFox-Bot，访问 http://localhost:12138 即可。

### 4.3 使用独立的 Web 服务器（高级）

如果你需要自定义域名、HTTPS 或者更灵活的配置，可以使用独立的 Web 服务器来托管前端文件。

构建完成后，静态文件会生成在 `forward/mofox-webui/dist` 目录中。

### 4.2 部署前端文件

你可以使用任何静态文件服务器来部署这些文件，例如：

#### 方式一：使用 Nginx

将 `dist` 目录中的文件复制到 Nginx 的网站根目录，配置示例：

```nginx
server {
    listen 11451;
    server_name localhost;
    root /path/to/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

#### 方式二：使用 serve（简单快速）

安装 `serve` 工具：

```bash
npm install -g serve
```

然后运行：

```bash
serve -s dist -l 11451
```

#### 方式三：使用 Apache、Caddy 等

根据你熟悉的服务器软件配置即可。

## 五、工作原理：它是怎么运作的？

理解 WebUI 的工作流程，能帮助你更好地排查问题。

```
┌─────────────┐       ┌──────────────────┐       ┌─────────────┐
│   前端 UI   │──1──▶ │ 发现服务器:12138 │──2──▶ │  返回信息   │
│ localhost:  │       │  (固定端口)      │       │ host + port │
│   11451     │       └──────────────────┘       └─────────────┘
└──────┬──────┘                                          │
       │                                                 │
       └────────────────3. 使用返回的地址访问─────────────┘
                              ▼
                    ┌──────────────────┐
                    │   主程序 API     │
                    │ plugins/         │
                    │ webui_backend/*  │
                    └──────────────────┘
```

**流程说明**：
1. **前端访问固定端口 12138**：前端首先会访问发现服务器（端口固定为 12138），获取 MoFox-Bot 主程序的实际地址
2. **发现服务器返回信息**：发现服务器返回主程序的 IP 和端口
3. **前端连接主程序**：前端使用获取到的地址 + API Key，访问受保护的 API 接口

::: tip 为什么要这样设计？
因为 MoFox-Bot 主程序的端口可能是动态分配的，而前端需要一个固定的入口才能找到它。发现服务器就像一个"导航站"，告诉前端"主程序在哪儿"。
:::

## 六、项目结构说明

了解项目结构有助于你进行定制化开发或排查问题。

```
MoFox-Core-Webui/
├── backend/                    # 后端插件（需要复制到 Bot 插件目录）
│   ├── plugin.py              # 主插件类
│   ├── discovery_server.py    # 服务发现服务器（端口 12138）
│   ├── handlers/              # 生命周期处理器
│   │   ├── startup_handler.py
│   │   └── shutdown_handler.py
│   └── routers/               # API 路由
│       ├── auth.py           # 认证接口
│       ├── stats.py          # 统计数据接口
│       ├── plugin_mgmt.py    # 插件管理接口
│       ├── config_mgmt.py    # 配置管理接口
│       └── marketplace.py    # 插件市场接口
│
└── forward/                   # 前端项目
    └── mofox-webui/
        ├── src/
        │   ├── components/   # Vue 组件
        │   ├── views/        # 页面视图
        │   ├── router/       # 路由配置
        │   └── stores/       # 状态管理（Pinia）
        ├── package.json
        └── vite.config.ts
```

## 七、常见问题排查

遇到问题别慌，先看看这里：

### Q1: 访问 localhost:11451 显示"无法访问此网站"

**可能原因**：
- 前端开发服务器没有启动
- 端口被其他程序占用

**解决方法**：
1. 确认终端中是否有 `npm run dev` 的输出信息
2. 检查端口占用：`netstat -ano | findstr :11451`（Windows）或 `lsof -i :11451`（Mac/Linux）
3. 如果端口被占用，关闭占用程序或修改前端配置文件中的端口

### Q2: 登录后提示"无法连接到后端服务"

**可能原因**：
- MoFox-Bot 主程序没有运行
- 后端插件没有正确加载
- 防火墙阻止了连接

**解决方法**：
1. 确认 MoFox-Bot 主程序正在运行
2. 检查日志，确认 `webui_backend` 插件已加载
3. 确认发现服务器（端口 12138）正常启动
4. 临时关闭防火墙测试

### Q3: 输入 API Key 后提示"认证失败"

**可能原因**：
- API Key 输入错误
- `bot_config.toml` 中的 `plugin_api_valid_keys` 配置不正确

**解决方法**：
1. 仔细核对 API Key 是否与配置文件中的完全一致（包括大小写、空格）
2. 确认 `plugin_api_valid_keys` 列表不为空
3. 修改配置后记得**重启 MoFox-Bot**

### Q4: 修改配置后需要重启吗？

**关于后端配置**：
- 修改 `bot_config.toml` 后，**需要重启 MoFox-Bot 主程序**

**关于前端配置**：
- 修改前端配置后（如发现服务器地址），**需要重启前端开发服务器**（Ctrl+C 停止，然后重新 `npm run dev`）

### Q5: 如何修改发现服务器的地址？

如果你的 MoFox-Bot 部署在远程服务器上，需要修改前端配置：

编辑 `forward/mofox-webui/src/api/config.ts`：

```typescript
export const DISCOVERY_SERVER_URL = 'http://your-server-ip:12138'
```

将 `your-server-ip` 替换为你的服务器 IP 地址。

## 八、技术栈说明

如果你想参与开发或深度定制，了解技术栈会很有帮助。

### 前端
- **Vue 3**：渐进式 JavaScript 框架
- **TypeScript**：带类型系统的 JavaScript 超集
- **Vite**：新一代前端构建工具，速度极快
- **Vue Router**：Vue 官方路由管理器
- **Pinia**：轻量级状态管理库
- **ECharts**：强大的数据可视化图表库
- **Marked**：Markdown 渲染库

### 后端
- **FastAPI**：现代、高性能的 Python Web 框架
- **Uvicorn**：轻量级 ASGI 服务器
- **MoFox Plugin System**：与 MoFox-Bot 插件系统深度集成

## 九、开发状态

目前项目的功能完成情况：

- [x] 后端插件系统
- [x] 服务发现机制
- [x] 用户认证
- [x] 仪表盘统计
- [x] 插件管理
- [x] 插件市场
- [x] 配置编辑器
- [x] 实时日志查看
- [ ] 响应式布局
- [ ] 消息历史查看
- [ ] 定时任务管理
- [ ] 用户权限管理

我们会持续开发新功能，敬请期待！

## 十、安全性说明

WebUI 采用了多层安全机制：

- **API Key 验证**：所有敏感接口都需要在请求头中携带 `X-API-Key`
- **固定发现端口**：仅发现服务使用固定端口（12138），主要 API 使用动态端口
- **CORS 配置**：后端已正确配置 CORS，支持跨域访问但限制了来源
- **插件隔离**：后端以插件形式运行，与主程序隔离，降低安全风险

::: warning 生产环境建议
如果你要在公网环境部署 WebUI，强烈建议：
1. 使用 HTTPS 加密传输
2. 定期更换 API Key
3. 限制访问 IP 范围
4. 启用防火墙规则
:::

## 十一、贡献与反馈

如果你在使用过程中遇到问题，或者有好的建议，欢迎：

- 在 GitHub 提交 Issue
- 提交 Pull Request
- 加入社区讨论

---

好了，现在你已经掌握了 MoFox-Bot WebUI 的完整使用方法。去享受可视化管理带来的便利吧！如果还有疑问，随时查阅本文档或联系社区。
