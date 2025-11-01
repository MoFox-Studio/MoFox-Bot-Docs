# 🎉 新功能演示

本页面展示了文档站点的最新增强功能！

## ✨ 功能一：页面阅读进度条

当您滚动页面时，注意顶部会出现一个**渐变色进度条**，实时显示您的阅读进度。

**特点：**
- 📊 实时更新，跟随滚动位置
- 🎨 采用品牌渐变色（蓝色系）
- 📱 响应式设计，移动端自动调整
- 🌓 支持深色/浅色主题
- ⚡ 平滑动画效果

## ✨ 功能二：代码块一键复制

每个代码块的右上角都有一个**复制按钮**，让您轻松复制代码。

**试试看：**

```python
def hello_world():
    print("Hello, MoFox Bot!")
    print("欢迎使用增强版文档系统！")
    return "复制成功！"

# 点击右上角的复制按钮试试
hello_world()
```

```javascript
// JavaScript 示例
const greet = () => {
  console.log('Hello from MoFox Bot Docs!');
  console.log('这是一个带复制功能的代码块');
};

greet();
```

```bash
# Bash 命令示例
npm install
npm run docs:dev
npm run docs:build

# 一键复制，轻松执行！
```

**特点：**
- 📋 一键复制整个代码块
- ✅ 复制成功后显示确认提示
- 🎯 自动2秒后恢复按钮状态
- 📱 移动端自动隐藏文字，只显示图标
- 🎨 悬停时高亮显示

## 🎯 使用场景

### 1. 快速复制配置文件

```yaml
# config.yaml
bot:
  name: "MoFox Bot"
  version: "2.0"
  features:
    - 智能对话
    - 持久记忆
    - 插件系统
```

### 2. 复制安装命令

```bash
git clone https://github.com/MoFox-Studio/MoFox_Bot.git
cd MoFox_Bot
npm install
```

### 3. 复制代码示例

```python
from mofox_bot import Plugin

class MyPlugin(Plugin):
    def __init__(self):
        super().__init__()
        self.name = "示例插件"
    
    async def on_message(self, message):
        return f"收到消息: {message}"
```

## 💡 技术实现

这两个功能都是**纯前端实现**，无需后端支持：

1. **阅读进度条**：
   - 监听 `scroll` 事件
   - 计算滚动百分比
   - 使用 CSS 渐变和过渡动画

2. **代码复制按钮**：
   - 使用 Clipboard API
   - MutationObserver 监听 DOM 变化
   - 动态添加按钮到代码块

## 📝 更多示例

试试滚动到页面底部，观察进度条的变化！同时尝试复制不同的代码块。

```json
{
  "project": "MoFox Bot Docs",
  "features": [
    "阅读进度条",
    "代码复制增强",
    "阅读时间统计",
    "回到顶部/底部",
    "Git 变更日志"
  ],
  "theme": {
    "colors": {
      "primary": "#367BF0",
      "secondary": "#5C96F5"
    }
  }
}
```

---

**感谢使用 MoFox Bot 文档系统！** 🦊

