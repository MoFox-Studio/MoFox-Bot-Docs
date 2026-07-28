# Agent 插件开发工作流

这套工作流面向 Claude Code 等支持 Skill / 自定义命令的 Agent，编排从需求澄清、方案确认、开发与测试，到真实加载/卸载验证的插件交付流程。

它是现有插件开发教程的补充：教程说明插件机制、组件与 API；工作流帮助你把这些知识落实为可验证的交付过程。

## 何时使用

- 从零开始开发 Neo-MoFox 插件；
- 排查目录插件无法加载的问题；
- 在提交前验证插件能否由框架真实加载、注册并卸载；
- 希望 Agent 按固定阶段完成需求澄清、方案确认、测试和交付报告。

## 与现有教程、MPDT 的关系

开始前，建议先阅读 [插件机制原理](./guide/mechanism) 和 [插件编写指南](./guide/plugin-authoring)。

- **插件开发教程**：说明框架机制、目录结构、`manifest.json`、组件和 API。
- **MPDT 开发工具**：提供初始化、生成、静态检查、构建和市场相关命令。参见 [MPDT 概述](/docs/development/mpdt/)。
- **本工作流**：负责需求扩展、设计方案确认、测试布局、真实加载/卸载验证和交付报告。它可调用 MPDT，但 `verify_plugin.py` 提供的真实框架验证不能由静态检查替代。

## 下载完整工作流

[下载完整工作流包（ZIP）](/downloads/mofox-plugin-workflow/mofox-plugin-workflow.zip)

压缩包包含 Skill、两个 slash command、全部参考资料、真实加载/卸载验证器、`e2e_probe` 样例插件、样例测试和验证器测试。解压后只有一个顶层目录：`mofox-plugin-workflow/`。

安装时必须完整保留 `skills/mofox-plugin-workflow/`，不能只取 `SKILL.md`；该目录会相对引用其中的 `references/` 和 `scripts/`。

## 安装完整工作流

全局安装与项目级安装二选一。安装完成后，请重新打开 Claude Code 会话，使其重新发现 Skill 和命令。

### Windows：全局安装

1. 下载并解压 ZIP，进入解压后的 `mofox-plugin-workflow` 目录。
2. 在命令提示符中执行：

```bat
mkdir "%USERPROFILE%\.claude\skills" "%USERPROFILE%\.claude\commands"
xcopy /E /I ".\skills\mofox-plugin-workflow" "%USERPROFILE%\.claude\skills\mofox-plugin-workflow"
copy ".\commands\*.toml" "%USERPROFILE%\.claude\commands\"
```

### Linux / macOS：全局安装

解压并进入 `mofox-plugin-workflow` 目录后执行：

```bash
mkdir -p ~/.claude/skills ~/.claude/commands
cp -R skills/mofox-plugin-workflow ~/.claude/skills/
cp commands/*.toml ~/.claude/commands/
```

### 项目级安装

如只希望在一个 Neo-MoFox 项目中使用，请在目标项目根目录执行。将 `/path/to/mofox-plugin-workflow` 替换为 ZIP 的解压目录：

```bash
mkdir -p .claude/skills .claude/commands
cp -R /path/to/mofox-plugin-workflow/skills/mofox-plugin-workflow .claude/skills/
cp /path/to/mofox-plugin-workflow/commands/*.toml .claude/commands/
```

Windows 用户可在资源管理器中将解压目录内的 `skills\mofox-plugin-workflow` 复制到项目 `.claude\skills\`，并将 `commands` 内两个 `.toml` 文件复制到项目 `.claude\commands\`。

## 验证与首次使用

确认以下文件均已复制：

```text
.claude/
├── skills/mofox-plugin-workflow/
│   ├── SKILL.md
│   ├── references/
│   └── scripts/verify_plugin.py
└── commands/
    ├── mofox-plugin.toml
    └── mofox-verify.toml
```

在新的 Claude Code 会话中，可以通过以下方式开始：

```text
/mofox-plugin 我想做一个群聊关键词提醒插件
```

工作流会先澄清需求并给出方案，确认前不会开始编写插件代码。验证已有目录插件时，在 Neo-MoFox 仓库根目录使用：

```text
/mofox-verify plugins/my_plugin
```

也可以使用 Neo-MoFox 项目的 Python 解释器直接调用 `.claude/skills/mofox-plugin-workflow/scripts/verify_plugin.py`。详细参数、退出码、测试方式和交付规则以 ZIP 内 [README.md](https://github.com/qingfeng66640/mofox-plugin-workflow/blob/main/README.md) 为准。

### 找不到 Skill 或命令

- 确认复制的是整个 `skills/mofox-plugin-workflow/`，而不是单独的 `SKILL.md`；
- 确认两个 `.toml` 文件位于对应的 `.claude/commands/` 目录；
- 确认全局安装与项目级安装所用位置一致；
- 重新打开 Claude Code 会话；
- 执行验证时确认当前目录是 Neo-MoFox 项目根目录。

::: warning 验证器会执行真实插件导入
`verify_plugin.py` 会真实导入、加载并卸载目标插件。它使用临时工作目录，但这**不是安全沙箱**：插件的网络访问、数据库操作、绝对路径写入和子进程等副作用无法由验证器撤销。

默认不执行插件自定义 lifecycle；使用 `--lifecycle` 前，请确认 `on_plugin_loaded()`、`on_plugin_unloaded()` 及其后代进程的副作用可接受。验证器目前覆盖目录插件的真实加载/卸载验证，不代表 ZIP 或 `.mfp` 插件包已被验证。
:::

## 推荐使用顺序

1. 完成 [插件编写指南](./guide/plugin-authoring) 中与目标功能相关的章节；
2. 下载完整工作流包，选择全局或项目级安装；
3. 用 `/mofox-plugin` 或自然语言触发工作流，先确认设计方案，再开始实现；
4. 使用 `/mofox-verify` 或 `verify_plugin.py` 验证目录插件的真实加载/卸载；
5. 根据工作流的交付报告，分别确认版本、提交、构建、推送或发布等动作。
