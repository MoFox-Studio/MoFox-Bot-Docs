# 🛠️ MPDT 插件开发工具指南

## 📖 核心概念：什么是 MPDT？

**MPDT (MoFox Plugin Dev Toolkit)** 是一个类似于 Vite 的现代化 Python 开发工具，专为 MoFox-Bot 插件系统设计。它提供了从项目初始化、组件生成、代码检查到热重载开发的完整工具链，让插件开发变得更加高效和规范。

### MPDT 的核心特点

- 🚀 **快速初始化** - 一键创建标准化的插件项目，告别繁琐的手动搭建
- 🎨 **智能代码生成** - 自动生成规范的组件代码，所有方法自动异步化
- 🔍 **完整的检查系统** - 6 层验证体系确保代码质量和规范性
- 🔥 **热重载开发** - 文件保存即生效，无需重启主程序
- 🤖 **高度自动化** - 自动注册组件、自动管理依赖、自动修复问题

---

## 🚀 安装与配置

### 安装 MPDT

```bash
# 从PyPi安装（推荐）
pip install mofox-plugin-dev-toolkit
```

### 首次配置（用于开发模式）

```bash
# 启动开发模式会提示配置 MMC 主程序路径
mpdt dev

# 配置会保存到 ~/.mpdt/config.toml
# 你也可以手动创建配置文件：
```

```toml
# ~/.mpdt/config.toml
[mpdt]
mmc_path = "E:/delveoper/mmc010"  # MoFox-Bot 主程序路径
```

---

## 📦 快速开始：创建你的第一个插件

### 1. 初始化插件项目

MPDT 提供了交互式和命令行两种初始化方式。

#### 方式一：交互式创建（推荐新手）

```bash
mpdt init
```

系统会依次询问：
- **插件名称**: 例如 `my_awesome_plugin`
- **模板类型**: 选择合适的模板（basic、action、tool、plus_command、full、adapter）
- **作者名称**: 自动从 Git 配置获取，也可手动输入
- **开源协议**: 选择 GPL-v3.0、MIT、Apache-2.0 或 BSD-3-Clause
- **是否包含示例**: 推荐选择 Yes，可以参考示例代码
- **是否创建文档**: 推荐选择 Yes
- **是否初始化 Git**: 推荐选择 Yes

#### 方式二：命令行创建（适合熟悉者）

```bash
# 创建基础插件
mpdt init my_plugin -t basic -a "张三" -l GPL-v3.0

# 创建带 Action 组件的插件
mpdt init weather_plugin -t action --with-examples --with-docs

# 创建完整功能的插件（包含多种组件示例）
mpdt init full_plugin -t full --with-examples
```

#### 模板类型说明

| 模板 | 说明 | 适用场景 |
|------|------|---------|
| `basic` | 最小化结构 | 想完全自定义结构 |
| `action` | 包含 Action 组件 | 需要 Bot 主动执行操作 |
| `tool` | 包含 Tool 组件 | 为 LLM 提供工具能力 |
| `plus_command` | 包含 PlusCommand 组件 | 创建用户命令 |
| `full` | 完整示例 | 学习所有组件用法 |
| `adapter` | 适配器模板 | 创建平台适配器 |

### 2. 查看生成的项目结构

```bash
cd my_plugin
tree /F  # Windows
# 或
ls -R    # Linux/Mac
```

生成的标准结构：

```
my_plugin/
├── __init__.py              # ⭐ 插件元数据（必需）
├── plugin.py                # ⭐ 插件主类（必需）
├── config/
│   └── config.toml          # ⭐ 配置文件（必需）
├── components/              # 组件目录
│   ├── actions/             # Action 组件
│   ├── tools/               # Tool 组件
│   ├── plus_commands/       # PlusCommand 组件
│   └── ...                  # 其他组件类型
├── tests/                   # 测试目录
├── README.md               # 插件说明
├── requirements.txt        # 依赖列表
└── LICENSE                 # 许可证
```

---

## 🎨 生成组件：快速添加功能

### 1. 交互式生成（最简单）

```bash
cd my_plugin
mpdt generate
```

系统会询问：
1. **选择组件类型**: 从 8 种组件中选择
2. **组件名称**: 使用 PascalCase 命名（如 `SendMessage`）
3. **组件描述**: 简要说明组件功能

### 2. 命令行生成（更快捷）

```bash
# 生成 Action 组件
mpdt generate action GetWeather -d "获取指定城市的天气信息"

# 生成 Tool 组件
mpdt generate tool Calculator -d "执行数学计算"

# 生成 PlusCommand 组件
mpdt generate plus-command Help -d "显示帮助信息"

# 生成其他组件
mpdt generate event MessageReceived -d "处理消息接收事件"
mpdt generate prompt SystemPrompt -d "系统提示词模板"
mpdt generate router MessageRouter -d "消息路由器"
mpdt generate chatter ChatHandler -d "对话处理器"
mpdt generate adapter CustomAdapter -d "自定义平台适配器"
```

### 3. 组件类型详解

#### Action 组件
用于 Bot 主动执行的操作（如发送消息、查询数据）。

```python
# 生成命令
mpdt generate action SendImage -d "发送图片"

# 生成的代码 (components/actions/send_image.py)
class SendImage(BaseAction):
    action_name = "send_image"
    action_description = "发送图片"
    action_parameters = {}  # 定义需要的参数
    
    async def go_activate(self, llm_judge_model=None) -> bool:
        """激活逻辑 - 决定何时可用"""
        return await self._keyword_match(["图片", "发图"])
    
    async def execute(self) -> Tuple[bool, str]:
        """执行逻辑 - 实际的操作"""
        # 在这里实现你的逻辑
        return True, "执行成功"
```

详细用法参见 [Action 组件开发指南](./action-components.md)。

#### Tool 组件
为 LLM 提供可调用的工具函数。

```python
# 生成命令
mpdt generate tool SearchWeb -d "网页搜索工具"

# 生成的代码
class SearchWeb(BaseTool):
    tool_name = "search_web"
    tool_description = "搜索网页内容"
    tool_parameters = {
        "query": "搜索关键词"
    }
    
    async def execute(self) -> str:
        """工具执行逻辑"""
        query = self.tool_data.get("query")
        # 实现搜索逻辑
        return f"搜索结果: {query}"
```

详细用法参见 [工具指南](./tool_guide.md)。

#### PlusCommand 组件
用户可以直接调用的命令。

```python
# 生成命令
mpdt generate plus-command Weather -d "查询天气命令"

# 生成的代码
class Weather(BasePlusCommand):
    command_name = "/天气"
    command_description = "查询指定城市的天气"
    
    async def execute(self) -> str:
        """命令执行逻辑"""
        # 实现命令逻辑
        return "今天天气晴朗"
```

详细用法参见 [命令指南](./PLUS_COMMAND_GUIDE.md)。

### 4. 自动注册

生成组件后，MPDT 会自动在 `plugin.py` 中添加注册代码：

```python
# plugin.py
class MyPlugin(BasePlugin):
    async def on_enable(self):
        await super().on_enable()
        
        # 自动添加的注册代码
        from .components.actions.get_weather import GetWeather
        self.action_manager.register_action(GetWeather)
```

---

## 🔍 代码检查：确保质量

MPDT 提供了 6 层检查体系，全面保障代码质量。

### 基础检查

```bash
# 运行所有检查（推荐）
mpdt check

# 自动修复可修复的问题
mpdt check --fix
```

### 检查器说明

| 检查器 | 检查内容 | 可自动修复 |
|--------|---------|-----------|
| **structure** | 目录结构、必需文件 | ❌ |
| **metadata** | `__plugin_meta__` 完整性 | ❌ |
| **component** | 组件注册、命名规范 | ❌ |
| **config** | `config.toml` 语法 | ❌ |
| **type** | 类型注解（mypy） | ❌ |
| **style** | 代码风格（ruff） | ✅ |

### 高级用法

```bash
# 只显示错误级别的问题
mpdt check --level error

# 生成 Markdown 格式的检查报告
mpdt check --report markdown -o check_report.md

# 跳过耗时的类型和风格检查
mpdt check --no-type --no-style

# 只运行特定检查器
mpdt check --no-structure --no-metadata --no-component --no-config

# 组合使用
mpdt check --fix --level warning --report markdown -o report.md
```

### 检查结果示例

```
✅ StructureValidator: 通过
✅ MetadataValidator: 通过
⚠️  ComponentValidator: 发现 1 个警告
    ⚠  SendMessage: 建议添加更详细的 action_description
✅ ConfigValidator: 通过
✅ TypeValidator: 通过
✅ StyleValidator: 通过

总结: 6 个检查器，5 个通过，1 个警告
```

### 自动修复说明

使用 `--fix` 参数时，MPDT 会自动修复：
- 代码格式问题（缩进、空行、引号等）
- import 语句排序
- 行长度问题
- 尾随空格

不能自动修复的问题会给出详细的修复建议。

---

## 🔥 热重载开发：极速迭代

MPDT 的热重载系统让你无需重启主程序即可测试插件修改。

### 1. 启动开发模式

```bash
cd my_plugin
mpdt dev
```

首次运行会提示配置 MMC 主程序路径，之后会自动：
1. ✅ 注入开发桥接插件到主程序
2. ✅ 启动 MMC 主程序
3. ✅ 建立 WebSocket 连接
4. ✅ 开始监控文件变化

### 2. 开发流程

```
┌─────────────────────────────────────────────┐
│ 1. 修改代码并保存                           │
│    (编辑 components/actions/weather.py)     │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ 2. MPDT 自动检测文件变化                    │
│    ⚡ 检测到变化: weather.py               │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ 3. 通过 WebSocket 通知主程序                │
│    📡 发送重载指令                          │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ 4. 主程序自动重载插件                       │
│    🔄 卸载旧版本 → 加载新版本              │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ 5. 显示重载结果                             │
│    ✅ 重载成功 (耗时: 0.5s)                │
└─────────────────────────────────────────────┘
```

### 3. 实时反馈

```
🔥 开发服务器就绪！
监控文件变化中... (Ctrl+C 退出)

📝 [14:23:45] 检测到文件变化: components/actions/weather.py
🔄 [14:23:45] 正在重载插件...
✅ [14:23:45] 重载成功 (耗时: 0.5s)

📝 [14:24:12] 检测到文件变化: plugin.py
🔄 [14:24:12] 正在重载插件...
✅ [14:24:12] 重载成功 (耗时: 0.6s)
```

### 4. 开发模式的优势

- ⚡ **极速迭代** - 保存即生效，无需等待重启
- 🎯 **精准重载** - 只重载修改的插件，不影响其他功能
- 📊 **实时反馈** - 立即知道重载是否成功
- 🔒 **安全可靠** - 重载失败会保留旧版本，不会崩溃

---

## 💡 最佳实践

### 1. 项目命名规范

```bash
# ✅ 好的命名
mpdt init weather_plugin
mpdt init user_manager
mpdt init ai_chat_assistant

# ❌ 避免的命名
mpdt init WeatherPlugin  # 避免大写
mpdt init weather-plugin # 避免连字符（Python 包名不支持）
mpdt init 天气插件      # 避免中文
```

### 2. 组件命名规范

```bash
# ✅ 使用 PascalCase
mpdt generate action GetWeather
mpdt generate tool SearchEngine

# ❌ 避免其他格式
mpdt generate action get_weather  # 不要用 snake_case
mpdt generate action getWeather   # 不要用 camelCase
```

### 3. 开发工作流

推荐的开发流程：

```bash
# 1. 初始化插件
mpdt init my_plugin -t action --with-examples

# 2. 进入插件目录
cd my_plugin

# 3. 生成需要的组件
mpdt generate action SendMessage -d "发送消息"
mpdt generate tool Calculator -d "计算器"

# 4. 运行检查
mpdt check

# 5. 修复问题
mpdt check --fix

# 6. 启动开发模式
mpdt dev

# 7. 编辑代码并实时测试
# (在另一个终端或编辑器中修改代码)

# 8. 完成开发后再次检查
mpdt check

# 9. 提交代码
git add .
git commit -m "feat: add message sending functionality"
```

### 4. 代码质量保证

在提交代码前，务必运行完整检查：

```bash
# 完整的质量检查流程
mpdt check --fix          # 自动修复格式问题
mpdt check --level error  # 确保没有错误
mpdt check --report markdown -o report.md  # 生成检查报告
```

### 5. 开发模式技巧

```bash
# 技巧 1: 使用多终端
# 终端 1: 运行开发模式
mpdt dev

# 终端 2: 查看主程序日志
tail -f logs/app_*.log

# 技巧 2: 快速重新检查
# 在开发过程中定期运行快速检查
mpdt check --no-type --no-style  # 跳过耗时检查

# 技巧 3: 保存配置
# 创建 .mpdtrc.toml (未来功能)
[mpdt]
default_template = "action"
default_license = "GPL-v3.0"
```

---

## 📚 完整示例：创建天气插件

让我们通过一个完整的例子，从零开始创建一个天气查询插件。

### 第一步：初始化项目

```bash
mpdt init weather_plugin -t action --with-examples -a "你的名字" -l GPL-v3.0
cd weather_plugin
```

### 第二步：生成组件

```bash
# 生成 Action 组件
mpdt generate action GetWeather -d "获取指定城市的天气信息"

# 生成 Tool 组件（供 LLM 调用）
mpdt generate tool WeatherQuery -d "天气查询工具"

# 生成 PlusCommand 组件（供用户直接使用）
mpdt generate plus-command Weather -d "天气查询命令"
```

### 第三步：实现功能

编辑 `components/actions/get_weather.py`:

```python
from typing import Tuple
from src.plugin_system.base.base_action import BaseAction

class GetWeather(BaseAction):
    action_name = "get_weather"
    action_description = "获取指定城市的天气信息"
    action_parameters = {
        "city": "城市名称（如：北京、上海）"
    }
    action_require = [
        "当用户询问天气情况时",
        "当对话中提到天气相关话题时"
    ]
    
    async def go_activate(self, llm_judge_model=None) -> bool:
        """当消息包含天气相关关键词时激活"""
        return await self._keyword_match([
            "天气", "气温", "下雨", "晴天", "阴天"
        ])
    
    async def execute(self) -> Tuple[bool, str]:
        """执行天气查询"""
        # 获取城市参数
        city = self.action_data.get("city", "北京")
        
        # TODO: 调用天气 API 获取数据
        # 这里用示例数据演示
        weather_info = f"{city}今天晴天，气温 20-28℃"
        
        # 发送消息给用户
        await self.send_text(weather_info)
        
        return True, f"已发送 {city} 的天气信息"
```

### 第四步：配置文件

编辑 `config/config.toml`:

```toml
# 插件启用状态
enabled = true

# 天气插件配置
[weather_plugin]
# 天气 API 配置（示例）
api_key = "your_api_key_here"
api_url = "https://api.weather.com"
default_city = "北京"
```

### 第五步：检查代码

```bash
# 运行完整检查
mpdt check

# 自动修复代码风格
mpdt check --fix

# 生成检查报告
mpdt check --report markdown -o check_report.md
```

### 第六步：开发测试

```bash
# 启动开发模式
mpdt dev
```

现在你可以：
1. 在编辑器中修改代码
2. 保存文件
3. MPDT 自动重载插件
4. 在 Bot 中测试功能

### 第七步：完善文档

编辑 `README.md`:

```markdown
# 天气插件

获取城市天气信息的 MoFox-Bot 插件。

## 功能

- 🌤️ 查询城市天气
- 🌡️ 显示温度信息
- ☔ 降雨提醒

## 使用方法

直接在聊天中询问：
- "今天天气怎么样？"
- "北京的天气"
- "上海会下雨吗？"

或使用命令：
```
/天气 北京
```

## 配置

在 `config/config.toml` 中配置 API 密钥：
```toml
[weather_plugin]
api_key = "your_key"
```
```

---

## 🔧 故障排查

### 常见问题

#### 1. `mpdt: command not found`

**原因**: MPDT 未正确安装或未添加到 PATH

**解决方案**:
```bash
# 确保在正确的虚拟环境中
pip install -e .

# 或使用完整路径
python -m mpdt.cli --version
```

#### 2. 开发模式连接失败

**原因**: MMC 路径配置错误或主程序未启动

**解决方案**:
```bash
# 检查配置文件
cat ~/.mpdt/config.toml

# 手动指定路径
mpdt dev --mmc-path "E:/path/to/mmc"
```

#### 3. 检查器报错

**错误**: `ModuleNotFoundError: No module named 'src'`

**原因**: 不在 MMC 主程序环境中运行

**解决方案**:
```bash
# 在 MMC 主程序目录运行
cd /path/to/mmc
mpdt check /path/to/your/plugin
```

#### 4. 热重载不生效

**原因**: 文件监控未检测到变化

**解决方案**:
- 确保保存了文件
- 检查是否修改了 `.py` 文件（只监控 Python 文件）
- 查看 MPDT 控制台是否有错误信息

---

## 📖 进一步学习

完成本指南后，建议继续学习：

- [Action 组件开发指南](./action-components.md) - 深入了解 Action 组件
- [工具指南](./tool_guide.md) - 创建供 LLM 使用的工具
- [命令指南](./PLUS_COMMAND_GUIDE.md) - 创建用户命令
- [配置指南](./configuration-guide.md) - 管理插件配置
- [元数据指南](./metadata-guide.md) - 完善插件信息

---

## 💡 小贴士

### 快捷命令别名

在你的 shell 配置文件（`.bashrc` 或 `.zshrc`）中添加：

```bash
alias mpdt-new='mpdt init'
alias mpdt-gen='mpdt generate'
alias mpdt-check='mpdt check --fix'
alias mpdt-dev='mpdt dev'
```

### VS Code 集成

推荐安装以下 VS Code 扩展：
- Python
- Pylance
- Ruff
- TOML Language Support

### 版本控制

推荐的 `.gitignore`:

```gitignore
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
venv/

# MPDT
.mpdt/
logs/
*.log

# IDE
.vscode/
.idea/
```

---

## 🎉 总结

通过本指南，你已经学会了：

✅ 安装和配置 MPDT  
✅ 创建插件项目  
✅ 生成各种组件  
✅ 使用检查系统  
✅ 使用热重载开发  
✅ 遵循最佳实践  

现在，你可以高效地开发高质量的 MoFox-Bot 插件了！

如有问题，欢迎在 [GitHub Issues](https://github.com/MoFox-Studio/mofox-plugin-toolkit/issues) 中反馈。

---

**Happy Coding! 🚀**
