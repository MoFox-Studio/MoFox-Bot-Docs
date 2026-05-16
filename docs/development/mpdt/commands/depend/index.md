# mpdt depend

依赖管理命令组，处理插件依赖和 Python 包依赖。

## 命令列表

| 命令 | 功能说明 |
|------|----------|
| [add](./add) | 添加依赖 |
| [search](./search) | 搜索依赖 |
| [info](./info) | 查看依赖详细信息 |
| [remove](./remove) | 移除依赖 |
| [list](./list) | 列出所有依赖 |

## 基本工作流

依赖管理的典型操作：

```bash
# 1. 添加 Python 包依赖
mpdt depend add "requests>=2.28.0"

# 2. 添加插件依赖
mpdt depend add "other-plugin>=1.0.0"

# 3. 搜索依赖
mpdt depend search requests

# 4. 查看依赖详情
mpdt depend info requests

# 5. 列出所有依赖
mpdt depend list

# 6. 移除依赖
mpdt depend remove requests
```

## 快速参考

### 添加依赖
```bash
# 自动判断类型
mpdt depend add <dependency>

# 指定为 Python 包
mpdt depend add <package> --type python

# 指定为插件
mpdt depend add <plugin> --type plugin
```

### 搜索依赖
```bash
# 搜索所有类型
mpdt depend search <query>

# 仅搜索插件
mpdt depend search <query> --type plugin

# 仅搜索 Python 包
mpdt depend search <query> --type python
```

### 列出依赖
```bash
# 列出所有依赖
mpdt depend list

# 仅列出插件依赖
mpdt depend list --type plugin

# 仅列出 Python 包依赖
mpdt depend list --type python
```

## 依赖类型

### Python 包依赖
存储在 `manifest.json` 的 `dependencies.python` 字段，使用 `uv` 自动安装到 Neo-MoFox 虚拟环境。

```bash
mpdt depend add "requests>=2.28.0"
mpdt depend add "pydantic==2.0.0"
```

### 插件依赖
存储在 `manifest.json` 的 `dependencies.plugins` 字段，自动下载到 Neo-MoFox 的 `plugins` 目录。

```bash
mpdt depend add "other-plugin>=1.0.0"
```

## 版本规范

支持 [PEP 440](https://peps.python.org/pep-0440/) 版本说明符：

| 规范 | 说明 | 示例 |
|------|------|------|
| `==` | 精确版本 | `requests==2.28.0` |
| `>=` | 最小版本 | `requests>=2.28.0` |
| `<=` | 最大版本 | `requests<=2.30.0` |
| `~=` | 兼容版本 | `requests~=2.28.0` |
| `*` | 任意版本 | `requests` |

## 前置要求

使用 depend 命令需要：

1. **配置 Neo-MoFox 路径**
   ```bash
   mpdt config edit mofox.path /path/to/Neo-MoFox
   ```

2. **位于插件目录**
   ```bash
   cd my-plugin
   mpdt depend add <dependency>
   ```

## 相关文档

- [配置管理](../config/)
- [manifest.json 格式说明](/docs/development/plugin_develop/manifest)
