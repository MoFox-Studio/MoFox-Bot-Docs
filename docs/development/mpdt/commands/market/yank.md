# mpdt market yank

废弃指定版本的插件，标记为不推荐使用。

## 用法

```bash
mpdt market yank <plugin_id> <version> [options]
```

## 参数

### plugin_id

插件 ID（必需）。

### version

要废弃的版本号（必需）。

```bash
mpdt market yank my-plugin 1.0.0
```

## 选项

### --reason, -r

废弃原因（推荐提供）。

```bash
mpdt market yank my-plugin 1.0.0 --reason "存在安全漏洞"
```

## 废弃效果

废弃后：
- ✓ 版本仍然存在，已安装的用户不受影响
- ✓ 市场会显示废弃警告
- ✗ 新用户无法安装此版本
- ✗ 依赖解析会跳过此版本

## 示例

### 废弃有 bug 的版本

```bash
mpdt market yank my-plugin 1.0.0 --reason "严重 bug，请升级到 1.0.1"
```

### 废弃有安全问题的版本

```bash
mpdt market yank my-plugin 2.1.0 --reason "安全漏洞 CVE-2024-XXXX"
```

## 何时使用

### 应该使用 yank
- 发现严重 bug
- 存在安全漏洞
- 数据损坏风险
- 依赖错误

### 不应该使用 yank
- 正常的版本迭代（发布新版本即可）
- 小的文档错误
- 性能优化


## 最佳实践

1. **提供详细原因**
   ```bash
   mpdt market yank plugin 1.0.0 --reason "数据库迁移脚本有误，会导致数据丢失"
   ```

2. **同时发布修复版本**
   ```bash
   # 废弃旧版本
   mpdt market yank plugin 1.0.0 --reason "bug"
   
   # 发布修复版本
   mpdt plugin bump --type patch
   mpdt market publish --release-notes "修复 1.0.0 中的 bug"
   ```

3. **通知用户**
   在 GitHub、文档或社区中通知用户升级。

## 市场显示

废弃的版本在市场中显示：

```
my-plugin
  2.0.0 (最新)
  1.1.0
  1.0.1
  1.0.0 (已废弃: 存在安全漏洞)
```

## 相关命令

- [mpdt plugin bump](../plugin/bump) - 升级版本号
- [mpdt market publish](./publish) - 发布新版本
- [mpdt market delete](./delete) - 删除插件
