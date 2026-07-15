# Skill 管理器（skill_manager）

SkillManager 是 Neo-MoFox 的技能索引与按需加载插件。它会在插件加载完成后扫描本地 skill 目录，建立技能清单，并提供 3 个工具给 LLM 按需调用。

## 概述

Skill 是 Neo-MoFox 的扩展能力模块，通过 `SKILL.md` 文件声明工具的使用方法，LLM 可据此调用外部程序完成任务。

### 核心工具

- **get_skill**：读取并注入 `SKILL.md`
- **get_reference**：读取 skill 内 markdown 引用文件
- **get_script**：执行 skill 内脚本（支持 `.py`/`.ps1`/`.bat`/`.cmd`/`.sh`，支持参数，返回脚本输出）

## 工作流程

1. 启动时触发 `SkillManagerLoadHandler`
2. `SkillManagerPlugin.refresh_skill_catalog()` 扫描配置路径，发现所有包含 `SKILL.md` 的 skill
3. 刷新 `skills` 索引并同步 system reminder（actor/sub_actor）
4. LLM 在需要时按顺序调用工具：
   - 先 `get_skill(name)`
   - 再按需 `get_reference(name, location)` 或 `get_script(name, location, script_args)`

## Skill 目录结构

```
skill/
├── weather/
│   └── SKILL.md          # 天气查询
├── bilibili/
│   ├── SKILL.md          # B站操作
│   └── README.md
├── github/
│   └── SKILL.md          # GitHub 操作
└── ...
```

每个 Skill 一个子目录，核心是 `SKILL.md` 文件。

## SKILL.md 格式

```markdown
---
name: skill-name
description: 简要描述
---

# Skill 标题

## 使用说明

具体的命令示例和使用方法...
```

### Front Matter

| 字段 | 说明 |
|------|------|
| `name` | Skill 名称（唯一标识） |
| `description` | 简要描述，LLM 据此判断是否使用 |

### 正文

正文部分是 LLM 的参考文档，应包含：
- 工具的前提条件（安装命令等）
- 具体的命令行使用示例
- 常见使用模式

## Skill 发现规则

- 配置路径来自 `manager.paths`，默认是 `skill`
- 若路径本身包含 `SKILL.md`，它被视为一个 skill 根目录
- 否则会扫描该路径下一层子目录，子目录中存在 `SKILL.md` 的会被识别为 skill
- `SKILL.md` front matter 支持解析：`name`、`description`

## 内置示例

### Weather — 天气查询

```markdown
---
name: weather
description: Get current weather and forecasts (no API key required).
---

# Weather

Quick one-liner:
curl -s "wttr.in/London?format=3"
```

### Bilibili — B站操作

```markdown
---
name: bilibili-cli
description: Browse Bilibili from the terminal — videos, users, search
---

# bilibili-cli Skill

pipx install bilibili-cli

bili video BV1ABcsztEcY
bili search "关键词" --type video
```

## 配置项

配置模型：`SkillManagerConfig`（`plugins/skill_manager/config.py`）

`[manager]`：

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `enabled` | `bool` | `true` | 是否启用插件 |
| `paths` | `list[str]` | `["skill"]` | skill 扫描路径 |
| `inject_actor_reminder` | `bool` | `true` | 是否注入 actor system reminder |
| `inject_sub_actor_reminder` | `bool` | `true` | 是否注入 sub_actor system reminder |

示例：

```toml
[manager]
enabled = true
paths = ["skill"]
inject_actor_reminder = true
inject_sub_actor_reminder = true
```

## 管理

- Skill 由 `skill_manager` 插件自动发现和加载
- 添加新 Skill：在 `skill/` 下创建子目录和 `SKILL.md`，重启生效
- 删除 Skill：移除对应目录，重启生效

## 常见调用建议

- 调用顺序固定为：先 `get_skill`，再 `get_reference` / `get_script`
- `get_script` 优先使用字符串列表参数，避免 shell 分词歧义
- 对 argparse 脚本可直接传 `script_args: "--help"` 获取帮助文本

## 安全与边界

- 所有引用路径都会做目录边界校验，禁止越界访问
- `get_reference` 仅允许 `.md`
- `get_script` 仅允许 `.py`、`.ps1`、`.bat`、`.cmd`、`.sh`
- 本插件不负责脚本沙箱隔离，脚本执行权限等同当前进程

## 版本

- Plugin: `1.0.0`
- Manifest: `plugins/skill_manager/manifest.json`
- min_core_version: `1.0.0`
