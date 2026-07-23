# XML 入门

本文是 XML 轨的入门指南：从注册页面、最小示例到完整语法、语法糖、API 模板与示范。XML 轨用一段声明式 XML 描述界面，由 WebUI 内置渲染引擎解析为 Vue 组件树，配合管道指令编排交互，无需写 JS 即可完成表单、列表、配置页等标准管理界面。

完整组件属性表见 [XML 组件参考](./xml-components)；HTML 轨（命令式）见 [HTML 开发](./html)。

## XML 轨是什么

XML 轨的渲染流程：

1. **注册阶段**：插件后端调 `PluginUIService.register_ui_page(mode="xml", xml=...)`，传入一段 XML 字符串
2. **渲染阶段**：前端 `XmlRenderer` 解析 XML，把标签映射为 Vue 组件，处理变量绑定与事件管道
3. **交互阶段**：用户操作触发管道指令（如 `on-click="api: save() | notify: '已保存'"`），由 `PipeExecutor` 顺序执行

适用场景：表单、配置页、数据展示、列表管理等标准管理界面。需要 Canvas / WebGL / 第三方 JS 库时请改用 [HTML 轨](./html)。

## 快速开始

### 最小可运行页面

```xml
<?xml version="1.0" encoding="UTF-8"?>
<page version="3.1" xmlns:bind="urn:neo-mofox:bind">
  <definitions>
    <var name="greeting" default="'你好，世界！'" />
    <var name="count" default="0" />
    <api id="ping" method="GET" url="/api/health" response-to="health_data" />
  </definitions>

  <layout>
    <card title="我的第一个插件页面">
      <sys-text>{greeting}</sys-text>
      <hbox>
        <sys-button on-click="set: count={count + 1}" variant="filled">
          点击计数: {count}
        </sys-button>
        <sys-button on-click="api: ping | notify: '请求已发送'" variant="outlined">
          测试请求
        </sys-button>
      </hbox>
    </card>
  </layout>
</page>
```

### 在插件中注册页面

在插件的 `on_plugin_loaded` 生命周期中注册，`on_plugin_unloaded` 中卸载：

```python
from src.app.plugin_system.base import BasePlugin, register_plugin
from src.app.plugin_system.api.service_api import get_service


XML_CONTENT = """<?xml version="1.0" encoding="UTF-8"?>
<page xmlns:bind="urn:neo-mofox:bind">
  <card title="Hello"><sys-text>Hello XML 轨</sys-text></card>
</page>
"""


@register_plugin
class MyPlugin(BasePlugin):
    plugin_name = "my_plugin"
    plugin_description = "示例插件"
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
            page_id="main",
            title="我的插件",
            mode="xml",
            icon="extension",
            description="我的第一个插件 UI 页面",
            order=100,
            xml=XML_CONTENT,
        )

    async def on_plugin_unloaded(self) -> None:
        ui_service = get_service("neo-mofox-webui:service:plugin_ui")
        if ui_service is None:
            return
        await ui_service.unregister_plugin_pages("my_plugin")
```

::: warning 前提：声明依赖
必须在 `manifest.json` 的 `dependencies.components` 和插件类的 `dependent_components` 同时声明 `neo-mofox-webui:service:plugin_ui`，否则 `get_service` 拿不到东西。详见 [总览](./overview#前提条件)。
:::

注册完成后刷新 WebUI 侧边栏即可看到你的页面。

### 注册 API 速查

| 方法 | 签名 | 说明 |
|------|------|------|
| `register_ui_page` | `register_ui_page(*, plugin_name, page_id, title, mode, icon=None, description=None, order=100, xml=None, assets=None, mobile_xml=None, mobile_assets=None)` | 注册页面；同 `plugin_name+page_id` 视为更新 |
| `unregister_ui_page` | `unregister_ui_page(plugin_name, page_id) -> bool` | 卸载单个页面；不存在返回 `False`（幂等） |
| `unregister_plugin_pages` | `unregister_plugin_pages(plugin_name) -> int` | 批量卸载该插件所有页面 |
| `list_pages` | `list_pages(*, plugin_filter=None) -> list[PageSummary]` | 列出已注册页面 |

**`page_id` 规则**：必须匹配 `^[a-z][a-z0-9_-]{0,63}$`（小写字母开头，长度 1–64）。

**mode 与字段一致性**：

| mode | 必填 | 必须为 `None` |
|------|------|----------------|
| `"xml"` | `xml` | `assets`、`mobile_assets` |
| `"html"` | `assets` | `xml`、`mobile_xml` |

**可能抛出的异常**：

| 异常 | 触发条件 |
|------|----------|
| `ValueError` | 参数格式不合法 / mode 与字段不一致 |
| `XMLValidationError` | XML 内容校验失败 |
| `AssetPathError` | 路径穿越或不合法 |
| `AssetMissingError` | 引用的文件不存在 |
| `AssetSizeError` | 文件超过 5 MB |

## 文档结构

XML 页面根元素必须是 `<page>`，内部分两段：声明段 `<definitions>` 与可见 UI 段（`<layout>` 透传容器或直接的子组件）。

```xml
<page version="3.1" xmlns:bind="urn:neo-mofox:bind">
  <definitions>
    <!-- 变量 / API / 子模板声明，不渲染 -->
  </definitions>

  <card title="可见 UI">
    <!-- 这里写页面真正显示的内容 -->
  </card>
</page>
```

::: tip xmlns:bind 命名空间
`xmlns:bind="urn:neo-mofox:bind"` 是为了写 `bind:value="x"` 时让 XML 解析器不报错。**强烈建议在 `<page>` 上加上**，否则 `bind:` 双向绑定会被解析器当作未知属性而失效。
:::

### definitions 声明段

`<definitions>` 在渲染前被预处理，不会渲染为可见 UI。可包含三类子元素：

#### var — 变量声明

```xml
<var name="变量名" default="默认值" />
```

| 属性 | 必填 | 说明 |
|------|------|------|
| `name` | 是 | 变量名，支持点路径如 `form.name` |
| `default` | 否 | 默认值 |

默认值解析规则（按优先级）：

| 输入 | 解析结果 |
|------|----------|
| `0`、`true`、`false`、`[]`、`{...}` 等 | 走 `JSON.parse` 得到对应类型 |
| `'字符串'`（单引号包裹） | 字符串字面量 |
| 其他 | 当作字符串字面量 |

```xml
<var name="count" default="0" />           <!-- 数字 0 -->
<var name="enabled" default="true" />      <!-- 布尔 true -->
<var name="items" default="[]" />          <!-- 空数组 -->
<var name="config" default='{"a":1}' />    <!-- 对象 -->
<var name="username" default="'匿名用户'" /><!-- 字符串 '匿名用户' -->
```

::: tip 变量只在首次写入默认值
变量仅在变量池中不存在时写入默认值，**不会覆盖用户已修改的值**。重新进入页面时变量保留上次状态。
:::

#### api — API 模板声明

详见 [API 模板](#api-模板)。

#### template — 子模板声明

```xml
<template id="userCard">
  <card title="{user.name}">
    <sys-text>{user.email}</sys-text>
  </card>
</template>
```

子模板存储在渲染上下文中，当前版本为预留功能。

### layout 透传容器

`<layout>` 标签**本身不渲染**，其子节点会被直接提升到父级：

```xml
<page>
  <layout>
    <card title="卡片1" />
    <card title="卡片2" />
  </layout>
</page>

<!-- 等价于 -->
<page>
  <card title="卡片1" />
  <card title="卡片2" />
</page>
```

## 属性与绑定（语法糖）

XML 轨提供一组语法糖，让声明式 XML 既能描述静态布局，又能做数据双向绑定与事件编排。

### 静态属性

```xml
<sys-button variant="filled">提交</sys-button>
<sys-text variant="caption">说明文字</sys-text>
```

### 占位符 `{...}` — 动态求值

属性值或文本节点中用 `{expression}` 插入动态值。当属性值整体是 `{expr}` 时，保留求值结果的**原始类型**（对象、数组、布尔），可以直接传给组件 prop：

```xml
<sys-text>你好，{username}</sys-text>
<sys-text>{count} 条记录</sys-text>
<sys-input label="计数: {count}" />
<sys-table data="{users}" columns="{cols}" />   <!-- users 直接以数组传入 -->
```

详细求值规则见 [占位符表达式](#占位符表达式)。

::: warning sys-text 没有 value 属性
`sys-text` 通过**默认插槽**显示文本，不要写 `<sys-text value="...">`，要写 `<sys-text>...</sys-text>`。详见 [XML 组件参考 · sys-text](./xml-components#sys-text)。
:::

### 双向绑定 `bind:prop`

用 `bind:prop="varPath"` 把组件 prop 与变量池双向绑定：

- **读方向**：从变量池取值传入组件 prop
- **写方向**：组件 `change` 事件时自动写回变量池

```xml
<sys-input label="用户名" bind:value="username" />
<sys-switch label="启用" bind:value="enabled" />
<sys-slider label="音量" bind:value="volume" min="0" max="100" />
```

::: tip bind 与 on-change 的顺序
同时使用 `bind:value` 和 `on-change` 时，**先写回变量池，再执行管道指令**。
:::

### 事件 `on-*`

事件属性形如 `on-click="..."`、`on-change="..."`，kebab-case 自动转 camelCase（`on-click` → `onClick`）。值是一段 [管道指令](#管道指令)：

```xml
<sys-button on-click="api: save() | notify: '已保存'">保存</sys-button>
```

### 通用条件属性

`hidden` 与 `disabled` 可应用于任何组件，值为布尔表达式：

```xml
<sys-button hidden="{!is_admin}">管理员操作</sys-button>
<sys-button disabled="{api.saveUser.pending}">保存中...</sys-button>
<sys-input disabled="{!editable}" />
```

- `hidden` 求值为 `true` 时元素**不渲染**（DOM 中也不存在）
- `disabled` 求值为 `true` 时元素禁用

支持占位符格式或直接表达式：`hidden="true"`、`hidden="{!form_valid}"` 均可。

### 设备定向 `mobile-only` / `desktop-only`

在同一份 XML 中按设备控制元素显示：

```xml
<sys-text mobile-only>仅在移动端显示</sys-text>
<sys-text desktop-only>仅在桌面端显示</sys-text>

<hbox desktop-only>
  <sys-text>桌面端横排布局</sys-text>
</hbox>
<vbox mobile-only>
  <sys-text>移动端竖排布局</sys-text>
</vbox>
```

不需要值，presence 即视为 `true`。详见 [移动端适配](#移动端适配)。

## 占位符表达式

### 求值器

占位符中的表达式由一个**安全的 AST 解释器**执行，不使用 `eval` / `new Function`，禁用 `new`、`function`、`eval`、`import` 等关键字。

支持的操作：

| 类型 | 语法 | 示例 |
|------|------|------|
| 标识符 / 点路径 | `user.name` | `{user.name}` |
| 取反 | `!expr` | `{!is_admin}` |
| 比较运算 | `> < >= <= == !=` | `{count > 5}` |
| 逻辑运算 | `&& \|\|` | `{a && b}` |
| 算术运算 | `+ - * / %` | `{price * count}` |
| 字面量 | 数字、字符串、布尔、null | `{42}`, `{'hello'}`, `{true}`, `{null}` |
| 内置函数 | `empty()` / `len()` / `keys()` / `values()` | `{len(items)}`, `{empty(name)}` |
| 属性访问器 | `.length`, `.keys` | `{list.length}` |
| 数组索引 | `[0]` | `{items[0]}` |

### 内置函数

| 函数 | 说明 | 示例 |
|------|------|------|
| `empty(x)` | 判断是否为空（`null` / `undefined` / 空字符串 / 空数组） | `{empty(username)}` |
| `len(x)` | 数组长度或对象键数 | `{len(items) > 0}` |
| `keys(x)` | 对象的键数组 | `{keys(config)}` |
| `values(x)` | 对象的值数组 | `{values(config)}` |

### 逻辑或默认值 `||`

`||` 运算符提供默认值，左侧为 `null` / `undefined` / 空字符串 / `0` 时用右侧：

```xml
<sys-text>{username || '匿名用户'}</sys-text>
<sys-text>{users?.length || 0}</sys-text>
```

### 花括号嵌套与转义

- 花括号嵌套通过深度计数处理，`{obj.arr[0]}` 不会误断
- 文本里想要字面 `{`、`}` 时用 `\{` 和 `\}` 转义
- XML 里 `<` 和 `>` 必须转义为 `&lt;` 和 `&gt;`：

```xml
<sys-text hidden="{counter &lt;= 5}">超过 5 才显示</sys-text>
```

## 管道指令

管道指令是 XML 轨的核心交互机制，用一段字符串描述"用户操作后要做什么"。

### 格式

```
指令名: 参数 | 指令名: 参数 | ...
```

- 以 ` | ` 为分隔符，按顺序执行
- 引号内的 `|` 不会被分割
- 任意节点抛出异常则中断后续节点

```xml
on-click="api: saveUser | notify: '保存成功', success | set: form={}"
```

### 内置指令一览

#### set — 设置变量

```
set: path=value
```

值的解析优先级：引号字符串 > 布尔 / 空值字面量 > 数字字面量 > 占位符表达式 > 混合字符串。

```xml
on-click="set: username='张三'"
on-click="set: count={count + 1}"
on-click="set: form_valid=true"
```

#### api — 调用 API 模板

```
api: templateId
api: templateId(key1=val1, key2=val2)
```

```xml
on-click="api: saveUser"
on-click="api: saveUser(name={username}, email={email})"
```

API 执行失败会抛出异常并中断后续管道。

#### notify — 显示通知

```
notify: '消息内容'
notify: '消息内容', level
```

`level` 可选值：`info`、`success`、`warning`、`error`，默认 `info`。

```xml
on-click="notify: '操作成功'"
on-click="notify: '保存失败', error"
```

#### confirm — 确认对话框

```
confirm: '确认消息'
```

用户取消时抛出异常，中断后续管道。

```xml
on-click="confirm: '确定要删除吗？' | api: deleteItem | notify: '已删除', success"
```

#### navigate — 页面跳转

```
navigate: /path
navigate: plugin:page
```

`plugin:page` 格式可跳转到其他插件的 UI 页面：

```xml
on-click="navigate: /dashboard"
on-click="navigate: my_plugin:settings"
```

#### open-dialog / close-dialog — 对话框控制

```
open-dialog: dialogId
close-dialog: dialogId
```

通过变量池 `__dialog_<id>_open` 控制对话框开关，需配合 `<dialog id="...">` 组件使用：

```xml
<dialog id="confirmDlg" title="确认操作">
  <sys-text>确定要执行此操作吗？</sys-text>
</dialog>

<sys-button on-click="open-dialog: confirmDlg">打开对话框</sys-button>
<sys-button on-click="close-dialog: confirmDlg">关闭</sys-button>
```

#### refresh — 刷新组件

```
refresh: componentId
```

触发指定组件的刷新回调。组件需通过 `id` 属性注册到刷新注册表：

```xml
<sys-table id="usersTable" data="{users}" />
<sys-button on-click="api: reloadData | refresh: usersTable">刷新</sys-button>
```

#### reset — 重置变量

```
reset: path
reset: path=defaultValue
```

```xml
on-click="reset: form"
on-click="reset: count=0"
```

#### emit — 触发事件

```
emit: eventName
emit: eventName, payload
```

向页面级事件总线发送事件：

```xml
on-click="emit: dataUpdated"
on-click="emit: itemSelected, {selected_id}"
```

### 经典组合

```xml
<!-- 计数器自增 -->
<sys-button on-click="set: counter={counter + 1}">+1</sys-button>

<!-- 调接口 + 通知 + 清空表单 -->
<sys-button on-click="api: addItem | notify: '添加成功', success | set: username=''">
  提交
</sys-button>

<!-- 危险操作：先确认再调接口 -->
<sys-button on-click="confirm: '确定删除？' | api: deleteItem | notify: '已删除'">
  删除
</sys-button>
```

::: warning 异常即中断
任何一段管道抛错（包括 `confirm` 用户取消），后续指令都会被中断。要在错误后继续执行，请用两段独立的 `on-click`。
:::

## API 模板

API 模板在 `<definitions>` 中声明，定义 HTTP 请求配置，可在管道指令中通过 `api: id` 调用，与 HTML 轨 `sys.api(id)` 共用。

### 声明语法

```xml
<api id="模板ID"
     method="GET|POST|PUT|PATCH|DELETE"
     url="请求URL（可含占位符）"
     body="请求体模板（可含占位符，仅 POST/PUT/PATCH）"
     headers='{"Content-Type": "application/json"}'
     response-to="变量池路径"
     auto-fetch="true|false"
     raw-response="true|false" />
```

### 属性说明

| 属性 | 必填 | 说明 |
|------|------|------|
| `id` | 是 | 唯一标识，用于管道指令引用 |
| `method` | 是 | HTTP 方法 |
| `url` | 是 | 请求 URL，支持占位符 |
| `body` | 否 | 请求体 JSON 模板，支持占位符 |
| `headers` | 否 | 请求头 JSON |
| `response-to` | 否 | 响应数据写入变量池的路径 |
| `auto-fetch` | 否 | 页面加载时自动执行，默认 `false` |
| `raw-response` | 否 | 跳过 BaseResponse 拦截器，直接使用原始响应 |

### 自动状态变量

每个 API 模板注册后，变量池中自动创建以下状态变量：

| 变量路径 | 说明 |
|----------|------|
| `api.<id>.pending` | 请求是否进行中（布尔值） |
| `api.<id>.error` | 最近一次错误信息（字符串或 null） |
| `api.<id>.last_response` | 最近一次响应数据 |

常用于按钮 loading 与错误提示：

```xml
<sys-button loading="{api.getItems.pending}" on-click="api: getItems">
  刷新
</sys-button>

<sys-text variant="caption" color="error" hidden="{!api.getItems.error}">
  请求出错：{api.getItems.error}
</sys-text>
```

### 示例

#### GET 请求 + 自动加载

```xml
<api id="loadUsers" method="GET" url="/api/users"
     response-to="users" auto-fetch="true" />
```

页面加载时自动请求，响应数据写入 `users` 变量。

#### POST 请求 + 占位符参数

```xml
<api id="saveUser" method="POST" url="/api/users"
     body='{"name": "{username}", "email": "{email}"}'
     response-to="save_result" />
```

调用时 `username` 和 `email` 从变量池动态取值。

#### 原始响应模式

```xml
<api id="weather" method="GET" url="https://api.example.com/weather"
     raw-response="true" response-to="weather_data" />
```

跳过 BaseResponse 拦截器，直接将完整响应写入 `weather_data`，之后可通过 `{weather_data.temperature}` 访问字段。

## 移动端适配

Plugin UI 支持为移动端提供独立布局。两种方式可组合使用。

### 方式一：注册时指定移动端 XML

```python
await ui_service.register_ui_page(
    plugin_name="my_plugin",
    page_id="settings",
    title="设置",
    mode="xml",
    xml=desktop_xml,
    mobile_xml=mobile_xml,
)
```

`mobile_xml` 为空时移动端自动 fallback 到桌面端 XML。

### 方式二：mobile-only / desktop-only 属性

在同一份 XML 中按设备控制元素显示，见 [设备定向](#设备定向-mobile-only-desktop-only)。

## 常用组件速览

XML 轨内置 25 个 Material Design 3 风格组件。下面是按分类的速览，**完整属性、事件、用法见 [XML 组件参考](./xml-components)**。

### 布局组件

| 标签 | 用途 | 一行示例 |
|------|------|----------|
| `vbox` | 垂直布局容器 | `<vbox gap="1rem"><sys-text>...</sys-text></vbox>` |
| `hbox` | 水平布局容器 | `<hbox gap="8px"><sys-button>...</sys-button></hbox>` |
| `grid` | 网格布局容器 | `<grid columns="3" gap="16px">...</grid>` |
| `card` | 卡片容器 | `<card title="用户信息" variant="elevated">...</card>` |
| `tabs` | 标签页容器 | `<tabs default-tab="0"><card label="基本">...</card></tabs>` |
| `dialog` | 模态对话框 | `<dialog id="dlg" title="确认">...</dialog>` |
| `divider` | 分割线 | `<divider direction="vertical" variant="dashed" />` |
| `spacer` | 弹性间距 | `<hbox>...<spacer /><sys-button>...</sys-button></hbox>` |

### 基础组件

| 标签 | 用途 | 一行示例 |
|------|------|----------|
| `sys-text` | 文本显示 | `<sys-text variant="headline">{title}</sys-text>` |
| `sys-input` | 单行输入 | `<sys-input label="用户名" bind:value="username" />` |
| `sys-textarea` | 多行输入 | `<sys-textarea label="描述" bind:value="desc" rows="4" />` |
| `sys-select` | 下拉选择 | `<sys-select bind:value="lang"><option value="zh">中文</option></sys-select>` |
| `sys-switch` | 开关 | `<sys-switch label="启用" bind:value="enabled" />` |
| `sys-slider` | 滑块 | `<sys-slider label="音量" bind:value="volume" min="0" max="100" />` |
| `sys-date-picker` | 日期选择 | `<sys-date-picker label="生日" bind:value="birthday" />` |
| `sys-button` | 按钮 | `<sys-button variant="filled" on-click="...">保存</sys-button>` |
| `sys-icon-button` | 图标按钮 | `<sys-icon-button icon="delete" on-click="..." />` |
| `sys-icon` | 图标 | `<sys-icon name="settings" size="24px" />` |
| `sys-tag` | 标签 | `<sys-tag variant="primary">置顶</sys-tag>` |
| `sys-badge` | 徽章 | `<sys-badge value="3"><sys-icon name="mail" /></sys-badge>` |

### 高级组件

| 标签 | 用途 | 一行示例 |
|------|------|----------|
| `sys-table` | 数据表格 | `<sys-table data="{users}" columns='[{...}]' striped="true" />` |
| `sys-chart` | ECharts 图表 | `<sys-chart type="line" data="{chart_data}" />` |
| `sys-form` | 表单容器 | `<sys-form gap="1rem" on-submit="...">...</sys-form>` |
| `sys-list` | 列表 | `<sys-list data="{items}" divider="true" />` |

::: tip 通用属性
所有组件都支持 `hidden`、`disabled`、`mobile-only`、`desktop-only`、`bind:prop`、`on-*` 等通用属性，详见 [XML 组件参考 · 通用属性](./xml-components#通用属性)。
:::

## 示范

### 表单 + API 提交

```xml
<page xmlns:bind="urn:neo-mofox:bind">
  <definitions>
    <var name="username" default="''" />
    <var name="email" default="''" />
    <api id="saveUser" method="POST" url="/api/users"
         body='{"name": "{username}", "email": "{email}"}' />
  </definitions>

  <card title="用户信息">
    <vbox>
      <sys-input label="用户名" bind:value="username" placeholder="请输入用户名" />
      <sys-input label="邮箱" bind:value="email" type="email" placeholder="请输入邮箱" />
      <sys-button on-click="api: saveUser | notify: '保存成功', success"
                  loading="{api.saveUser.pending}"
                  disabled="{!username || !email}"
                  variant="filled">
        保存
      </sys-button>
    </vbox>
  </card>
</page>
```

### 列表 + 条件显示

```xml
<page xmlns:bind="urn:neo-mofox:bind">
  <definitions>
    <var name="is_admin" default="false" />
    <var name="items" default="[]" />
    <api id="loadItems" method="GET" url="/api/items" response-to="items" auto-fetch="true" />
  </definitions>

  <card title="项目列表">
    <sys-table data="{items}"
               columns='[{"key":"name","label":"名称"},{"key":"status","label":"状态"}]'
               striped="true"
               page-size="10" />
    <sys-button hidden="{!is_admin}" on-click="api: addItem" variant="filled">
      添加项目
    </sys-button>
    <sys-text hidden="{len(items) > 0}" variant="caption">暂无数据</sys-text>
  </card>
</page>
```

### 对话框确认

```xml
<page xmlns:bind="urn:neo-mofox:bind">
  <definitions>
    <api id="deleteItem" method="DELETE" url="/api/items/{selected_id}" />
  </definitions>

  <card title="危险操作">
    <sys-button on-click="confirm: '确定要删除吗？' | api: deleteItem | notify: '已删除', success"
                variant="filled">
      删除
    </sys-button>
  </card>

  <dialog id="tip" title="提示">
    <sys-text>操作完成</sys-text>
    <template #footer>
      <sys-button variant="filled" on-click="close-dialog: tip">知道了</sys-button>
    </template>
  </dialog>
</page>
```

### 完整示例

```xml
<?xml version="1.0" encoding="UTF-8"?>
<page version="3.1" xmlns:bind="urn:neo-mofox:bind">
  <definitions>
    <var name="username" default="''" />
    <var name="email" default="''" />
    <var name="notifications" default="true" />
    <var name="users" default="[]" />
    <var name="active_tab" default="0" />
    <api id="loadUsers" method="GET" url="/api/users" response-to="users" auto-fetch="true" />
    <api id="saveProfile" method="POST" url="/api/profile"
         body='{"name": "{username}", "email": "{email}", "notifications": {notifications}}' />
  </definitions>

  <card title="个人资料" variant="elevated">
    <vbox gap="0.75rem">
      <sys-input label="用户名" bind:value="username" placeholder="请输入用户名" />
      <sys-input label="邮箱" bind:value="email" type="email" placeholder="请输入邮箱" />
      <sys-switch label="启用通知" bind:value="notifications" />
      <hbox>
        <sys-button variant="filled"
                    on-click="api: saveProfile | notify: '保存成功', success"
                    loading="{api.saveProfile.pending}"
                    disabled="{!username || !email}">
          保存
        </sys-button>
        <sys-button variant="outlined" on-click="api: loadUsers | notify: '已刷新'">
          刷新列表
        </sys-button>
      </hbox>
    </vbox>
  </card>

  <card title="用户列表" variant="outlined">
    <sys-table data="{users}"
               columns='[{"key":"name","label":"姓名"},{"key":"email","label":"邮箱"}]'
               striped="true"
               page-size="10" />
    <sys-text hidden="{len(users) > 0}" variant="caption">暂无用户数据</sys-text>
  </card>
</page>
```

## 调试技巧

- **打开浏览器控制台**：渲染器会输出大量 `[XmlRenderer]`、`[PipeExecutor]`、`[ApiTemplateEngine]` 调试日志
- **未知组件保护**：写错标签名时页面会显示红色虚线框 `未知组件: <xxx>`，不会整页崩
- **XML 解析错误**：注册时会先用 XSD 校验 XML，错误信息会通过 `XMLValidationError` 抛出
- **变量没初始化**：`<var>` 默认值为空时变量是 `null`，`{name || '缺省'}` 是常见兜底写法
- **API 路径**：XML 里 `<api>` 的 `url` 默认走前端 `instance` HTTP 客户端，相对路径会拼到 WebUI 后端基地址下
- **取 sys 对象**：在控制台执行 `window.__plugin_sys_<pageId>` 可手动检查当前页面的 sys 桥接对象（XML 轨也共享 sys）

## 常见坑

1. **`<` 没转义** — XML 里写 `counter < 5` 会让 DOMParser 直接报解析错误，必须写 `counter &lt; 5`
2. **`default="hello"` 被当成变量** — 字符串字面量请写 `default="'hello'"`，引擎会先尝试 `JSON.parse`
3. **`<api>` 写在 `<layout>` 里不会执行** — 所有 `<var>` / `<api>` / `<template>` 必须放在 `<definitions>` 段内
4. **想自动加载数据但没数据** — 检查 `<api auto-fetch="true">`，字符串值**必须是 `"true"`** 才会自动触发
5. **bind 双向绑定不生效** — XML 命名空间没声明，在 `<page>` 上加 `xmlns:bind="urn:neo-mofox:bind"`
6. **`page_id` 注册被拒** — `page_id` 必须匹配 `^[a-z][a-z0-9_-]{0,63}$`，不要写下划线开头、大写或中文
7. **改了 XML 但页面没变** — 插件没真正卸载重载，重新启动 Neo-MoFox 或卸载该插件后重装
8. **想从其他插件拿数据** — 别 `import` 对方源码，发请求到对方插件 Router 的 URL 即可
9. **`<sys-text value="...">` 不显示** — `sys-text` 没有 `value` 属性，文本写在默认插槽里：`<sys-text>内容</sys-text>`
10. **`<sys-tag text="...">` 不显示** — `sys-tag` 没有 `text` 属性，文本写在默认插槽里：`<sys-tag>标签</sys-tag>`

## 下一步

- [XML 组件参考](./xml-components) — 所有内置 XML 组件的完整属性、事件、用法
- [HTML 开发](./html) — 用原生 HTML/CSS/JS 写自定义页面（命令式）
- [HTML sys API](./html-sys-api) — `sys` 桥接对象完整 API（HTML 轨核心，XML 轨也可用）
- [总览](./overview) — 整体架构与前提条件
