# 安装 MPDT

`mpdt` 是一个标准的 Python 包，安装方式多种多样，总有一款适合你。

## 环境要求

- **Python**: `3.11` 或更高版本。

在开始之前，请确保你的环境中 `python --version` 输出的是 `3.11` 以上。

## 安装方法

### 方法一：使用 pip（推荐）

最简单直接的方式，打开你的终端，运行：

```bash
pip install mofox-plugin-dev-toolkit
```

如果你想体验最新功能，可以直接从 GitHub 安装开发版：

```bash
pip install git+https://github.com/MoFox-Studio/mofox-plugin-toolkit.git
```

### 方法二：使用 uv

如果你是 `uv` 的忠实用户，那么安装 `mpdt` 就像呼吸一样简单：

```bash
uv pip install mofox-plugin-dev-toolkit
```

### 方法三：从源码安装

如果你想对 `mpdt` 进行二次开发，或者深入了解其内部构造，可以从源码安装：

```bash
# 1. 克隆仓库
git clone https://github.com/MoFox-Studio/mofox-plugin-toolkit.git

# 2. 进入目录
cd mofox-plugin-toolkit

# 3. 安装
# 使用 pip
pip install .
# 或者使用 uv
uv pip install .
```

## 验证安装

安装完成后，运行以下命令来验证 `mpdt` 是否已成功进入你的 `PATH`：

```bash
mpdt --version
```

如果终端输出了版本号（如 `mpdt, version 0.4.8`），那么恭喜你，安装成功！

## 常见安装问题

**问题：`mpdt: command not found` (zsh/bash) 或 `“mpdt”不是内部或外部命令...` (Windows)**

**原因**：这通常意味着 Python 的脚本目录没有被添加到系统的 `PATH` 环境变量中。

**解决方案**：

1.  **找到脚本目录**：
    -   运行 `pip show mofox-plugin-dev-toolkit`，查看 `Location` 字段，然后找到该目录下的 `Scripts` (Windows) 或 `bin` (Linux/macOS) 文件夹。
    -   或者，运行 `python -m site --user-scripts` 直接获取用户脚本目录。

2.  **添加到 PATH**：
    -   **Windows**:
        -   搜索“编辑系统环境变量”，打开“环境变量”对话框。
        -   在“系统变量”或“用户变量”中找到 `Path`，点击“编辑”。
        -   点击“新建”，将第一步找到的脚本目录路径粘贴进去，然后一路确定。
        -   **重启你的终端**，再次尝试 `mpdt --version`。
    -   **Linux/macOS**:
        -   编辑你的 shell 配置文件（如 `~/.zshrc`, `~/.bash_profile`）。
        -   在文件末尾添加 `export PATH="<你的脚本目录>:$PATH"`。
        -   保存文件，然后运行 `source ~/.zshrc` (或对应的配置文件) 或重启终端。

## 获取 AI 开发助手支持（可选）

MPDT 提供了一个 `SKILL.md` 文件，让 GitHub Copilot、Cursor 等 AI 助手能够按照最佳实践帮助你开发插件。

### 快速获取

**方法一：克隆完整仓库（推荐）**

如果你想参与 MPDT 开发或查看源码：

```bash
git clone https://github.com/MoFox-Studio/mofox-plugin-toolkit.git
cd mofox-plugin-toolkit
code .  # 在 VS Code 中打开
```

现在 GitHub Copilot 会自动识别 `SKILL.md` 文件。

**方法二：仅下载 Skill 文件**

如果你只想获取 Skill 支持：

```bash
# 下载到你的插件开发工作区根目录
curl -O https://raw.githubusercontent.com/MoFox-Studio/mofox-plugin-toolkit/main/SKILL.md

# 或使用 wget
wget https://raw.githubusercontent.com/MoFox-Studio/mofox-plugin-toolkit/main/SKILL.md
```

### 验证 Skill 是否生效

1. 在包含 `SKILL.md` 的目录中打开 VS Code
2. 打开 GitHub Copilot Chat（快捷键 `Ctrl+I` 或 `Cmd+I`）
3. 输入："使用 MPDT 帮我创建一个插件"
4. 观察 Copilot 是否按照 MPDT 标准流程回应

::: tip
如果你不使用 AI 助手，可以跳过这一步。`SKILL.md` 也可以作为开发流程参考手册。详见 [Skill 使用指南](./skill-guide.md)。
:::


现在，你的开发环境已经准备就绪。是时候用 [mpdt init](./commands/init.md) 来创建你的第一个插件了！
