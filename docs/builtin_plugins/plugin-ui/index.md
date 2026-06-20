# Plugin UI — 插件自定义界面系统

Plugin UI 是 Neo-MoFox-WebUI 提供的插件界面扩展子系统，允许任何 Neo-MoFox 插件在 WebUI 中注册自己的管理页面，无需编写任何前端代码。

## 概述

Plugin UI 系统提供两种渲染模式：

| 模式 | 说明 | 适用场景 |
|------|------|----------|
| **XML 模式** | 使用声明式 XML 描述界面，由 WebUI 内置渲染引擎解析为 Vue 组件树 | 表单、配置页、数据展示等标准管理界面 |
| **HTML 模式** | 插件自行提供 HTML/CSS/JS 资源，WebUI 以 iframe 方式加载 | 需要完全自定义 UI 的复杂场景 |

对于大多数插件，**XML 模式**即可满足需求——你只需在后端 Service 调用中传入一段 XML 字符串，WebUI 就能自动渲染出 Material Design 3 风格的交互界面。

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

## 文档导航

| 文档 | 说明 |
|------|------|
| [快速入门](./quick-start) | 5 分钟创建你的第一个插件 UI 页面 |
| [代码指南](./code-guide) | 后端 API 详解、XML 语法参考、管道指令、表达式与占位符 |
| [组件参考](./components) | 所有内置 XML 组件的属性、用法和示例 |

## 关键概念

### XML 轨渲染流程

XML 轨是 Plugin UI 的核心渲染方式。一段典型的 XML 页面结构如下：

```xml
<page>
  <definitions>
    <var name="username" default="''" />
    <api id="getUser" method="GET" url="/api/user" response-to="user_data" auto-fetch="true" />
  </definitions>

  <card title="用户信息">
    <sys-input label="用户名" bind:value="username" />
    <sys-button on-click="api: saveUser(name={username}) | notify: '保存成功'">
      保存
    </sys-button>
  </card>
</page>
```

- `<definitions>` 段声明变量和 API 模板，在渲染前预处理
- `<page>` 根元素下的内容被渲染为 Vue 组件树
- `bind:value="username"` 实现变量池双向绑定
- `on-click="..."` 绑定管道指令，按 `|` 分隔顺序执行

### 变量池

每个页面拥有独立的变量池（`PluginUIVarStore`），基于 Vue `reactive` 对象实现。变量可通过以下方式读写：

- **声明**：`<var name="key" default="value" />`
- **读取**：属性中使用 `{key}` 占位符
- **写入**：`bind:prop="key"` 双向绑定，或管道指令 `set: key=value`
- **API 状态**：`api.<id>.pending`、`api.<id>.error`、`api.<id>.last_response`

### 管道指令

管道指令是 XML 轨的核心交互机制，格式为：

```
指令名: 参数 | 指令名: 参数 | ...
```

内置指令包括：`set`、`api`、`notify`、`confirm`、`navigate`、`open-dialog`、`close-dialog`、`refresh`、`reset`、`emit`。

详见 [代码指南 - 管道指令](./code-guide#管道指令)。

### API 模板

在 `<definitions>` 中声明 API 模板，可在管道指令中通过 `api: templateId` 调用。支持自动请求、响应映射、原始响应模式等。

详见 [代码指南 - API 模板](./code-guide#api-模板)。
