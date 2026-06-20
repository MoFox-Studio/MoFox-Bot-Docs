# 组件参考

Plugin UI XML 轨提供一套内置的 Material Design 3 风格组件。本文列出所有可用组件的标签名、属性、事件和用法示例。

组件分为三大类：

- **布局组件** — 控制页面结构和容器
- **基础组件** — 文本、输入、按钮等交互元素
- **高级组件** — 表格、图表、表单等复合组件

---

## 布局组件

### vbox — 垂直布局容器

将子元素按垂直方向排列。

```xml
<vbox>
  <sys-text>第一行</sys-text>
  <sys-text>第二行</sys-text>
</vbox>
```

| 属性 | 类型 | 说明 |
|------|------|------|
| `gap` | `string` | 子元素间距，如 `"8px"`、`"1rem"` |

---

### hbox — 水平布局容器

将子元素按水平方向排列。

```xml
<hbox>
  <sys-button variant="filled">确认</sys-button>
  <sys-button variant="outlined">取消</sys-button>
</hbox>
```

| 属性 | 类型 | 说明 |
|------|------|------|
| `gap` | `string` | 子元素间距，如 `"8px"`、`"1rem"` |

---

### grid — 网格布局容器

将子元素按网格排列。

```xml
<grid columns="3" gap="16px">
  <card title="卡片1" />
  <card title="卡片2" />
  <card title="卡片3" />
</grid>
```

| 属性 | 类型 | 说明 |
|------|------|------|
| `columns` | `string` | 列数 |
| `gap` | `string` | 网格间距 |

---

### card — 卡片容器

MD3 风格的 Surface 容器，带圆角和阴影。

```xml
<card title="用户信息" variant="elevated">
  <sys-text>内容区域</sys-text>
</card>
```

| 属性 | 类型 | 说明 |
|------|------|------|
| `title` | `string` | 卡片标题 |
| `variant` | `string` | 变体：`elevated`（默认）、`outlined`、`filled` |
| `padding` | `string` | 内边距，默认 `"1rem"` |

---

### tabs — 标签页容器

标签切换组件，子元素通过 `label` 属性定义 tab 标题。

```xml
<tabs default-tab="0">
  <card label="基本设置">...</card>
  <card label="高级设置">...</card>
</tabs>
```

| 属性 | 类型 | 说明 |
|------|------|------|
| `default-tab` | `string` | 默认选中的 tab 索引 |

---

### dialog — 对话框

通过管道指令 `open-dialog` / `close-dialog` 控制的对话框。组件本身不渲染可见 UI，而是委托给系统级 Dialog。

```xml
<dialog id="confirmDlg" title="确认操作">
  <sys-text>确定要执行此操作吗？</sys-text>
</dialog>

<sys-button on-click="open-dialog: confirmDlg">打开</sys-button>
<sys-button on-click="close-dialog: confirmDlg">关闭</sys-button>
```

| 属性 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | 对话框 ID（用于 open-dialog/close-dialog 指令） |
| `title` | `string` | 对话框标题 |
| `message` | `string` | 对话框消息内容 |

---

### divider — 分割线

水平分割线。

```xml
<sys-text>上方内容</sys-text>
<divider />
<sys-text>下方内容</sys-text>
```

无特殊属性。

---

### spacer — 弹性间距

占据剩余空间的弹性间距元素。

```xml
<hbox>
  <sys-text>左对齐</sys-text>
  <spacer />
  <sys-button>右对齐按钮</sys-button>
</hbox>
```

无特殊属性。

---

## 基础组件

### sys-text — 文本显示

显示静态或动态文本内容。

```xml
<sys-text value="Hello World" />
<sys-text value="你好，{username}" />
```

| 属性 | 类型 | 说明 |
|------|------|------|
| `value` | `string` | 文本内容，支持占位符 |

也支持子节点方式：

```xml
<sys-text>直接写入的文本内容</sys-text>
```

---

### sys-input — 输入框

单行文本输入框。

```xml
<sys-input label="用户名" bind:value="username" placeholder="请输入用户名" />
<sys-input label="邮箱" type="email" bind:value="email" />
```

| 属性 | 类型 | 说明 |
|------|------|------|
| `label` | `string` | 输入框标签 |
| `placeholder` | `string` | 占位文本 |
| `type` | `string` | 输入类型，如 `text`、`email`、`password`、`number`，默认 `text` |
| `value` | `string` | 当前值（配合 `bind:value` 使用） |
| `disabled` | `boolean` | 是否禁用 |
| `error` | `string` | 错误提示信息 |

| 事件 | 说明 |
|------|------|
| `on-change` | 值变化时触发（`bind:value` 自动处理写回，通常无需手动监听） |

---

### sys-textarea — 多行文本框

多行文本输入框。

```xml
<sys-textarea label="描述" bind:value="description" placeholder="请输入描述" />
```

| 属性 | 类型 | 说明 |
|------|------|------|
| `label` | `string` | 标签 |
| `placeholder` | `string` | 占位文本 |
| `value` | `string` | 当前值 |
| `disabled` | `boolean` | 是否禁用 |
| `rows` | `string` | 可见行数 |

| 事件 | 说明 |
|------|------|
| `on-change` | 值变化时触发 |

---

### sys-select — 下拉选择

下拉选择框。

```xml
<sys-select label="语言" bind:value="lang" placeholder="请选择">
  <option value="zh">中文</option>
  <option value="en">English</option>
</sys-select>
```

| 属性 | 类型 | 说明 |
|------|------|------|
| `label` | `string` | 标签 |
| `options` | `string` | 选项 JSON（也可用子节点 `<option>`） |
| `value` | `string` | 当前选中值 |
| `disabled` | `boolean` | 是否禁用 |
| `placeholder` | `string` | 占位文本 |

| 事件 | 说明 |
|------|------|
| `on-change` | 选中值变化时触发 |

---

### sys-switch — 开关

开关切换组件。

```xml
<sys-switch label="启用通知" bind:value="notifications_enabled" />
```

| 属性 | 类型 | 说明 |
|------|------|------|
| `label` | `string` | 标签文本 |
| `value` | `string \| boolean` | 当前值（`"true"`/`"false"` 或布尔值） |
| `disabled` | `boolean` | 是否禁用 |

| 事件 | 说明 |
|------|------|
| `on-change` | 开关状态变化时触发，参数为布尔值 |

---

### sys-slider — 滑块

滑块选择组件。

```xml
<sys-slider label="音量" bind:value="volume" min="0" max="100" />
```

| 属性 | 类型 | 说明 |
|------|------|------|
| `label` | `string` | 标签 |
| `value` | `string` | 当前值 |
| `min` | `string` | 最小值 |
| `max` | `string` | 最大值 |
| `step` | `string` | 步长 |
| `disabled` | `boolean` | 是否禁用 |

---

### sys-date-picker — 日期选择器

日期选择组件。

```xml
<sys-date-picker label="选择日期" bind:value="selected_date" />
```

| 属性 | 类型 | 说明 |
|------|------|------|
| `label` | `string` | 标签 |
| `value` | `string` | 当前日期值 |

---

### sys-button — 按钮

MD3 风格按钮，支持多种变体。

```xml
<sys-button variant="filled" on-click="api: saveData">保存</sys-button>
<sys-button variant="outlined" on-click="notify: '已取消'">取消</sys-button>
<sys-button variant="text">了解更多</sys-button>
<sys-button variant="tonal" icon="settings">设置</sys-button>
```

| 属性 | 类型 | 说明 |
|------|------|------|
| `variant` | `string` | 变体：`filled`（默认）、`outlined`、`text`、`tonal` |
| `icon` | `string` | Material Symbols 图标名 |
| `disabled` | `boolean` | 是否禁用 |
| `loading` | `string` | 加载状态（`"true"` 时显示旋转动画并禁用） |

| 事件 | 说明 |
|------|------|
| `on-click` | 点击时触发 |

---

### sys-icon-button — 图标按钮

仅显示图标的圆形按钮。

```xml
<sys-icon-button icon="delete" on-click="confirm: '确定删除？' | api: deleteItem" />
```

| 属性 | 类型 | 说明 |
|------|------|------|
| `icon` | `string` | Material Symbols 图标名 |
| `disabled` | `boolean` | 是否禁用 |

| 事件 | 说明 |
|------|------|
| `on-click` | 点击时触发 |

---

### sys-icon — 图标

显示 Material Symbols 图标。

```xml
<sys-icon name="settings" />
```

| 属性 | 类型 | 说明 |
|------|------|------|
| `name` | `string` | Material Symbols 图标名 |

---

### sys-tag — 标签

小标签组件。

```xml
<sys-tag text="新功能" />
```

| 属性 | 类型 | 说明 |
|------|------|------|
| `text` | `string` | 标签文本 |
| `color` | `string` | 颜色主题 |

---

### sys-badge — 徽章

状态徽章/数字标记。

```xml
<sys-badge text="3" />
<sys-badge text="New" />
```

| 属性 | 类型 | 说明 |
|------|------|------|
| `text` | `string` | 徽章文本 |

---

## 高级组件

### sys-table — 数据表格

接收 JSON 数据和列配置，渲染为 MD3 风格表格。

```xml
<definitions>
  <api id="loadUsers" method="GET" url="/api/users" response-to="users" auto-fetch="true" />
</definitions>

<sys-table data="{users}" columns='[{"key":"name","label":"姓名"},{"key":"email","label":"邮箱"}]' striped="true" />
```

| 属性 | 类型 | 说明 |
|------|------|------|
| `data` | `string \| array` | JSON 数据（字符串或数组对象） |
| `columns` | `string \| array` | 列定义 JSON：`[{"key":"字段名","label":"显示名","width":"宽度"}]`。省略时自动从数据推断列 |
| `striped` | `string` | 是否显示斑马纹（`"true"`/`"false"`） |
| `page-size` | `string` | 每页行数 |

::: tip
当 `data` 通过占位符 `{users}` 绑定且值为数组时，由于表达式求值保留原始类型，组件会直接接收到数组对象，无需 JSON.parse。
:::

---

### sys-chart — 图表

基于 ECharts 的交互式图表组件。

```xml
<definitions>
  <var name="chart_data" default='{"xAxis":["Mon","Tue","Wed"],"series":[{"name":"访问量","data":[120,200,150]}]}' />
</definitions>

<sys-chart type="line" data="{chart_data}" />
```

| 属性 | 类型 | 说明 |
|------|------|------|
| `type` | `string` | 图表类型：`line`、`bar`、`pie`、`scatter`、`radar` |
| `data` | `string \| object` | 图表数据 JSON（简化格式或完整 ECharts option） |
| `height` | `string` | 图表高度，默认 `"300px"` |
| `title` | `string` | 图表标题 |

**简化数据格式（type=line/bar）：**

```json
{
  "xAxis": ["Mon", "Tue", "Wed"],
  "series": [
    { "name": "邮件", "data": [120, 132, 101] },
    { "name": "访问", "data": [220, 182, 191] }
  ],
  "title": "周访问量统计"
}
```

**简化数据格式（type=pie）：**

```json
{
  "data": [
    { "name": "直接访问", "value": 335 },
    { "name": "邮件营销", "value": 310 }
  ]
}
```

**完整 ECharts option：**

当 `type` 不指定或传入完整 option 时，直接作为 ECharts 配置使用：

```xml
<sys-chart data='{"xAxis":{"type":"value"},"yAxis":{"type":"category","data":["A","B"]},"series":[{"type":"bar","data":[10,20]}]}' />
```

---

### sys-form — 表单容器

表单容器组件，用于组合表单控件。

```xml
<sys-form>
  <sys-input label="名称" bind:value="form.name" />
  <sys-input label="邮箱" bind:value="form.email" type="email" />
  <sys-switch label="启用" bind:value="form.enabled" />
  <sys-button on-click="api: saveForm">提交</sys-button>
</sys-form>
```

当前版本为容器组件，暂无特殊属性。

---

### sys-list — 列表

渲染数组数据为列表项。

```xml
<sys-list data="{items}" divider="true" />
```

| 属性 | 类型 | 说明 |
|------|------|------|
| `data` | `string \| array` | JSON 数据数组 |
| `divider` | `string` | 是否有分割线（默认 `"true"`） |

---

## 通用属性

以下属性可应用于任何 XML 组件：

| 属性 | 类型 | 说明 |
|------|------|------|
| `hidden` | `string` | 条件表达式，求值为 `true` 时隐藏组件 |
| `disabled` | `string` | 条件表达式，求值为 `true` 时禁用组件 |
| `mobile-only` | — | 仅在移动端显示（无需值） |
| `desktop-only` | — | 仅在桌面端显示（无需值） |
| `bind:propName` | `string` | 将 `propName` prop 双向绑定到变量池路径 |
| `on-eventName` | `string` | 绑定事件到管道指令 |

## 完整示例

```xml
<page>
  <definitions>
    <var name="username" default="''" />
    <var name="email" default="''" />
    <var name="notifications" default="true" />
    <var name="users" default="[]" />
    <api id="loadUsers" method="GET" url="/api/users" response-to="users" auto-fetch="true" />
    <api id="saveProfile" method="POST" url="/api/profile"
         body='{"name": "{username}", "email": "{email}", "notifications": {notifications}}' />
  </definitions>

  <card title="个人资料" variant="elevated">
    <vbox>
      <sys-input label="用户名" bind:value="username" placeholder="请输入用户名" />
      <sys-input label="邮箱" bind:value="email" type="email" placeholder="请输入邮箱" />
      <sys-switch label="启用通知" bind:value="notifications" />
      <hbox>
        <sys-button variant="filled"
                    on-click="api: saveProfile | notify: '保存成功', success"
                    loading="{api.saveProfile.pending}">
          保存
        </sys-button>
        <sys-button variant="outlined"
                    on-click="api: loadUsers | notify: '已刷新'">
          刷新列表
        </sys-button>
      </hbox>
    </vbox>
  </card>

  <card title="用户列表" variant="outlined">
    <sys-table data="{users}" columns='[{"key":"name","label":"姓名"},{"key":"email","label":"邮箱"}]' striped="true" />
    <sys-text hidden="{len(users) > 0}">暂无用户数据</sys-text>
  </card>
</page>
```
