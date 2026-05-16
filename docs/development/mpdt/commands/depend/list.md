# mpdt depend list

列出插件的所有依赖。

## 用法

```bash
mpdt depend list [path] [options]
```

## 参数

### path

插件根目录（可选）。默认为当前目录。

```bash
mpdt depend list /path/to/plugin
```

## 选项

### --type

依赖类型。

**可选值**：
- `all` - 列出所有依赖 *默认*
- `plugin` - 仅列出插件依赖
- `python` - 仅列出 Python 包依赖

```bash
mpdt depend list . --type python
```

## 示例

### 列出所有依赖

```bash
mpdt depend list
```

输出：
```
   插件依赖 (1 个)    
┏━━━━━━━━━━━━━━━━━━━━┓
┃ 插件 ID            ┃
┡━━━━━━━━━━━━━━━━━━━━┩
│ asr_adapter>=1.0.2 │
└────────────────────┘
  Python   
 包依赖 (1 
    个)    
┏━━━━━━━━━┓
┃ 包规范  ┃
┡━━━━━━━━━┩
│ aiohttp │
└─────────┘
```

### 仅列出插件依赖

```bash
mpdt depend list --type plugin
```

输出：
```
   插件依赖 (1 个)    
┏━━━━━━━━━━━━━━━━━━━━┓
┃ 插件 ID            ┃
┡━━━━━━━━━━━━━━━━━━━━┩
│ asr_adapter>=1.0.2 │
└────────────────────┘
```

### 仅列出 Python 包依赖

```bash
mpdt depend list --type python
```

输出：
```
┏━━━━━━━━━┓
┃ 包规范  ┃
┡━━━━━━━━━┩
│ aiohttp │
└─────────┘
```


### 无依赖时

```bash
mpdt depend list
```

输出：
```
插件依赖（0 个）
  无插件依赖

Python 包依赖（0 个）
  无 Python 包依赖
```

## 数据来源

依赖信息从 `manifest.json` 读取：

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

## 常见问题

### manifest.json 不存在

**问题**：
```
✗ 未找到 manifest.json
```

**解决方案**：
确保在插件根目录中运行命令。

### dependencies 字段为空

显示无依赖。这是正常的，表示插件没有声明依赖。

## 最佳实践

### 1. 定期检查依赖

```bash
mpdt depend list
```

### 2. 更新前先列出

```bash
# 查看现有依赖
mpdt depend list

# 添加新依赖
mpdt depend add requests

# 再次查看
mpdt depend list
```

### 3. 导出依赖列表

```bash
# 导出到文件
mpdt depend list > dependencies.txt
```

## 相关命令

- [mpdt depend add](./add) - 添加依赖
- [mpdt depend remove](./remove) - 移除依赖
- [mpdt depend info](./info) - 查看依赖详情

## 相关文档

- [manifest.json 格式说明](/docs/development/plugin_develop/manifest)
