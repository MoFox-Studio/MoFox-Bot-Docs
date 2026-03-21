# `mpdt check`

`check` 命令是你的随身代码质检员。它会对你的插件项目进行一次全方位的“体检”，从头到脚，从里到外，确保它符合 Neo-MoFox 的最佳实践。

## 命令用途

在提交代码或发布插件之前，运行 `mpdt check` 是一个好习惯。它能帮你发现那些肉眼难以察觉的问题：
- 检查项目结构是否标准。
- 验证 `manifest.json` 是否合法。
- 扫描代码中的类型错误和风格问题。
- 发现未使用的导入和潜在的 bug。
- 最重要的是，它支持**自动修复**！

## 语法格式

```bash
mpdt check [OPTIONS] [PATH]
```
- `PATH`: 要检查的插件项目路径。如果省略，默认为当前目录。

## 选项详解

| 选项 | 缩写 | 描述 | 默认值 |
|---|---|---|---|
| `--fix` | | 尝试自动修复所有可修复的问题。 | `False` |
| `--level` | `-l` | 设置报告级别，只显示指定级别及以上的问题。 | `info` |
| `--report` | | 指定报告输出格式。 | `console` |
| `--output` | `-o` | 将报告输出到指定文件。 | (无) |
| `--no-structure` | | 跳过结构检查。 | `False` |
| `--no-metadata` | | 跳过元数据检查。 | `False` |
| `--no-component` | | 跳过组件检查。 | `False` |
| `--no-type` | | 跳过类型检查 (mypy)。 | `False` |
| `--no-style` | | 跳过代码风格检查 (ruff)。 | `False` |

### 报告级别 (`--level`)
| `--no-type` | | 跳过类型检查 (mypy)。 | `False` |
| `--no-style` | | 跳过代码风格检查 (ruff)。 | `False` |

### 报告级别 (`--level`)
- `info`: 显示所有信息，包括建议。
- `warning`: 显示警告和错误。
- `error`: 只显示错误。

### 报告格式 (`--report`)
- `console`: 在控制台彩色输出（默认）。
- `markdown`: 生成 Markdown 格式的报告。
- `json`: 生成 JSON 格式的报告，便于 CI/CD 集成。

## 8 层验证系统

`mpdt check` 的强大之处在于其分层的验证设计：

1.  **StructureValidator**: 检查目录结构、必需文件 (`plugin.py`, `manifest.json`)。
2.  **MetadataValidator**: 检查 `manifest.json` 的字段、版本号格式。
3.  **ComponentValidator**: 检查组件的注册、命名规范。
4.  **ConfigValidator**: 检查配置文件的语法。
5.  **TypeValidator**: 使用 `mypy` 进行严格的静态类型检查。
6.  **StyleValidator**: 使用 `ruff` 进行代码风格和质量检查。
7.  **ImportValidator**: 检查导入顺序和未使用的导入。
8.  **AutoFixValidator**: 智能分析并应用自动修复。

## 使用示例

### 基础用法

对当前目录的插件进行一次全面检查：

```bash
mpdt check
```

### 自动修复

检查并让 `mpdt` 帮你“一键美颜”：

```bash
mpdt check --fix
```
这条命令会修复诸如导入顺序、代码格式等问题。对于不能自动修复的问题，它会给出明确的提示。

### 生成报告

在 CI/CD 流程中，你可能需要生成一份检查报告：

```bash
mpdt check --report markdown -o check_report.md
```
这会生成一个名为 `check_report.md` 的文件，其中包含了所有检查结果。

## 常见场景

### 场景一：提交代码前的例行检查

在 `git commit` 之前，确保代码质量达标。

```bash
mpdt check --fix --level warning
```
自动修复能解决的问题，并只关注警告和错误，忽略建议性信息。

### 场景二：性能优化

如果你的项目很大，类型检查可能很慢。在开发阶段，你可以暂时跳过它来加快检查速度。

```bash
mpdt check --fix --no-type
```
这在只关心代码格式和结构时非常有用。

---

`mpdt check` 是保证插件质量的最后一道防线。养成频繁使用它的习惯，能有效减少 bug，并让你的代码看起来更专业。
