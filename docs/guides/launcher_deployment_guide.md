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
> - 如果使用 Wayland，建议设置环境变量 `ELECTRON_OZONE_PLATFORM_HINT=auto` 以获得更好的显示效果
> - AppImage 在某些发行版上可能需要安装 `fuse` 或 `fuse2` 才能运行
> - AUR 包会自动处理所有依赖，是 Arch 用户的最佳选择


## 第二步：环境检测（向导步骤 1）

### 2.1 自动检测流程

第一次打开 Launcher 时，会自动进入**安装向导**的第一步：**环境检测**。

Launcher 会检查以下工具：

| 检测项 | 说明 | 版本要求 |
|--------|------|----------|
| ✅ **Python** | 机器人运行环境 | ≥ 3.11 |
| ✅ **uv** | Python 包管理器 | 任意版本 |
| ✅ **Git** | 代码下载工具 | 任意版本 |

### 2.2 检测结果

#### ✅ 全部通过

- 所有项显示绿色勾选标记 ✓
- 点击 **"下一步"** 按钮，进入许可协议步骤
- 恭喜！您可以继续安装流程

#### ❌ 有工具缺失

- 缺失项显示红色 X 标记和错误提示
- **"下一步"按钮会被禁用**
- 请返回上一节**"准备工作：安装必备工具"**，按照指引安装缺失的工具
- 安装完成后，**关闭 Launcher 并重新打开**，重新检测

> [!TIP]
> 如果所有工具已安装但仍然检测失败，请检查系统环境变量 PATH 是否正确配置。


## 第三步：阅读并同意许可协议（向导步骤 2）

环境检测通过后，向导会要求您阅读并同意两份协议：

### 3.1 协议内容

1. **EULA（最终用户许可协议）** - 使用条款和免责声明
2. **隐私政策** - 数据收集与使用说明

### 3.2 操作步骤

1. 点击顶部标签页切换查看两份协议
2. 仔细阅读协议内容（建议真的看一下😊）
3. 勾选底部的 **"我已阅读并同意以上条款（包括 EULA 和隐私政策）"**
4. 点击 **"下一步"**

> [!IMPORTANT]
> 必须勾选同意协议才能继续。如果协议加载失败，可以点击 "重新加载" 按钮。


## 第四步：设置实例信息（向导步骤 3）

给您的机器人起一个名字，方便识别。

| 字段 | 说明 | 示例 |
|------|------|------|
| **实例名称** | 1-32 个字符，用于在界面上显示 | `我的测试 Bot`、`生产环境机器人` |

> [!TIP]
> 如果您计划创建多个机器人，建议使用有意义的名称区分它们。

填写完成后，点击 **"下一步"**。


## 第五步：配置 QQ 账号（向导步骤 4）

填写机器人使用的 QQ 账号信息。

| 字段 | 说明 | 示例 | 验证规则 |
|------|------|------|----------|
| **Bot QQ 号** | 用作机器人的 QQ 号码 | `1234567890` | 5-12 位纯数字 |
| **Bot QQ 昵称** | 该 QQ 的昵称 | `小狐狸助手` | 最多 32 字符 |
| **主人 QQ 号** | 您（管理员）的 QQ 号 | `9876543210` | 5-12 位纯数字 |

### 关于主人 QQ 号

- 主人拥有最高权限，可以管理机器人的所有功能
- 建议填写您自己的 QQ 号
- 后续可在配置文件中添加更多管理员

填写完成后，点击 **"下一步"**。


## 第六步：配置大语言模型（向导步骤 5）

机器人需要调用大模型 API 才能智能对话。目前推荐使用 **SiliconFlow**（新用户有免费额度）。

| 字段 | 说明 | 获取方式 |
|------|------|----------|
| **API Key** | 大模型服务的访问密钥 | 见下方教程 |

### 如何获取 API Key？

**推荐平台：SiliconFlow（新用户免费）**

1. 访问 [SiliconFlow 官网](https://cloud.siliconflow.cn/)
2. 注册并登录账号
3. 进入 **"控制台"** 或 **"API 管理"**
4. 点击 **"创建新密钥"** 或 **"生成 API Key"**
5. 复制生成的密钥（格式类似 `sk-xxxxxxxxxx`）
6. 粘贴到 Launcher 的 **"API Key"** 输入框中

> [!IMPORTANT]
> - API Key 是敏感信息，不要分享给他人
> - 免费额度用完后需要充值才能继续使用
> - 可以点击眼睛图标 👁️ 显示/隐藏密钥

填写完成后，点击 **"下一步"**。


## 第七步：网络配置（向导步骤 6）

配置机器人的网络端口、更新通道，以及 WebUI 访问密钥。

| 字段 | 说明 | 推荐值 | 备注 |
|------|------|--------|------|
| **WebSocket 端口** | NapCat 连接端口 | `8095` | 如被占用可改为 8096、8097 等 |
| **更新通道** | GitHub 分支选择 | `稳定版 (main)` | 新手推荐稳定版 |
| **WebUI API 密钥** | Web 管理界面访问密钥 | 点击 🎲 随机生成 | 至少 8 位字符 |

### WebUI API 密钥说明

这个密钥用于：
- 访问 WebUI（Web 管理控制台）
- 插件 HTTP 路由的身份验证

### 如何设置

1. **推荐**：点击 **🎲 随机生成** 按钮，自动生成强密钥
2. 如需自定义，输入至少 8 位字符（支持字母、数字、特殊符号）
3. 密钥强度会实时显示：弱 / 中 / 强

> [!WARNING]
> - 此密钥非常重要，请妥善保管！
> - 安装完成后可在 `config/core.toml` 中修改

填写完成后，点击 **"下一步"**。


## 第八步：选择安装组件（向导步骤 7）

选择要安装的附加组件。

| 组件 | 说明 | 是否必需 | 推荐 |
|------|------|----------|------|
| **NapCat** | QQ 消息收发适配器 | ✅ **必需** | 勾选 |
| **WebUI** | Web 可视化管理控制台 | ⭕ 可选 | **强烈推荐** |

### NapCat

- 必装组件，负责连接 QQ 并收发消息
- 如果不勾选，机器人无法与 QQ 通信
- 如果你有其他适配器,可以不安装 NapCat

### WebUI

- 提供 Web 界面管理机器人
- 可查看日志、修改配置、管理插件等
- 强烈建议新手安装

> [!TIP]
> 默认已全部勾选，如无特殊需求，保持默认即可。

选择完成后，点击 **"下一步"**。


## 第九步：选择安装位置（向导步骤 8）

选择机器人文件的存放目录。

| 字段 | 说明 | 示例 |
|------|------|------|
| **安装目录** | 机器人文件存放路径 | `D:\Neo-MoFox-Bots` |

### 注意事项

- ⚠️ **避免包含中文**，路径全部使用英文和数字
- ⚠️ **避免包含空格**，例如 `Program Files` 可能出问题
- ✅ 确保目标磁盘有至少 **2GB 可用空间**
- ✅ 可以点击右侧 📁 按钮浏览选择目录

### 推荐的安装路径示例

```
✅ D:\Neo-MoFox-Bots
✅ E:\Bots\Neo-MoFox
✅ C:\Users\YourName\MoFox
```

### 不推荐的路径

```
❌ C:\Program Files\Neo-MoFox（包含空格）
❌ D:\我的机器人\Neo-MoFox（包含中文）
```

选择完成后，点击 **"下一步"**。


## 第十步：确认配置摘要（向导步骤 9）

### 10.1 检查配置

安装向导会展示您刚才填写的所有配置，请仔细检查。

**显示内容包括**：
- ✅ 实例名称
- ✅ Bot QQ 号、昵称、主人 QQ
- ✅ WebSocket 端口、更新通道
- ✅ WebUI API 密钥（脱敏显示为 `•••••••••`）
- ✅ 安装组件（NapCat、WebUI）
- ✅ 安装目录

### 10.2 如何修改

如发现配置错误：
- 每个配置块右侧都有 ✏️ **"编辑"** 按钮
- 点击后会跳回对应步骤
- 修改后自动返回摘要页

### 10.3 开始安装

确认无误后，点击 **"开始安装"** 按钮进入最后步骤。


## 第十一步：自动安装过程（向导步骤 10）

### 11.1 安装流程

点击 "开始安装" 后，Launcher 会自动完成以下操作：

| 步骤 | 操作 | 预计耗时 | 说明 |
|------|------|----------|------|
| 1️⃣ | 克隆 Neo-MoFox 仓库 | 1-2 分钟 | 从 GitHub 下载代码 |
| 2️⃣ | 创建 Python 虚拟环境 | 30 秒 | 隔离 Python 依赖 |
| 3️⃣ | 安装 Python 依赖包 | 3-5 分钟 | **最耗时的步骤** |
| 4️⃣ | 生成配置文件 | 10 秒 | 创建 `config/` 目录 |
| 5️⃣ | 写入 core.toml | 5 秒 | 写入核心配置 |
| 6️⃣ | 写入 model.toml | 5 秒 | 写入模型配置 |
| 7️⃣ | 写入 WebUI 密钥 | 5 秒 | 保存管理界面密钥 |
| 8️⃣ | 写入适配器配置 | 5 秒 | NapCat 连接配置 |
| 9️⃣ | 配置 NapCat | 1-2 分钟 | 下载并配置 QQ 适配器 |
| 🔟 | 安装 WebUI（可选） | 1-2 分钟 | 部署 Web 管理界面 |
| ✅ | 注册实例 | 2 秒 | 登记到 Launcher 数据库 |

**总耗时**：正常情况下约 **5-10 分钟**，具体取决于网络速度。

### 11.2 界面显示

**进度条**：
- 实时显示当前进度百分比（0% → 100%）
- 显示当前正在执行的步骤名称

**轮播展示**：
- 在等待时，界面会展示机器人的核心功能介绍
  - 💬 智能对话
  - 🧠 记忆系统
  - 🧩 插件生态
  - 💖 情感系统

**安装日志**：
- 点击底部的 **"安装日志"** 可展开查看详细输出
- 如遇到问题，日志能帮助排查错误

### 11.3 安装完成

✅ **成功提示**：
- 显示 🎉 **"安装完成！"**
- 提示 "Neo-MoFox 已成功安装，你可以开始使用了"
- 点击 **"完成"** 按钮返回主界面

❌ **失败处理**：
- 显示 ⚠️ **"安装失败"** 和错误信息
- 可选操作：
  - **"重试"**：重新执行安装
  - **"清理"**：删除未完成的安装文件
  - **"取消"**：返回主界面

> [!TIP]
> 如果安装失败，可以查看日志找出原因，常见问题包括：
> - 网络连接中断
> - 磁盘空间不足
> - 端口被占用
> - 依赖下载失败


## 🎮 启动和管理机器人

### 主界面布局

安装完成后，您将返回 Launcher 的**主界面**。

**顶部 Hero 区域**：
- 📊 **活跃实例数**：当前正在运行的机器人数量
- 💻 **CPU 使用率**：系统 CPU 占用
- 🧠 **内存使用率**：系统内存占用
- 💬 **每日名言**：随机显示编程相关名言

**实例列表区域**：
- 显示所有已配置的机器人实例
- 每个实例以卡片形式呈现
- 最右侧是 **"+ 新建实例"** 卡片（用于添加第二个、第三个机器人）


### 实例卡片详解

每个实例卡片包含：

| 元素 | 说明 |
|------|------|
| **图标** | 机器人图标（运行时会动画） |
| **标题** | 实例名称（例如：我的测试 Bot） |
| **路径** | 安装目录路径 |
| **自动信息** | QQ 号和端口（例如：QQ: 123456789 \| 端口: 8095） |
| **描述** | 自定义描述（可在管理中编辑） |
| **状态指示器** | 圆点显示运行状态<br>🟢 运行中 / ⚫ 已停止 / 🟡 启动中 |
| **操作按钮** | 启动、停止、管理、查看日志、版本管理 |


### 启动机器人

**方法一：快速启动**
1. 找到目标实例卡片
2. 点击右下角的 **"▶ 启动"** 按钮
3. 等待状态变为 **"运行中"**（圆点变绿）

**方法二：从详情启动**
1. 点击实例卡片任意位置
2. 进入实例详情页
3. 点击顶部的 **"启动"** 按钮
4. 实时查看启动日志

**启动过程**：
```
已停止 → 启动中... → 运行中
  ⚫      🟡          🟢
```

- 预计耗时：10-30 秒
- 启动成功后，机器人即可接收和回复消息

> [!TIP]
> 首次启动可能需要更长时间，因为要初始化数据库和加载模型。


### 停止机器人

**在主界面**：
1. 找到正在运行的实例（绿色圆点）
2. 点击 **"⏹ 停止"** 按钮
3. 等待状态变为 **"已停止"**（灰色圆点）

**在详情页**：
1. 点击顶部的 **"停止"** 按钮
2. 机器人会安全关闭，保存所有数据

> [!NOTE]
> 停止操作是安全的，不会丢失数据。


### 查看实例日志

**实时日志（运行时）**：
1. 点击实例卡片打开详情页
2. 日志会实时滚动显示
3. 可查看机器人的运行状态、消息处理、错误信息等

**日志示例**：
```
[2026-03-21 10:30:15] INFO: 机器人启动中...
[2026-03-21 10:30:16] INFO: 加载插件: message_processor
[2026-03-21 10:30:17] INFO: 连接到 NapCat WebSocket
[2026-03-21 10:30:18] INFO: 机器人启动完成
```

**历史日志**：
- 进入实例安装目录
- 打开 `logs/` 文件夹
- 日志文件命名格式：`app_20260321_*.log.jsonl`


### 管理实例

点击实例卡片上的 **⚙️ "管理"** 按钮，弹出管理对话框。

**可修改项**：
- ✏️ **实例名称** - 更改显示名称
- ✏️ **描述信息** - 添加或修改描述

**核心配置修改**（需手动编辑配置文件）：
- Bot QQ 号、端口、API Key 等
- 进入实例目录，编辑以下文件：
  - `config/core.toml` - 核心配置
  - `config/model.toml` - 模型配置

**删除实例**：
- 点击管理界面底部的 **"删除实例"** 按钮
- 确认后将删除：
  - 实例记录
  - 所有相关文件（代码、配置、数据）
- ⚠️ **不可撤销**，请谨慎操作


### 添加更多实例

如果您想在同一台电脑上运行多个 Bot（例如不同的 QQ 号）：

1. 在主界面点击 **"+ 新建实例"** 卡片
2. 重新进入安装向导（10 步流程）
3. 填写新机器人的配置
   - ⚠️ **端口号不能重复**（例如：第一个用 8095，第二个用 8096）
   - ⚠️ 每个实例使用不同的 QQ 号
4. 安装完成后，新实例会出现在主界面

> [!TIP]
> **多实例使用场景**：
> - 开发测试机器人 + 生产环境机器人
> - 不同群组使用不同的 Bot
> - 测试不同的配置或插件
> - 多个 QQ 号分别管理不同业务


## ⚙️ 高级配置

### 配置 NapCat WebSocket

在大多数情况下，Launcher 会自动配置好 NapCat 的 WebSocket 连接。但如果遇到消息收发问题，可以手动检查：

**自动配置说明**：

Launcher 在安装过程中会自动：
- 在 NapCat 配置中创建反向 WebSocket 客户端
- 设置连接地址为 `ws://127.0.0.1:8095`（或您指定的端口）
- 启用该连接

**手动检查（如需）**：

如果机器人无法正常收发消息：

1. 等待所有服务完全启动（约 30 秒）
2. 访问 NapCat WebUI：`http://127.0.0.1:6099`
3. 输入 TOKEN（查看 NapCat 启动日志，找到类似 `NapCat Token: napcat` 的行）
4. 进入 **"网络配置"** 页面
5. 检查是否存在反向 WebSocket 客户端，且：
   - 地址：`ws://127.0.0.1:8095`
   - 状态：✅ 已启用
6. 如需修改，保存后重启机器人实例


### 目录结构

Launcher 会按以下结构组织文件：

```
应用数据目录 (%APPDATA%\Neo-MoFox-Launcher\)
├── instances.json       # 实例列表配置
├── launcher.log         # Launcher 日志
└── logs/                # 详细日志目录

实例安装目录 (您指定的安装路径，例如 D:\Neo-MoFox-Bots\)
├── <实例ID>/            # 实例唯一标识符
│   ├── neo-mofox/       # Neo-MoFox 主程序
│   │   ├── .venv/       # Python 虚拟环境
│   │   ├── config/      # 配置文件
│   │   │   ├── core.toml       # 核心配置（QQ 号、端口等）
│   │   │   └── model.toml      # 模型配置（API Key 等）
│   │   ├── data/        # 数据库和用户数据
│   │   ├── logs/        # 运行日志
│   │   └── plugins/     # 插件目录
│   │
│   └── napcat/          # NapCat 适配器
│       ├── NapCat.Shell.exe
│       └── config/      # NapCat 配置
```


## ❓ 常见问题 (FAQ)

### Q1：环境检测失败怎么办？

**A**：按照提示安装缺失的工具（Python、Git、uv），确保命令行中可以正常调用这些命令。安装完成后重新启动 Launcher。

**检查步骤**：
1. 打开命令提示符或 PowerShell
2. 依次输入以下命令验证：
   ```powershell
   python --version
   git --version
   uv --version
   ```
3. 如果任何命令报错，说明对应工具未正确安装或未添加到 PATH


### Q2：安装过程中出现网络错误？

**A**：
- 检查网络连接是否稳定
- 如果是下载依赖包失败，可能是网络问题
- 可以在返回主界面后，找到未完成的实例，点击 **"继续安装"** 重试


### Q3：如何切换到开发版（dev 分支）？

**A**：在安装向导的 **"网络配置"** 步骤（步骤 6），将 **"更新通道"** 切换为 **"开发版 (dev)"**。

> [!WARNING]
> 开发版可能包含未稳定的功能和 bug，建议新手使用稳定版。


### Q4：如何备份机器人数据？

**A**：
- 定期备份实例安装目录下的 `data/` 文件夹（包含数据库和用户数据）
- 备份 `config/` 文件夹中的配置文件
- 重要对话数据存储在 SQLite 数据库中（`data/` 目录下）

**备份方法**：
1. 停止机器人实例
2. 复制整个实例目录到备份位置
3. 或只复制 `data/` 和 `config/` 文件夹


### Q5：启动后提示端口被占用？

**A**：
- 检查 8095 端口是否被其他程序占用
- 可以在安装向导中修改为其他端口（如 8096、8097）
- **Windows 下查看端口占用**：
  ```powershell
  netstat -ano | findstr 8095
  ```
  如果有输出，说明端口被占用


### Q6：如何查看错误日志？

**A**：
- **Launcher 日志**：`%APPDATA%\Neo-MoFox-Launcher\logs\`
- **机器人日志**：实例安装目录 `logs/` 文件夹
- 日志文件为 JSON 格式，可用文本编辑器打开


### Q7：更新后启动失败？

**A**：
- 尝试在实例详情页点击 **"重启"**
- 检查 `logs/` 目录中的错误信息
- 如果依赖有更新，可能需要重新安装依赖（未来版本将支持）


### Q8：如何卸载机器人？

**A**：
1. 在 Launcher 主界面，点击实例的 **"管理"** 按钮
2. 点击底部的 **"删除实例"** 按钮
3. 确认删除
4. 或手动删除实例安装目录


### Q9：机器人不回复消息怎么办？

**A**：检查以下几点：
1. ✅ 机器人实例是否正在运行（绿色圆点）
2. ✅ NapCat 是否正常连接（查看日志）
3. ✅ API Key 是否正确配置且有额度
4. ✅ 在群组中，机器人是否有发言权限
5. ✅ 检查实例日志，看是否有错误信息


### Q10：如何联系 QQ 进行消息收发？

**A**：
机器人启动后，NapCat 会自动弹出 QQ 登录窗口或二维码：
1. 使用 Bot QQ 号扫码登录（如支持）
2. 或输入账号密码登录
3. 登录成功后，机器人即可接收和发送消息
4. **首次登录可能需要验证**（滑动验证、短信验证等）


## 📞 获取帮助

如果遇到问题，可以通过以下方式获取帮助：

- 📖 **官方文档**：[Neo-MoFox 文档](https://mofox-studio.github.io/MoFox-Bot-Docs/)
- 🐛 **提交 Issue**：[GitHub Issues](https://github.com/MoFox-Studio/Neo-MoFox-Launcher/issues)
- 💬 **QQ 交流群**：[Neo-MoFox 官方群](https://qm.qq.com/q/jfeu7Dq7VS)
- 🌐 **GitHub 仓库**：[Neo-MoFox](https://github.com/MoFox-Studio/Neo-MoFox)


## 📜 附录

### 快速参考表

| 操作 | 步骤 |
|------|------|
| **下载 Launcher** | GitHub Releases → 选择安装版/便携版 |
| **首次启动** | 自动进入安装向导 → 环境检测 |
| **创建机器人** | 主界面 → 点击"+ 新建实例" |
| **启动机器人** | 实例卡片 → 点击"启动"按钮 |
| **停止机器人** | 实例卡片 → 点击"停止"按钮 |
| **查看日志** | 点击实例卡片 → 实时日志 |
| **管理实例** | 实例卡片 → 点击"管理"按钮 |
| **删除实例** | 管理 → 删除实例 |


### 术语解释

| 术语 | 解释 |
|------|------|
| **实例（Instance）** | 一个完整的机器人配置和运行环境 |
| **NapCat** | QQ 消息收发适配器，负责与 QQ 通信 |
| **WebUI** | Web 可视化管理控制台 |
| **WebSocket 端口** | NapCat 与机器人通信使用的端口 |
| **API Key** | 大模型服务的访问密钥 |
| **主人 QQ** | 拥有最高权限的管理员 QQ 号 |


*感谢使用 Neo-MoFox Launcher！祝您使用愉快！* 🎉


文档版本：1.0.0  
最后更新：2026年3月21日
