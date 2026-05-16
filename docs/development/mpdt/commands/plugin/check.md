# mpdt plugin check

对插件进行全面的静态检查，包括结构、元数据、组件、类型和代码风格等 8 层检查。

## 用法

```bash
mpdt plugin check [path] [options]
```

## 参数

### path

插件根目录路径（可选）。默认为当前目录（`.`）。

```bash
mpdt plugin check /path/to/plugin
```

## 选项

### --level, -l

显示的最低问题级别。

**可选值**：
- `error` - 仅显示错误
- `warning` - 显示错误和警告 *默认*
- `info` - 显示所有问题（包括信息级别）

```bash
mpdt plugin check --level error
```

### --fix

自动修复可修复的问题。

```bash
mpdt plugin check --fix
```

支持自动修复的问题：
- 缺失的必需属性（如 `plugin_name`、`description`）
- 缺失的装饰器（如 `@action`、`@tool`）
- 代码风格问题（缩进、空行等）
- Manifest 格式问题

### --report

输出报告的格式。

**可选值**：
- `console` - 控制台输出 *默认*
- `markdown` - Markdown 格式
- `json` - JSON 格式

```bash
mpdt plugin check --report markdown
```

### --output, -o

报告输出路径。需要配合 `--report` 使用。

```bash
mpdt plugin check --report markdown --output report.md
```

### --no-structure

跳过结构检查。

```bash
mpdt plugin check --no-structure
```

### --no-metadata

跳过元数据检查（manifest.json）。

```bash
mpdt plugin check --no-metadata
```

### --no-config
跳过配置检查。

```bash
mpdt plugin check --no-config
```

### --no-import
跳过导入检查。

```bash
mpdt plugin check --no-import
```

### --no-component

跳过组件检查。

```bash
mpdt plugin check --no-component
```

### --no-type

跳过类型检查。

```bash
mpdt plugin check --no-type
```

### --no-style

跳过代码风格检查。

```bash
mpdt plugin check --no-style
```

## 检查层级

### 1. 结构检查（Structure Validator）

检查插件目录结构是否符合规范：

- ✓ `manifest.json` 存在
- ✓ `plugin.py` 存在
- ✓ `components/` 目录存在
- ✓ `__init__.py` 文件存在

### 2. 元数据检查（Metadata Validator）

检查 `manifest.json` 格式和必需字段：

- ✓ JSON 格式正确
- ✓ 必需字段存在（id、name、version 等）
- ✓ 版本号格式正确（遵循语义化版本）
- ✓ 分类和标签有效

### 3. 组件检查（Component Validator）

检查组件代码规范：

- ✓ 组件类继承正确的基类
- ✓ 必需属性存在（如 `action_name`、`tool_name`）
- ✓ 必需方法实现（如 `execute()`、`call()`）
- ✓ 装饰器使用正确

### 4. 类型检查（Type Validator）

检查类型注解：

- ✓ 关键方法有类型注解
- ✓ 类型注解正确

### 5. 风格检查（Style Validator）

检查代码风格：

- ✓ 缩进一致（4 空格）
- ✓ 空行规范
- ✓ 行长度合理
- ✓ 命名规范

## 示例

### 基本检查

```bash
mpdt plugin check
```

输出示例：
```
🔍 检查插件: my_plugin

✓ 结构检查
  ✓ 目录结构正常
  ✓ 必需文件存在

✗ 元数据检查
  ✗ manifest.json: 缺少必需字段 'author'
  ⚠ manifest.json: 建议添加 'homepage' 字段

✓ 组件检查
  ✓ 所有组件结构正常

══════════════════════════════════════
检查结果汇总
──────────────────────────────────────
验证器            错误  警告  信息  状态
结构检查            0     0     0   ✓
元数据检查          1     1     0   ✗
组件检查            0     0     0   ✓
类型检查            0     0     2   ✓
风格检查            0     3     0   ✓
──────────────────────────────────────
总计：1 个错误，4 个警告
```

### 自动修复

```bash
mpdt plugin check --fix
```

输出示例：
```
🔍 检查插件: my_plugin

正在运行检查...
✓ 结构检查
✗ 元数据检查（1 个错误，1 个警告）
✓ 组件检查

正在自动修复...
✓ 修复了 1 个问题
  ✓ 添加了缺失的 'author' 字段

══════════════════════════════════════
自动修复摘要
──────────────────────────────────────
已修复：1
无需修复：0
无法修复：1
──────────────────────────────────────

最终结果：0 个错误，1 个警告
```

### 仅检查错误

```bash
mpdt plugin check --level error
```

### 生成 Markdown 报告

```bash
mpdt plugin check --report markdown --output check-report.md
```

生成的报告示例：
```markdown
# 插件检查报告

## 摘要

- 错误: 1
- 警告: 4
- 信息: 2

## 结构检查

✓ 通过

## 元数据检查

✗ 失败

### 错误

- manifest.json: 缺少必需字段 'author'

### 警告

- manifest.json: 建议添加 'homepage' 字段

## 总结

发现 1 个错误，建议修复后再发布。
```

### 生成 JSON 报告

```bash
mpdt plugin check --report json --output check-report.json
```

### 跳过特定检查

```bash
# 跳过风格检查
mpdt plugin check --no-style

# 跳过多个检查
mpdt plugin check --no-type --no-style
```

## 最佳实践

1. **开发过程中定期检查**
```bash
   mpdt plugin check
```

2. **发布前完整检查并修复**
 ```bash
   mpdt plugin check --fix --level info
 ```

3. **CI/CD 集成**
 ```yaml
   # .github/workflows/check.yml
   - name: Check plugin
     run: mpdt plugin check --level error
 ```

4. **生成报告存档**
 ```bash
   mpdt plugin check --report markdown --output docs/check-report.md
 ```

## 相关命令

- [mpdt plugin build](./build) - 构建插件（构建前建议先检查）
- [mpdt plugin dev](./dev) - 开发模式
- [mpdt market publish](../market/publish) - 发布插件（发布前必须检查通过）

## 相关文档

- [插件结构与最佳实践](/docs/development/plugin_develop/structure)
- [manifest.json 格式说明](/docs/development/plugin_develop/manifest)
