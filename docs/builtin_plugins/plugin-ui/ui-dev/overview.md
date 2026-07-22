# 总览

Plugin UI 开发指南带你从零开始，为你的插件编写自定义 WebUI 管理页面。

## 这份指南会教你什么

- 理解 Plugin UI 的渲染模型（XML 轨 / HTML 轨）
- 通过后端 Service 注册一个插件页面
- XML 轨：用声明式 XML 描述界面布局、变量绑定与事件管道
- HTML 轨：用原生 HTML/CSS/JS 在 Shadow DOM 沙箱里写自定义页面，通过 `sys` 桥接对象调系统接口
- 调用后端 API 并把结果回写变量池
- 处理移动端适配与条件渲染

## 阅读顺序

1. 本页（总览）— 了解整体架构与核心概念
2. [XML 入门](./xml) — XML 轨语法、语法糖、管道指令、API 模板、表达式、移动端适配
3. [XML 组件参考](./xml-components) — XML 轨所有内置组件的属性与用法
4. [HTML 开发](./html) — HTML 轨资源结构、Shadow DOM 沙箱、sys 桥接对象注入
5. [HTML 组件参考](./html-components) — HTML 轨 `sys-*` 自定义元素的命令式用法
6. [HTML sys API](./html-sys-api) — `sys` 桥接对象的完整 API 参考

## 核心架构

```
插件后端 (Python)                    WebUI 前端 (Vue)
┌─────────────────┐                ┌──────────────────────┐
│  PluginUIService │──register──→  │  PluginUIManager     │
│  register_ui_page│               │  (注册表管理)         │
│  unregister_...  │               │                      │
└─────────────────┘                │  XmlRenderer         │
                                    │  (XML → VNode 渲染)  │
                                    │                      │
                                    │  PipeExecutor        │
                                    │  (管道指令执行)       │
                                    │                      │
                                    │  ApiTemplateEngine   │
                                    │  (API 模板引擎)      │
                                    └──────────────────────┘
```

### 数据流

1. **注册阶段**：插件通过 `PluginUIService.register_ui_page()` 注册页面，传入 XML 字符串或 HTML 资源声明
2. **渲染阶段**：前端 `XmlRenderer` 解析 XML，将标签映射为 Vue 组件，处理变量绑定和事件管道
3. **交互阶段**：用户操作触发管道指令（如 `on-click="api: save() | notify: '已保存'"`），由 `PipeExecutor` 顺序执行

## 渲染模式

| 模式 | 说明 | 适用场景 |
|------|------|----------|
| **XML 模式** | 使用声明式 XML 描述界面，由 WebUI 内置渲染引擎解析为 Vue 组件树 | 表单、配置页、数据展示等标准管理界面 |
| **HTML 模式** | 插件自行提供 HTML/CSS/JS 资源，WebUI 以 Shadow DOM 沙箱加载，注入 `sys` 桥接对象 | 需要完全自定义 UI 的复杂场景、需要第三方 JS 库 |

对于大多数插件，**XML 模式**即可满足需求——你只需在后端 Service 调用中传入一段 XML 字符串，WebUI 就能自动渲染出 Material Design 3 风格的交互界面。

## 后端服务入口

Plugin UI 的后端入口是 `PluginUIService`，签名为 `neo-mofox-webui:service:plugin_ui`。其他插件通过 Service API 获取该服务实例。

```python
from src.app.plugin_system.api.service_api import get_service

ui_service = await get_service("neo-mofox-webui:service:plugin_ui")
```

::: warning
`get_service()` 每次调用都会创建新的 Service 实例。建议在 `on_plugin_loaded` 中获取一次并缓存引用，或在每次需要时重新获取。
:::

## 前提条件

在开始之前，请确保：

- 已有可运行的 Neo-MoFox 插件项目
- 插件已正确配置 `manifest.json` 和 `plugin.py`
- 插件中已声明对 `neo-mofox-webui:service:plugin_ui` 的依赖

### 声明服务依赖

在 `manifest.json` 的 `dependencies.components` 中添加 WebUI 的 Plugin UI 服务签名：

```json
{
  "dependencies": {
    "plugins": ["neo-mofox-webui"],
    "components": ["neo-mofox-webui:service:plugin_ui"]
  }
}
```

并在插件类的 `dependent_components` 同步声明：

```python
dependent_components: list[str] = ["neo-mofox-webui:service:plugin_ui"]
```

::: warning
不写这两处依赖，`get_service("neo-mofox-webui:service:plugin_ui")` 会拿不到东西。
:::

## 下一步

- [XML 入门](./xml) — 开始编写你的第一个 XML 页面
- [XML 组件参考](./xml-components) — 查阅所有可用 XML 组件
- [HTML 开发](./html) — 用原生 HTML/CSS/JS 写自定义页面
- [HTML 组件参考](./html-components) — `sys-*` 自定义元素的命令式用法
- [HTML sys API](./html-sys-api) — `sys` 桥接对象完整 API
