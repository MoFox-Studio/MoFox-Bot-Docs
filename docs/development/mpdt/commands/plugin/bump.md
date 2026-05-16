# mpdt plugin bump

升级插件版本号，遵循语义化版本（Semantic Versioning）规范。

## 用法

```bash
mpdt plugin bump [path] [options]
```

## 参数

### path

插件根目录路径（可选）。默认为当前目录（`.`）。

```bash
mpdt plugin bump /path/to/plugin
```

## 选项

### --type, -t

版本升级类型。

**可选值**：
- `patch` - 修订号 (1.0.0 → 1.0.1) *默认*
- `minor` - 次版本号 (1.0.0 → 1.1.0)
- `major` - 主版本号 (1.0.0 → 2.0.0)

```bash
mpdt plugin bump --type major
```

## 语义化版本规范

版本号格式：`major.minor.patch`

### Patch（修订号）

修复 bug，向后兼容。

```bash
mpdt plugin bump --type patch
# 1.0.0 → 1.0.1
```

**何时使用**：
- 修复 bug
- 性能优化
- 文档更新
- 内部重构（无 API 变化）

### Minor（次版本号）

添加新功能，向后兼容。

```bash
mpdt plugin bump --type minor
# 1.0.0 → 1.1.0
```

**何时使用**：
- 添加新功能
- 添加新组件
- 标记某些功能为废弃（但仍保留）

### Major（主版本号）

重大变更，可能不向后兼容。

```bash
mpdt plugin bump --type major
# 1.0.0 → 2.0.0
```

**何时使用**：
- 删除功能或组件
- 修改公共 API
- 重大架构调整
- 不兼容的变更

## 示例

### 升级修订号

```bash
mpdt plugin bump
# 或
mpdt plugin bump --type patch
```

输出：
```
📌 版本升级: my_plugin
✓ 当前版本: 1.0.0
✓ 新版本: 1.0.1
✓ 版本升级完成

插件名称    my_plugin
升级类型    patch
旧版本      1.0.0
新版本      1.0.1

✓ 版本已升级: 1.0.0 -> 1.0.1
```

### 升级次版本号

```bash
mpdt plugin bump --type minor
```

```
1.2.3 → 1.3.0
```

### 升级主版本号

```bash
mpdt plugin bump --type major
```

```
1.2.3 → 2.0.0
```

### 指定插件路径

```bash
mpdt plugin bump /path/to/plugin --type minor
```

## 版本升级规则

### Patch 升级
- 主版本号：不变
- 次版本号：不变
- 修订号：+1

```
1.2.3 → 1.2.4
2.0.0 → 2.0.1
```

### Minor 升级
- 主版本号：不变
- 次版本号：+1
- 修订号：重置为 0

```
1.2.3 → 1.3.0
2.5.9 → 2.6.0
```

### Major 升级
- 主版本号：+1
- 次版本号：重置为 0
- 修订号：重置为 0

```
1.2.3 → 2.0.0
0.9.5 → 1.0.0
```

## 预发布版本

版本号支持预发布标识符（如 `1.0.0-alpha.1`、`1.0.0-beta.2`）。

升级时会保留后缀：

```
1.0.0-beta → 1.0.1-beta (patch)
1.0.0-beta → 1.1.0-beta (minor)
1.0.0-beta → 2.0.0-beta (major)
```

## 工作流集成

### 配合构建命令

```bash
# 1. 升级版本
mpdt plugin bump --type minor

# 2. 构建插件
mpdt plugin build
```

### 配合发布命令

```bash
# 1. 升级版本
mpdt plugin bump --type patch

# 2. 检查插件
mpdt plugin check --fix

# 3. 构建并发布
mpdt plugin build
mpdt market publish
```

### 自动化脚本

```bash
#!/bin/bash
# release.sh

# 询问版本类型
echo "选择版本升级类型："
echo "1) patch (bug 修复)"
echo "2) minor (新功能)"
echo "3) major (重大更新)"
read -p "输入 1-3: " choice

case $choice in
  1) type="patch" ;;
  2) type="minor" ;;
  3) type="major" ;;
  *) echo "无效选择"; exit 1 ;;
esac

# 升级版本
mpdt plugin bump --type $type

# 检查插件
mpdt plugin check --fix

# 构建插件
mpdt plugin build

# 发布插件
mpdt market publish
```

## 版本号存储

版本号存储在 `manifest.json` 的 `version` 字段：

```json
{
  "id": "my_plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  ...
}
```

`mpdt plugin bump` 会自动更新此字段。

## 最佳实践

### 1. 版本号从 0.1.0 开始

```json
{
  "version": "0.1.0"
}
```

表示项目处于初期开发阶段。

### 2. 首个稳定版本为 1.0.0

当插件功能稳定、API 确定后：

```bash
mpdt plugin bump --type major  # 0.9.0 → 1.0.0
```

### 3. 定期升级修订号

每次 bug 修复或小改进：

```bash
mpdt plugin bump  # 默认 patch
```

### 4. 新功能升级次版本号

添加新组件或功能：

```bash
mpdt plugin bump --type minor
```

### 5. 重大变更升级主版本号

API 变更或删除功能：

```bash
mpdt plugin bump --type major
```

### 6. 配合 Git 标签

```bash
# 升级版本
mpdt plugin bump --type minor

# 创建 Git 标签
git add manifest.json
git commit -m "Bump version to $(jq -r .version manifest.json)"
git tag "v$(jq -r .version manifest.json)"
git push --tags
```

## 相关命令

- [mpdt plugin build](./build) - 构建插件（构建前通常先升级版本）
- [mpdt market publish](../market/publish) - 发布插件（发布时会自动打标签）
- [mpdt plugin check](./check) - 检查插件

## 相关文档

- [manifest.json 格式说明](/docs/development/plugin_develop/manifest)
- [语义化版本规范](https://semver.org/lang/zh-CN/)
