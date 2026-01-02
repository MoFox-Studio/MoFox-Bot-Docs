# 🦊 MPDT 插件开发神器完全攻略

> 别慌，写插件没那么难！这份指南带你从零到一，轻松上手 MoFox-Bot 插件开发 ～

## 🤔 等等，MPDT 是个啥？

**MPDT**，全称 **MoFox Plugin Dev Toolkit**（MoFox 插件开发工具箱），简单来说就是你开发 MoFox-Bot 插件的"瑞士军刀" 🔪

想象一下：
- 不用自己从头搭项目框架 ❌
- 不用手动写一堆模板代码 ❌  
- 不用改一行代码就重启整个 Bot ❌

有了 MPDT，这些烦恼通通拜拜！它能帮你快速搭建项目框架和生成组件模板，让你专注于业务逻辑的编写。

### ✨ MPDT 能帮你做什么？

| 功能 | 一句话解释 | 爽感指数 |
|------|-----------|---------|
| 🚀 **一键初始化** | 敲一行命令，项目框架就搭好了 | ⭐⭐⭐⭐⭐ |
| 🎨 **模板生成器** | 生成组件框架代码，业务逻辑你来填 | ⭐⭐⭐⭐ |
| 🔍 **7层质检系统** | 帮你揪出代码里的小毛病 | ⭐⭐⭐⭐ |
| 🔥 **热重载开发** | Ctrl+S 保存，插件立刻更新 | ⭐⭐⭐⭐⭐ |
| ⚙️ **配置管理** | 交互式配置，一键验证 | ⭐⭐⭐⭐ |

## 📥 第一步：把 MPDT 装上

### 安装只要一行命令

```bash
pip install mofox-plugin-dev-toolkit
```

装完之后，试试这个：

```bash
mpdt --version
```

看到版本号了？恭喜你，MPDT 已经准备就绪！🎉

### 🛠️ 首次配置（可选但推荐）

如果你打算用热重载功能（强烈推荐！），需要告诉 MPDT 你的 MoFox-Bot 主程序在哪：

```bash
mpdt config init
```

跟着交互式提示走就行。配置完成后可以验证：

```bash
# 查看当前配置
mpdt config show

# 测试配置是否有效
mpdt config test
```

也可以单独设置某项配置：

```bash
# 设置 MoFox 主程序路径
mpdt config set-mofox "E:/你的路径/MoFox-Bot"

# 设置虚拟环境
mpdt config set-venv "E:/你的路径/venv" --type venv
```

## 🎬 开始表演！创建你的第一个插件

### 方式一：问答式创建（新手友好 💚）

```bash
mpdt init
```

然后 MPDT 会像个贴心小助手一样问你：

```
🦊 插件名称叫啥？ my_first_plugin
📦 选个模板呗？ action (Bot 主动行为类插件)
👤 作者大名？ 你的名字
📜 开源协议？ GPL-v3.0
📁 要示例代码不？ Yes (强烈建议!)
📝 创建文档？ Yes
🔧 初始化 Git？ Yes
```

回答完毕，你的插件项目模板就诞生了！✨

### 方式二：一行命令搞定（老司机专属 🏎️）

```bash
# 最简单版本
mpdt init my_plugin

# 带点料的版本
mpdt init weather_bot -t action --with-examples --with-docs

# 豪华全家桶版本
mpdt init super_plugin -t full --with-examples --with-docs -a "张三" -l MIT
```

### 🎭 模板怎么选？看这个表就懂了

| 模板 | 适合场景 | 复杂度 |
|------|---------|-------|
| `basic` | 我就要干净的空项目 | ⭐ |
| `action` | Bot 主动做事（发消息、查数据等） | ⭐⭐ |
| `tool` | 给 AI 提供新能力（工具函数） | ⭐⭐ |
| `plus_command` | 做个用户命令（如 /天气） | ⭐⭐ |
| `full` | 我全都要！学习用最佳 | ⭐⭐⭐ |
| `adapter` | 对接新平台（QQ、微信等） | ⭐⭐⭐⭐ |

> 💡 **小贴士**：新手建议从 `action` 模板开始，最实用！

## 📁 生成的项目长啥样？

跑完 `mpdt init` 后，你会得到这样一个目录结构：

```
my_plugin/
├── 📄 __init__.py          # 插件身份证（元数据）
├── 📄 plugin.py            # 插件大脑（主类）
├── 📁 components/          # 组件都住这里
│   ├── 📁 actions/         # Action 组件
│   ├── 📁 tools/           # Tool 组件
│   └── 📁 plus_commands/   # 命令组件
├── 📁 tests/               # 测试代码
├── 📄 README.md            # 说明书
└── 📄 LICENSE              # 版权声明
```

**三个核心文件，必须有！**
1. `__init__.py` - 告诉 MoFox-Bot "我是谁"
2. `plugin.py` - 插件的主逻辑

其他的都是锦上添花 ～

## 🎨 组件模板生成器：省去重复的框架代码

MPDT 可以帮你生成组件的基础框架代码，具体的业务逻辑还是需要你来实现 🌟

### 交互式生成（推荐！）

```bash
cd my_plugin  # 先进入插件目录
mpdt generate
```

然后选择你要的组件类型，填个名字和描述，框架代码就自动生成了！

### 命令行一步到位

```bash
# 生成一个获取天气的 Action 模板
mpdt generate action GetWeather -d "获取指定城市的天气信息"

# 生成一个计算器工具模板
mpdt generate tool Calculator -d "执行数学计算"

# 生成一个查询天气的命令模板
mpdt generate plus-command Weather -d "输入 /天气 城市名 查询"
```

### 🧩 8 种组件任你挑

| 组件类型 | 干啥用的 | 生成命令示例 |
|---------|---------|-------------|
| `action` | Bot 主动行为模板 | `mpdt generate action SendGift` |
| `tool` | AI 可调用的工具模板 | `mpdt generate tool WebSearch` |
| `plus-command` | 用户命令模板 | `mpdt generate plus-command Help` |
| `event` | 事件监听器模板 | `mpdt generate event OnMessage` |
| `prompt` | 提示词模板 | `mpdt generate prompt SystemPrompt` |
| `router` | 消息路由模板 | `mpdt generate router MainRouter` |
| `chatter` | 对话处理器模板 | `mpdt generate chatter ChatHandler` |
| `adapter` | 平台适配器模板 | `mpdt generate adapter Discord` |

### 看看生成的模板代码长啥样

比如生成一个 Action 模板：

```python
# components/actions/get_weather.py
class GetWeather(BaseAction):
    action_name = "get_weather"
    action_description = "获取指定城市的天气信息"
    action_parameters = {
        "city": "城市名称"
    }
    
    async def go_activate(self, llm_judge_model=None) -> bool:
        """啥时候激活这个 Action？需要你来实现判断逻辑"""
        # TODO: 在这里实现你的激活条件
        return await self._keyword_match(["天气", "温度", "下雨"])
    
    async def execute(self) -> Tuple[bool, str]:
        """Action 的核心逻辑，需要你来实现"""
        city = self.action_data.get("city", "北京")
        # TODO: 在这里写你的业务逻辑
        return True, f"查询了 {city} 的天气"
```

> 🎯 **注意**：生成的只是框架代码，带 `TODO` 的地方需要你填入具体业务逻辑！所有方法都是 `async` 的，符合 MoFox-Bot 的异步架构。

### 🪄 自动注册

生成组件后，MPDT 会自动帮你在 `plugin.py` 里添加注册代码，省去手动导入的麻烦。

## 🔍 代码检查：揪出隐藏的 Bug

写完代码，让 MPDT 帮你做个"体检"：

```bash
mpdt check
```

### 7 层检查，全方位保障

| 检查项 | 检查啥 | 能自动修吗 |
|-------|-------|-----------|
| 📂 **结构检查** | 文件夹对不对、必要文件有没有 | ❌ |
| 🏷️ **元数据检查** | 插件信息填完整没 | ❌ |
| 🧩 **组件检查** | 组件注册对不对、命名规范不 | ❌ |
| ⚙️ **配置检查** | config.toml 语法对不对 | ❌ |
| 🔤 **类型检查** | 类型标注正确不（用 mypy） | ❌ |
| 🎨 **风格检查** | 代码风格好看不（用 ruff） | ✅ |
| 🔧 **自动修复** | 智能分析可修复的问题 | ✅ |

### 自动修复格式问题

```bash
mpdt check --fix
```

代码缩进乱了？import 顺序不对？空行太多？一键全搞定！

### 更多检查姿势

```bash
# 只看错误，不看警告
mpdt check --level error

# 生成 Markdown 报告文件
mpdt check --report markdown -o report.md

# 生成 JSON 格式报告
mpdt check --report json -o report.json

# 跳过耗时的类型检查（赶时间用）
mpdt check --no-type --no-style

# 跳过其他检查
mpdt check --no-structure --no-metadata --no-component
```

### 检查结果示例

```
✅ 结构检查: 通过
✅ 元数据检查: 通过
⚠️  组件检查: 1 个警告
    └─ GetWeather: 建议写个更详细的描述
✅ 配置检查: 通过
✅ 类型检查: 通过
✅ 风格检查: 通过
✅ 自动修复: 无需修复

📊 总结: 7 项检查，6 项通过，1 个小建议
```

## 🔥 热重载开发：改代码不用重启！

这是 MPDT 的王炸功能 💣

以前改个代码要这样：
1. 改代码
2. 停止 Bot
3. 重启 Bot
4. 等待启动
5. 测试
6. 发现 bug，回到第 1 步...

现在只需要：
1. 改代码
2. Ctrl+S 保存
3. 测试

**没了，就这么简单！** 🎉

### 启动开发模式

```bash
cd my_plugin
mpdt dev

# 或者指定路径
mpdt dev --mmc-path "E:/你的路径/MoFox-Bot"
mpdt dev --plugin-path "E:/你的路径/my_plugin"
```

### 工作原理

`mpdt dev` 启动时会：
1. 将你的插件复制到主程序的 `plugins` 目录
2. 注入 **DevBridge** 开发桥接插件
3. 启动 MoFox-Bot 主程序
4. DevBridge 使用 watchdog 监控文件变化
5. 检测到变化时自动卸载旧版本、加载新版本
6. 主程序退出时自动清理 DevBridge

### 开发流程可视化

```
    ╭──────────────────────────────────────╮
    │  � MPDT 启动开发模式                │
    │     注入插件 + DevBridge 到主程序    │
    ╰──────────────────┬───────────────────╯
                       │
                       ▼
    ╭──────────────────────────────────────╮
    │  📝 你在编辑器里改了代码             │
    │     Ctrl+S 保存                      │
    ╰──────────────────┬───────────────────╯
                       │
                       ▼
    ╭──────────────────────────────────────╮
    │  👀 DevBridge 插件检测到文件变化     │
    │     "嘿！weather.py 被改了！"        │
    ╰──────────────────┬───────────────────╯
                       │
                       ▼
    ╭──────────────────────────────────────╮
    │  🔄 主程序自动重载插件               │
    │     旧版本下线 → 新版本上线          │
    ╰──────────────────┬───────────────────╯
                       │
                       ▼
    ╭──────────────────────────────────────╮
    │  ✅ 完成！可以直接测试新功能了～     │
    ╰──────────────────────────────────────╯
```

### 控制台反馈

```
🚀 MoFox Plugin Dev Server

📂 目录: weather_plugin
📍 路径: E:/plugins/weather_plugin
✓ 插件名: weather_plugin

📦 注入目标插件...
📦 注入 DevBridge 插件...
🚀 启动主程序...

✨ 开发模式已启动！
主程序窗口中会显示文件监控和重载信息
DevBridge 插件会在主程序退出时自动清理
```

### 为什么热重载这么香？

- ⚡ **快！** 不用等 Bot 重启
- 🎯 **准！** 只重载你改的插件，其他插件不受影响
- 🔒 **稳！** 重载失败也不怕，旧版本继续跑
- 🧹 **干净！** 主程序退出时自动清理开发插件

## 📚 完整实战：做个天气查询插件

来，手把手带你做一个完整的插件！

### Step 1️⃣ 创建项目

```bash
mpdt init weather_plugin -t action --with-examples
cd weather_plugin
```

### Step 2️⃣ 生成组件

```bash
# 生成核心 Action
mpdt generate action GetWeather -d "获取天气信息"

# 生成用户命令（可选）
mpdt generate plus-command Weather -d "天气查询命令"
```

### Step 3️⃣ 编写业务逻辑

模板生成后，你需要在生成的框架代码基础上填入实际的业务逻辑。

编辑 `components/actions/get_weather.py`：

```python
from typing import Tuple
from src.plugin_system.base.base_action import BaseAction
import aiohttp  # 需要安装: pip install aiohttp

class GetWeather(BaseAction):
    action_name = "get_weather"
    action_description = "获取指定城市的天气信息"
    action_parameters = {
        "city": "城市名称（如：北京、上海）"
    }
    action_require = [
        "当用户询问天气时",
        "当对话提到天气相关话题时"
    ]
    
    async def go_activate(self, llm_judge_model=None) -> bool:
        """检测用户是否在问天气"""
        keywords = ["天气", "气温", "下雨", "晴天", "冷不冷", "热不热"]
        return await self._keyword_match(keywords)
    
    async def execute(self) -> Tuple[bool, str]:
        """查询并返回天气 - 这里是你需要实现的核心逻辑"""
        city = self.action_data.get("city", "北京")
        
        # 实际项目中，你需要：
        # 1. 调用天气 API 获取数据
        # 2. 解析返回的 JSON
        # 3. 格式化成用户友好的消息
        
        # 示例：调用天气 API（需要自己申请 API Key）
        # api_key = self.plugin.config.get("api_key")
        # async with aiohttp.ClientSession() as session:
        #     async with session.get(f"https://api.weather.com/{city}") as resp:
        #         data = await resp.json()
        
        # 这里用模拟数据演示
        weather = f"🌤️ {city}今天晴，气温 15-22℃，微风"
        
        await self.send_text(weather)
        return True, f"已查询 {city} 天气"
```

> ⚠️ **重要**：上面的天气 API 调用是示例，你需要自己申请天气服务的 API Key 并实现真实的调用逻辑。

### Step 4️⃣ 配置插件

编辑 `config/config.toml`：

```toml
enabled = true

[weather_plugin]
api_key = "你的天气API密钥"
default_city = "北京"
```

### Step 5️⃣ 检查 & 测试

```bash
# 先检查一下
mpdt check --fix

# 启动开发模式
mpdt dev
```

### Step 6️⃣ 试试效果

在 Bot 里发消息："今天天气怎么样？"

🎉 如果 Bot 回复了天气信息，恭喜你，插件开发成功！

> 💡 **总结**：MPDT 帮你搭好了项目框架和组件模板，但核心的业务逻辑（比如调用天气 API、解析数据等）还是需要你自己来实现。

## 💼 命名规范速查表

### 项目名：用蛇形命名

```bash
# ✅ 正确
weather_plugin
user_manager  
ai_assistant

# ❌ 错误
WeatherPlugin    # 不要大驼峰
weather-plugin   # 不要连字符
天气插件          # 不要中文
```

### 组件名：用大驼峰

```bash
# ✅ 正确
mpdt generate action GetWeather
mpdt generate tool SearchEngine

# ❌ 错误
mpdt generate action get_weather   # 不要蛇形
mpdt generate action getweather    # 不要小驼峰
```

## 🚨 遇到问题？看这里！

### ❓ "mpdt: command not found"

八成是没装好或者没加到 PATH：

```bash
# 重新安装试试
pip install mofox-plugin-dev-toolkit

# 或者用完整路径调用
python -m mpdt.cli --version
```

### ❓ 开发模式连不上 MoFox-Bot

检查配置对不对：

```bash
# 看看当前配置
mpdt config show

# 测试配置是否有效
mpdt config test

# 重新配置
mpdt config init

# 或者手动设置路径
mpdt config set-mofox "E:/你的路径/MoFox-Bot"

# 或者启动时指定路径
mpdt dev --mmc-path "E:/你的路径/MoFox-Bot"
```

### ❓ 检查报错 "No module named 'src'"

你可能不在 MoFox-Bot 主程序目录：

```bash
# 方案一：进入主程序目录
cd /path/to/MoFox-Bot
mpdt check /path/to/your/plugin

# 方案二：跳过需要主程序的检查
mpdt check --no-component --no-type
```

### ❓ 热重载不生效

几个可能的原因：
- 🔍 文件没保存？按 Ctrl+S！
- 🔍 改的是 `.py` 文件吗？（只监控 Python 文件）
- 🔍 看看主程序窗口有没有报错（DevBridge 日志在那里）
- 🔍 插件是否已经在主程序的 plugins 目录下？

## 🎁 彩蛋：提高效率的小技巧

### 1. 设置命令别名

在 `.bashrc` 或 `.zshrc` 里加上：

```bash
alias mi='mpdt init'
alias mg='mpdt generate'
alias mc='mpdt check --fix'
alias md='mpdt dev'
```

以后 `mi my_plugin` 就能创建插件了！

### 2. VS Code 扩展推荐

安装这几个扩展，开发体验更丝滑：

- 🐍 **Python** - 必装
- 🔍 **Pylance** - 智能提示
- 🎨 **Ruff** - 代码格式化
- 📝 **Even Better TOML** - 配置文件高亮

### 3. 开发模式小技巧

```bash
# 开两个终端
# 终端 1：跑开发模式
mpdt dev

# 终端 2：看日志（Windows用 Get-Content -Wait）
tail -f logs/app_*.log
```

### 4. Git 忽略文件模板

把这个加到 `.gitignore`：

```gitignore
# Python 缓存
__pycache__/
*.py[cod]

# 虚拟环境
venv/
.venv/

# MPDT
.mpdt/
logs/
*.log

# IDE
.vscode/
.idea/
```

## 🗺️ 下一步去哪儿？

恭喜你读完了这份指南！接下来可以：

- 📖 [Action 组件深入指南](./action-components.md) - 玩转 Action
- 🔧 [Tool 开发指南](./tool_guide.md) - 给 AI 加技能
- 💬 [命令开发指南](./PLUS_COMMAND_GUIDE.md) - 做用户命令
- ⚙️ [配置管理指南](./configuration-guide.md) - 管理配置项

## 🦊 写在最后

MPDT 的定位是**开发辅助工具**，它能帮你：

- ✅ 快速搭建标准化的项目结构
- ✅ 生成组件框架代码，省去重复劳动
- ✅ 检查代码规范和常见问题
- ✅ 热重载开发，提升调试效率

但它**不能帮你**：

- ❌ 自动实现业务逻辑（这需要你自己写）
- ❌ 自动接入第三方 API（需要你自己申请和集成）
- ❌ 替代学习 MoFox-Bot 插件开发的知识

把 MPDT 当作你的**脚手架工具**，它帮你打好地基，具体的房子还是要你自己盖！

遇到问题？来 [GitHub Issues](https://github.com/MoFox-Studio/mofox-plugin-toolkit/issues) 聊聊，我们很乐意帮忙！

<div align="center">

**开始你的插件开发之旅吧！** 🚀

Made with 🧡 by MoFox-Studio

*"让 Bot 开发更规范，让框架搭建更简单"*

</div>
