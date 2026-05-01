# Neo-MoFox Launcher 使用指南

## 📖 简介

Neo-MoFox Launcher 是一个图形化的机器人管理工具，让您通过可视化界面轻松部署和管理 Neo-MoFox QQ 机器人。**无需敲命令，全程鼠标点击即可完成。**

### 主要功能

- 🎯 **10 步安装向导** - 从环境检测到安装完成，全程自动化
- 📦 **多实例管理** - 在同一台电脑上管理多个不同的机器人账号
- 🚀 **可视化控制** - 启动、停止、查看日志，一目了然
- ⚙️ **智能检测** - 自动检查 Python、Git 等必备工具，缺失即提示


## 💻 系统要求

### 必备条件

| 项目 | 要求 | 说明 |
|------|------|------|
| **操作系统** | Windows 10/11 (64-bit) <br> Linux (x64/ARM64) | 支持主流 Linux 发行版 |
| **Python** | 3.11 或更高版本 | 运行机器人必需 |
| **Git** | 任意版本 | 用于下载代码仓库 |
| **Node.js** | 18 或更高版本 | Linux 下需要（AUR 包会自动处理） |
| **uv** | 最新版本 | Python 包管理器（推荐） |
| **硬盘空间** | 至少 2GB 可用空间 | 用于存放机器人文件 |
| **内存** | 至少 4GB | 推荐 8GB 或更多 |
| **网络** | 稳定的互联网连接 | 需要下载依赖包 |

> [!TIP]
> 不用担心！Launcher 会在首次启动时**自动检测**这些工具。如果缺少，会明确告诉您需要安装什么。

### Linux 特别说明

- **支持架构**：x86_64 (x64)、aarch64 (ARM64)
- **桌面环境**：需要 X11 或 Wayland 支持
- **推荐发行版**：Ubuntu 22.04+、Fedora 40+、Arch Linux、openSUSE Tumbleweed


### 准备工作：安装必备工具

如果您是第一次使用，需要先安装以下工具（如已安装请跳过）：

<details>
<summary><b>📦 安装 Python 3.11+</b>（点击展开）</summary>

:::code-group
```powershell [Windows]
# 1. 访问 Python 官网下载安装包
# https://www.python.org/downloads/
# 2. 运行安装程序时，务必勾选 "Add Python to PATH"
# 3. 验证安装
python --version
# 应显示：Python 3.11.x 或更高版本
```

```bash [Ubuntu/Debian]
# 安装 Python 3.11+
sudo apt update
sudo apt install python3 python3-pip python3-venv

# 验证安装
python3 --version
# 应显示：Python 3.11.x 或更高版本
```

```bash [Fedora]
# 安装 Python 3.11+
sudo dnf install python3 python3-pip

# 验证安装
python3 --version
```

```bash [Arch Linux]
# 安装 Python（Arch 默认提供最新版本）
sudo pacman -S python python-pip

# 验证安装
python --version
```

```bash [openSUSE]
# 安装 Python
sudo zypper install python3 python3-pip

# 验证安装
python3 --version
```
:::

</details>

<details>
<summary><b>🔧 安装 Git</b>（点击展开）</summary>

:::code-group
```powershell [Windows]
# 1. 访问 Git 官网下载安装包
# https://git-scm.com/downloads
# 2. 运行安装程序，保持默认选项
# 3. 验证安装
git --version
```

```bash [Ubuntu/Debian]
# 安装 Git
sudo apt update
sudo apt install git

# 验证安装
git --version
```

```bash [Fedora]
# 安装 Git
sudo dnf install git

# 验证安装
git --version
```

```bash [Arch Linux]
# 安装 Git
sudo pacman -S git

# 验证安装
git --version
```

```bash [openSUSE]
# 安装 Git
sudo zypper install git

# 验证安装
git --version
```
:::

</details>

<details>
<summary><b>⚡ 安装 uv 包管理器</b>（点击展开）</summary>

:::code-group
```powershell [Windows]
# 使用 pip 安装 uv
pip install uv

# 验证安装
uv --version
# 应显示：uv, version x.x.x
```

```bash [Linux (通用)]
# 方法 1: 使用官方安装脚本（推荐）
curl -LsSf https://astral.sh/uv/install.sh | sh

# 方法 2: 使用 pip
pip3 install uv

# 验证安装
uv --version
```

```bash [Arch Linux (AUR)]
# 使用 AUR 助手（如 yay）
yay -S uv

# 或使用 pip
pip install uv

# 验证安装
uv --version
```
:::

</details>

<details>
<summary><b>🟢 安装 Node.js（Linux 需要）</b>（点击展开）</summary>

:::code-group
```bash [Ubuntu/Debian]
# 添加 NodeSource 仓库（Node.js 20 LTS）
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# 安装 Node.js
sudo apt install nodejs

# 验证安装
node --version
npm --version
```

```bash [Fedora]
# 安装 Node.js 20
sudo dnf install nodejs

# 验证安装
node --version
```

```bash [Arch Linux]
# 安装 Node.js（使用 Arch 的 nodejs 包）
sudo pacman -S nodejs npm

# 验证安装
node --version
```

```bash [openSUSE]
# 安装 Node.js
sudo zypper install nodejs npm

# 验证安装
node --version
```
:::

> [!NOTE]
> 如果使用 AUR 安装 Launcher，Node.js 会作为依赖自动安装。

</details>


## 🚀 完整安装流程

接下来，我们将按照实际操作步骤，一步一步引导您完成机器人的安装和启动。


## 第一步：下载并安装 Launcher

### 1.1 下载地址

从 [GitHub Releases](https://github.com/MoFox-Studio/Neo-MoFox-Launcher/releases) 下载最新版本的 Launcher。

### 1.2 选择合适的版本

#### Windows 用户

| 文件名 | 说明 | 适合人群 |
|--------|------|----------|
| `Neo-MoFox-Launcher-*-win-x64-setup.exe` | **安装版**（推荐） | 想要添加到开始菜单、桌面快捷方式 |
| `Neo-MoFox-Launcher-*-win-x64-portable.exe` | 便携版 | 不想安装、直接运行，或使用 U 盘 |
| `Neo-MoFox-Launcher-*-win-ia32-*.exe` | 32 位版本 | 32 位 Windows 系统 |
| `Neo-MoFox-Launcher-*-win-arm64-*.exe` | ARM64 版本 | Windows on ARM 设备 |

#### Linux 用户

| 文件名 | 说明 | 适合人群 |
|--------|------|----------|
| `Neo-MoFox-Launcher-*-linux-x64.deb` | Debian/Ubuntu 安装包 | Debian、Ubuntu、Mint 等发行版 |
| `Neo-MoFox-Launcher-*-linux-arm64.deb` | Debian/Ubuntu ARM64 包 | 树莓派、ARM 服务器等 |
| `Neo-MoFox-Launcher-*-linux-x64.AppImage` | AppImage 通用包 | 所有 Linux 发行版（免安装） |
| `Neo-MoFox-Launcher-*-linux-arm64.AppImage` | AppImage ARM64 包 | ARM 架构的 Linux 系统 |

> [!NOTE]
> 文件名中的 `*` 代表版本号和构建日期（如 `20260501-nightly`）

### 1.3 安装步骤

#### Windows 安装

**使用安装版**：
1. 双击下载的 `-setup.exe` 文件
2. 按照安装向导提示完成安装
3. 安装完成后，从开始菜单或桌面快捷方式启动

**使用便携版**：
1. 直接双击 `-portable.exe` 文件即可运行
2. 无需安装，但需保留文件在固定位置

#### Linux 安装

:::code-group
```bash [Debian/Ubuntu (.deb)]
# 1. 下载 .deb 文件后，在文件所在目录执行：
sudo dpkg -i Neo-MoFox-Launcher-*-linux-x64.deb

# 2. 如果提示依赖缺失，运行：
sudo apt install -f

# 3. 启动应用
neo-mofox-launcher
# 或从应用菜单中找到 "Neo-MoFox Launcher"

# 卸载
sudo apt remove neo-mofox-launcher
```

```bash [Arch Linux (AUR)]
# 方法 1: 使用 AUR 助手（推荐）
yay -S neo-mofox-launcher-git
# 或
paru -S neo-mofox-launcher-git

# 方法 2: 手动构建
git clone https://aur.archlinux.org/neo-mofox-launcher-git.git
cd neo-mofox-launcher-git
makepkg -si

# 启动应用
neo-mofox-launcher

# 卸载
sudo pacman -R neo-mofox-launcher-git
```

```bash [通用 Linux (AppImage)]
# 1. 下载 .AppImage 文件后，赋予执行权限：
chmod +x Neo-MoFox-Launcher-*-linux-x64.AppImage

# 2. 直接运行
./Neo-MoFox-Launcher-*-linux-x64.AppImage

# 可选：集成到系统（添加桌面快捷方式）
# 某些发行版支持通过 AppImageLauncher 自动集成

# 移动到 /opt 便于管理（可选）
sudo mv Neo-MoFox-Launcher-*.AppImage /opt/neo-mofox-launcher
sudo ln -s /opt/neo-mofox-launcher /usr/local/bin/neo-mofox-launcher
```

```bash [Fedora (.deb → .rpm 转换)]
# Fedora 不直接支持 .deb，但可以转换或使用 AppImage

# 方法 1: 使用 AppImage（推荐）
chmod +x Neo-MoFox-Launcher-*-linux-x64.AppImage
./Neo-MoFox-Launcher-*-linux-x64.AppImage

# 方法 2: 从源码构建（需要 npm 和 electron）
# 参考 GitHub 仓库的构建说明
```

```bash [openSUSE]
# 使用 AppImage（推荐）
chmod +x Neo-MoFox-Launcher-*-linux-x64.AppImage
./Neo-MoFox-Launcher-*-linux-x64.AppImage
```
:::

#### Linux 依赖检查

安装后，首次启动前建议检查依赖：

:::code-group
```bash [Ubuntu/Debian]
# 检查必备工具
python3 --version  # 应 >= 3.11
git --version
node --version     # 应 >= 18
uv --version       # 可选但推荐

# 如有缺失，安装
sudo apt install python3 python3-pip git nodejs
pip3 install uv
```

```bash [Arch Linux]
# 检查必备工具
python --version   # 应 >= 3.11
git --version
node --version

# 如有缺失，安装（AUR 包应已自动安装）
sudo pacman -S python git nodejs
pip install uv
```

```bash [Fedora]
# 检查必备工具
python3 --version
git --version
node --version

# 如有缺失，安装
sudo dnf install python3 python3-pip git nodejs
pip3 install uv
```

```bash [openSUSE]
# 检查必备工具
python3 --version
git --version
node --version

# 如有缺失，安装
sudo zypper install python3 python3-pip git nodejs
pip3 install uv
```
:::

> [!TIP]
> **Linux 用户注意事项**：
> - AppImage 在某些发行版上可能需要安装 `fuse` 或 `fuse2` 才能运行
> - AUR 包会自动处理所有依赖，是 Arch 用户的最佳选择


## 第二步：首次启动 - OOBE 向导

安装完成后，首次启动 Launcher 会自动进入 **OOBE（开箱即用）向导**，引导您完成初始化配置。整个流程分为 6 个步骤。

### 2.1 步骤 1：欢迎

欢迎界面会介绍 Neo-MoFox Launcher 的主要功能特性：
- 🚀 **快速部署** - 一键创建和管理多个机器人实例
- 📊 **实时监控** - 监控实例状态、日志和性能指标
- 🧩 **丰富功能** - 支持插件管理、配置编辑等丰富功能

点击"下一步"继续。

### 2.2 步骤 2：环境检测

Launcher 会自动检测系统中的必备工具：

| 工具 | 说明 | 是否必需 |
|------|------|----------|
| **Python 3.11+** | 运行 Neo-MoFox 机器人的核心环境 | ✅ 必需 |
| **uv** | Python 包管理器，用于快速安装依赖 | ✅ 必需 |
| **Git** | 用于克隆机器人仓库和更新代码 | ✅ 必需 |

#### 自动安装缺失工具

如果检测到工具缺失，Launcher 会显示"自动安装"按钮。点击后：

- **Windows 用户**：Launcher 会尝试自动下载并安装（可能需要管理员权限）
- **Linux 用户**：Launcher 会使用系统包管理器安装（如 `apt`、`dnf`、`pacman` 等）

> [!IMPORTANT]
> **Linux 用户需要输入密码**：
> 
> 安装工具需要管理员权限，Launcher 会弹出对话框要求您输入 **sudo 密码**。
> 
> - 输入您的用户密码（通常是登录系统的密码）
> - 如果密码错误，您最多有 3 次重试机会
> 
> Launcher **不会保存**您的密码，仅用于本次安装操作。

#### 手动安装

如果自动安装失败，或您希望手动安装，可以：
1. 点击"取消"退出 OOBE
2. 参考前面的"准备工作：安装必备工具"章节手动安装
3. 安装完成后重新启动 Launcher

### 2.3 步骤 3：安装路径

设置机器人实例的默认安装目录。建议选择：
- 磁盘空间充足的位置（至少 5GB 可用空间）
- 路径中不包含中文或特殊字符（避免潜在兼容性问题）

**示例路径**：
- Windows: `D:\Neo-MoFox_Bots`
- Linux: `/home/你的用户名/Neo-MoFox_Bots`

> [!TIP]
> 留空则每次创建实例时手动选择路径。您也可以在设置中随时修改默认路径。

### 2.4 步骤 4：主题设置

选择您喜欢的界面风格：

**主题模式**：
- 🌞 **浅色** - 明亮的浅色界面
- 🌙 **深色** - 护眼的深色界面（默认）
- 🔄 **跟随系统** - 自动跟随操作系统主题

**强调色**：
- 提供 6 种预设颜色（蓝色、紫色、粉色、橙色、绿色等）
- 支持自定义颜色选择器

> [!NOTE]
> 主题设置会实时预览，您可以立即看到效果。稍后可在设置中随时更改。

### 2.5 步骤 5：偏好设置

配置 Launcher 的行为选项：

| 设置项 | 说明 | 默认值 |
|--------|------|--------|
| **日志保留天数** | 自动清理 N 天前的日志文件 | 7 天 |
| **压缩旧日志** | 归档日志时自动压缩以节省空间 | 启用 |
| **WebUI 自动打开** | 启动 NapCat 时自动在浏览器中打开 WebUI | 启用 |
| **自动检查更新** | 定期检查实例和 Launcher 的更新 | 启用 |
| **配置编辑器** | 使用内置编辑器或外部编辑器编辑配置文件 | 内置编辑器 |

> [!TIP]
> 这些设置都是可选的，可以跳过使用默认值，稍后在设置中调整。

### 2.6 步骤 6：完成

OOBE 向导完成！页面会显示您的配置摘要：
- ✅ 安装路径
- ✅ 主题模式和强调色
- ✅ 日志和行为偏好

点击"开始使用"按钮，Launcher 会保存配置并跳转到主界面。


## 第三步：主界面介绍

完成 OOBE 后，您将进入 Launcher 的主界面 - **实例管理面板**。

### 3.1 界面布局

主界面采用卡片式布局，包含以下区域：

**顶部标题栏**：
- 显示欢迎语和当前时间问候（早上好/下午好/晚上好）
- 显示每日名言（可刷新）

**实例卡片区域**：
- 以卡片形式展示所有已创建的机器人实例
- 每个卡片显示实例名称、QQ 号、运行状态和控制按钮

**底部浮动操作栏**：
- ➕ **新建实例** - 创建新的机器人实例
- ⚙️ **环境管理** - 管理 Python 虚拟环境和依赖
- 🔧 **设置** - 打开 Launcher 全局设置

**系统监控**：
- 实时显示 CPU 和内存使用率
- 帮助您监控系统资源

### 3.2 实例卡片说明

每个实例卡片包含以下信息：

| 元素 | 说明 |
|------|------|
| **状态指示器** | 绿色=运行中，灰色=已停止，黄色=启动中，红色=错误 |
| **实例名称** | 您创建实例时设置的名称 |
| **QQ 号** | 机器人绑定的 QQ 账号 |
| **运行时长** | 实例已运行的时间（如果在运行中） |
| **控制按钮** | 启动/停止/重启/打开日志/设置 |

**快捷操作**：
- 点击卡片 → 打开实例详细页面（查看日志、监控性能）
- 右键卡片 → 显示更多操作菜单

### 3.3 首次使用提示

如果您还没有创建任何实例，界面中央会显示提示卡片：
- 📦 **创建第一个实例** - 点击"新建实例"开始
- 📚 **查看文档** - 链接到使用指南
- 💡 **快速入门视频** - 观看操作演示（如果有）


## 第四步：创建机器人实例

主界面点击"新建实例"按钮，会弹出选择对话框，提供两种安装方式：

### 方式 1：从头安装（全新配置）

适合首次使用或需要自定义配置的用户。安装向导共分为 10 个步骤，系统会引导您逐步完成配置。

#### 4.1.1 实例信息配置

设置机器人实例的基本标识信息。

| 字段 | 说明 | 示例 |
|------|------|------|
| **实例名称** | 自定义实例的显示名称，用于在 Launcher 中标识此实例 | `我的第一个机器人` |

> [!TIP]
> 实例名称支持 1-32 个字符，建议使用易于识别的名称，方便管理多个机器人实例。

#### 4.1.2 账号配置

配置机器人的 QQ 账号信息和管理员权限。

| 字段 | 说明 | 示例 |
|------|------|------|
| **QQ 号** | 机器人绑定的 QQ 账号（5-12 位数字） | `123456789` |
| **QQ 昵称** | 机器人的显示昵称 | `小助手` |
| **管理员 QQ** | 具有机器人管理权限的 QQ 号 | `987654321` |

> [!WARNING]
> **QQ 号建议使用小号**，避免使用主账号以防封号风险。

#### 4.1.3 模型配置

配置大语言模型 API 密钥，用于机器人的 AI 对话功能。

| 字段 | 说明 | 获取方式 |
|------|------|----------|
| **API Key** | 硅基流动（SiliconFlow）大模型 API 密钥 | 点击"获取 API Key"按钮跳转到官网注册并创建密钥 |

> [!NOTE]
> **关于硅基流动 API**：
> - 硅基流动提供高性价比的大模型 API 服务
> - 新用户注册赠送免费额度，足够测试使用
> - 点击表单中的"获取 API Key"按钮会自动打开注册链接

**密钥格式示例**：`sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

#### 4.1.4 网络配置

配置 NapCat 与 Neo-MoFox 的通信参数和安全认证。

##### WebSocket 配置

| 字段 | 说明 | 推荐值 |
|------|------|--------|
| **WebSocket 端口** | NapCat 与 Neo-MoFox 通信的端口 | `8095`（默认） |

> [!TIP]
> 如果端口冲突，可以修改为其他未占用的端口（建议范围：8000-9000）。

##### 更新通道选择

| 选项 | 说明 | 适合人群 |
|------|------|----------|
| **稳定版 (main)** | 正式发布版本，经过充分测试 | 普通用户（推荐） |
| **开发版 (dev)** | 包含最新功能，可能存在不稳定情况 | 开发者和尝鲜用户 |

##### 插件 HTTP 路由访问控制

| 字段 | 说明 | 操作 |
|------|------|------|
| **WebUI API 密钥** | 用于保护 MoFox HTTP Router 的访问密钥 | 点击"🎲 生成"自动生成强密钥 |

> [!IMPORTANT]
> **关于 WebUI API 密钥**：
> - 该密钥用于保护机器人的 HTTP 路由接口，防止未授权访问
> - **强烈建议使用自动生成的随机密钥**，手动设置时请确保足够复杂
> - 密码强度指示器会实时显示：
>   - 🔴 **弱**：少于 8 位或过于简单
>   - 🟡 **中**：8-16 位，包含字母和数字
>   - 🟢 **强**：16+ 位，包含大小写、数字和特殊字符
> - 生成后会自动复制到剪贴板，**请务必妥善保存**
> - 后续访问 WebUI 或 API 时需要使用此密钥

**密钥格式示例**：`mF9k2XpQ7nR4sT8vW1yZ3bC6dE0`

#### 4.1.5 组件选择

选择需要安装的组件：

| 组件 | 说明 | 推荐 |
|------|------|------|
| **安装 NapCat** | QQ 协议端，负责与 QQ 服务器通信 | ✅ 推荐 |
| **安装 WebUI** | NapCat 的图形化管理面板，可查看账号状态、扫码登录等 | ✅ 推荐 |

> [!NOTE]
> **关于组件选择**：
> - 如果不安装 NapCat，仅部署 Neo-MoFox 核心，无法连接 QQ
> - WebUI 提供可视化的账号管理界面，方便扫码登录和查看连接状态
> - **Linux 用户注意**：Launcher 目前对 Linux 平台的 NapCat 支持有限，该选项会被自动禁用

#### 4.1.6 安装位置

设置机器人实例文件的存放目录。

| 字段 | 说明 | 建议 |
|------|------|------|
| **安装目录** | 实例文件的存放位置 | 使用 OOBE 设置的默认路径，或点击"浏览"自定义 |

**路径建议**：
- 选择磁盘空间充足的位置（至少 2GB 可用空间）
- 避免路径中包含中文或特殊字符
- 建议使用统一的父目录管理所有实例

**示例路径**：
- Windows: `D:\Neo-MoFox_Bots\my-first-bot`
- Linux: `/home/你的用户名/Neo-MoFox_Bots/my-first-bot`

> [!TIP]
> 如果在 OOBE 中设置了默认安装路径，此处会自动填充。您也可以随时点击"浏览"按钮选择其他位置。

#### 4.1.7 开始安装

配置完成后，点击"开始安装"，Launcher 会执行以下步骤：

1. **创建实例目录** - 在指定位置创建文件夹
2. **克隆代码仓库** - 使用 Git 下载 Neo-MoFox 源码
3. **创建虚拟环境** - 使用 uv 创建独立的 Python 环境
4. **安装依赖包** - 安装 Neo-MoFox 所需的 Python 包
5. **下载 NapCat**（如果选择）- 下载 NapCat 协议端
6. **生成配置文件** - 根据您的输入生成配置文件

**安装过程中**：
- 进度条会实时显示当前步骤和完成百分比
- 日志窗口会滚动显示详细的安装日志（可点击"显示日志"查看）
- 如果某步骤失败，会显示错误信息并提供重试按钮

**安装时长**：
- 约 **5-10 分钟**（取决于网络速度和设备性能）

#### 4.1.8 安装完成

安装成功后，界面会显示：
- ✅ 实例创建成功提示
- 📁 实例目录路径
- 🚀 启动按钮 - 立即启动机器人
- 📋 配置文件位置 - 查看和编辑配置

点击"完成"返回主界面，新创建的实例会出现在实例列表中。


### 方式 2：从整合包导入（快速部署）

适合使用预配置好的机器人整合包，可快速部署完整功能的机器人。整合包导入向导共分为 **6 个步骤**。

#### 4.2.1 步骤 1：选择整合包

点击"浏览"按钮，选择整合包文件（`.mfpack` 格式）。

> [!WARNING]
> **安全警告**：请仅导入来自**可信来源**的整合包。恶意整合包可能包含有害代码，导致数据泄露、系统损坏或其他安全风险。MoFox Studio 不对因导入非官方整合包导致的任何损失负责。

Launcher 会自动解析整合包并显示包含的内容：
- 包名称、版本、作者、描述
- 预装的插件列表及版本
- 包含的组件（Neo-MoFox 主程序、NapCat、配置文件、数据文件等）
- 创建时间和整合包版本

#### 4.2.2 步骤 2：环境检测

Launcher 会自动检测系统必备工具：
- **Python 3.11+**：运行机器人的核心环境
- **uv**：Python 包管理器
- **Git**：用于克隆代码仓库（如果整合包未包含主程序）

如检测失败，请参考前面的"准备工作：安装必备工具"章节。

#### 4.2.3 步骤 3：用户配置

整合包通常已预设好大部分配置，您需要填写以下必要信息：

| 字段 | 说明 | 示例 |
|------|------|------|
| **实例名称** | 自定义显示名称 | `我的机器人` |
| **QQ 号** | 机器人绑定的 QQ 账号（5-12 位数字） | `123456789` |
| **QQ 昵称** | 机器人的显示昵称（可选） | `小助手` |
| **管理员 QQ** | 具有管理权限的 QQ 号 | `987654321` |
| **API Key** | SiliconFlow API 密钥 | `sk-xxxxx...` |
| **WebSocket 端口** | NapCat 与 Neo-MoFox 通信端口 | `8095`（默认） |
| **WebUI API 密钥** | WebUI 管理界面访问密钥（可选） | 点击"🎲 生成"自动生成 |
| **安装目录** | 实例文件存放位置 | 点击"浏览"选择 |

> [!TIP]
> **WebUI API 密钥**：
> - 用于保护 MoFox HTTP Router 的访问，强烈建议使用自动生成的随机密钥
> - 密码强度指示器会实时显示安全等级（弱/中/强）
> - 生成后会自动复制到剪贴板，请妥善保存

#### 4.2.4 步骤 4：组件配置

选择需要安装的组件：

| 组件 | 说明 | 推荐 |
|------|------|------|
| **安装 WebUI** | 可视化配置面板，支持在线管理实例状态 | ✅ 推荐 |
| **安装 NapCat** | QQ 协议端，负责与 QQ 服务器通信 | ✅ Windows 推荐 |

> [!NOTE]
> **组件说明**：
> - **WebUI**：提供可视化管理界面，强烈建议安装以便日常维护
> - **NapCat**：
>   - 如果不安装，仅部署 Neo-MoFox 核心，无法连接 QQ
>   - 整合包可能已包含 NapCat，则会跳过下载步骤
>   - **Linux 用户注意**：Launcher 目前不支持在 Linux 系统上自动安装和管理 NapCat，该选项在 Linux 下会被自动禁用。Linux 用户需要手动部署 NapCat

#### 4.2.5 步骤 5：安装确认

确认页面会显示即将安装的详细信息摘要：

**整合包信息**：
- 包名称、版本、作者
- 包含内容（Neo-MoFox、NapCat、插件、配置、数据等）

**实例配置**：
- 实例名称、QQ 号、昵称
- 管理员 QQ、WebSocket 端口
- 安装路径

**安装步骤**：
Launcher 会根据整合包内容和您的选择，智能确定需要执行的步骤。典型步骤包括：
1. 验证整合包
2. 解压整合包
3. 复制文件（Neo-MoFox、NapCat、插件、配置等）
4. 克隆代码仓库（如果整合包未包含主程序）
5. 创建虚拟环境
6. 安装 Python 依赖
7. 生成配置文件（替换占位符）
8. 下载 NapCat（如果选择安装且整合包未包含）
9. 克隆 WebUI（如果选择安装）
10. 注册实例

仔细核对信息无误后，点击"下一步"开始安装。

#### 4.2.6 步骤 6：安装执行

安装过程中会显示：
- **进度条**：实时显示当前进度（百分比）
- **步骤指示器**：每个安装步骤的执行状态（等待/进行中/完成/失败）
- **日志窗口**：详细的安装日志（可点击"展开"查看）

安装时长约 **3-8 分钟**，取决于：
- 网络速度（是否需要下载组件）
- 设备性能
- 整合包大小和内容

**如果安装失败**：
- 查看日志中的错误信息
- 点击"重试"按钮重新执行
- 或点击"取消"返回主界面

**安装成功后**：
- 显示 ✅ 导入成功提示
- 点击"完成"返回主界面
- 新实例会出现在实例列表中，可直接启动使用

> [!TIP]
> 整合包导入通常比全新安装更快，因为：
> - 配置文件已预设好
> - 插件和数据已打包
> - 可能包含预编译的组件


### 4.3 启动实例

创建实例后，回到主界面：

1. 找到新创建的实例卡片
2. 点击"启动"按钮（▶️ 图标）
3. Launcher 会启动 Neo-MoFox 和 NapCat（如果安装）
4. 状态指示器变为黄色（启动中），然后变为绿色（运行中）

**首次启动**：
- NapCat 会打开 WebUI 页面（浏览器）
- 使用 QQ 扫码登录，或输入账号密码登录
- 登录成功后，机器人会自动连接并开始工作

**查看日志**：
- 点击实例卡片进入详细页面
- 切换到"日志"标签页查看实时日志
- 可搜索、复制、导出日志

### 4.4 常见问题

**Q: 启动失败怎么办？**
- 检查日志是否有错误信息
- 确认 QQ 号和密钥配置正确
- 检查端口是否被占用（如 8080、6099）
- 尝试重启实例或重新安装

**Q: NapCat 扫码登录失败？**
- 确认 QQ 号未在其他设备登录
- 尝试使用账号密码登录
- 检查网络连接

**Q: 如何更新机器人？**
- 点击实例卡片右上角的"⋮"菜单
- 选择"检查更新" → "更新实例"
- Launcher 会自动拉取最新代码并重启实例

**Q: 如何备份实例？**
- 点击实例设置 → "导出整合包"
- 选择导出位置，Launcher 会打包实例的所有配置、插件和数据
- 整合包可用于迁移到其他设备或分享给他人


## 第五步：后续使用

### 5.1 日常管理

- **启动/停止实例**：点击卡片上的控制按钮
- **查看日志**：点击卡片进入详细页面
- **修改配置**：实例设置 → 编辑配置文件
- **安装插件**：实例设置 → 插件管理

### 5.2 全局设置

点击底部浮动栏的"设置"按钮，可以：
- 修改默认安装路径
- 更改主题和强调色
- 调整日志保留策略
- 配置自动更新行为
- 查看 Launcher 版本和更新

### 5.3 环境管理

点击底部浮动栏的"环境管理"，可以：
- 查看所有实例的虚拟环境
- 清理未使用的环境
- 重建损坏的环境
- 更新 Python 包


## 🎉 完成！

恭喜您成功部署 Neo-MoFox 机器人！现在可以开始使用了。

如有问题，欢迎在 GitHub Issues 提问或加入官方 QQ 群交流！