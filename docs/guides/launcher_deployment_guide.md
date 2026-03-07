# Neo-MoFox Launcher 部署指南

## 简介

Neo-MoFox Launcher 是一个现代化的桌面应用程序，专为 Neo-MoFox QQ 机器人框架设计的图形化实例管理工具。它采用 Material Design 3 设计风格，提供直观友好的用户界面，让您无需复杂的命令行操作即可轻松部署和管理多个机器人实例。

### 核心特性

- 🎯 **图形化安装向导** - 一步步引导完成所有配置，零命令行操作
- 🚀 **一键自动部署** - 自动克隆仓库、创建虚拟环境、安装依赖、配置 NapCat
- 📦 **多实例管理** - 在同一电脑上轻松管理多个不同的机器人实例
- 🔄 **版本管理** - 支持稳定版 (main) 和开发版 (dev) 分支切换
- 💎 **Material Design 3** - 遵循现代设计规范的精美界面
- 🛡️ **进程管理** - 实时监控运行状态，支持自动崩溃恢复


## 系统要求

### 必备条件

在使用 Neo-MoFox Launcher 之前，请确保您的系统满足以下要求：

| 项目 | 要求 |
|------|------|
| **操作系统** | Windows 10/11 (64-bit) |
| **Python** | 3.11 或更高版本 |
| **Git** | 任意版本（用于克隆仓库） |
| **uv** | Python 包管理器 |
| **硬件** | 至少 4GB RAM，2GB 可用磁盘空间 |
| **网络** | 稳定的互联网连接（用于下载依赖） |

> [!TIP]
> Launcher 会在首次运行时自动检测这些工具是否已安装。如果有缺失，会提示您进行安装。

### 安装必备工具

#### 1. 安装 Python

1. 访问 [Python 官网](https://www.python.org/downloads/) 下载 Python 3.11+ 安装包
2. 运行安装程序，**务必勾选 "Add Python to PATH"**
3. 完成安装后，打开命令提示符验证：
   ```powershell
   python --version
   # 应显示 Python 3.11.x 或更高版本
   ```

#### 2. 安装 Git

1. 访问 [Git 官网](https://git-scm.com/downloads) 下载安装包
2. 运行安装程序，保持默认选项即可
3. 验证安装：
   ```powershell
   git --version
   ```

#### 3. 安装 uv

打开命令提示符或 PowerShell，执行：

```powershell
pip install uv
```

验证安装：
```powershell
uv --version
```

---

## 快速开始

### 下载 Launcher

**目前 Neo-MoFox Launcher 仍在开发中**，您可以通过以下方式获取：

#### 方式一：下载预构建版本（推荐）

从 [GitHub Releases](https://github.com/MoFox-Studio/Neo-MoFox-Launcher/releases) 下载对应平台的最新 nightly 版本。当前发布的二进制格式包括：

- **Windows 安装包**：`Neo-MoFox-Launcher-<date>-nightly-win-<arch>-setup.exe`
- **Windows 便携版**：`Neo-MoFox-Launcher-<date>-nightly-win-<arch>-portable.exe`
- **Linux deb 包**：`Neo-MoFox-Launcher-<date>-nightly-linux-<arch>.deb`

将安装包双击运行即可安装；便携版无需安装，可直接执行；Linux 下使用 `dpkg -i` 命令安装 deb 包。



## 首次运行：环境检测

首次启动 Launcher 时，会先进行环境检测，确保系统已安装所有必备工具。

### 环境检测流程

Launcher 会自动检测以下必备工具：

- ✅ **Python 3.11+** - 机器人运行的核心环境
- ✅ **Git** - 用于克隆机器人仓库
- ✅ **uv** - Python 包管理器，用于管理依赖

#### 智能检测与自动安装

- **有缓存**：如果7天内已通过检测，会直接进入主界面
- **检测失败**：如发现缺失工具，会显示 **"一键安装"** 按钮
- **自动安装**：点击一键安装后，Launcher 会自动下载并安装缺失的工具
- **检测通过**：所有工具就绪后，点击 **"继续"** 进入主界面

> [!TIP]
> Launcher 的自动安装功能会在后台静默安装缺失的工具，无需手动操作。

---

## 创建第一个实例

环境检测通过后，您会看到 Launcher 的主界面。此时还没有任何机器人实例，需要手动添加。

### 添加新实例

1. 在主界面点击 **"+ 添加实例"** 按钮
2. 进入安装向导，填写实例信息

### 实例配置信息

在安装向导中需要填写以下信息：

| 字段 | 说明 | 示例 |
|------|------|------|
| **实例名称** | 为这个机器人实例起一个便于识别的名字 | `我的测试Bot` |
| **Bot QQ 号** | 用作机器人的 QQ 账号 | `1234567890` |
| **Bot QQ 昵称** | 机器人的昵称 | `测试Bot` |
| **管理员 QQ 号** | 您作为管理员的 QQ 号 | `9876543210` |
| **安装路径** | 机器人文件的安装位置 | `D:\Neo-MoFox-Bots` |
| **WebSocket 端口** | NapCat 反向 WebSocket 端口 | `8095`（默认） |
| **LLM API Key** | 大语言模型的 API 密钥 | `sk-xxxxxxxxxx` |
| **API 基础 URL** | API 服务的基础地址 | `https://api.siliconflow.cn/v1` |
| **版本分支** | 选择稳定版或开发版 | `main`（稳定版） |

> [!IMPORTANT]
> - **安装路径** 建议选择空间充足的磁盘，避免使用中文路径
> - **API Key** 可从 [SiliconFlow](https://cloud.siliconflow.cn/) 等平台获取
> - **端口号** 确保未被其他程序占用（8095 为默认推荐端口）

### 自动安装流程

填写完实例信息后，点击 **"开始安装"**，Launcher 会自动执行以下操作（预计需要 5-10 分钟）：

1. 📥 克隆 Neo-MoFox 仓库
2. 🐍 创建 Python 虚拟环境
3. 📦 安装所有 Python 依赖包
4. ⚙️ 生成并配置 `core.toml` 和 `model.toml`
5. 🤖 下载并配置 NapCat 适配器
6. 🎉 完成安装，注册实例

> [!TIP]
> 安装过程中请保持网络连接稳定。如果因网络问题失败，可以稍后在实例管理界面重试安装。

---

## 使用 Launcher

### 主界面

安装完成后，您将看到 Launcher 的主界面，以卡片形式展示所有已配置的机器人实例：

**实例卡片包含：**
- 实例名称和描述
- Bot QQ 号
- 安装路径
- 当前运行状态（运行中 / 已停止 / 安装中）
- 快捷操作按钮（启动、设置）

### 启动机器人

1. 点击实例卡片上的 **"启动"** 按钮
2. 进入实例详情页，显示实时日志输出
3. 等待启动完成，机器人即可开始工作

### 停止机器人

在实例详情页中，点击 **"停止"** 按钮即可安全关闭机器人进程。

### 添加更多实例

如需创建第二个、第三个机器人实例（例如管理多个 Bot 账号）：

1. 在主界面点击 **"+ 添加实例"** 卡片
2. 重复上述配置向导流程，填写新实例的信息
3. 等待自动安装完成
4. 新实例将出现在主界面上

### 编辑实例

1. 点击实例卡片上的 **"设置"** (⚙️) 按钮
2. 可修改实例名称和描述
3. **注意**：核心配置（QQ 号、端口、API Key 等）需要手动编辑配置文件：
   - 进入实例安装目录
   - 编辑 `config/core.toml` 和 `config/model.toml`

### 删除实例

1. 在编辑窗口中点击 **"删除实例"** 按钮
2. 确认后将删除实例记录及所有相关文件

> [!WARNING]
> 删除操作不可撤销！请确保已备份重要数据。

---

## 配置 NapCat WebSocket

在大多数情况下，Launcher 会自动配置好 NapCat 的 WebSocket 连接。但如果遇到消息收发问题，可以手动检查：

### 自动配置说明

Launcher 在安装过程中会自动：
- 在 NapCat 配置中创建反向 WebSocket 客户端
- 设置连接地址为 `ws://127.0.0.1:8095`（或您指定的端口）
- 启用该连接

### 手动检查（如需）

如果机器人无法正常收发消息：

1. 等待所有服务完全启动
2. 访问 NapCat WebUI：`http://127.0.0.1:6099`
   - 默认 TOKEN：请查看 NapCat 日志界面输出的启动日志，找到类似 `NapCat Token: napcat` 的行确认
3. 进入"网络配置"页面
4. 检查是否存在反向 WebSocket 客户端，且：
   - 地址：`ws://127.0.0.1:8095`
   - 状态：已启用
5. 如需修改，保存后重启机器人实例

---

## 常见问题 (FAQ)

### Q1：环境检测失败怎么办？

**A**：按照提示安装缺失的工具（Python、Git、uv），确保命令行中可以正常调用这些命令。安装完成后重新启动 Launcher。

### Q2：安装过程中出现网络错误？

**A**：
- 检查网络连接是否稳定
- 如果是下载依赖包失败，可以尝试使用国内镜像
- 可以在实例管理界面点击"重试安装"

### Q3：如何切换到开发版（dev 分支）？

**A**：目前版本管理功能正在开发中。敬请期待后续更新。

### Q4：如何备份机器人数据？

**A**：
- 定期备份实例安装目录下的 `data/` 文件夹
- 备份 `config/` 文件夹中的配置文件
- 重要对话数据存储在 SQLite 数据库中（`data/MaiBot.db`）

### Q5：可以在 Linux 或 Mac 上使用吗？

**A**：当前版本支持 Windows 和 Linux。Mac 支持正在开发中。

### Q6：启动后提示端口被占用？

**A**：
- 检查 8095 端口是否被其他程序占用
- 可以在安装向导中修改为其他端口（如 8096、8097）
- Windows 下使用 `netstat -ano | findstr 8095` 查看端口占用情况
- Linux 下使用 `lsof -i :8095` 查看端口占用情况

### Q7：如何查看错误日志？

**A**：
- Launcher 日志：`%APPDATA%\Neo-MoFox-Launcher\logs\`
- 机器人日志：实例安装目录 `logs/` 文件夹

### Q8：更新后启动失败？

**A**：
- 尝试在实例详情页点击"重启"
- 检查 `logs/` 目录中的错误信息
- 可能需要重新运行依赖安装（未来版本将支持）

### Q9：环境检测一直失败怎么办？

**A**：
- 确保已关闭杀毒软件或防火墙的拦截
- 如果一键安装失败，可以手动按照"安装必备工具"章节的步骤安装
- 在设置中找到"环境管理"，可以手动触发重新检测
- 检查系统 PATH 环境变量是否包含 Python、Git、uv 的路径

---

## 目录结构

Launcher 会按以下结构组织文件：

```
应用数据目录 (%APPDATA%\Neo-MoFox-Launcher\)
├── instances.json       # 实例列表配置
├── launcher.log         # Launcher 日志
└── logs/                # 详细日志目录

实例安装目录 (您指定的安装路径)
├── <实例ID>/
│   ├── neo-mofox/       # Neo-MoFox 主程序
│   │   ├── .venv/       # Python 虚拟环境
│   │   ├── config/      # 配置文件
│   │   ├── data/        # 数据库和用户数据
│   │   ├── logs/        # 运行日志
│   │   └── plugins/     # 插件目录
│   │
│   └── napcat/          # NapCat 适配器
│       ├── NapCat.Shell.exe
│       └── config/      # NapCat 配置
```

---

## 获取帮助

如果遇到问题，可以通过以下方式获取帮助：

- 📖 查阅 [Neo-MoFox 官方文档](https://mofox-studio.github.io/MoFox-Bot-Docs/)
- 🐛 提交 [GitHub Issue](https://github.com/MoFox-Studio/Neo-MoFox-Launcher/issues)
- 💬 加入 QQ 群：[Neo-MoFox 官方群](https://qm.qq.com/q/jfeu7Dq7VS)

---

*感谢使用 Neo-MoFox Launcher！祝您使用愉快！* 🎉
