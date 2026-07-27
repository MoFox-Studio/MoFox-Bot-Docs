# Neo-MoFox 插件开发自动化工作流

把一句话插件想法，变成一个**已完成框架本体加载/卸载验证**的 Neo-MoFox 插件。

面向 Claude Code（也适用于任何支持 Skill / 自定义命令的 Agent）。

---

## 这是什么

一套让 Agent 按固定流程开发 Neo-MoFox 插件的工件包：

```
用户一句话想法
   ↓  Phase 1  需求扩展（把隐含需求显性化，AskUserQuestion 收敛选择）
   ↓  Phase 2  组件选型 + 设计方案 + 文档交付计划（ExitPlanMode 等用户点头）
   ↓  Phase 3  按框架规范写代码并同步适用文档
   ↓  Phase 4  写测试
   ↓  Phase 5  三层自动验证 + 文档/manifest/实现人工一致性检查
   ↓  Phase 6  上线报告 + 版本与 commit 建议（只起草）
一个 0 FAIL 的插件
```

核心价值不在「生成代码」，而在 **Phase 5 的 `verify_plugin.py`**：它在一次性子进程和临时 cwd 中，通过真实 `PluginManager.load_plugin_from_manifest()` / `unload_plugin()` 验证目标目录插件本体，能在提交前抓出「代码看着对但框架加载不了」的问题。检查结果按 `FRAMEWORK` / `POLICY` / `RUNTIME` 分类，数量随执行路径动态变化。它不会加载外部依赖插件；存在合法外部组件依赖时会保留 `RUNTIME/WARN`，明确依赖组件运行可用性尚未动态验证。

---

## 目录结构

```
mofox-work/
├── README.md                       # 本文件
├── skills/
│   └── mofox-plugin-workflow/
│       ├── SKILL.md                # 主工作流（六阶段 + 12 条框架事实）
│       ├── references/
│       │   ├── commit-rules.md     # commit、仓库归属、SemVer 与发布确认规则
│       │   ├── component-rules.md  # 11 类组件的精确写法约束
│       │   ├── documentation-rules.md # 文档创建与一致性规则
│       │   ├── plugin-template.md  # 可直接改写的插件骨架（含精简 README）
│       │   └── test-patterns.md    # 测试 fake 对象模式
│       └── scripts/
│           └── verify_plugin.py    # 框架本体加载/卸载验证脚本（核心）
├── commands/
│   ├── mofox-plugin.toml           # /mofox-plugin  全流程
│   └── mofox-verify.toml           # /mofox-verify  只验证
└── examples/
    ├── e2e_probe/                  # 可真实加载的样例插件
    └── e2e_probe_tests/            # 配套行为测试
```

---

## 安装

### 方式 A：全局安装（推荐，所有项目可用）

Windows：

```bat
xcopy /E /I ".\mofox-work\skills\mofox-plugin-workflow" "%USERPROFILE%\.claude\skills\mofox-plugin-workflow"
copy ".\mofox-work\commands\*.toml" "%USERPROFILE%\.claude\commands\"
```

Linux / macOS：

```bash
cp -r skills/mofox-plugin-workflow ~/.claude/skills/
cp commands/*.toml ~/.claude/commands/
```

### 方式 B：项目级安装（只在 Neo-MoFox 仓库生效）

```bash
cd /path/to/Neo-MoFox
mkdir -p .claude/skills .claude/commands
cp -r /path/to/mofox-work/skills/mofox-plugin-workflow .claude/skills/
cp /path/to/mofox-work/commands/*.toml .claude/commands/
```

工作流会自动探测 Skill 装在哪里，两种方式都支持。

### 验证安装

在 Neo-MoFox 仓库根目录：

```bash
.venv/Scripts/python.exe -X utf8 ~/.claude/skills/mofox-plugin-workflow/scripts/verify_plugin.py plugins/todo_plugin
```

看到 `结果: NN PASS | ...` 就说明装好了。

---

## 怎么用

### 场景 1：从零做一个新插件

```
/mofox-plugin 我想做一个群聊关键词提醒插件，有人提到指定词就提醒我
```

Agent 会：

1. **Phase 0** 静默探测环境（解释器、插件目录、Skill 路径、mpdt 是否可用）
2. **Phase 1** 把想法扩展成完整需求，然后问你 2–4 个真正影响架构的问题
   （触发范围？要不要命令管理？要不要权限限制？）
3. **Phase 2** 给出设计方案（组件清单 / 数据流 / 配置项 / 文件结构 / 测试计划 / 文档交付计划），
   用 `ExitPlanMode` 等你确认 —— **没点头不会写任何代码**
4. **Phase 3-4** 写插件、按条件同步 README 等文档并写测试
5. **Phase 5** 跑三层自动验证，再人工核对 manifest、实际组件、文档和版本源；任何一层 FAIL 就定位修复后重跑
6. **Phase 6** 输出上线报告，并只起草 SemVer 与 `type(scope): subject` commit 建议

### 场景 2：验证一个已有插件能不能被加载

```
/mofox-verify plugins/my_plugin
```

或直接跑脚本：

```bash
.venv/Scripts/python.exe -X utf8 \
  ~/.claude/skills/mofox-plugin-workflow/scripts/verify_plugin.py \
  plugins/my_plugin
```

常用参数：

| 参数                    | 作用                                                                               |
| ----------------------- | ---------------------------------------------------------------------------------- |
| `--json`                | 结构化输出，便于 CI 消费                                                           |
| `--lifecycle`           | 额外执行 `on_plugin_loaded/on_plugin_unloaded`；使用前必须确认其副作用可接受       |
| `--strict`              | WARN 也算失败                                                                      |
| `--timeout <seconds>`   | 一次性 worker 超时，默认 30 秒；只终止 worker，不保证回收插件创建的后代进程        |
| `--project-root <path>` | 插件不在 Neo-MoFox 仓库内时指定框架根目录                                          |

退出码：`0` 通过 / `1` 有 FAIL / `2` `--strict` 下有 WARN / `3` 脚本自身出错。

### 场景 3：不用 slash command，直接让 Agent 用 Skill

Skill 会被自动匹配，直接说人话就行：

```
帮我给 mofox 写个自动总结群聊的插件
这个插件加载不了，帮我查一下
```

### 场景 4：接进 CI

```yaml
- name: Verify plugins
  run: |
    for p in plugins/*/; do
      python -X utf8 .claude/skills/mofox-plugin-workflow/scripts/verify_plugin.py "$p" --strict || exit 1
    done
```

---

## 使用与交付规则

### 文档交付

Phase 2 会先决定文档是否适用，Phase 3 再同步实际内容：

- 新插件默认提供精简 README，至少覆盖简介、安装与启用、配置、使用、实际组件差异、兼容性与限制。
- README 中的命令语法、权限、事件、配置默认值、组件签名、依赖和最低核心版本必须与 `manifest.json` 和实现一致。
- CHANGELOG 仅用于已有惯例、用户明确要求或版本发布；LICENSE 仅在许可证已明确时创建；API 文档仅用于稳定 Service、Router、Adapter 等公开接口。
- 不创建空文件或 TODO 占位，不把开发计划、调试过程、Agent 思考或重复说明写入长期文档。

详见 `skills/mofox-plugin-workflow/references/documentation-rules.md`。

### Commit、仓库与版本

Phase 6 默认只给建议，不自动执行版本或发布操作：

- commit 标题为 `type(scope): subject`；类型、scope、subject、body 和 footer 的具体要求见 `commit-rules.md`。
- 实现、对应测试和必要文档组成一个原子变更；无关改动和不同插件应拆分。
- 独立插件仓库承载插件源码、插件内测试和插件文档；主仓集成测试归 Neo-MoFox 主仓。跨仓变更分别检查、验证和提交。
- SemVer 按兼容性影响建议；得到版本递增确认后，先同步 `manifest.json`、`plugin_version` 等全部版本源并复验，再单独请求 commit。
- 版本递增、commit、build/package、push、package-update、publish、release/tag/上传制品均需逐项确认。
- 按用户偏好，不自动添加 `Co-Authored-By`。

详见 `skills/mofox-plugin-workflow/references/commit-rules.md`。

---

## verify_plugin.py 检查什么

当前脚本验证**目录插件的框架本体加载/卸载**，不声称完整覆盖 zip/.mfp archive。父进程只启动一个一次性 worker，并用 `--timeout` 限制执行时间；超时只终止 worker，不保证回收插件自行创建的后代进程。worker 切到临时 cwd，唯一明确的路径隔离保证是：框架自动生成的**相对路径** Config 位于临时 cwd，不写入项目的相对 `config/`。这不是安全沙箱：模块导入、插件使用的绝对路径、网络、外部数据库、子进程等副作用无法撤销。默认用空钩子抑制自定义 lifecycle；启用 `--lifecycle` 前必须确认真实钩子及其后代进程等副作用可接受。验证器不会导入外部依赖插件，只核对外部组件依赖声明；声明合法时仍产生 `RUNTIME/WARN`，表示目标插件本体真实 load/unload 已通过，但依赖组件运行可用性未动态验证。

主要检查范围：

| 分类 | 检查内容 |
|---|---|
| `FRAMEWORK` | manifest/entry point、版本兼容与依赖计划、组件识别、Action/Agent `associated_types`、签名与内部依赖 |
| `POLICY` | 显式 `min_core_version`、跨插件/自导入、裸 `asyncio.create_task`、外部依赖声明、include 元数据一致性 |
| `RUNTIME` | Python dependencies、真实加载、组件 ACTIVE、EventHandler 注册、真实卸载与残留清理、可选 lifecycle |

检查数量由实际执行路径动态决定。新插件目标是 **0 FAIL**；只有不存在未动态验证的外部组件依赖，且没有隔离、lifecycle、后代进程等相关未覆盖风险时，才可把 **0 WARN / 0 FAIL** 作为结论。

---

## 当前验证快照

以下仅是带环境信息的回归快照，不作为固定营销指标：

- 日期：2026-07-27
- 框架：Neo-MoFox `dev`，core version `1.3.0-alpha.0`
- 目标：`examples/e2e_probe`
- 验证口径：当前目录插件框架本体验证器；样例无外部组件依赖及相关风险，要求 `0 WARN / 0 FAIL`

每次脚本或框架行为变化后都应重新运行，以当次动态计数和测试输出为准。

---

## examples/e2e_probe 是什么

**这个工作流自己产出的样例插件**，用来证明模板能产出可加载的代码，不是手工挑选的成功案例。

生成过程：按 `references/plugin-template.md` 的骨架写 Service + EventHandler + Command + Config，按 `references/test-patterns.md` 写测试。请用当前框架与当前脚本现场验证：

```bash
PLUGIN_DIR="$PLUGINS_DIR/e2e_probe"
ruff check "$PLUGIN_DIR"
"$PY" -X utf8 "$SKILL_DIR/scripts/verify_plugin.py" "$PLUGIN_DIR" --project-root "$PROJECT_ROOT" --timeout 30
"$PY" -X utf8 -m pytest examples/e2e_probe_tests -q --no-cov -p no:randomly
```

验收标准：ruff 通过、验证器 `0 WARN / 0 FAIL`、pytest 全部通过。

要复用它作起点：

```bash
cp -r examples/e2e_probe /path/to/Neo-MoFox/plugins/my_plugin
cp -r examples/e2e_probe_tests /path/to/Neo-MoFox/test/plugins/my_plugin
# 然后全局替换 e2e_probe -> my_plugin、probe_ -> my_，改 manifest.json
```

**这个验证过程中修掉了模板的一个真实 bug**：`send_api.send_text` 的参数顺序原本写成
`(stream_id, content)`，实际签名是 `send_text(content, stream_id, ...)`。不做端到端
实测发现不了。

---

## 工作流的硬约束

1. **只改插件目录** —— 默认禁止修改 `src/kernel/`、`src/core/`、`src/app/`。
   发现框架能力不足时输出「需要框架层支持」并停下。
2. **先计划后开发** —— 用户未确认设计方案前不写任何代码。
3. **参考资料优先级** —— 源码 > `AI插件编写规范.md` > `docs/`。
   文档可能滞后于实现，冲突时以源码为准。
4. **发布类动作逐项单独确认** —— 版本递增、`git commit`、构建/打包、`git push`、
   `mpdt market publish`、`mpdt market package-update`、release/tag/上传制品互不代替授权。
5. **文档按需创建并保持一致** —— README 只写实际配置、命令、组件和限制；CHANGELOG、
   LICENSE、API 文档只在适用时创建，禁止空文档、重复文档和过程文档。
6. **提交按仓库归属原子拆分** —— 使用 `type(scope): subject`，独立插件仓库与主仓分别提交；
   按用户偏好不自动添加 `Co-Authored-By`。
7. **不硬编码密钥** —— API key 走 `BaseConfig` 字段。

---

## 与 mpdt 的关系

如果你装了 MPDT（MoFox Plugin Dev Toolkit），两者互补：

| 工具     | 职责                                                               |
| -------- | ------------------------------------------------------------------ |
| `mpdt`   | 脚手架与打包：`plugin init/generate/check/build`、`market publish` |
| 本工作流 | 流程编排 + **框架本体加载/卸载验证**                              |

工作流会在 Phase 3 优先调 `mpdt plugin init` / `mpdt plugin generate`（命令组件类型为 `plus-command`）生成骨架，Phase 5.1 调
`mpdt plugin check "$PLUGIN_DIR" --level warning` 做静态检查。但 **`mpdt check` 不能替代 `verify_plugin.py`**
—— 前者是静态检查，不会真实导入插件、不验证 `@register_plugin` 是否生效、
不验证组件能否注册进 `ComponentRegistry`。

没装 mpdt 也能用，工作流会降级为按模板手写。

---

## 环境要求

- Python >= 3.11（Neo-MoFox 仓库要求）
- 在 Neo-MoFox 仓库根目录运行（含 `src/app/plugin_system`）
- Windows 中文终端：所有 python 调用加 `-X utf8`，否则 GBK 下 rich 会抛
  `UnicodeEncodeError`

工作流 Phase 0 会自动探测这些，不写死路径：

| 变量           | 探测顺序                                                                      |
| -------------- | ----------------------------------------------------------------------------- |
| `$PY`          | `.venv/Scripts/python.exe` → `.venv/bin/python` → `command -v python3/python` |
| `$PLUGINS_DIR` | 用 Python 3.11 `tomllib` 读取 `config/*.toml` 的 `plugins_dir`，默认 `plugins`       |
| `$SKILL_DIR`   | `$HOME/.claude/skills/...` → `.claude/skills/...`                             |
| `$TEST_DIR`    | 改已有插件跟随现有约定；新建时按是否独立 git 仓库决定                         |

---

## 常见问题

**Q: 插件不在 Neo-MoFox 仓库里怎么验证？**

```bash
python -X utf8 verify_plugin.py /path/to/my_plugin --project-root /path/to/Neo-MoFox
```

**Q: `--lifecycle` 要不要开？**

默认不开。它会真的执行 `on_plugin_loaded()` / `on_plugin_unloaded()`，可能注册定时任务、连接外部服务或创建后代进程；验证器超时只终止 worker，不保证回收这些后代进程。只有在事先确认这些副作用可接受、或专门要测钩子时才开。

**Q: 测试该放插件内还是主仓 `test/plugins/`？**

改已有插件时**跟随该插件现有约定**，不要用规则去猜。本仓库有反例：
`todo_plugin` 是独立 git 仓库但测试在主仓，`kokoro_flow_chatter-main` 不是 git
仓库却自带 `tests/`。新建插件时才用默认规则（独立仓库放插件内，主仓插件放主仓）。

**Q: verify 报 WARN 要不要修？**

看内容。合法外部组件依赖会固定产生 `RUNTIME/WARN`：验证器只核对声明，不加载依赖插件，因此这表示目标插件本体 load/unload 已通过，但依赖组件运行可用性未动态验证；「绝对自导入」「裸 `create_task`」也应当修。

---

## 修改工作流本身

改完 `SKILL.md` 或 `references/` 后，记得同步到安装位置：

```bash
cp -r skills/mofox-plugin-workflow ~/.claude/skills/
cp commands/*.toml ~/.claude/commands/
```

改 `verify_plugin.py` 后，至少在 3 个已有插件上回归一遍，确认没有新的误报。
