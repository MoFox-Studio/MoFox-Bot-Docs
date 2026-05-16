# mpdt market publish

一键发布插件到 Neo-MoFox 插件市场，自动处理构建、Git 提交、GitHub Release 创建等全流程。

## 用法

```bash
mpdt market publish [plugin_path] [options]
```

## 参数

### plugin_path

插件根目录路径（可选）。默认为当前目录（`.`）。

```bash
mpdt market publish /path/to/plugin
```

## 选项

### --owner

GitHub 用户或组织名。默认从 manifest.json 或当前 GitHub 用户读取。

```bash
mpdt market publish --owner your-username
```

### --repo

GitHub 仓库名。默认使用插件 ID。

```bash
mpdt market publish --repo my-plugin-repo
```

### --private

创建私有仓库。默认为公开仓库。

```bash
mpdt market publish --private
```

### --output

构建输出目录。默认为 `dist/`。

```bash
mpdt market publish --output release
```

### --with-docs

将文档文件包含在插件包中。

```bash
mpdt market publish --with-docs
```

### --release-notes

Release 说明。可以是文本或 Markdown。

```bash
mpdt market publish --release-notes "修复了若干 bug"
```

### --skip-push

跳过 Git 推送，仅本地操作。

```bash
mpdt market publish --skip-push
```

## 完整流程

`mpdt market publish` 会自动执行以下步骤：

### 1. 加载插件信息
读取 `manifest.json`，验证分类和标签。

### 2. 构建插件包
调用 `mpdt plugin build` 构建 `.mfp` 文件。

### 3. 权限检查
- 检查 GitHub Token 是否有效
- 检查仓库权限（push、release）

### 4. 创建/确认 GitHub 仓库
- 如果仓库不存在，自动创建
- 如果仓库已存在，验证权限

### 5. Git 操作
- 初始化 Git 仓库（如果未初始化）
- 提交代码
- 创建版本标签（如 `v1.0.0`）
- 推送到 GitHub

### 6. 创建 GitHub Release
- 创建 Release
- 上传 `.mfp` 文件作为资产

### 7. 注册到市场
- 注册插件信息到插件市场
- 提交版本信息

## 前置要求

### 1. 配置 GitHub Token

发布插件需要 GitHub Personal Access Token。

**创建 Token**：
1. 访问 [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. 点击 "Generate new token (classic)"
3. 选择权限：
   - `repo`（完整的仓库访问权限）
   - `write:packages`（发布 Release）
4. 生成并复制 Token

**配置 Token**：
```bash
mpdt config edit github.token ghp_xxxxxxxxxxxxx
```

### 2. 插件通过检查

```bash
mpdt plugin check --level error
```

确保没有错误级别的问题。

### 3. manifest.json 完整

必需字段：
- `id` - 插件 ID
- `name` - 插件名称
- `version` - 版本号
- `author` - 作者
- `categories` - 分类（必须是有效值）
- `tags` - 标签

## 示例

### 首次发布

```bash
# 1. 配置 GitHub Token
mpdt config edit github.token ghp_xxxxxxxxxxxxx

# 2. 检查插件
mpdt plugin check --fix

# 3. 发布
mpdt market publish --owner your-username
```

### 更新已发布的插件

先升级版本号，再发布：

```bash
# 1. 升级版本
mpdt plugin bump --type minor

# 2. 发布
mpdt market publish --release-notes "添加了新功能"
```

### 发布到组织

```bash
mpdt market publish --owner your-org --repo plugin-name
```

### 包含文档

```bash
mpdt market publish --with-docs
```

### 测试发布（不推送）

```bash
mpdt market publish --skip-push
```

## 版本标签规则

版本标签格式：`v<version>`

| manifest.json 中的 version | Git 标签 |
|---------------------------|----------|
| `1.0.0` | `v1.0.0` |
| `1.0.0-beta` | `v1.0.0-beta` |
| `2.1.3` | `v2.1.3` |

## GitHub 仓库结构

发布后的 GitHub 仓库：

```
your-username/my_plugin
├── .git/
├── plugin.py
├── manifest.json
├── LICENSE
├── README.md
├── components/
└── ...

Releases:
  v1.0.0
    ├── my_plugin-1.0.0.mfp  (资产)
    └── Source code (自动生成)
```

## 常见问题

### GitHub Token 权限不足

**问题**：
```
✗ 没有仓库创建权限
```

**解决方案**：
重新生成 Token，确保选择了 `repo` 权限。

### 仓库已存在但无权限

**问题**：
```
✗ 仓库已存在但当前用户没有写入权限
```

**解决方案**：
- 使用 `--repo` 指定不同的仓库名
- 或获取现有仓库的访问权限

### manifest.json 验证失败

**问题**：
```
✗ Manifest 验证失败:
  - 分类 'invalid_category' 不在允许的列表中
```
手动编辑 manifest.json，使用有效的分类。

## 发布检查清单

发布前确认：

- [ ] 插件通过 `mpdt plugin check`
- [ ] manifest.json 字段完整
- [ ] 配置了 GitHub Token
- [ ] 版本号已更新
- [ ] README.md 内容完善
- [ ] LICENSE 文件存在
- [ ] 测试插件功能正常

## 发布后操作

### 1. 验证发布

访问 GitHub Release 页面，确认：
- Release 已创建
- `.mfp` 文件已上传
- Release notes 显示正确

### 2. 通知用户

在社区或文档中通知新版本发布。

### 3. 监控反馈

关注 GitHub Issues 和用户反馈。

## 最佳实践

### 1. 使用语义化版本

```bash
# Bug 修复
mpdt plugin bump --type patch
mpdt market publish --release-notes "修复 bug"

# 新功能
mpdt plugin bump --type minor
mpdt market publish --release-notes "添加新功能"

# 重大更新
mpdt plugin bump --type major
mpdt market publish --release-notes "v2.0 重大更新"
```

### 2. 编写详细的 Release Notes

```bash
mpdt market publish --release-notes "
## 新功能
- 添加天气查询功能
- 支持自定义城市

## Bug 修复
- 修复配置读取错误
- 修复内存泄漏

## 改进
- 优化性能
- 更新文档
"
```

### 3. 保持 README 更新

发布前更新 README.md：
- 功能说明
- 安装方法
- 使用示例
- 配置说明

## 相关命令

- [mpdt plugin build](../plugin/build) - 构建插件包
- [mpdt plugin check](../plugin/check) - 检查插件
- [mpdt plugin bump](../plugin/bump) - 升级版本号
- [mpdt market package-update](./package-update) - 更新已发布的插件
- [mpdt config edit](../config/edit) - 配置 GitHub Token

## 相关文档

- [配置 GitHub Token](../config/edit)
- [manifest.json 格式说明](/docs/development/plugin_develop/manifest)
