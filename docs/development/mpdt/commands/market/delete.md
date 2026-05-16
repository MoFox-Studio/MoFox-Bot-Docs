# mpdt market delete

从市场删除插件（慎用）。

## 用法

```bash
mpdt market delete <plugin_id>
```

## 参数

### plugin_id

插件 ID（必需）。

```bash
mpdt market delete my-plugin
```

## 警告

::: danger 不可逆操作
删除插件会：
- 从市场移除插件
- 删除所有版本信息
- 影响依赖此插件的用户

此操作不可逆，请谨慎使用。
:::

## 示例

```bash
mpdt market delete my-plugin
```

系统会要求确认：
```
⚠ 警告：你即将删除插件 'my-plugin'
此操作不可逆，所有版本信息将被删除。

确认删除? [y/N]: 
```

## 替代方案

### 废弃版本

如果只是某个版本有问题，使用 `yank` 命令：

```bash
mpdt market yank my-plugin 1.0.0 --reason "安全问题"
```

## 相关命令

- [mpdt market yank](./yank) - 废弃指定版本
