# Agent 插件开发工作流

这套工作流面向 Claude Code 等支持 Skill 的 Agent，编排从需求澄清、方案确认、开发与测试，到真实加载/卸载验证、代码 Review 和交付报告的插件开发流程。

它是现有插件开发教程的补充：教程说明插件机制、组件与 API；工作流帮助你把这些知识落实为可验证的交付过程。

## 何时使用

- 从零开始开发 Neo-MoFox 插件；
- 排查目录插件无法加载的问题；
- 在提交前验证插件能否由框架真实加载、注册并卸载；
- 对已有插件做代码 Review，或希望 Agent 按固定阶段完成开发、验证和交付。

## 与现有教程、MPDT 的关系

开始前，建议先阅读 [插件机制原理](./guide/mechanism) 和 [插件编写指南](./guide/plugin-authoring)。

- **插件开发教程**：说明框架机制、目录结构、`manifest.json`、组件和 API。
- **MPDT 开发工具**：提供初始化、生成、静态检查、构建和市场相关命令。参见 [MPDT 概述](/docs/development/mpdt/)。
- **本工作流**：负责编排需求、设计、测试、验证、Review 和交付。它可调用 MPDT，但 `verify_plugin.py` 提供的真实框架验证不能由静态检查替代。

## 下载完整工作流

[下载完整工作流包（ZIP）](/downloads/mofox-plugin-workflow/mofox-plugin-workflow.zip)

压缩包包含 Skill、两个 Claude Code Markdown 命令、全部参考资料、真实加载/卸载验证器、`e2e_probe` 样例插件、样例测试和验证器测试。解压后只有一个顶层目录：`mofox-plugin-workflow/`。

安装时必须完整保留 `skills/mofox-plugin-workflow/`，不能只取 `SKILL.md`；该目录会相对引用其中的 `references/` 和 `scripts/`。

## 安装完整工作流

以下是 Claude Code 的安装方式，全局安装与项目级安装二选一。从旧包升级时，请重新复制整个 Skill 目录和两个 `.md` 命令；原先的 `.toml` 不再作为 Claude Code 命令入口。安装完成后重新打开会话，使其重新发现 Skill 和命令。

### Windows：全局安装

1. 下载并解压 ZIP，进入解压后的 `mofox-plugin-workflow` 目录。
2. 在命令提示符中执行：

```bat
mkdir "%USERPROFILE%\.claude\skills" "%USERPROFILE%\.claude\commands"
xcopy /E /I /Y ".\skills\mofox-plugin-workflow" "%USERPROFILE%\.claude\skills\mofox-plugin-workflow"
copy /Y ".\commands\*.md" "%USERPROFILE%\.claude\commands\"
```

### Linux / macOS：全局安装

解压并进入 `mofox-plugin-workflow` 目录后执行：

```bash
mkdir -p ~/.claude/skills ~/.claude/commands
cp -R skills/mofox-plugin-workflow ~/.claude/skills/
cp commands/*.md ~/.claude/commands/
```

### 项目级安装

如只希望在一个 Neo-MoFox 项目中使用，请在目标项目根目录执行。将 `/path/to/mofox-plugin-workflow` 替换为 ZIP 的解压目录：

```bash
mkdir -p .claude/skills .claude/commands
cp -R /path/to/mofox-plugin-workflow/skills/mofox-plugin-workflow .claude/skills/
cp /path/to/mofox-plugin-workflow/commands/*.md .claude/commands/
```

Windows 用户可在资源管理器中将解压目录内的 `skills\mofox-plugin-workflow` 复制到项目 `.claude\skills\`，并将 `commands` 内两个 `.md` 文件复制到项目 `.claude\commands\`。

## 验证与首次使用

确认以下文件均已复制：

```text
.claude/
├── skills/mofox-plugin-workflow/
│   ├── SKILL.md
│   ├── references/
│   └── scripts/verify_plugin.py
└── commands/
    ├── mofox-plugin.md
    └── mofox-verify.md
```

在 Neo-MoFox 仓库根目录打开新的 Claude Code 会话，可以通过以下方式开始：

```text
/mofox-plugin 我想做一个群聊关键词提醒插件
```

工作流会先澄清需求并给出方案，确认前不会开始编写插件代码。如果只想验证已有目录插件是否能真实加载和卸载，使用：

```text
/mofox-verify plugins/my_plugin
```

也可以用 Neo-MoFox 项目的 Python 解释器直接运行 `verify_plugin.py`。脚本在已安装的 `.claude/skills/mofox-plugin-workflow/scripts/` 中；全局安装在用户主目录下，项目级安装在项目根目录下。详细参数、退出码、测试方式和交付规则见 ZIP 内的 `README.md`。

### 找不到 Skill 或命令

- 确认复制的是整个 `skills/mofox-plugin-workflow/`，而不是单独的 `SKILL.md`；
- 确认两个 `.md` 文件位于对应的 `.claude/commands/` 目录；
- 确认 Skill 和命令安装在同一个层级（全局或项目级）；
- 重新打开 Claude Code 会话；
- 执行验证时确认当前目录是 Neo-MoFox 项目根目录。

::: warning 验证器会执行真实插件导入
`verify_plugin.py` 会真实导入、加载并卸载目标插件。它使用临时工作目录，但这**不是安全沙箱**：插件的网络访问、数据库操作、绝对路径写入和子进程等副作用无法由验证器撤销。

默认不执行插件自定义 lifecycle；使用 `--lifecycle` 前，请确认 `on_plugin_loaded()`、`on_plugin_unloaded()` 及其后代进程的副作用可接受。验证器目前覆盖目录插件的真实加载/卸载验证，不代表 ZIP 或 `.mfp` 插件包已被验证。
:::

## 新插件的交付要求

1. 用 `/mofox-plugin` 或自然语言触发完整工作流，先确认设计方案，再开始实现。
2. 编写单元与行为测试，并补齐**组件构造/执行契约测试**。按框架管理器实际传参方式核对组件签名，避免测试替身绕过真实调用约定。写法见包内 `references/test-patterns.md`。
3. 依次执行静态检查、目录插件真实加载/卸载、测试，并核对 manifest、注册组件与文档是否一致。`/mofox-verify` 是独立验证入口，不能替代完整交付检查。
4. 新插件交付前必须完成 **Phase 5.5 代码 Review**。优先检查框架契约；发现阻断问题先修复再复验。Review 规则见包内 `references/review-rules.md`。
5. 在交付报告中列出契约测试与 Review 结果、实际检查结果和未覆盖范围；版本递增、提交、构建、推送或发布等动作分别确认。
