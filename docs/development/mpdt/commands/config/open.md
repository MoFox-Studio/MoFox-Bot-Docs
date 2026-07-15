# mpdt config open

在编辑器中打开 MPDT 配置文件。

## 用法

```bash
mpdt config open
```

## 功能

使用配置的编辑器打开 `config.toml` 文件，方便直接编辑。

## 示例

```bash
mpdt config open
```

会在配置的编辑器（如 VS Code）中打开：
```
~/.mpdt/config.toml
```

## 编辑器优先级

1. 配置文件中的 `editor.command`
2. 环境变量 `EDITOR`
3. 系统默认编辑器

## 配置文件格式

```toml
# Neo-MoFox 配置
[mofox]
path = "/path/to/Neo-MoFox"

# GitHub 配置
[github]
token = "ghp_xxxxxxxxxxxxx"

# 编辑器配置
[editor]
command = "code"
```

## 相关命令

- [mpdt config show](./show) - 查看配置
- [mpdt config edit](./edit) - 编辑指定配置项
- [mpdt config init](./init) - 初始化配置
