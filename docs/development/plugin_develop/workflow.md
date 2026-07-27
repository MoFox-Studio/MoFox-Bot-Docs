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

## 获取完整工作流

下面的静态快照保留了原始目录结构。安装 Skill 时，请完整获取 `skills/mofox-plugin-workflow/`，以保留其对 `references/` 和 `scripts/` 的相对引用。

- [工作流 README](/downloads/mofox-plugin-workflow/README.md)
- [主 Skill 定义](/downloads/mofox-plugin-workflow/skills/mofox-plugin-workflow/SKILL.md)
- [真实加载/卸载验证器](/downloads/mofox-plugin-workflow/skills/mofox-plugin-workflow/scripts/verify_plugin.py)
- [全流程命令定义](/downloads/mofox-plugin-workflow/commands/mofox-plugin.toml)
- [仅验证命令定义](/downloads/mofox-plugin-workflow/commands/mofox-verify.toml)
- [可加载样例插件的入口文件](/downloads/mofox-plugin-workflow/examples/e2e_probe/plugin.py)
- [样例行为测试](/downloads/mofox-plugin-workflow/examples/e2e_probe_tests/test_probe.py)

具体安装方式、六阶段流程、组件规则、测试模式和提交边界均以随附的原始工作流文件为准。

::: warning 验证器会执行真实插件导入
`verify_plugin.py` 会真实导入、加载并卸载目标插件。它使用临时工作目录，但这**不是安全沙箱**：插件的网络访问、数据库操作、绝对路径写入和子进程等副作用无法由验证器撤销。

默认不执行插件自定义 lifecycle；使用 `--lifecycle` 前，请确认 `on_plugin_loaded()`、`on_plugin_unloaded()` 及其后代进程的副作用可接受。
:::

## 推荐使用顺序

1. 完成 [插件编写指南](./guide/plugin-authoring) 中与目标功能相关的章节；
2. 阅读工作流 [README](/downloads/mofox-plugin-workflow/README.md)，按需安装 Skill 和命令定义；
3. 用 `/mofox-plugin` 或自然语言触发工作流，先确认设计方案，再开始实现；
4. 使用 `verify_plugin.py` 验证目录插件的真实加载/卸载；
5. 根据工作流的交付报告，分别确认版本、提交、构建、推送或发布等动作。
