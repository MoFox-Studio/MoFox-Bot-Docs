# Neo-MoFox WebUI 部署指南

欢迎！这份指南会手把手教你如何部署 WebUI——让你**从命令行地狱中解脱出来**，用浏览器优雅地管理你的机器人。

:::warning 测试阶段
WebUI 还在测试中，偶尔会闹点小脾气。遇到 bug 别慌，来 GitHub 提 Issue，我们一起修！
:::


## 第一步：确认你已经装好了主程序

开始之前，确保你已经：
- ✅ 安装并能正常运行 Neo-MoFox 主程序
- ✅ 电脑上装了 Git（没装的话去 [git-scm.com](https://git-scm.com/) 下一个，Windows 用户一路下一步就行）

::: tip 为什么要用 Git？
因为 Git 能让你**一键更新 WebUI**，不用每次都手动下载。信我，偷懒是第一生产力。
:::

## 第二步：把 WebUI 克隆到插件目录

打开终端（Windows 用 PowerShell，Mac/Linux 用 Terminal），然后：

:::code-group
```powershell [Windows]
# 进入你的 Neo-MoFox 插件目录
cd E:\delveoper\mmc010\Neo-MoFox\plugins

# 克隆预编译版本（webui-dist 分支）
git clone -b webui-dist https://github.com/MoFox-Studio/MoFox-Core-Webui.git
```

```bash [Linux / macOS]
# 进入插件目录（改成你自己的路径）
cd /path/to/Neo-MoFox/plugins

# 克隆预编译版本
git clone -b webui-dist https://github.com/MoFox-Studio/MoFox-Core-Webui.git
```
:::

::: tip 为什么是 webui-dist 分支？
因为这个分支里已经有**编译好的前端文件**，下载就能用，不用折腾 Node.js 和 npm。

而且！这个分支支持**一键更新**——以后在 WebUI 界面里点一下就能升级，爽歪歪。
:::

克隆完成后，你的目录结构应该长这样：

```
Neo-MoFox/
├── plugins/
│   └── MoFox-Core-Webui/     ← 新克隆的 WebUI 插件
│       ├── backend/           ← 后端代码
│       │   ├── static/        ← 编译好的前端文件
│       │   ├── router/        ← API 路由
│       │   └── ...
│       └── ...
└── ...
```


## 第三步：配置登录密钥

编辑 Neo-MoFox 的配置文件：

```
<Neo-MoFox安装目录>/config/core.toml
```

找到 `[http_router]` 这一节，设置你的 API Key：

```toml
[http_router]
# 是否启用 HTTP 路由（必须是 true）
enable_http_router = true

# 监听地址（本机访问用 127.0.0.1，局域网访问用 0.0.0.0）
http_router_host = "127.0.0.1"

# 监听端口（默认 8000，别和其他程序冲突就行）
http_router_port = 8000

# 登录密钥列表（重点在这里！）
api_keys = [
    "your-super-secret-key-here",  # 改成你自己的密钥
]
```

::: danger 安全提醒
**API Key 就像你家钥匙，别随便给别人！**

推荐生成一个随机字符串：
- **Windows PowerShell**：`[System.Guid]::NewGuid().ToString()`
- **Linux/Mac**：`openssl rand -hex 32`

把生成的结果复制到 `<Neo-MoFox安装目录>/config/core.toml` 的 `api_keys` 列表里。
:::

**配置示例**（仅供参考，别直接复制）：

```toml
api_keys = [
    "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
]
```



## 第四步：启动主程序

保存配置文件后，启动（或重启）Neo-MoFox：

```bash
# 在 Neo-MoFox 根目录运行
uv run main.py
```

启动成功后，你会在日志里看到类似这样的提示：

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          🌐 WebUI 可访问地址
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
监听地址: 127.0.0.1:8000

🖥️  本机访问
  ▶ http://localhost:8000/webui/frontend
  ▶ http://127.0.0.1:8000/webui/frontend

🌐 局域网访问
  ▶ http://192.168.1.100:8000/webui/frontend  ← 推荐
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

::: tip 看到这个提示就成功了！
日志里会自动显示所有可访问的地址，包括局域网 IP。手机想访问的话，用带 🌐 标记的那个。
:::



## 第五步：打开浏览器登录

1. **复制可访问地址**（推荐用 `http://localhost:8000/webui/frontend`）
2. **打开浏览器**，粘贴地址，回车
3. **输入密钥**，就是你刚才在 `config/core.toml` 里配置的那个 `api_keys`
4. **点击登录**

登录成功后，你会看到一个漂亮的仪表盘，上面有各种统计数据、插件列表、配置编辑器等等。

::: tip 恭喜你！🎉
到这里你已经完成部署了！现在可以愉快地用浏览器管理机器人了。

想更新 WebUI？打开侧边栏，找到「更新管理」，点一下就行。
:::



## 常见问题（遇到问题先看这里）

### Q1: 浏览器显示"无法访问此网站"

**原因**：
- Neo-MoFox 主程序没运行
- 插件没加载成功
- 端口被占用了

**解决方法**：
1. 确认主程序正在运行（看终端有没有报错）
2. 检查日志，确认 `MoFox-Core-Webui` 插件已加载
3. 检查端口占用：
   - **Windows**：`netstat -ano | findstr :8000`
   - **Linux/Mac**：`lsof -i :8000`
   如果被占用，修改 `<Neo-MoFox安装目录>/config/core.toml` 里的 `http_router_port`，改成其他没被占用的端口（如 8080），然后重启主程序。

### Q2: 输入密钥后提示"认证失败"

**原因**：
- 密钥输入错误（注意大小写和空格！）
- 配置文件里 `api_keys` 是空的

**解决方法**：
1. 仔细核对密钥是否和配置文件里的**完全一致**
2. 确认 `<Neo-MoFox安装目录>/config/core.toml` 的 `[http_router]` 部分，`api_keys` 列表不为空
3. 修改配置后**必须重启主程序**

### Q3: 能登录，但是功能用不了

**原因**：可能是前端文件没下载完整，或者 Git 克隆出问题了

**解决方法**：
```bash
cd plugins/MoFox-Core-Webui
git pull origin webui-dist
```

重新拉取一遍代码，然后重启主程序。


### Q4: 局域网访问不了（手机/其他电脑）

**原因**：监听地址设置成 `127.0.0.1` 了

**解决方法**：
编辑 `config/core.toml`，把 `http_router_host` 改成 `0.0.0.0`：

```toml
http_router_host = "0.0.0.0"
```

然后重启主程序。

::: warning 安全提示
`0.0.0.0` 会让所有网络都能访问，包括公网（如果你的路由器转发了的话）。

**如果暴露到公网**，强烈建议：
- 用超级复杂的 API Key
- 配置防火墙规则限制访问 IP
- 考虑用 Nginx 反向代理加上 HTTPS
:::

### Q5: 想用其他端口怎么办？

编辑 `config/core.toml`，修改 `http_router_port`：

```toml
http_router_port = 9999  # 改成你想要的端口
```

重启主程序，然后访问 `http://localhost:9999/webui/frontend`。

## 一键更新（懒人必看）

WebUI 支持**在界面内一键更新**，不用手动下载：

1. 登录 WebUI
2. 打开侧边栏，找到 **「更新管理」**
3. 点击 **「检查更新」**
4. 如果有新版本，点击 **「立即更新」**

更新会自动：
- 从 GitHub 拉取最新代码
- 备份当前版本（万一翻车可以回滚）
- 刷新页面

::: tip 更新失败了？
别慌！WebUI 会自动备份，你可以在「历史版本」里回滚到之前的版本。
:::



## 手动下载方式（不推荐）

如果你实在没法用 Git，也可以手动下载 ZIP：

1. 访问 [webui-dist 分支](https://github.com/MoFox-Studio/MoFox-Core-Webui/tree/webui-dist)
2. 点击绿色的 **Code** 按钮 → **Download ZIP**
3. 解压到 `plugins/MoFox-Core-Webui/` 目录
4. 重启主程序

::: warning 缺点
手动下载后**无法使用一键更新功能**，每次更新都得重新下载解压。

所以还是强烈建议用 Git！
:::



## 技术细节（给开发者看的）

如果你想了解 WebUI 的工作原理，或者需要进行二次开发，这里有一些技术细节：

### 架构概览

```
用户浏览器
    ↓
http://localhost:8000/webui/frontend
    ↓
[FrontendRouter]  ← 托管静态文件（backend/static/）
    ↓
[ApiRouter]  ← 提供 API 接口（/webui/api/...）
    ↓
插件系统 API（src/core/components/）
```

### 核心组件

- **FrontendRouter**：托管编译好的 Vue 前端（SPA 模式）
- **ApiRouter**：处理认证和 API 请求
- **StartupUrlEventHandler**：系统启动时输出可访问 URL
- **各种功能 Router**：stats、config、plugin_manage、log_viewer 等

### 认证机制

WebUI 使用 `X-API-Key` 请求头进行认证：

1. 前端从用户输入获取密钥
2. 将密钥存储到浏览器 localStorage
3. 所有 API 请求都在请求头中携带 `X-API-Key`
4. 后端通过 `src/core/utils/security.py` 中的 `get_api_key` 验证密钥是否在 `config/core.toml` 的 `api_keys` 列表中

### 目录结构

```
MoFox-Core-Webui/
├── backend/                  # 后端插件代码
│   ├── plugin.py            # 插件入口，注册所有组件
│   ├── manifest.json        # 插件元数据
│   ├── static/              # 编译好的前端文件（webui-dist 分支）
│   │   ├── index.html
│   │   └── assets/
│   ├── router/              # FastAPI 路由组件
│   │   ├── frontend_router.py  # 前端托管
│   │   ├── api_router.py       # 认证 API
│   │   ├── stats_router.py     # 统计数据
│   │   ├── plugin_manage_router.py  # 插件管理
│   │   ├── core_config_router.py    # 配置管理
│   │   ├── git_update_router.py     # Git 更新
│   │   └── ...
│   ├── event_handler/       # 事件处理器
│   │   └── startup_url_event_handler.py  # 启动提示
│   ├── adapter/             # 适配器组件（如聊天室）
│   ├── services/            # 业务逻辑服务
│   ├── storage/             # 数据存储
│   └── utils/               # 工具函数
└── forward/                 # 前端源码（仅开发者需要）
    └── mofox-webui/
        ├── src/
        ├── package.json
        └── ...
```

### 开发模式

如果你想修改前端代码：

```bash
# 克隆完整仓库
git clone https://github.com/MoFox-Studio/MoFox-Core-Webui.git

# 进入前端目录
cd forward/mofox-webui

# 安装依赖
npm install

# 启动开发服务器（热重载）
npm run dev
```

开发服务器会在 `http://localhost:5173` 启动，修改代码后会自动刷新。

前端构建：

```bash
npm run build
```

构建产物会输出到 `forward/mofox-webui/dist/` 目录，需要手动复制到 `backend/static/`。



## 反馈与贡献

遇到问题或有建议？欢迎：

- 🐛 [提交 Bug 报告](https://github.com/MoFox-Studio/MoFox-Core-Webui/issues/new)
- 💡 提出功能建议
- 🛠️ 提交 Pull Request

感谢你的使用！祝你玩得开心 🎉
