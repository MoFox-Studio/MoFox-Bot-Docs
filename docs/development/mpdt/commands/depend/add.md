# mpdt depend add

添加依赖到插件，支持 Python 包和插件依赖。

## 用法

```bash
mpdt depend add <dependency> [path] [options]
```

## 参数

### dependency

依赖规范（必需），格式：`name[operator version]`

### path

插件根目录（可选）。默认为当前目录。

```bash
# Python 包
mpdt depend add "requests>=2.28.0"

# 插件
mpdt depend add "other-plugin>=1.0.0"

# 指定插件路径
mpdt depend add requests /path/to/plugin
```

## 选项

### --type

依赖类型。

**可选值**：
- `auto` - 自动判断 *默认*
- `python` - Python 包
- `plugin` - 插件

```bash
mpdt depend add requests . --type python
mpdt depend add other-plugin . --type plugin
```

## 自动类型判断

使用 `--type auto` 时，MPDT 会：

1. 先在插件市场搜索
2. 如果找到，视为插件依赖
3. 如果未找到，视为 Python 包依赖

## 示例

### 添加 Python 包

```bash
mpdt depend add "requests>=2.28.0"
```

输出：
```
正在检查 'requests' 是否为插件...
ℹ 未找到插件 'requests'，视为 Python 包
正在添加 Python 包依赖: requests>=2.28.0
✓ 已添加到 manifest.json
正在下载包到 /path/to/Neo-MoFox...
✓ 安装完成
```

### 添加插件依赖

```bash
mpdt depend add "weather-api>=1.0.0"
```

输出：
```
正在检查 'weather-api' 是否为插件...
✓ 找到插件 'weather-api'
正在添加插件依赖: weather-api>=1.0.0
✓ 已添加到 manifest.json
正在下载插件到 /path/to/Neo-MoFox/plugins...
✓ 下载完成: weather-api v1.2.0
```

### 显式指定类型

```bash
# 强制作为 Python 包
mpdt depend add requests --type python

# 强制作为插件
mpdt depend add other-plugin --type plugin
```

## 版本说明符

支持 [PEP 440](https://peps.python.org/pep-0440/) 版本规范：

| 规范 | 说明 | 示例 |
|------|------|------|
| `==` | 精确版本 | `requests==2.28.0` |
| `>=` | 最小版本 | `requests>=2.28.0` |
| `<=` | 最大版本 | `requests<=2.30.0` |
| `~=` | 兼容版本 | `requests~=2.28.0` |
| `>` | 大于 | `requests>2.28.0` |
| `<` | 小于 | `requests<2.30.0` |
| `*` | 任意版本 | `requests` |

### 组合版本

```bash
mpdt depend add "requests>=2.28.0,<3.0.0"
```

## 自动安装

### Python 包

使用 `uv` 安装到 Neo-MoFox 虚拟环境：

```bash
cd /path/to/Neo-MoFox
uv pip install requests>=2.28.0
```

### 插件

下载到 `Neo-MoFox/plugins/` 目录：

```bash
wget https://github.com/user/plugin/releases/download/v1.0.0/plugin-1.0.0.mfp
unzip plugin-1.0.0.mfp -d plugins/plugin
```

## manifest.json 更新

依赖会写入 `manifest.json`：

```json
{
  "dependencies": {
    "python": [
      "requests>=2.28.0",
      "pydantic>=2.0.0"
    ],
    "plugins": [
      "weather-api>=1.0.0"
    ]
  }
}
```

## 前置要求

### 配置 Neo-MoFox 路径

```bash
mpdt config edit mofox.path /path/to/Neo-MoFox
```

### 在插件目录中

```bash
cd my-plugin
mpdt depend add <dependency>
```

## 常见问题

### Neo-MoFox 路径未配置

**问题**：
```
✗ 未找到 Neo-MoFox 路径配置
```

**解决方案**：
```bash
mpdt config edit mofox.path /path/to/Neo-MoFox
```

### manifest.json 不存在

**问题**：
```
✗ 未找到 manifest.json
```

**解决方案**：
确保在插件根目录中运行命令。

### 虚拟环境不存在

**问题**：
```
✗ Neo-MoFox 虚拟环境不存在
```

**解决方案**：
在 Neo-MoFox 目录中创建虚拟环境：
```bash
cd /path/to/Neo-MoFox
uv venv
```

## 相关命令

- [mpdt depend list](./list) - 列出所有依赖
- [mpdt depend remove](./remove) - 移除依赖
- [mpdt depend search](./search) - 搜索依赖
- [mpdt depend info](./info) - 查看依赖详情

## 相关文档

- [manifest.json 格式说明](/docs/development/plugin_develop/manifest)
- [配置 Neo-MoFox 路径](../config/edit)
