# XML 开发

本文整合了 Plugin UI 的快速入门与代码指南，是 XML 轨开发的核心参考。涵盖：后端 API、XML 语法、管道指令、API 模板、表达式与占位符、条件渲染、移动端适配。


## 第一个 XML 页面

最小可运行 XML：

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

**硬性结构**（来自 XSD）：

- 根元素必须是 `<page>`
- `<layout>` 是必选透传容器，**它本身不渲染**，只渲染子节点
- `<definitions>` 可选，用于声明变量、API、子模板

> `xmlns:bind="urn:neo-mofox:bind"` 命名空间是写 `bind:value="x"` 时让 XML 解析器开心的，**强烈建议加上**。

## 在插件中注册页面

在插件的 `on_plugin_loaded` 生命周期中注册 UI 页面：

```python
from src.app.plugin_system.base import BasePlugin, register_plugin
from src.app.plugin_system.api.service_api import get_service


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
        ui_service = await get_service("neo-mofox-webui:service:plugin_ui")
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
            xml=xml_content,
        )

    async def on_plugin_unloaded(self) -> None:
        ui_service = await get_service("neo-mofox-webui:service:plugin_ui")
        if ui_service is None:
            return
        await ui_service.unregister_plugin_pages("my_plugin")
```

注册完成后，刷新 WebUI 侧边栏即可看到你的页面。

## 后端 API

### register_ui_page

注册一个插件 UI 页面。同 `plugin_name + page_id` 的重复注册视为更新。

```python
page = await ui_service.register_ui_page(
    plugin_name="my_plugin",
    page_id="settings",
    title="插件设置",
    mode="xml",
    icon="settings",
    description="插件配置页面",
    order=100,
    xml=xml_content,
    mobile_xml=mobile_xml_content,  # 可选
)
```

**参数说明：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `plugin_name` | `str` | 是 | 调用方插件名称 |
| `page_id` | `str` | 是 | 同插件内唯一标识（小写字母、数字、连字符） |
| `title` | `str` | 是 | 页面显示名 |
| `mode` | `str` | 是 | 渲染模式：`"xml"` 或 `"html"` |
| `icon` | `str` | 否 | Material Symbols 图标名 |
| `description` | `str` | 否 | 页面简介 |
| `order` | `int` | 否 | 排序权重（升序），默认 100 |
| `xml` | `str` | XML 模式必填 | XML 字符串 |
| `assets` | `dict` | HTML 模式必填 | HTML 资源声明 |
| `mobile_xml` | `str` | 否 | 移动端 XML（空则 fallback 到桌面端） |
| `mobile_assets` | `dict` | 否 | 移动端 HTML 资源声明 |

**assets 字典结构（HTML 模式）：**

```python
assets = {
    "entry_html": "ui/index.html",
    "styles": ["ui/style.css"],
    "scripts": ["ui/main.js"],
    "assets_dir": "ui/assets"
}
```

**参数校验规则：**

| 规则 | 说明 |
|------|------|
| `page_id` 格式 | 只允许小写字母、数字、连字符 |
| `mode=xml` | `xml` 必填，`assets` 和 `mobile_assets` 必须为 `None` |
| `mode=html` | `assets` 必填，`xml` 和 `mobile_xml` 必须为 `None` |
| 移动端一致性 | 桌面端和移动端必须使用相同的 mode |
| 路径安全 | 路径不得包含 `..`、不得以 `/` 开头 |

**可能抛出的异常：**

| 异常类型 | 触发条件 |
|----------|----------|
| `ValueError` | 参数格式不合法、mode 与字段不一致 |
| `XMLValidationError` | XML 内容校验失败 |
| `AssetPathError` | 路径穿越或不合法 |
| `AssetMissingError` | 引用的文件不存在 |
| `AssetSizeError` | 文件超过大小限制 |

### unregister_ui_page

卸载单个页面。幂等操作，页面不存在时返回 `False`。

```python
removed = await ui_service.unregister_ui_page("my_plugin", "settings")
```

### unregister_plugin_pages

批量卸载指定插件的所有页面。

```python
count = await ui_service.unregister_plugin_pages("my_plugin")
```

### list_pages

获取已注册页面的摘要列表。

```python
pages = await ui_service.list_pages()
pages = await ui_service.list_pages(plugin_filter="my_plugin")
```


## XML 语法参考

### 文档结构

XML 页面的根元素为 `<page>`，内部结构分为两段：

```xml
<page>
  <definitions>
    <var ... />
    <api ... />
  </definitions>

  <card title="...">
    ...
  </card>
</page>
```

### definitions 声明段

`<definitions>` 在渲染前被预处理，不会渲染为可见 UI。

#### var — 变量声明

```xml
<var name="变量名" default="默认值" />
```

- `name`（必填）：变量名，支持点路径如 `form.name`
- `default`（可选）：默认值

默认值解析规则：
- JSON 可解析 → 使用 JSON 类型（`true`/`false`/数字/数组/对象）
- 单引号包裹 → 字符串
- 其他 → 当作字符串字面量

```xml
<var name="count" default="0" />
<var name="enabled" default="true" />
<var name="items" default="[]" />
<var name="username" default="'匿名用户'" />
```

::: tip
变量仅在首次不存在时写入默认值，不会覆盖用户已修改的值。
:::

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

`<layout>` 标签不会渲染为实际组件，其子节点会被直接提升到父级：

```xml
<page>
  <layout>
    <card title="卡片1" />
    <card title="卡片2" />
  </layout>
</page>
```

### 属性绑定

#### 静态属性

```xml
<sys-text value="Hello World" />
<sys-button variant="filled">提交</sys-button>
```

#### 占位符绑定

属性值中使用 `{expression}` 插入动态值：

```xml
<sys-text value="你好，{username}" />
<sys-input label="计数: {count}" />
```

当属性值整体为 `{expr}` 时，保留求值结果的原始类型（对象、数组、布尔等）。

#### 双向绑定 (bind:)

使用 `bind:prop="varPath"` 实现变量池与组件的双向数据绑定：

```xml
<sys-input bind:value="username" label="用户名" />
<sys-switch bind:value="enabled" label="启用" />
```

- **读方向**：从变量池取值传入组件 prop
- **写方向**：组件 `change` 事件时自动写回变量池

同时使用 `bind:value` 和 `on-change` 时，先写回变量池，再执行管道指令。

#### 事件绑定 (on-*)

```xml
<sys-button on-click="api: save() | notify: '已保存'">保存</sys-button>
```

事件名映射：`on-click` → `onClick`，`on-change` → `onChange`（kebab-case 转 camelCase）。


## 管道指令

管道指令是 XML 轨的核心交互机制。格式为：

```
指令名: 参数 | 指令名: 参数 | ...
```

管道节点按顺序执行，任意节点抛出异常则中断后续节点。以 ` | ` 为分隔符，引号内的 `|` 不会被分割。

### 内置指令一览

#### set — 设置变量

```
set: path=value
```

```xml
on-click="set: username='张三'"
on-click="set: count={count + 1}"
on-click="set: form_valid=true"
```

值的解析优先级：引号字符串 > 布尔/空值字面量 > 数字字面量 > 占位符表达式 > 混合字符串。

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

level 可选值：`info`、`success`、`warning`、`error`，默认 `info`。

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

```xml
on-click="navigate: /dashboard"
on-click="navigate: my_plugin:settings"
```

使用 `plugin:page` 格式可跳转到其他插件的 UI 页面。

#### open-dialog / close-dialog — 对话框控制

```
open-dialog: dialogId
close-dialog: dialogId
```

通过变量池 `__dialog_<id>_open` 控制对话框的打开/关闭状态。需配合 `<dialog id="...">` 组件使用。

```xml
<dialog id="confirmDlg" title="确认操作">
  <sys-text>确定要执行此操作吗？</sys-text>
</dialog>

<sys-button on-click="open-dialog: confirmDlg">打开对话框</sys-button>
```

#### refresh — 刷新组件

```
refresh: componentId
```

触发指定组件的刷新回调。组件需通过 `id` 属性注册到刷新注册表。

```xml
on-click="api: reloadData | refresh: usersTable"
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

向页面级事件总线发送事件。

```xml
on-click="emit: dataUpdated"
on-click="emit: itemSelected, {selected_id}"
```

### 经典组合

```xml
<!-- 计数器自增 -->
<sys-button on-click="set: counter={counter + 1}">+1</sys-button>

<!-- 调接口 + 通知 + 清空表单 -->
<sys-button on-click="api: addItem | notify: '添加成功', 'success' | set: username=''">
  提交
</sys-button>

<!-- 危险操作：先确认再调接口 -->
<sys-button on-click="confirm: '确定删除？' | api: deleteItem | notify: '已删除'">
  删除
</sys-button>
```

> 任何一段抛错（包括 `confirm` 取消），后续指令都会被中断。


## API 模板

API 模板在 `<definitions>` 中声明，定义了 HTTP 请求的配置信息，可在管道指令中通过 `api: id` 调用。

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

示例：

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


## 表达式与占位符

### 占位符语法

在属性值和文本节点中使用 `{expression}` 插入动态值：

```xml
<sys-text value="你好，{username}" />
<sys-text value="{count} 条记录" />
```

- 花括号嵌套通过深度计数处理，`{obj.arr[0]}` 不会误断
- 转义序列 `\{` 和 `\}` 按字面量 `{` `}` 处理

### 表达式求值器

占位符中的表达式由一个安全的 AST 解释器执行，不使用 `eval` / `new Function`。

**支持的操作：**

| 类型 | 语法 | 示例 |
|------|------|------|
| 标识符 / 点路径 | `user.name` | `{user.name}` |
| 取反 | `!expr` | `{!is_admin}` |
| 比较运算 | `> < >= <= == !=` | `{count > 5}` |
| 逻辑运算 | `&& \|\|` | `{a && b}` |
| 算术运算 | `+ - * / %` | `{price * count}` |
| 字面量 | 数字、字符串、布尔、null | `{42}`, `{'hello'}`, `{true}`, `{null}` |
| 内置函数 | `empty()`, `len()`, `keys()`, `values()` | `{len(items)}`, `{empty(name)}` |
| 属性访问器 | `.length`, `.keys` | `{list.length}` |
| 数组索引 | `[0]` | `{items[0]}` |

### 内置函数

| 函数 | 说明 | 示例 |
|------|------|------|
| `empty(x)` | 判断值是否为空（null/undefined/空字符串/空数组） | `{empty(username)}` |
| `len(x)` | 返回数组长度或对象键数 | `{len(items) > 0}` |
| `keys(x)` | 返回对象的键数组 | `{keys(config)}` |
| `values(x)` | 返回对象的值数组 | `{values(config)}` |

### 逻辑或默认值

使用 `||` 运算符提供默认值：

```xml
<sys-text value="{username || '匿名用户'}" />
```

当 `username` 为 `null`、`undefined`、空字符串或 `0` 时，使用右侧默认值。

### 转义

文本里想要字面 `{`、`}` 时用 `\{` 和 `\}`。
XML 里 `<` 和 `>` 必须转义为 `&lt;` 和 `&gt;`：

```xml
<sys-text hidden="{counter &lt;= 5}">超过 5 才显示</sys-text>
```


## 条件渲染

### hidden 属性

使用 `hidden` 属性控制元素的显示/隐藏。值为布尔表达式：

```xml
<sys-button hidden="{!is_admin}">管理员操作</sys-button>
<sys-text hidden="{count === 0}">有数据时显示</sys-text>
```

表达式求值为 `true` 时元素不渲染。支持占位符格式或直接表达式：

```xml
hidden="true"
hidden="{!form_valid}"
```

### disabled 属性

使用 `disabled` 属性控制元素的禁用状态：

```xml
<sys-button disabled="{api.saveUser.pending}">保存中...</sys-button>
<sys-input disabled="{!editable}" />
```

### mobile-only / desktop-only

使用这两个属性控制元素在不同设备上的显示：

```xml
<sys-text mobile-only="true">仅在移动端显示</sys-text>
<sys-text desktop-only="true">仅在桌面端显示</sys-text>
```


## 移动端适配

Plugin UI 支持为移动端提供独立的 UI 布局。

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

如果 `mobile_xml` 为空，移动端自动 fallback 到桌面端 XML。

### 方式二：使用 mobile-only / desktop-only 属性

在同一份 XML 中通过属性控制不同设备的显示：

```xml
<page>
  <hbox desktop-only>
    <sys-text>桌面端横排布局</sys-text>
  </hbox>
  <vbox mobile-only>
    <sys-text>移动端竖排布局</sys-text>
  </vbox>
</page>
```

### 渲染变体获取

前端通过 `get_page_schema` 接口指定 `variant` 参数获取不同变体：

```python
schema = await ui_service.get_page_schema("my_plugin", "settings", variant="mobile")
```


## 常用模式速查

### 表单 + API 提交

```xml
<page>
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
      <sys-button on-click="api: saveUser | notify: '保存成功'" variant="filled">
        保存
      </sys-button>
    </vbox>
  </card>
</page>
```

### 条件显示

```xml
<page>
  <definitions>
    <var name="is_admin" default="false" />
    <var name="items" default="[]" />
    <api id="loadItems" method="GET" url="/api/items" response-to="items" auto-fetch="true" />
  </definitions>

  <card title="项目列表">
    <sys-table data="{items}" columns='[{"key":"name","label":"名称"},{"key":"status","label":"状态"}]' />
    <sys-button hidden="{!is_admin}" on-click="api: addItem" variant="filled">
      添加项目
    </sys-button>
  </card>
</page>
```

### 对话框确认

```xml
<page>
  <definitions>
    <api id="deleteItem" method="DELETE" url="/api/items/{selected_id}" />
  </definitions>

  <card title="危险操作">
    <sys-button on-click="confirm: '确定要删除吗？' | api: deleteItem | notify: '已删除', success"
                variant="filled">
      删除
    </sys-button>
  </card>
</page>
```


## 调试技巧

- **打开浏览器控制台**：渲染器会输出大量 `[XmlRenderer]`、`[PipeExecutor]`、`[ApiTemplateEngine]` 调试日志。
- **未知组件保护**：写错标签名时页面会显示红色虚线框 `未知组件: <xxx>`，不会整页崩。
- **XML 解析错误**：注册时会先用 XSD 校验你的 XML，错误信息会通过 `XMLValidationError` 抛出。
- **变量没初始化怎么办？**：`<var>` 默认值为空时变量是 `null`，`{name || '缺省'}` 是常见兜底写法。
- **API 路径不对？**：XML 里的 `url` 默认走前端的 `instance` HTTP 客户端，相对路径会拼到 WebUI 后端基地址下。

## 常见坑

1. **`<` 没转义** — XML 里写 `counter < 5` 会让 DOMParser 直接报解析错误。必须写 `counter &lt; 5`。
2. **`default="hello"` 被解析成变量** — 字符串字面量请写 `default="'hello'"`，因为引擎会先尝试 `JSON.parse`。
3. **`<api>` 写在 `<layout>` 里不会执行** — 所有 `<var>` / `<api>` / `<template>` 必须放在 `<definitions>` 段内。
4. **想自动加载数据但没数据** — 检查 `<api auto-fetch="true">` 里的字符串值，**必须是 `"true"`**。
5. **bind 双向绑定不生效** — XML 命名空间没声明。在 `<page>` 上加 `xmlns:bind="urn:neo-mofox:bind"`。
6. **page_id 注册被拒** — `page_id` 只允许 `[a-z0-9-]+`，不要写下划线、大写或中文。
7. **改了 XML 但页面没变** — 插件没真正卸载重载，重新启动 Neo-MoFox 或卸载该插件后重装。
8. **想从其他插件拿数据** — 别 `import` 对方源码，发请求到对方插件 Router 的 URL 即可。

## 下一步

- [组件参考](./components) — 所有内置 XML 组件的完整属性和用法
