# AI Skill 安装指南

::: info 适用范围
本指南适用于 GitHub Copilot (Claude Code)、Cursor、VS Code 等支持 Skill 文件的 AI 编辑器。
:::

MPDT 提供了一个完整的 **Skill 文件** (`SKILL.md`)，让 AI 助手能够自动按照最佳实践执行插件开发的完整流程。通过这个 Skill 文件，你只需告诉 AI"使用 MPDT 创建一个翻译插件"，AI 就会自动帮你完成初始化、组件生成、质量检查和打包等所有步骤。

## 什么是 Skill 文件？

Skill 文件是一种让 AI 助手理解特定工作流程的配置文件。它包含：

- 📋 **工作流定义** - 明确的操作步骤和命令模板
- 🎯 **触发条件** - AI 何时应该使用这个 Skill
- 🛠️ **最佳实践** - 经过验证的操作模式
- ⚠️ **错误处理** - 常见问题的解决方案

对于 MPDT，Skill 文件封装了完整的插件开发流程，从创建到打包的每一步。

## 下载 Skill 文件

### 方式 1：直接下载（推荐）

下载 MPDT 的 Skill 文件：

**下载地址**：[`SKILL.md`](https://raw.githubusercontent.com/MoFox-Studio/mofox-plugin-toolkit/main/SKILL.md)

或使用命令下载：

::: code-group

```bash [Linux/macOS]
curl -o SKILL.md https://raw.githubusercontent.com/MoFox-Studio/mofox-plugin-toolkit/main/SKILL.md
```

```powershell [Windows PowerShell]
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/MoFox-Studio/mofox-plugin-toolkit/main/SKILL.md" -OutFile "SKILL.md"
```
:::
### 方式 2：从仓库克隆

如果你已经克隆了 `mofox-plugin-toolkit` 仓库：

```bash
# 文件位置
mofox-plugin-toolkit/SKILL.md
```

直接复制该文件即可。

## 安装位置

根据你使用的编辑器，将 `SKILL.md` 文件放到对应的位置：

### GitHub Copilot (claude.ai/code)

在你的**插件项目根目录**或 **Neo-MoFox 工作区根目录**下直接放置：

```
your-plugin-project/
├── SKILL.md          ← 放在这里
├── manifest.json
├── plugin.py
└── ...
```

或：

```
your-workspace/
├── SKILL.md          ← 放在这里
├── Neo-MoFox/
├── my-plugin/
└── ...
```

**Claude Code 会自动检测工作区中的 SKILL.md 文件。**

### Cursor

Cursor 支持多种方式：

**方式 1：项目级别**（推荐）

```
your-project/
├── .cursorrules      ← 可选：项目规则
├── SKILL.md          ← 放在这里
└── ...
```

**方式 2：全局级别**

将 `SKILL.md` 放到 Cursor 的全局配置目录：

::: code-group

```bash [Linux]
~/.config/Cursor/User/SKILL.md
```

```bash [macOS]
~/Library/Application Support/Cursor/User/SKILL.md
```

```powershell [Windows]
%APPDATA%\Cursor\User\SKILL.md
```

:::

### VS Code (GitHub Copilot 扩展)

**方式 1：工作区级别**

在工作区的 `.vscode` 目录下：

```
your-workspace/
├── .vscode/
│   └── SKILL.md      ← 放在这里
└── ...
```

**方式 2：用户级别**

将文件放到 VS Code 用户配置目录：

::: code-group

```bash [Linux]
~/.config/Code/User/SKILL.md
```

```bash [macOS]
~/Library/Application Support/Code/User/SKILL.md
```

```powershell [Windows]
%APPDATA%\Code\User\SKILL.md
```

:::

## 验证安装

安装完成后，测试 AI 是否能正确识别 Skill：

### 测试步骤

1. 打开你的 AI 编辑器（Copilot/Cursor/VS Code）
2. 在对话框中输入：

   ```
   使用 MPDT 创建一个名为 test_plugin 的插件
   ```

3. 观察 AI 的响应

### 期望行为

✅ **正确识别**：AI 应该：
- 提及 `mpdt init` 命令
- 询问模板类型（basic/action/tool/full 等）
- 询问作者信息和许可证
- 提供完整的工作流步骤

❌ **未识别**：如果 AI 只是笼统地说"你可以手动创建文件"或者不提 `mpdt` 命令，说明 Skill 未生效。

## 常见问题

### Q: Skill 文件没有生效怎么办？

**诊断步骤**：

1. **确认文件名正确**：必须是 `SKILL.md`（大小写敏感）
2. **确认文件位置**：在工作区或配置目录的正确位置
3. **重启编辑器**：某些编辑器需要重启才能加载新 Skill
4. **检查文件格式**：确保是纯文本 Markdown 文件，没有特殊编码

**Claude Code / GitHub Copilot 特定问题**：
- 检查是否在多根工作区（multi-root workspace）中，Skill 文件应放在每个根目录或共享的父目录

**Cursor 特定问题**：
- 在 Settings → Cursor → Models 中确认是否启用了 Skill 功能
- 尝试切换到项目级别而非全局级别

### Q: 可以同时使用多个 Skill 文件吗？

可以。大多数 AI 编辑器支持加载多个 Skill 文件，它们会根据上下文自动选择合适的 Skill。

例如：
```
your-workspace/
├── SKILL.md                     ← MPDT 工作流
├── another-project/
│   └── SKILL.md                 ← 另一个工作流
└── ...
```

### Q: Skill 文件会被提交到 Git 吗？

这取决于你的选择：

- **提交**：团队成员可以共享相同的 AI 工作流（推荐用于协作项目）
- **不提交**：将 `SKILL.md` 添加到 `.gitignore`（适合个人定制）

### Q: 如何更新 Skill 文件？

定期从官方仓库下载最新版本：

```bash
# 下载最新版本
curl -o SKILL.md https://raw.githubusercontent.com/MoFox-Studio/mofox-plugin-toolkit/main/SKILL.md

# 或查看是否有更新
git pull  # 如果你克隆了仓库
```

MPDT 的 Skill 文件会随工具本身一起更新。

## 使用示例

安装完成后，你可以这样与 AI 对话：

### 示例 1：创建新插件

**你**：
```
使用 MPDT 创建一个翻译插件，模板选 tool
```

**AI 会做什么**：
1. 运行 `mpdt init translator --template tool`
2. 询问你的作者信息和许可证
3. 自动生成插件结构
4. 提示下一步操作（如添加组件、启动开发模式）

### 示例 2：添加组件

**你**：
```
给我的插件添加一个 action 组件，用于发送表情
```

**AI 会做什么**：
1. 确认当前在插件目录中
2. 运行 `mpdt generate action emoji_sender`
3. 询问组件描述
4. 生成组件文件
5. 建议运行 `mpdt check` 检查

### 示例 3：完整流程

**你**：
```
帮我创建一个完整的计算器插件，从初始化到打包
```

**AI 会做什么**：
1. `mpdt init calculator --template tool`
2. 生成必要的组件
3. `mpdt check --fix`
4. `mpdt build --bump patch`
5. 告诉你 `.mfp` 文件在 `dist/` 目录

## 进阶技巧

### 自定义提示词

你可以在对话中添加约束条件，AI 会遵循 Skill 工作流的同时满足你的要求：

```
使用 MPDT 创建插件，但我要用 MIT 许可证而不是 GPL-3.0
```

### 组合多个操作

```
创建一个天气查询插件，包含 tool 和 action 组件，然后启动开发模式
```

AI 会依次执行：
1. `mpdt init weather --template tool`
2. `mpdt generate action send_weather`
3. `mpdt dev`

### 调试模式

```
我的插件检查失败了，帮我诊断并修复
```

AI 会：
1. 运行 `mpdt check --level info --report markdown`
2. 分析错误报告
3. 运行 `mpdt check --fix`
4. 手动修复无法自动修复的问题

## 下一步

现在你已经安装了 Skill 文件，可以：

1. 📖 阅读 [MPDT 概述](./index.md) 了解工具能力
2. 🚀 按照 [安装指南](./installation.md) 安装 MPDT 本身
3. 🧪 尝试创建你的第一个插件
4. 📚 查看 [命令参考](./commands/init.md) 深入了解每个命令

**记住**：Skill 文件只是让 AI 更智能地使用 MPDT，你仍然需要安装 MPDT 工具本身。

---

::: tip 🤖 提示
如果你在使用过程中发现 Skill 文件的问题或有改进建议，欢迎到 [mofox-plugin-toolkit](https://github.com/MoFox-Studio/mofox-plugin-toolkit) 提交 Issue 或 PR。
:::
