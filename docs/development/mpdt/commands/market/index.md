# mpdt market

插件市场命令组，提供插件发布、管理和搜索功能。

## 命令列表

| 命令 | 功能说明 |
|------|----------|
| [publish](./publish) | 一键发布插件到市场 |
| [search](./search) | 搜索市场插件 |
| [info](./info) | 查看插件详细信息 |
| [package-update](./package-update) | 更新已发布的插件 |
| [delete](./delete) | 删除插件 |
| [yank](./yank) | 废弃指定版本 |

## 基本工作流

发布插件到市场的典型流程：

```bash
# 1. 首次发布
mpdt market publish --owner your-github-username

# 2. 搜索市场插件
mpdt market search keyword

# 3. 查看插件详情
mpdt market info plugin-id

# 4. 更新已发布的插件
mpdt market package-update --release-notes "修复 bug"

# 5. 废弃某个版本
mpdt market yank plugin-id 1.0.0 --reason "安全问题"
```

## 快速参考

### 发布插件
```bash
mpdt market publish --owner <github-username>
```

### 搜索插件
```bash
mpdt market search <query> --category <category>
```

### 更新插件
```bash
mpdt market package-update --release-notes "更新说明"
```

## 前置要求

使用 market 命令需要：

1. **配置 GitHub Token**
   ```bash
   mpdt config edit github.token <your_token>
   ```
   Token 需要以下权限：
   - `repo`（仓库访问权限）
   - `write:packages`（发布 Release）

2. **插件已构建**
   ```bash
   mpdt plugin build
   ```

3. **Git 仓库已初始化**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

## 相关文档

- [配置 GitHub Token](../config/edit)
- [构建插件](../plugin/build)
