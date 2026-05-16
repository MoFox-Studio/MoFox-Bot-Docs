# mpdt config edit

编辑指定的配置项。

## 用法

```bash
mpdt config edit [key] [value] [options]
```

## 参数

### key

配置键

:::tip
支持的配置键：
  - mofox.path: Neo-MoFox 主程序路径
  - github.token: GitHub Personal Access Token
  - market.url: 插件市场地址
  - pypi.index_url: PyPI 镜像源地址
  - editor.command: 编辑器命令（code/pycharm/subl/vim 等）
  - dev.auto_reload: 自动重载（true/false）
  - dev.reload_delay: 重载延迟（秒）
:::

### value

配置值

## 选项

### --unset

删除配置项。

```bash
mpdt config edit github.token --unset
```

## 配置键

### Neo-MoFox 相关

**mofox.path** - Neo-MoFox 主程序路径

```bash
mpdt config edit mofox.path /path/to/Neo-MoFox
```

### GitHub 相关

**github.token** - GitHub Personal Access Token

```bash
mpdt config edit github.token ghp_xxxxxxxxxxxxx
```

### 编辑器相关

**editor.command** - 编辑器命令

```bash
mpdt config edit editor.command code
```

## 示例

### 设置 Neo-MoFox 路径

```bash
mpdt config edit mofox.path /home/user/Neo-MoFox
```

输出：
```
✓ 配置已更新: mofox.path = /home/user/Neo-MoFox
```

### 设置 GitHub Token

```bash
mpdt config edit github.token ghp_xxxxxxxxxxxxx
```

输出：
```
✓ 配置已更新: github.token = ghp_***************xxx
```

### 删除配置项

```bash
mpdt config edit github.token --unset
```

输出：
```
✓ 配置项已删除: github.token
```

## 验证

某些配置项会自动验证：

### Neo-MoFox 路径

```bash
mpdt config edit mofox.path /invalid/path
```

输出：
```
✗ 验证失败: 路径不存在或不是有效的 Neo-MoFox 目录
  请确保路径包含 main.py 文件
```

### GitHub Token

```bash
mpdt config edit github.token invalid_token
```

输出：
```
⚠ 警告: Token 格式可能不正确
  GitHub Token 通常以 ghp_ 开头
```

## 配置文件位置

- **Linux/macOS**: `~/.config/mpdt/config.toml`
- **Windows**: `%APPDATA%\mpdt\config.toml`

## 最佳实践

### 1. 首次使用先初始化

```bash
mpdt config init
```

### 2. 修改配置用 edit

```bash
mpdt config edit mofox.path /new/path
```

### 3. 复杂配置用 open

```bash
mpdt config open
```

直接编辑配置文件。

### 4. 验证配置

```bash
mpdt config show
```

## 相关命令

- [mpdt config init](./init) - 初始化配置
- [mpdt config show](./show) - 查看配置
- [mpdt config open](./open) - 打开配置文件

## 相关文档

- [开发模式](../plugin/dev) - 需要配置 mofox.path
- [发布插件](../market/publish) - 需要配置 github.token
