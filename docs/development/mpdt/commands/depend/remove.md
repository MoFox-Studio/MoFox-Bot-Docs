# mpdt depend remove

从插件中移除依赖。

## 用法

```bash
mpdt depend remove <dependency> [path] [options]
```

## 参数

### dependency

依赖名称（必需）。

### path

插件根目录（可选）。默认为当前目录。

```bash
mpdt depend remove requests /path/to/plugin
```

## 选项

### --type

依赖类型。

**可选值**：
- `auto` - 自动判断 *默认*
- `plugin` - 插件
- `python` - Python 包

```bash
mpdt depend remove requests . --type python
```

## 示例

### 移除 Python 包

```bash
mpdt depend remove requests
```

输出：
```
✓ 已从 manifest 移除 Python 包依赖: requests
ℹ 正在卸载 Python 包: requests
✓ Python 包已卸载: requests
```

### 移除插件依赖

```bash
mpdt depend remove weather-api
```

输出：
```
✓ 已从 manifest 移除插件依赖: weather-api
✓ 已删除插件包: /path/to/Neo-MoFox/plugins/weather-api.mfp
```

或者（如果是目录形式）：
```
✓ 已从 manifest 移除插件依赖: weather-api
✓ 已删除插件目录: /path/to/Neo-MoFox/plugins/weather-api
```

## 行为说明

### 自动清理

`mpdt depend remove` 默认会：

1. 从 `manifest.json` 中移除依赖声明
2. **自动删除相关文件**：
   - **Python 包**：使用 `uv pip uninstall` 从虚拟环境中卸载
   - **插件**：删除 `plugins/` 目录下的 `.mfp` 文件或插件目录

::: warning 无条件清理
当前版本的 `mpdt depend remove` 会无条件删除相关文件。如果只需要从 manifest.json 中移除声明而保留文件，请手动编辑 `manifest.json`。
:::

### 前置条件

自动清理功能需要：

1. **已配置 Neo-MoFox 路径**：使用 `mpdt config edit mofox.path <path>` 配置
2. **Python 包卸载**：需要存在 `.venv` 虚拟环境
3. **已安装 uv**：用于卸载 Python 包

## manifest.json 更新

移除前：
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

移除后（移除 requests）：
```json
{
  "dependencies": {
    "python": [
      "pydantic>=2.0.0"
    ],
    "plugins": [
      "weather-api>=1.0.0"
    ]
  }
}
```

## 常见问题

### 依赖未找到

**问题**：
```
✗ 未找到依赖: requests
```

**解决方案**：
检查依赖名称是否正确，或使用 `mpdt depend list` 查看所有依赖。

### manifest.json 不存在

**问题**：
```
✗ 未找到 manifest.json
```

**解决方案**：
确保在插件根目录中运行命令。

### 未配置 Neo-MoFox 路径

**问题**：
```
⚠ 未配置 Neo-MoFox 路径，跳过包卸载
```

**解决方案**：
配置 Neo-MoFox 路径以启用自动清理：
```bash
mpdt config edit mofox.path /path/to/Neo-MoFox
```

### 未找到 uv 命令

**问题**：
```
✗ 未找到 uv 命令，请先安装: pip install uv
```

**解决方案**：
安装 uv 工具：
```bash
pip install uv
# 或
pipx install uv
```

### 插件文件未找到

**问题**：
```
ℹ 未找到插件文件: weather-api
```

**说明**：
依赖已从 manifest.json 移除，但在 Neo-MoFox plugins 目录中未找到对应文件。这可能是因为：
- 插件已被手动删除
- 插件从未下载
- 插件使用了不同的文件名

这不是错误，依赖移除仍然成功。

## 最佳实践

### 1. 移除前先查看

在移除依赖前，先查看当前所有依赖：

```bash
mpdt depend list
mpdt depend remove requests
```

### 2. 默认使用自动清理

通常情况下使用默认行为即可，会自动清理所有相关文件：

```bash
# 完全移除依赖（推荐）
mpdt depend remove requests
```

### 3. 移除后验证

移除依赖后，检查插件状态：

```bash
mpdt depend remove requests
mpdt plugin check
```

### 4. 配置 Neo-MoFox 路径

为了使用自动清理功能，建议先配置 Neo-MoFox 路径：

```bash
mpdt config edit mofox.path /path/to/Neo-MoFox
mpdt depend remove requests  # 现在会自动卸载
```

## 相关命令

- [mpdt depend list](./list) - 列出所有依赖
- [mpdt depend add](./add) - 添加依赖
- [mpdt plugin check](../plugin/check) - 检查插件

## 相关文档

- [manifest.json 格式说明](/docs/development/plugin_develop/manifest)
