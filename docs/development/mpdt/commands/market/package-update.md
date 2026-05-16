# mpdt market package-update

更新已发布的插件包，创建新版本的 Release。

## 用法

```bash
mpdt market package-update [plugin_path] [options]
```

## 参数

### plugin_path

插件根目录路径（可选）。默认为当前目录（`.`）。

## 选项

### --owner

GitHub 用户或组织名。

```bash
mpdt market package-update --owner your-username
```

### --repo

GitHub 仓库名。默认使用插件 ID。

```bash
mpdt market package-update --repo my-plugin
```

### --with-docs

包含文档文件。

```bash
mpdt market package-update --with-docs
```

### --release-notes

Release 说明。

```bash
mpdt market package-update --release-notes "修复 bug"
```

### --skip-push

跳过 Git 推送。

```bash
mpdt market package-update --skip-push
```

## 典型流程

```bash
# 1. 修改代码
vim plugin.py

# 2. 升级版本
mpdt plugin bump --type patch

# 3. 检查
mpdt plugin check --fix

# 4. 更新发布
mpdt market package-update --release-notes "Bug 修复"
```

## 示例

### 快速更新

```bash
mpdt market package-update
```

### 带说明更新

```bash
mpdt market package-update --release-notes "
## 新功能
- 添加 XXX 功能

## Bug 修复
- 修复 YYY 问题
"
```

## 相关命令

- [mpdt plugin bump](../plugin/bump) - 升级版本号
- [mpdt market publish](./publish) - 首次发布
