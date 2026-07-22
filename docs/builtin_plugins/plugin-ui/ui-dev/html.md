# HTML 开发

XML 轨用声明式 XML 描述界面，HTML 轨则把整个页面交给插件自己控制：你写原生 HTML / CSS / JS，WebUI 用 Shadow DOM 沙箱加载，并提供一个 `sys` 桥接对象作为与系统交互的唯一通道。

本文从快速入门出发，介绍 HTML 轨的资源结构、注册方式、沙箱环境、`sys` 注入、组件用法与调试技巧。

::: tip 何时选 HTML 轨
- 需要完全自定义的 UI（图表可视化、Canvas / WebGL、复杂表单编排）
- 想用第三方 JS 库（ECharts、Monaco、CodeMirror、Three.js 等）
- 命令式编程习惯，不想被 XML 管道指令约束

其他场景建议优先用 [XML 轨](./xml) —— 更轻量、更安全、零样板。
:::

## 渲染模型

HTML 轨的渲染流程：

```
插件后端 (Python)                WebUI 前端 (Vue)
┌──────────────────────┐        ┌─────────────────────────────┐
│ register_ui_page     │        │  PluginUIManager            │
│   mode="html"        │──register──→  (注册表)               │
│   assets=...         │        │                             │
└──────────────────────┘        │  HtmlSandbox                │
                                │   1. host.attachShadow()    │
                                │   2. 注入 MD3 变量穿透 <style>│
                                │   3. installFetchProxy       │
                                │      (注入 Token / X-Plugin)  │
                                │   4. fetch styles → <style>  │
                                │   5. fetch entry_html        │
                                │      → shadowRoot.innerHTML  │
                                │   6. 注册 sys-* 自定义元素    │
                                │   7. createSysBridge         │
                                │      → window.__plugin_sys_* │
                                │   8. 顺序执行 scripts        │
                                └─────────────────────────────┘
```

每个 HTML 页面运行在独立的 **Shadow DOM** 沙箱里：

- 主站样式不污染插件页面，插件 CSS 也不外溢
- MD3 主题 CSS 变量（`--md-sys-color-*`）**天然穿透 Shadow DOM**，插件可直接使用
- 插件内 `window.fetch` / `XMLHttpRequest` 被透明重写，自动注入 `Authorization` / `X-API-Key` / `X-Plugin-Name` 头
- 一个 `sys` 桥接对象挂在 `window.__plugin_sys_<pageId>` 上，是插件与系统交互的唯一入口

## 第一个 HTML 页面

### 1. 准备资源文件

在插件目录下建一个 `ui/` 子目录（命名随意），结构如下：

```
my_plugin/
├── manifest.json
├── plugin.py
└── ui/
    ├── index.html      ← 入口 HTML
    ├── style.css       ← 插件样式
    ├── main.js         ← 插件脚本
    └── assets/         ← 静态资源（图片 / 字体 / SVG 等，可选）
        └── logo.png
```

#### `ui/index.html`

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>我的 HTML 页面</title>
</head>
<body>
  <sys-card title="Hello HTML 轨" variant="elevated">
    <sys-vbox gap="0.75rem">
      <sys-text variant="headline">欢迎使用 HTML 轨</sys-text>
      <sys-text variant="body">
        这是用原生 HTML 写的插件页面。下方按钮通过 sys.* 桥接对象调用后端 API。
      </sys-text>
      <sys-hbox gap="0.5rem" align="center">
        <sys-button id="ping-btn" variant="filled" icon="bolt">发起请求</sys-button>
        <sys-text id="result" variant="caption">尚未请求</sys-text>
      </sys-hbox>
    </sys-vbox>
  </sys-card>
</body>
</html>
```

#### `ui/style.css`

```css
:host {
  display: block;
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
  font-family: inherit;
  color: var(--md-sys-color-on-surface, #1a1b20);
}

#result {
  min-height: 1.25rem;
}
```

#### `ui/main.js`

```javascript
// 沙箱会在脚本前自动注入：
//   const sys = window.__plugin_sys_<pageId>;
// 因此这里可直接使用 sys.* 桥接对象。

// 沙箱 Shadow DOM 内查询元素
const host = document.querySelector('.html-sandbox-host')
const root = host?.shadowRoot
const $ = (sel) => root?.querySelector(sel)

$('#ping-btn')?.addEventListener('click', async () => {
  const result = $('#result')
  if (result) result.textContent = '请求中...'
  try {
    // sys.request 自动注入 Token + 解包 BaseResponse.data
    const data = await sys.request('/my-plugin/ping')
    if (result) result.textContent = `响应：${JSON.stringify(data)}`
    sys.ui.toast('请求成功', 'success')
  } catch (e) {
    if (result) result.textContent = `失败：${e.message ?? e}`
  }
})

console.log('[my-plugin] 脚本初始化完成')
```

### 2. 在 `plugin.py` 中注册页面

```python
from src.app.plugin_system.base import BasePlugin, register_plugin
from src.app.plugin_system.api.service_api import get_service


@register_plugin
class MyPlugin(BasePlugin):
    plugin_name = "my_plugin"
    plugin_description = "示例 HTML 插件"
    plugin_version = "1.0.0"

    configs: list[type] = []
    dependent_components: list[str] = ["neo-mofox-webui:service:plugin_ui"]

    def get_components(self) -> list[type]:
        return []

    async def on_plugin_loaded(self) -> None:
        ui_service = get_service("neo-mofox-webui:service:plugin_ui")
        if ui_service is None:
            return

        await ui_service.register_ui_page(
            plugin_name="my_plugin",
            page_id="home",
            title="我的 HTML 页面",
            mode="html",
            icon="code",
            description="用 HTML 轨写的插件页面",
            order=100,
            assets={
                "entry_html": "ui/index.html",
                "styles": ["ui/style.css"],
                "scripts": ["ui/main.js"],
                "assets_dir": "ui/assets",   # 可选，仅当需要图片 / 字体等静态资源时声明
            },
        )

    async def on_plugin_unloaded(self) -> None:
        ui_service = get_service("neo-mofox-webui:service:plugin_ui")
        if ui_service is None:
            return
        await ui_service.unregister_plugin_pages("my_plugin")
```

注册完成后，刷新 WebUI 侧边栏即可看到你的页面。

## `assets` 资源声明

`mode="html"` 时 `assets` 字典必填，结构：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `entry_html` | `str` | 是 | 入口 HTML 文件相对路径，必须以 `.html` 结尾 |
| `styles` | `list[str]` | 否 | CSS 文件路径列表，按数组顺序加载（每个必须以 `.css` 结尾） |
| `scripts` | `list[str]` | 否 | JS 文件路径列表，按数组顺序加载（每个必须以 `.js` 结尾） |
| `assets_dir` | `str \| None` | 否 | 静态资源根目录；为空时不暴露任何静态资源 |

**所有路径以「插件根目录」为基准**，由系统通过 `plugin_name` 解析出插件根目录后再校验。

### 路径校验规则

- 必须为相对路径，**不得以 `/` 或 `\` 开头**
- 不得包含 `..` 段（防止路径穿越）
- 单文件大小上限 **5 MB**
- 允许的扩展名：

| 类别 | 扩展名 |
|------|--------|
| 网页 | `.html` `.css` `.js` |
| 图片 | `.png` `.jpg` `.jpeg` `.gif` `.webp` `.svg` `.ico` |
| 字体 | `.woff` `.woff2` `.ttf` `.otf` |

### 移动端资源

可为移动端单独提供一份资源，桌面端与移动端必须使用相同的 `mode`：

```python
await ui_service.register_ui_page(
    plugin_name="my_plugin",
    page_id="home",
    title="我的页面",
    mode="html",
    xml=None,                       # mode=html 时必须为 None
    assets={...},                   # 桌面端
    mobile_xml=None,
    mobile_assets={                 # 移动端（可选，空则 fallback 到桌面端）
        "entry_html": "ui/mobile/index.html",
        "styles": ["ui/mobile/style.css"],
        "scripts": ["ui/mobile/main.js"],
    },
)
```

## 沙箱环境

### Shadow DOM 隔离

- 每个页面挂载到 `<div class="html-sandbox-host">` 上，宿主 `attachShadow({ mode: 'open' })`
- 主站 CSS 不会影响 Shadow DOM 内部
- 插件 CSS 写在 `styles` 里，会被 `fetch` 取回并以 `<style>` 注入 Shadow DOM（**不是 `<link>`**，因为 `<link>` 不走 `window.fetch`，无法注入 Token）
- MD3 CSS 变量（`--md-sys-color-*`）从 `:root` **天然穿透** Shadow DOM，插件可直接用
- `@font-face` 声明也是全局的，但 `.material-symbols-rounded` 类样式不穿透 Shadow DOM —— 沙箱已自动在每个 `sys-*` 自定义元素的 shadow root 内重声明，**图标开箱可用**

### `:host` 入口

入口 HTML 不会带 `<html>` / `<body>` 标签原样进 Shadow DOM —— 沙箱取 HTML 内的所有非 `<script>` 节点直接 append 到 shadowRoot。`<script>` 会被捕获、按顺序在 `sys` 注入后执行。

样式里推荐用 `:host` 选择根容器：

```css
:host {
  display: block;
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}
```

### MD3 变量

主题色 / 间距 / 圆角等 MD3 设计令牌都通过 CSS 变量暴露，在 Shadow DOM 内可直接引用。常用变量：

| 变量 | 含义 |
|------|------|
| `--md-sys-color-primary` | 主色 |
| `--md-sys-color-on-primary` | 主色上的前景色 |
| `--md-sys-color-surface` | 表面色 |
| `--md-sys-color-on-surface` | 表面上的前景色 |
| `--md-sys-color-on-surface-variant` | 次级前景色 |
| `--md-sys-color-outline` / `--md-sys-color-outline-variant` | 边框色 |
| `--md-sys-color-error` | 错误色 |
| `--md-sys-color-surface-container-*` | 各级容器表面色（`low` / `high` / `highest`） |

### Motion 变量

`shared-motion.css` 中定义了 MD3 motion 时长与缓动曲线变量，可直接使用：

| 变量 | 说明 |
|------|------|
| `--md-sys-motion-duration-x-short` / `short` / `medium` / `long` | 时长 |
| `--md-sys-motion-standard` / `emphasized` / `decelerated` / `accelerated` / `linear` | 缓动函数 |

预设 keyframes：`sys-fade-in`、`sys-scale-in`、`sys-slide-down`、`sys-shake`、`sys-spin`、`sys-ripple`。

## `sys` 桥接对象

每个 HTML 沙箱实例对应一个独立的 `sys` 对象，挂在 `window.__plugin_sys_<pageId>` 上。沙箱在执行你的 `scripts` 之前会自动在每个脚本前注入：

```javascript
const sys = window.__plugin_sys_<pageId>;
```

所以你的脚本里直接用 `sys.*` 即可，无需手动取。

::: warning sys 是唯一通道
与系统的所有交互（变量池、API 调用、UI 反馈、路由、主题）都通过 `sys.*` 完成。裸 `window.fetch` 虽然也被代理（注入 Token），但**不做 BaseResponse 解包**，仅用于兼容第三方库。

要拿系统数据，请用 `sys.request` / `sys.api`，详见 [sys API](./sys-api)。
:::

完整 API 参考：[sys API](./sys-api)。这里列出主要能力：

| 命名空间 | 作用 |
|----------|------|
| `sys.vars` | page scope 变量池（响应式） |
| `sys.plugin` | plugin scope 变量池 |
| `sys.global` | global scope 变量池（只读） |
| `sys.api(id, params?)` | 调用预定义 API 模板（与 XML 轨 `<api>` 共用） |
| `sys.request(url, options?)` | fetch 风格的统一请求方法（注入 Token + 解包 BaseResponse） |
| `sys.bus` | page 级事件总线（`on` / `off` / `emit`） |
| `sys.ui` | UI 交互（`notify` / `toast` / `confirm` / `alert` / `dialog.open` / `dialog.close`） |
| `sys.theme` | 当前主题（`mode` / `primary`，只读） |
| `sys.route` | 路由（`current` / `back()` / `go(plugin, page)`） |
| `sys.format` | 格式化辅助（`date` / `number` / `currency`） |
| `sys.i18n` | 文案翻译（`t(key, params?)`） |

## 用 `sys-*` 组件构建 UI

HTML 轨与 XML 轨**共享同一套 `sys-*` 组件源**（`components/plugin-ui/sys-components/`）。在 XML 轨里它们以裸名出现（`vbox` / `card`），在 HTML 轨里因为受 Web Component 命名约束，**布局类一律加 `sys-` 前缀**：

| XML 轨 | HTML 轨 |
|--------|---------|
| `<vbox>` | `<sys-vbox>` |
| `<hbox>` | `<sys-hbox>` |
| `<grid>` | `<sys-grid>` |
| `<card>` | `<sys-card>` |
| `<tabs>` | `<sys-tabs>` |
| `<dialog>` | `<sys-dialog>` |
| `<divider>` | `<sys-divider>` |
| `<spacer>` | `<sys-spacer>` |
| `<sys-text>` 等 | `<sys-text>` （不变） |

完整属性表与用法见 [HTML 组件参考](./html-components)。

### 命令式 vs 声明式

HTML 轨是**命令式**：组件实例就是一个 DOM 元素，你可以 `querySelector` 取到它，直接读 / 写属性、监听事件、调方法：

```javascript
// 直接读 / 写组件属性
const input = root.querySelector('#task-input')
const title = input.value         // 取值（SysInput 实现了 .value 访问器）
input.value = ''                  // 清空

// 监听 change 事件
input.addEventListener('change', (e) => {
  console.log('值变化：', e.detail)  // SysInput 的 change 事件带 detail
})

// 给 sys-table 直接赋值数组
const table = root.querySelector('#task-table')
table.data = [
  { name: '任务1', status: 'done' },
  { name: '任务2', status: 'pending' },
]
table.columns = [
  { key: 'name', label: '名称' },
  { key: 'status', label: '状态' },
]

// 给 sys-chart 直接赋值对象
const chart = root.querySelector('#metrics-chart')
chart.type = 'line'
chart.data = { xAxis: ['Mon','Tue'], series: [{ name:'访问', data: [120, 200] }] }
```

::: tip .value 与 .getAttribute('value')
对 `sys-input` / `sys-textarea` / `sys-select`，HTML 自定义元素的 attribute 是字符串，用户输入不会回流到 attribute。WebUI 已在 SFC 内部把这些组件的 `.value` 访问器重定义为实时值，**始终用 `.value` 取用户输入**，不要用 `getAttribute('value')`。
:::

## fetch 代理

沙箱在加载资源前会重写 `window.fetch` 与 `XMLHttpRequest.prototype.send`：

- 所有出站请求自动注入 `Authorization: Bearer <token>` 与 `X-API-Key: <token>` 头
- 自动注入 `X-Plugin-Name: <plugin_name>` 头
- **不做 BaseResponse 解包** —— `fetch` 保持透传 `Response` 语义，方便第三方库工作
- 沙箱销毁时自动还原原始方法

要拿到解包后的业务数据，请用 `sys.request(url, options)` 或 `sys.api(id, params)` —— 详见 [sys API](./sys-api#sys-request-url-options)。

## 静态资源访问

声明了 `assets_dir` 后，里面的文件可通过 URL 访问，路径形如：

```
GET /webui/static/plugin-ui/{plugin_name}/{page_id}/{variant}/asset/{rel_path}
```

例如 `assets_dir: "ui/assets"` 下有 `logo.png`，可访问：

```
/webui/static/plugin-ui/my_plugin/home/desktop/asset/logo.png
```

::: tip 推荐：通过 `sys.request` 拿数据
插件内部资源（图片 / 字体）可直接用上述 URL 在 HTML / CSS 中引用（fetch 代理会带 Token）。但**业务数据请通过你自己的 Router 暴露 API**，前端用 `sys.request('/your-plugin/...')` 调用，不要直接读文件。
:::

## 完整示例

仓库自带的 `examples/demo_html_plugin/` 是一份完整可运行的 HTML 轨示例，覆盖：

- sys.vars 响应式变量池
- sys.request + sys-table 数据交互
- sys-chart 图表
- sys.ui 通知与对话框
- sys.bus 事件总线
- sys.theme / sys.format / sys.i18n / sys.global
- 自定义 `<sys-dialog>` 控制开关

阅读源码：

- `examples/demo_html_plugin/plugin.py` — 注册逻辑
- `examples/demo_html_plugin/assets/index.html` — 入口 HTML
- `examples/demo_html_plugin/assets/script.js` — 交互脚本
- `examples/demo_html_plugin/assets/styles.css` — 插件样式

## 调试技巧

- **打开浏览器控制台**：沙箱会输出 `[HtmlSandbox]`、`[sys]` 调试日志；插件自己的 `console.log` 也会出现在主控制台
- **取到 sys 对象**：在控制台执行 `window.__plugin_sys_<pageId>` 可手动检查当前页面的 sys 桥接对象
- **取到 Shadow DOM**：`document.querySelector('.html-sandbox-host').shadowRoot` 可手动查询元素
- **改了资源没生效**：HTML 资源带 `Cache-Control: max-age=300`，强刷一次或重启 Neo-MoFox
- **401 错误**：通常是 Token 失效，重新登录 WebUI；或检查 `assets_dir` 是否声明但路径不对
- **样式不生效**：检查是否用 `<link>` 引入了 CSS —— 沙箱**不会**用 `<link>`，需要把 CSS 写在 `assets.styles` 里，沙箱会 fetch 后注入 `<style>`

## 常见坑

1. **布局类标签没加 `sys-` 前缀** — HTML 自定义元素名必须含连字符，`<vbox>` 会被忽略或报 `SyntaxError`。必须写 `<sys-vbox>`。
2. **用 `getAttribute('value')` 取输入值** — 永远是 attribute 的初始字符串，不是用户当前输入。改用 `.value`。
3. **CSS 用 `<link>` 引入** — `<link>` 不走 `window.fetch`，无法带 Token，会被后端 `401`。把 CSS 写进 `assets.styles` 数组。
4. **直接 `import` 主站代码** — 沙箱与主站运行在不同上下文，主站模块不可见。需要的能力都通过 `sys.*` 暴露。
5. **`<script>` 写在 `<head>` 里** — 沙箱会把所有 `<script>` 捕获并按文档顺序执行，但执行时机是在 `sys` 注入之后。所有脚本里都可直接用 `sys`。
6. **路径以 `/` 开头** — `assets` 里的所有路径必须是相对路径（以插件根目录为基准），写 `/ui/index.html` 会被拒。
7. **`assets_dir` 未声明却访问资源** — `assets_dir` 为空时，`/asset/...` 端点会返回 `404 assets_dir not declared`。
8. **第三方接口返回非 BaseResponse** — `sys.request` 默认按 `BaseResponse` 解包，第三方接口若返回其他结构会报错。这种情况请用裸 `fetch(url)`（fetch 代理只注入头不解包），或用 axios 自行处理。

## 下一步

- [HTML 组件参考](./html-components) — 所有 `sys-*` 自定义元素的属性、事件、命令式用法
- [sys API](./sys-api) — `sys` 桥接对象的完整 API 参考
- [XML 入门](./xml) — 对比 XML 轨的声明式写法
