---
name: mofox-plugin-workflow
description: "Neo-MoFox 插件开发全流程自动化：从一句话想法出发，扩展需求、生成设计方案、等待确认、按框架规范开发、生成测试、运行静态与集成验证、模拟消息链路跑通、输出上线报告。关键词：mofox 插件、Neo-MoFox 插件开发、写个插件、插件工作流、插件验证、插件测试、verify_plugin。"
---

# Neo-MoFox 插件开发自动化工作流

把一句话插件想法变成一个**已完成框架本体加载/卸载验证**的 Neo-MoFox 插件。

## 何时使用

- "我想做一个 XX 插件"
- "给 mofox 写个 XX 功能"
- "帮我把这个插件跑通 / 验证一下"
- "这个插件加载不了，查一下"

## 与 mpdt-plugin-development 的分工

| Skill | 职责 |
|---|---|
| `mpdt-plugin-development` | **命令手册**：`mpdt plugin init/generate/check/build`、`mpdt market publish` 等具体命令参数 |
| 本 Skill | **工作流编排**：需求扩展 → 方案确认 → 开发 → 测试 → 集成验证 → 上线报告 |

两者互补。本 Skill 在脚手架阶段可以调用 `mpdt plugin init` / `mpdt plugin generate`，在静态检查阶段可以调用 `mpdt plugin check --fix`，但**集成验证必须用本 Skill 的 `verify_plugin.py`**——`mpdt check` 是静态检查，不会真实导入插件、不会验证 `@register_plugin` 是否生效、不会验证组件能否注册进 `ComponentRegistry`。

---

## 硬约束（任何阶段都不得违反）

1. **只改插件目录**。默认禁止修改 `src/kernel/`、`src/core/`、`src/app/`。发现框架能力不足时，输出"需要框架层支持"并停下，不要动核心。
2. **先计划后开发**。用户未确认设计方案前不写任何插件代码。
3. **参考资料优先级**：源码 > `AI插件编写规范.md` > `docs/`。`docs/app/plugin_system.md`、`docs/examples/manifest_example.json` 等可以读，但文档可能滞后于实现，与源码行为冲突时一律以源码为准。
4. **发布类动作必须逐项单独确认**：版本递增、`git commit`、构建/打包、`git push`、`mpdt market publish`、`mpdt market package-update`、release/tag/上传制品互不代替授权。默认只起草建议。
5. **不硬编码密钥**。API key 走 `BaseConfig` 字段，不写进源码。
6. **提交与版本规则**：遵循 `references/commit-rules.md`；提交标题用 `type(scope): subject`，按仓库归属原子拆分，且按用户偏好不自动添加 `Co-Authored-By`。
7. **文档按需创建**：遵循 `references/documentation-rules.md`，禁止空文档、重复文档和记录开发过程的长期文档。

---

## 六阶段工作流

### Phase 0：环境探测（自动，不询问用户）

**不要假设任何路径**。先探测出四个变量，后续所有命令都用探测结果，不要写死。

```bash
# 1. 确认在 Neo-MoFox 仓库根
ls src/app/plugin_system >/dev/null || echo "不是 Neo-MoFox 项目根"

# 2. 探测 Python 解释器 → 记为 $PY
#    Windows venv / POSIX venv / 全局，取第一个存在的
PY=$(ls .venv/Scripts/python.exe 2>/dev/null \
  || ls .venv/bin/python 2>/dev/null \
  || command -v python3 \
  || command -v python)
echo "解释器: $PY"

# 3. 探测插件目录 → 记为 $PLUGINS_DIR
#    用 Python 3.11 标准库 tomllib 读取 config/*.toml；默认 "plugins"
PLUGINS_DIR=$("$PY" -X utf8 - <<'PY'
from pathlib import Path
import tomllib

for path in sorted(Path("config").glob("*.toml")):
    try:
        data = tomllib.loads(path.read_text(encoding="utf-8"))
    except (OSError, tomllib.TOMLDecodeError):
        continue
    value = data.get("plugins_dir")
    if not value:
        value = data.get("core", {}).get("plugins_dir")
    if isinstance(value, str) and value.strip():
        print(value.strip())
        break
else:
    print("plugins")
PY
)
echo "插件目录: $PLUGINS_DIR"
ls "$PLUGINS_DIR"

# 4. mpdt 是否可用（可选工具，不可用时降级为手写骨架）
mpdt --version 2>&1 | head -1
```

**Windows 编码**：中文输出必须加 `-X utf8`，否则 GBK 终端下 rich 会抛 `UnicodeEncodeError`。所有 python 调用统一写成 `"$PY" -X utf8 <script> <args>`。

**目标插件是否为独立 git 仓库** —— 这决定测试写到哪里、提交到哪个仓库：

```bash
ls -d "$PLUGINS_DIR/<plugin_name>/.git" 2>/dev/null && echo "独立仓库" || echo "主仓内插件"
```

本仓库 29 个插件中有 16 个是独立 git 仓库。两种情况处理方式不同，见 Phase 4。

读一个**同类型**的现有插件作为参照（要做命令类就读一个带 `BaseCommand` 的，要做 EventHandler 类就读一个带 `BaseEventHandler` 的）。不要跳过这一步——现有插件是这个框架真实用法的最好证据。

---

### Phase 1：需求扩展

用户输入通常很粗糙。**不要直接问一堆问题**，先做一轮扩展，把隐含需求显性化，再用 `AskUserQuestion` 收敛 2–4 个真正影响架构的选择。

从这些维度扩展：

```
触发方式    被动监听消息 / 主动命令 / LLM 调用 / 定时任务 / HTTP 请求
作用范围    群聊 / 私聊 / 指定群 / 全平台
数据存储    无 / 配置文件 / JSON store / 数据库 / 向量库
权限        无 / USER / OPERATOR / OWNER
LLM         不需要 / 需要（哪个 model task）
外部依赖    无 / 第三方 API / 本地服务
生命周期    无状态 / 需要 on_plugin_loaded 初始化 / 需要定时任务
跨插件      独立 / 需要暴露 Service / 需要依赖其他插件
```

输出格式：

```markdown
## 我理解的插件目标
<一句话>

## 建议扩展的能力
1. ...（核心）
2. ...（辅助）
3. ...（管理）

## 需要你拍板的点
<用 AskUserQuestion 提 2-4 个，每个都要影响组件选型>
```

---

### Phase 2：组件选型 + 设计方案

#### 选型决策表

| 需求特征 | 组件 | 基类 | 名称属性 | 返回约定 |
|---|---|---|---|---|
| 收到消息后被动响应/拦截 | EventHandler | `BaseEventHandler` | `name` | `(EventDecision, params)` |
| 用户敲命令触发 | Command | `BaseCommand` | `name` | `(bool, str)` |
| LLM 查信息、算东西 | Tool | `BaseTool` | `name` | `(bool, str \| dict)` |
| LLM 执行动作、发消息、写状态 | Action | `BaseAction` | `name` | `(bool, str)` |
| 需要私有工具集的子代理 | Agent | `BaseAgent` | `name` | `(bool, str \| dict)` |
| 对话主流程控制 | Chatter | `BaseChatter` | `name` | `AsyncGenerator[Wait\|Success\|Failure\|Stop]` |
| 给其他插件复用的能力 | Service | `BaseService` | `name` | 自定 |
| HTTP 接口 | Router | `BaseRouter` | `name` | 无 |
| 平台协议桥接 | Adapter | `BaseAdapter` | `name` | `MessageEnvelope` |
| 用户可调参数 | Config | `BaseConfig` | `name`（`ClassVar`） | 配置模型 |

**Tool vs Action 判据**：核心价值是"返回信息"→ Tool；核心价值是"产生副作用"→ Action。

详细的每类组件写法约束见 `references/component-rules.md`。

#### 设计方案模板

```markdown
# 插件设计方案：<plugin_name>

## 1. 目标
<一句话>

## 2. 组件清单
| 签名 | 类名 | 文件 | 作用 |
|---|---|---|---|
| `<plugin>:config:config` | `XxxConfig` | config.py | ... |
| `<plugin>:event_handler:xxx` | `XxxHandler` | handlers.py | ... |
| `<plugin>:command:xxx` | `XxxCommand` | commands.py | ... |

## 3. 数据流
<从触发源到最终副作用的完整链路，标出经过哪个 EventType / API>

## 4. 配置项
| 字段 | 类型 | 默认 | 说明 |

## 5. 文件结构
<列出将创建的每个文件>

## 6. 文档交付计划
| 文档 | 创建/更新条件 | 本次内容 |
|---|---|---|
| `README.md` | 新插件，或使用/配置/组件/限制变化 | ... |
| `CHANGELOG.md` | 仓库已有惯例、用户明确要求或版本发布 | ... |
| `LICENSE` | 用户指定许可证或仓库已有明确政策 | ... |
| API 文档 | 暴露稳定 Service/Router/Adapter 或用户明确要求 | ... |

没有适用内容的文档不创建，不保留空章节。详细规则见 `references/documentation-rules.md`。

## 7. 不修改范围
- src/kernel、src/core、src/app 全部不动
```

方案写完后用 `ExitPlanMode` 请求确认。**用户没点头就不要写代码。**

---

### Phase 3：开发

#### 目录结构

```
plugins/<plugin_name>/
├── manifest.json
├── __init__.py
├── plugin.py          # entry_point，含 @register_plugin 插件类
├── config.py
├── handlers.py        # 按需
├── commands.py        # 按需
├── tools.py           # 按需
├── actions.py         # 按需
└── services.py        # 按需

test/plugins/<plugin_name>/
├── __init__.py
├── conftest.py
└── test_*.py
```

#### 脚手架方式二选一

**A. 用 mpdt（推荐，能自动生成合规骨架）**

```bash
PLUGIN_DIR="$PLUGINS_DIR/<plugin_name>"
mpdt plugin init <plugin_name> --template event_handler --output "$PLUGINS_DIR"
mpdt plugin generate plus-command <cmd_name> "$PLUGIN_DIR" --root --description "..."
```

**B. 手写**（mpdt 不可用时）。按 `references/plugin-template.md` 的骨架逐文件写。

#### 文档同步

按 Phase 2 的文档交付计划和 `references/documentation-rules.md` 同步文档：

- 新插件创建精简 README；已有插件仅在安装、配置、使用、组件行为、依赖或限制变化时更新。
- README 的插件名、配置、命令、组件签名、依赖、最低核心版本和版本信息必须来自 manifest 与实现。
- 只有满足条件时才创建或更新 CHANGELOG、LICENSE、API 文档；禁止空文件、重复说明、TODO 占位和过程文档。
- 不因模板中存在章节就保留不适用的空章节。

#### 必须遵守的框架事实（这些是源码行为，不是风格建议）

1. **`manifest.name` 必须 == 插件类 `plugin_name`**。`PluginManager` 用 `get_plugin_class(manifest.name)` 找类，不一致直接报"插件类未注册"。
   证据：`src/core/managers/plugin_manager.py:227`

2. **配置类只能放 `configs`，不能放 `get_components()`**。加载器先处理 `configs`，再用 `get_components()` 注册组件。配置类混进后者会被当成 `config` 类型组件重复注册。
   证据：`src/core/managers/plugin_manager.py:185-198`

3. **`configs` 里多个配置类只有第一个会注入 `self.config`**。需要多配置时用 `config_api` 显式加载。
   证据：`src/core/managers/plugin_manager.py:193-198`

4. **`manifest.include` 不是注册真源**，`include[].enabled=false` 不会阻止注册。真正的注册来源是 `get_components()` + `configs`。要禁用组件必须改代码。

5. **`min_core_version` 只有在 manifest 中为非空字符串时才满足工作流政策**。key 缺失、`null`、空字符串或纯空白均由验证器 S3 报告 `POLICY/WARN`；框架自身可能继续加载。

6. **所有组件的新代码统一声明 `name` / `description`**。旧 `*_name` / `*_description` 仅由弃用桥接兼容，模板和示例不得依赖它；Config 必须使用 `ClassVar[str]`。

7. **Action 与 Agent 必须显式声明非空 `associated_types: list[str]`**。空列表、缺失、非 list 或含空字符串都会在真实注册时失败。

8. **组件类型靠 `issubclass` 推断，名称统一从 `name` 读取**。`name` 为空会导致组件识别失败。
   证据：`src/core/managers/plugin_manager.py` 的 `_identify_component()`。

9. **插件间禁止源码级 import**。`from plugins.other_plugin.xxx import Yyy` 是硬违规，必须走 `service_api.get_service("other:service:name")`。

10. **插件内部必须用相对导入**（`.config`、`..protocol`），不能 `from plugins.self.config import`。

11. **后台任务用 `task_manager`**，不用裸 `asyncio.create_task()`：
   ```python
   from src.kernel.concurrency import get_task_manager
   get_task_manager().create_task(coro, name="xxx", daemon=True)
   ```

12. **`Service` 不是单例**。`service_api.get_service()` 每次返回新实例，不要依赖实例字段跨调用保持状态。

13. **EventHandler 抛异常不会拦截传播**，事件管理器会把异常转成 `EventDecision.PASS`。要阻断必须显式 `return EventDecision.STOP, params`。

14. **EventHandler 必须保持 `params` 的 key 集合不变**，事件总线会校验。

---

### Phase 4：写测试

#### 4.1 先确定测试放哪

**改已有插件时：跟随该插件的现有约定，不要用规则去猜。**

```bash
ls -d "$PLUGINS_DIR/<plugin_name>/tests" "$PLUGINS_DIR/<plugin_name>/test" 2>/dev/null   # 插件内
ls -d "test/plugins/<plugin_name>" 2>/dev/null                                            # 主仓
```

已有哪个就往哪个加。两个都有（如 `article_manager`）→ 看新测试测的是什么：测插件内部逻辑放插件内，测与框架集成放主仓。

**新建插件时**，按是否独立 git 仓库决定：

```bash
ls -d "$PLUGINS_DIR/<plugin_name>/.git" >/dev/null 2>&1 && echo "独立仓库" || echo "主仓插件"
```

| 情况 | 新插件默认位置 |
|---|---|
| 独立 git 仓库 | `$PLUGINS_DIR/<name>/tests/` |
| 主仓内插件 | `test/plugins/<name>/` |

理由：独立仓库插件单独 clone 时测试应当跟着走；测试留在主仓会导致代码与测试分家。

**这只是新建时的默认值，不是硬规则。** 本仓库实测 20 个有测试的插件中，9 个符合「独立仓库→自带 tests」，3 个符合「主仓插件→主仓 tests」，但有 3 个反例：

- `todo_plugin` —— 独立仓库，测试却全在 `test/plugins/todo_plugin/`
- `kokoro_flow_chatter-main` —— 非 git 仓库，却自带 `tests/`
- `article_manager` —— 独立仓库，两边都有

遇到这类插件，**照它现在的样子做**，不要按规则强行搬动已有测试。

仓库已配置 `asyncio_mode = "auto"`，async 测试不需要 `@pytest.mark.asyncio`。

#### 4.2 必备 conftest.py

Windows 事件循环 + 存储隔离。不要固定 `parents[N]`，而要向上查找同时包含 `src/app/plugin_system` 与 `pyproject.toml` 的 Neo-MoFox 根：

```python
"""Pytest bootstrap for <plugin_name> tests."""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

import pytest


def find_project_root(start: Path) -> Path:
    """Find the Neo-MoFox root from any supported test layout."""
    for candidate in (start, *start.parents):
        if (
            (candidate / "src" / "app" / "plugin_system").is_dir()
            and (candidate / "pyproject.toml").is_file()
        ):
            return candidate
    raise RuntimeError("无法定位 Neo-MoFox 项目根")


ROOT = find_project_root(Path(__file__).resolve().parent)
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


@pytest.fixture(scope="session")
def event_loop_policy() -> asyncio.AbstractEventLoopPolicy:
    """Use selector loops on Windows to avoid socketpair permission failures."""
    if sys.platform == "win32":
        return asyncio.WindowsSelectorEventLoopPolicy()
    return asyncio.get_event_loop_policy()


@pytest.fixture()
def isolated_json_storage(tmp_path, monkeypatch):
    """Route plugin JSON storage to a per-test temporary directory."""
    import src.app.plugin_system.api.storage_api as storage_api
    from src.kernel.storage import JSONStore

    store = JSONStore(str(tmp_path / "json"))
    monkeypatch.setattr(storage_api, "_get_plugin_json_store", lambda _name: store)
    return store
```

测试写法与 fake 对象模式见 `references/test-patterns.md`。

运行（`$TEST_DIR` = 4.1 决定的测试目录；注意 `--no-cov`，否则会跑全量 `src/` 覆盖率）：

```bash
"$PY" -X utf8 -m pytest "$TEST_DIR" -q --no-cov -p no:randomly
```

---

### Phase 5：集成验证（本工作流的核心）

按顺序跑三层，前一层不过不进下一层。

#### 5.1 静态检查

```bash
ruff check "$PLUGINS_DIR/<plugin_name>/"
mpdt plugin check "$PLUGINS_DIR/<plugin_name>" --level warning   # mpdt 可用时
```

#### 5.2 框架本体加载/卸载验证

脚本只验证**目录插件的框架本体加载/卸载**，并在一个一次性 worker 中运行。它使用真实的 `PluginManager.load_plugin_from_manifest()` / `unload_plugin()` 路径。worker 会切换到临时 cwd，唯一明确的路径隔离保证是：框架自动生成的**相对路径** Config 位于临时 cwd，不写入项目相对 `config/`。这不是安全沙箱；模块导入、绝对路径、网络、外部数据库、子进程等副作用无法撤销。默认用空钩子抑制自定义 lifecycle；只有在确认真实钩子及其副作用可接受后，才显式传 `--lifecycle`。验证器不会加载外部依赖插件，只核对外部组件依赖声明；合法声明仍会产生 `RUNTIME/WARN`，说明目标插件本体真实 load/unload 已通过，但依赖组件运行可用性未动态验证。

```bash
# SKILL_DIR = 本 SKILL.md 所在目录
"$PY" -X utf8 "$SKILL_DIR/scripts/verify_plugin.py" "$PLUGINS_DIR/<plugin_name>"
```

若无法自动确定 `$SKILL_DIR`，按此顺序找：

```bash
SKILL_DIR=$(ls -d "$HOME/.claude/skills/mofox-plugin-workflow" 2>/dev/null \
  || ls -d ".claude/skills/mofox-plugin-workflow" 2>/dev/null)
```

验证结果按 `FRAMEWORK`（框架契约）、`POLICY`（工作流政策）、`RUNTIME`（真实加载运行）分类。检查数量由实际路径动态决定（例如 lifecycle 开关、前置失败会影响结果数），不要声称固定检查项总数；当前实现也不验证 zip/.mfp archive。

主要检查包括：manifest 与入口、源码政策、Python 依赖、框架版本与依赖声明计划、目标插件本体真实加载、Action/Agent `associated_types`、组件识别与依赖声明、include 元数据、预期与实际 registry 完全相等、EventHandler 绑定、真实卸载清理，以及可选 lifecycle。外部依赖插件不会被导入或进入额外 lifecycle。

常用参数：

```bash
--json            # 结构化输出，便于程序化处理
--lifecycle       # 执行真实钩子；使用前必须确认副作用可接受
--strict          # WARN 也算失败
--timeout SECONDS # worker 超时，默认 30 秒；只终止 worker，不保证回收后代进程
--project-root PATH# 插件不在仓库内时显式指定 Neo-MoFox 根目录
```

退出码：`0` 通过 / `1` 有 FAIL / `2` `--strict` 下有 WARN / `3` 脚本自身错误。

新插件的目标是 **0 FAIL**。只有不存在未动态验证的外部组件依赖，且没有隔离、lifecycle、后代进程等相关未覆盖风险时，发布报告才可声称 **0 WARN / 0 FAIL**；其余 WARN 必须按 `POLICY` / `RUNTIME` 逐条保留和解释。

#### 5.3 单元 + 行为测试

```bash
"$PY" -X utf8 -m pytest "$TEST_DIR" -q --no-cov -p no:randomly
```

#### 5.4 人工一致性检查

自动检查通过后，按 `references/documentation-rules.md` 人工核对：

- `manifest.name`、插件类 `plugin_name`、README 名称一致；所有版本源一致。
- `manifest.include` 与 `configs` + `get_components()` 的实际组件完全对应，依赖签名一致。
- README 的命令语法、权限、事件、配置字段与默认值、组件签名、兼容性和限制与实现一致。
- CHANGELOG、LICENSE、API 文档仅在适用时存在；没有空文档、重复文档、过期示例或开发过程记录。

人工检查发现差异时，修正文档、manifest 或插件实现后，从受影响的验证层重新运行。

#### 修复循环

任何一层失败 → 读脚本给出的 `hint` → 定位到具体文件行 → 修复 → 重跑该层。不要跳过失败继续往下。

---

### Phase 6：上线报告

```markdown
## 插件开发完成：<plugin_name> v<version>

### 交付内容
| 文件 | 说明 |

### 组件清单
| 签名 | 类型 | 作用 |

### 验证结果
| 检查 | 命令 | 结果 |
|---|---|---|
| Lint | `ruff check plugins/x/` | ✅ |
| 加载验证 | `verify_plugin.py "$PLUGIN_DIR" --timeout 30` | `<实际 WARN / FAIL；仅无未验证外部依赖和相关风险时可写 0 WARN / 0 FAIL>` |
| 单元测试 | `pytest test/plugins/x/ --no-cov` | ✅ N passed |

### 已覆盖场景
- ...

### 未覆盖 / 已知限制
- ...

### 用户需手工做的事
1. 编辑 `config/plugins/<plugin_name>/config.toml` 填入 <具体字段>
2. 重启 Bot 或执行 `/reload <plugin_name>`

### 文档与版本一致性
- 文档交付：<实际创建/更新的文档；未适用项不列空文件>
- manifest/组件/README 人工核对：<结果>
- 当前版本源：<manifest、plugin.py 等实际值>

### 建议版本与提交（仅起草，不自动执行）
- SemVer 建议：`<不递增 | patch | minor | major>`，理由：...
- 仓库归属：`<独立插件仓库 | Neo-MoFox 主仓 | 跨仓分别处理>`
- 建议 commit：`type(scope): subject`
- 按用户偏好不自动添加 `Co-Authored-By`

### 下一步（每项需单独确认后才执行）
- [ ] 版本递增并同步全部版本源
- [ ] git commit
- [ ] 构建/打包
- [ ] git push
- [ ] mpdt market package-update
- [ ] mpdt market publish
```

---

## 排障速查

| 症状 | 检查项 | 根因 |
|---|---|---|
| `插件类未注册` | D2/D3 | 漏 `@register_plugin`，或 `plugin_name != manifest.name` |
| `_load_from_folder 返回 None` | D1 | 相对导入写错 / 缺 `__init__.py` / 模块级异常 / 缺 python 依赖 |
| 组件没生效 | D9/D9b | 名称属性为空，或没继承正确基类 |
| 配置文件没生成 | D6 | `configs` 没声明配置类，或 `name`（`ClassVar`） 为空 |
| 命令不响应 | — | `BaseCommand.execute` 收到的是**剥掉前缀和组件 `name` 后**的子路由文本 |
| reminder 没进 prompt | — | 目标调用链没传 `with_reminder="actor"` |
| 事件没拦截住 | — | 靠抛异常拦截无效，必须 `return EventDecision.STOP, params` |
| `UnicodeEncodeError` | — | 命令漏了 `-X utf8` |
| pytest 跑出一堆 src 覆盖率 | — | 漏了 `--no-cov` |

---

## 参考文件

| 文件 | 内容 |
|---|---|
| `references/component-rules.md` | 11 类组件的精确写法约束 + 常用 API 索引 |
| `references/documentation-rules.md` | 文档条件创建、README 内容和 manifest/实现一致性规则 |
| `references/commit-rules.md` | commit 格式、仓库归属、原子提交、SemVer 与发布确认边界 |
| `references/plugin-template.md` | 可直接改写的最小完整插件骨架（manifest + README + config + 各组件） |
| `references/test-patterns.md` | 测试与 fake 对象模式、模拟消息链路的写法 |
| `scripts/verify_plugin.py` | 框架本体加载/卸载验证脚本 |
