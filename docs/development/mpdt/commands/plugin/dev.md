# mpdt plugin dev

启动开发模式，提供热重载（Hot Reload）功能，文件修改后自动重新加载插件。

## 用法

```bash
mpdt plugin dev [path] [options]
```

## 参数

### path

插件路径（可选）。默认为当前目录。

```bash
mpdt plugin dev /path/to/plugin
```

## 选项

### --neo-mofox-path

Neo-MoFox 主程序路径。默认从配置文件读取。

```bash
mpdt plugin dev --neo-mofox-path /path/to/Neo-MoFox
```

## 工作原理

`mpdt plugin dev` 会：

1. **注入目标插件**
   将你的插件复制到 Neo-MoFox 的 `plugins/` 目录

2. **注入 DevBridge 插件**
   自动安装开发辅助插件，提供文件监控和热重载功能

3. **启动主程序**
   在新终端窗口中启动 Neo-MoFox

4. **监控文件变化**
   检测插件目录中的文件修改

5. **自动重载**
   文件修改后自动重新加载插件，无需重启主程序

## 示例

### 基本使用

在插件目录下运行：

```bash
cd my_plugin
mpdt plugin dev
```

输出：
```
🚀 Neo-MoFox Plugin Dev Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📂 目录: my_plugin
📍 路径: /path/to/my_plugin
✓ 插件名: my_plugin
✓ 目标插件已注入: /path/to/Neo-MoFox/plugins/my_plugin
✓ DevBridge 插件已注入
  目标插件: my_plugin
  监控路径: /path/to/my_plugin
🚀 启动路径: /path/to/Neo-MoFox/main.py
✓ 主程序已启动（新窗口）
✓ 开发模式启动完成

主程序窗口中会显示文件监控和重载信息
DevBridge 插件会在主程序退出时自动清理
```

### 指定 Neo-MoFox 路径

```bash
mpdt plugin dev --neo-mofox-path /path/to/Neo-MoFox
```

### 指定插件路径

```bash
mpdt plugin dev --path /path/to/my_plugin
```

## 首次使用

首次使用需要配置 Neo-MoFox 路径：

```bash
# 方式 1: 通过配置命令
mpdt config edit mofox.path /path/to/Neo-MoFox

# 方式 2: 直接在 dev 命令中指定
mpdt plugin dev --neo-mofox-path /path/to/Neo-MoFox
```

如果未配置，`mpdt plugin dev` 会自动启动配置向导。

## 热重载功能

### 监控的文件类型

- `.py` - Python 源文件
- `manifest.json` - 插件元数据
- `requirements.txt` - Python 依赖

### 触发重载的操作

- 修改文件内容
- 创建新文件
- 删除文件
- 重命名文件

### 重载过程

```
1. 检测到文件变化
   ↓
2. 防抖延迟（0.3 秒）
   ↓
3. 卸载插件
   ↓
4. 重新加载插件
   ↓
5. 输出重载结果
```

### 主程序输出示例

```
[DevBridge] 检测到文件变化: components/actions/greeting_action.py
[DevBridge] 正在重新加载插件: my_plugin
[DevBridge] ✓ 插件重新加载成功
```

## 开发工作流

### 典型开发流程

```bash
# 1. 启动开发模式
mpdt plugin dev

# 2. 修改代码
# 编辑 components/actions/my_action.py

# 3. 保存文件
# Ctrl+S

# 4. 查看主程序窗口
# 自动重载，查看日志输出

# 5. 测试功能
# 在 Neo-MoFox 中测试你的插件

# 6. 继续开发
# 重复步骤 2-5
```

### 结合其他命令

```bash
# 终端 1: 开发模式
mpdt plugin dev

# 终端 2: 生成组件
mpdt plugin generate action NewAction

# 终端 3: 检查代码
mpdt plugin check
```

## 平台差异

### Linux

在当前终端或 GNOME Terminal 中启动。

```bash
mpdt plugin dev
```

### macOS

在 Terminal.app 中打开新窗口。

```bash
mpdt plugin dev
```

### Windows

在新的命令提示符窗口中启动。

```bash
mpdt plugin dev
```

## 调试技巧

### 查看详细日志

在 Neo-MoFox 主程序窗口中查看：

```
[DevBridge] 插件监控已启动
[DevBridge] 监控路径: /path/to/my_plugin
[DevBridge] 目标插件: my_plugin
```

### 手动触发重载

修改任意 Python 文件并保存：

```bash
# 修改文件
echo "# trigger reload" >> plugin.py

# 或使用 touch 命令
touch plugin.py
```

### 禁用热重载

编辑生成的 `dev_config.py`：

```python
# Neo-MoFox/plugins/dev_bridge/dev_config.py
ENABLE_FILE_WATCHER = False
```

### 调整防抖延迟

编辑 `dev_config.py`：

```python
# 防抖延迟（秒）
DEBOUNCE_DELAY = 0.5  # 默认 0.3
```

## 常见问题

### 找不到 Neo-MoFox 路径

**问题**：
```
✗ 未配置 Neo-MoFox 主程序路径
```

**解决方案**：
```bash
mpdt config edit mofox.path /path/to/Neo-MoFox
```

### 无法解析插件名称

**问题**：
```
✗ 无法读取插件名称
```

**解决方案**：
确保 `plugin.py` 中有正确的 `plugin_name` 定义：

```python
class MyPlugin(BasePlugin):
    plugin_name = "my_plugin"  # 必需
```

### 热重载不生效

**问题**：修改文件后插件没有重新加载

**可能原因**：
1. 文件不在监控范围内
2. 防抖延迟太短
3. 文件系统事件不支持

**解决方案**：
- 检查 DevBridge 日志
- 手动触发：`touch plugin.py`
- 增加防抖延迟

### 端口占用

**问题**：
```
✗ 端口 8080 已被占用
```

**解决方案**：
关闭占用端口的程序，或修改 Neo-MoFox 配置。

## 最佳实践

### 1. 使用版本控制

开发模式会修改 Neo-MoFox 的 plugins 目录，建议：

```bash
# 开发前提交更改
git add .
git commit -m "开发前快照"
```

### 2. 独立终端窗口

保持 `mpdt plugin dev` 在单独的终端运行，方便查看日志。

### 3. 配合编辑器

使用支持保存时自动格式化的编辑器：
- VS Code
- PyCharm
- Sublime Text

### 4. 快速迭代

利用热重载快速测试：
```bash
# 修改代码 → 保存 → 测试 → 重复
```

### 5. 结束开发

开发完成后：
```bash
# 停止开发模式
Ctrl+C

# 清理注入的插件
rm -rf /path/to/Neo-MoFox/plugins/my_plugin
rm -rf /path/to/Neo-MoFox/plugins/dev_bridge
```

或重启 Neo-MoFox 会自动清理 DevBridge。

## 性能考虑

### 大型项目

对于包含大量文件的插件，文件监控可能影响性能：

1. **排除不必要的目录**
   避免监控 `__pycache__`、`.venv` 等目录

2. **增加防抖延迟**
   减少频繁重载

3. **禁用热重载**
   手动重启主程序

## 相关命令

- [mpdt config](../config/) - 配置管理
- [mpdt plugin generate](./generate) - 生成组件
- [mpdt plugin check](./check) - 检查插件

## 相关文档

- [配置 Neo-MoFox 路径](../config/edit)
- [插件开发概述](/docs/development/plugin_develop/)
