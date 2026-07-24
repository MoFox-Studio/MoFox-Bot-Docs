# 安装 Node.js 环境

VitePress 是基于 Vite + Vue 的纯前端工具链，必须依赖 Node.js 运行。本章将带你完成 Node.js 与包管理器的安装和验证。

## 1. 版本要求

MoFox-Bot-Docs 的 `package.json` 使用了 VitePress 2.x 与 Vite 7.x，**最低要求 Node.js 20 LTS**。建议直接安装 **Node.js 22 LTS** 或更高版本，以获得最佳兼容性。

可以在终端运行下方命令确认当前版本：

```bash
node -v
npm -v
```

若输出形如 `v22.x.x` 与 `10.x.x` 即满足要求；若提示 `command not found` 或版本低于 20，请按下面的方式安装/升级。

## 2. Windows 安装

### 方式一：官方安装包（推荐新手）

1. 访问 <https://nodejs.org/zh-cn/download>，选择 **LTS 版本**。
2. 下载 `Windows Installer (.msi)`（64 位）。
3. 双击运行安装程序，全程保持默认选项即可（勾选 `Add to PATH`）。
4. 安装完成后**重新打开** PowerShell 或 CMD，运行 `node -v` 验证。

### 方式二：winget（Windows 10/11 自带）

```powershell
winget install OpenJS.NodeJS.LTS
```

### 方式三：nvm-windows（多版本切换）

如果你需要在不同项目间切换 Node 版本，可使用 [nvm-windows](https://github.com/coreybutler/nvm-windows)：

```powershell
# 安装后执行
nvm install 22
nvm use 22
```

## 3. Linux 安装

推荐使用 [NodeSource](https://github.com/nodesource/distributions) 官方源，避免发行版自带仓库版本过旧。

### Debian / Ubuntu

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### RHEL / Fedora

```bash
curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
sudo dnf install -y nodejs
```

### Arch / Manjaro

```bash
sudo pacman -S nodejs npm
```

## 4. macOS 安装

### 方式一：官方安装包

访问 <https://nodejs.org/zh-cn/download> 下载 macOS 的 `.pkg` 安装包，双击安装即可。

### 方式二：Homebrew（推荐）

```bash
brew install node@22
brew link --overwrite node@22
```

### 方式三：nvm

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
# 重启终端后
nvm install 22
nvm use 22
```

## 5. 选择包管理器

MoFox-Bot-Docs 的依赖锁文件是 `package-lock.json`，对应 **npm**。下面是几种常见选择：

| 包管理器 | 安装命令 | 适用场景 |
| --- | --- | --- |
| **npm**（默认） | 随 Node.js 一起安装 | 项目已提交 `package-lock.json`，最省心 |
| **pnpm** | `npm i -g pnpm` | 速度快、节省磁盘；但需忽略 lockfile 差异 |
| **yarn** | `npm i -g yarn` | 兼容性好，社区常用 |

::: tip 推荐
本仓库使用 npm 作为默认包管理器并提交了 `package-lock.json`。若你初次贡献，**直接使用 npm 即可**，无需额外学习其他工具。
:::

## 6. 验证安装

完成 Node.js 与包管理器安装后，执行：

```bash
node -v       # 应输出 v22.x.x 或更高
npm -v        # 应输出 10.x.x 或更高
npx -v        # 应可用
```

若三条命令都正常返回版本号，说明环境就绪，可以进入下一步 [编辑文档内容](./edit-docs)。

## 7. 常见问题

### Q1：执行 `npm install` 时报 `EACCES` 权限错误？

切勿使用 `sudo npm install`。推荐做法是配置 npm 全局目录到当前用户：

```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
# 然后将 ~/.npm-global/bin 加入 PATH
```

或直接切换到 [nvm](https://github.com/nvm-sh/nvm) 管理的 Node，其默认就装在用户目录下。

### Q2：国内网络下载依赖太慢？

可以临时切换为淘宝镜像：

```bash
npm config set registry https://registry.npmmirror.com
```

但**提交 PR 前**请把镜像切回官方源，以免 `package-lock.json` 中的 `resolved` 字段被改写：

```bash
npm config set registry https://registry.npmjs.org/
```

### Q3：`npm run docs:dev` 报 `vitepress: command not found`？

说明依赖没有安装成功。进入仓库根目录重新执行：

```bash
npm install
```

若仍失败，删除 `node_modules` 后重试：

```bash
rm -rf node_modules package-lock.json
npm install
```

注意：删除 `package-lock.json` 会丢失锁定版本，仅作为兜底手段，提交前请勿保留该改动。
