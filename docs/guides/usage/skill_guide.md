# Skill 使用教程

Skill 是 Neo-MoFox 的扩展能力模块，通过 `SKILL.md` 文件声明工具的使用方法，LLM 可据此调用外部程序完成任务。

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

## 管理

- Skill 由 `skill_manager` 插件自动发现和加载
- 添加新 Skill：在 `skill/` 下创建子目录和 `SKILL.md`，重启生效
- 删除 Skill：移除对应目录，重启生效
