# mpdt config

配置管理命令组，用于管理 MPDT 的全局配置。

## 命令列表

| 命令 | 功能说明 |
|------|----------|
| [init](./init) | 交互式初始化配置 |
| [show](./show) | 显示当前配置 |
| [open](./open) | 在编辑器中打开配置文件 |
| [edit](./edit) | 编辑指定配置项 |

## 基本工作流

配置管理的典型操作：

```bash
# 1. 首次使用，初始化配置
mpdt config init

# 2. 查看当前配置
mpdt config show

# 3. 编辑特定配置项
mpdt config edit github.token ghp_xxxxxxxxxxxxx
mpdt config edit mofox.path /path/to/Neo-MoFox

# 4. 打开配置文件直接编辑
mpdt config open
```

## 快速参考

### 初始化配置
```bash
mpdt config init
```

### 查看配置
```bash
mpdt config show
```

### 编辑配置
```bash
mpdt config edit <key> <value>
```

### 删除配置项
```bash
mpdt config edit <key> --unset
```

## 配置项说明

### Neo-MoFox 路径
```bash
mpdt config edit mofox.path /path/to/Neo-MoFox
```
开发模式和依赖管理需要此配置。

### GitHub Token
```bash
mpdt config edit github.token ghp_xxxxxxxxxxxxx
```
发布插件到市场需要此配置。Token 需要以下权限：
- `repo`（仓库访问）
- `write:packages`（创建 Release）

### 编辑器配置
```bash
mpdt config edit editor.type vscode
mpdt config edit editor.command "code"
```

## 配置文件位置

配置文件存储在：
- **Linux/macOS**: `~/.config/mpdt/config.toml`
- **Windows**: `%APPDATA%\mpdt\config.toml`

## 相关文档

- [安装指南](../../installation)
- [开发模式](../plugin/dev)
- [发布插件](../market/publish)
