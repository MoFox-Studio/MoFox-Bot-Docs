# HTML 组件参考

HTML 轨与 XML 轨**共享同一套 `sys-*` 组件源**（`components/plugin-ui/sys-components/`）。差异仅在标签名与调用方式：

- **标签名**：HTML 自定义元素名必须含连字符，故 XML 轨的裸名布局标签在 HTML 轨一律加 `sys-` 前缀（`<vbox>` → `<sys-vbox>`，`<card>` → `<sys-card>` 等）；基础 / 高级组件在两种轨道下标签名一致（`<sys-text>` / `<sys-table>` 等）
- **调用方式**：XML 轨是声明式（管道指令、占位符、bind: 双向绑定），HTML 轨是命令式（`querySelector` 取元素、读写属性、`addEventListener` 监听事件）

本文只描述 HTML 轨下的命令式用法。组件 SFC 的 props / events 与 XML 轨一致，完整 props 表见 [XML 组件参考](./components)。

::: tip 属性类型约定
HTML 自定义元素的 attribute **永远是字符串**。布尔属性可用三种写法等价于 `true`：

```html
<sys-button disabled></sys-button>                <!-- presence -->
<sys-button disabled="true"></sys-button>         <!-- "true" -->
<sys-button disabled="disabled"></sys-button>     <!-- 同名 -->
```

`"false"` 字符串或属性缺失视为 `false`。

某些复杂属性（`columns` / `data` / `options`）需要传数组 / 对象 —— 在 HTML 轨**直接给 JS 属性赋值**，不要靠 attribute 字符串反序列化：

```javascript
table.data = [{...}, {...}]                       // ✅ 正确
table.setAttribute('data', '[{...}]')             // ⚠️ 会走 JSON.parse，可行但啰嗦
```
:::

## 布局组件

### sys-vbox — 垂直布局容器

```html
<sys-vbox gap="1rem" align="stretch" padding="1rem">
  <sys-text>第一行</sys-text>
  <sys-text>第二行</sys-text>
</sys-vbox>
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `gap` | `string` | `0.5rem` | 子元素间距 |
| `justify` | `string` | `flex-start` | 主轴对齐 |
| `align` | `string` | `stretch` | 交叉轴对齐 |
| `padding` | `string` | — | 内边距 |
| `fill` | `boolean` | `false` | 是否撑满父容器剩余空间 |

### sys-hbox — 水平布局容器

```html
<sys-hbox gap="0.5rem" align="center" wrap="false">
  <sys-button variant="filled">确认</sys-button>
  <sys-button variant="outlined">取消</sys-button>
</sys-hbox>
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `gap` | `string` | `0.5rem` | 子元素间距 |
| `justify` | `string` | `flex-start` | 主轴对齐 |
| `align` | `string` | `center` | 交叉轴对齐 |
| `wrap` | `string` | `"false"` | 是否换行 |
| `padding` | `string` | — | 内边距 |
| `fill` | `boolean` | `false` | 是否撑满 |

### sys-grid — 网格布局容器

```html
<sys-grid columns="3" gap="1rem">
  <sys-card title="卡片1" />
  <sys-card title="卡片2" />
  <sys-card title="卡片3" />
</sys-grid>
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `columns` | `string` | `repeat(auto-fit, minmax(200px, 1fr))` | 列定义；纯数字自动转 `repeat(N, 1fr)` |
| `rows` | `string` | — | 行模板 |
| `gap` | `string` | `1rem` | 网格间距 |
| `padding` | `string` | — | 内边距 |

### sys-card — 卡片容器

```html
<sys-card title="用户信息" variant="elevated" padding="1.5rem" clickable>
  <sys-text>主体内容</sys-text>
</sys-card>
```

支持具名插槽 `header` / `actions` / `footer`（用 `<template>` 节点声明）：

```html
<sys-card title="标题">
  <template #actions>
    <sys-icon-button icon="edit" />
  </template>
  <sys-text>主体</sys-text>
  <template #footer>
    <sys-text variant="caption">底部</sys-text>
  </template>
</sys-card>
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `title` | `string` | — | 卡片标题 |
| `variant` | `string` | `elevated` | `elevated` / `outlined` / `filled` |
| `padding` | `string` | `1rem` | 内边距 |
| `clickable` | `boolean` | `false` | 启用悬停 / 按下反馈 |

### sys-tabs — 标签页容器

```html
<sys-tabs default-tab="0" placement="top">
  <sys-vbox label="基本">...</sys-vbox>
  <sys-vbox label="高级">...</sys-vbox>
</sys-tabs>
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `default-tab` | `string` | `"0"` | 默认激活索引 |
| `placement` | `string` | `top` | `top` / `bottom` / `start` / `end` |
| `fill` | `boolean` | `false` | 内容区撑满高度 |

| 事件 | `event.detail` | 说明 |
|------|----------------|------|
| `change` | `[index: number, label: string]` | 切换 tab 时触发 |

```javascript
const tabs = root.querySelector('sys-tabs')
tabs.addEventListener('change', (e) => {
  const [index, label] = e.detail
  console.log(`切换到 ${label} (index=${index})`)
})
```

### sys-dialog — 对话框

通过 `id` 与 `sys.ui.dialog.open(id)` / `sys.ui.dialog.close(id)` 控制，或直接操作 `open` 属性 / 监听 `close` 事件。

```html
<sys-dialog id="confirmDlg" title="确认操作" close-on-backdrop="true" close-on-esc="true">
  <sys-text>确定要执行此操作吗？</sys-text>
  <template #footer>
    <sys-button id="cancel-btn" variant="text">取消</sys-button>
    <sys-button id="ok-btn" variant="filled">确定</sys-button>
  </template>
</sys-dialog>

<button onclick="sys.ui.dialog.open('confirmDlg')">打开</button>
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `id` | `string` | — | 对话框 ID（用于 `sys.ui.dialog`） |
| `title` | `string` | — | 标题 |
| `open` | `boolean \| string` | `false` | 是否打开，可直接赋值控制 |
| `close-on-backdrop` | `boolean \| string` | `true` | 点击遮罩关闭 |
| `close-on-esc` | `boolean \| string` | `true` | ESC 关闭 |
| `no-transition` | `boolean \| string` | `false` | 禁用过渡 |

| 事件 | 说明 |
|------|------|
| `close` | 关闭时触发（点击遮罩 / ESC / 关闭按钮 / `update:open=false`） |
| `update:open` | `open` 状态变化时触发，`event.detail` 为新布尔值 |

```javascript
const dlg = root.querySelector('#confirmDlg')
dlg.addEventListener('close', () => console.log('已关闭'))

// 直接控制开关
dlg.open = true
```

### sys-divider — 分割线

```html
<sys-divider />
<sys-divider direction="vertical" variant="dashed" />
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `direction` | `string` | `horizontal` | `horizontal` / `vertical` |
| `variant` | `string` | `solid` | `solid` / `dashed` / `dotted` / `thick` |
| `margin` | `string` | — | 外边距 |

### sys-spacer — 弹性间距

```html
<sys-hbox>
  <sys-text>左</sys-text>
  <sys-spacer />
  <sys-button>右</sys-button>
</sys-hbox>
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `height` | `string` | — | 固定高度 |
| `width` | `string` | — | 固定宽度 |

不传 `height` / `width` 时 `flex: 1`。

## 基础组件

### sys-text — 文本显示

```html
<sys-text variant="headline">大标题</sys-text>
<sys-text variant="caption" color="#888">辅助说明</sys-text>
<sys-text truncate>这段超长文字会被截断为省略号</sys-text>
```

::: warning 没有 value 属性
`sys-text` 没有名为 `value` 的属性，文本通过**默认插槽**传入。要动态修改文本，直接改 `.textContent`：

```javascript
const txt = root.querySelector('#my-text')
txt.textContent = `当前用户：${sys.vars.username}`
```
:::

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `variant` | `string` | `body` | `body` / `title` / `subtitle` / `caption` / `headline` / `overline` |
| `color` | `string` | — | 文本颜色 |
| `align` | `string` | — | `left` / `center` / `right` / `justify` |
| `bold` | `boolean` | `false` | 加粗 |
| `italic` | `boolean` | `false` | 斜体 |
| `truncate` | `boolean` | `false` | 超出省略号截断 |

### sys-input — 输入框

```html
<sys-input id="username" label="用户名" placeholder="请输入用户名" />
<sys-input id="email" label="邮箱" type="email" />
<sys-input id="count" label="数量" type="number" />
```

**取值**：用 `.value`，不要用 `getAttribute('value')`：

```javascript
const input = root.querySelector('#username')
console.log(input.value)        // 用户当前输入
input.value = ''                // 清空

input.addEventListener('change', (e) => {
  console.log('新值：', e.detail)
})
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `label` | `string` | — | 标签 |
| `placeholder` | `string` | — | 占位文本 |
| `type` | `string` | `text` | `text` / `email` / `password` / `number` / `search` / `tel` / `url` |
| `value` | `string \| number` | — | 当前值（可读写，实时反映用户输入） |
| `disabled` | `boolean` | `false` | 禁用 |
| `readonly` | `boolean` | `false` | 只读 |
| `error` | `string` | — | 错误提示 |
| `animated` | `boolean` | `true` | 聚焦动画 |

| 事件 | `event.detail` | 说明 |
|------|----------------|------|
| `change` | `string` | 值变化（输入时触发） |
| `focus` | `FocusEvent` | 获得焦点 |
| `blur` | `FocusEvent` | 失去焦点 |

### sys-textarea — 多行文本框

```html
<sys-textarea id="desc" label="描述" rows="4" maxlength="500" />
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `label` | `string` | — | 标签 |
| `placeholder` | `string` | — | 占位文本 |
| `value` | `string` | — | 当前值（用 `.value` 取） |
| `disabled` | `boolean` | `false` | 禁用 |
| `rows` | `string` | `"3"` | 可见行数 |
| `maxlength` | `string \| number` | — | 最大字符数 |
| `error` | `string` | — | 错误提示 |

| 事件 | `event.detail` | 说明 |
|------|----------------|------|
| `change` | `string` | 值变化 |
| `focus` / `blur` | `FocusEvent` | 焦点变化 |

### sys-select — 下拉选择

```html
<sys-select id="lang" label="语言" placeholder="请选择">
  <option value="zh">中文</option>
  <option value="en">English</option>
  <option value="ja">日本語</option>
</sys-select>
```

::: warning 没有 options 属性
`sys-select` 没有 `options` 属性。选项通过 `<option>` 子元素声明，与原生 `<select>` 一致。
:::

```javascript
const sel = root.querySelector('#lang')
console.log(sel.value)         // 当前选中值
sel.value = 'en'               // 切换选中

sel.addEventListener('change', (e) => {
  console.log('选了：', e.detail)
})
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `label` | `string` | — | 标签 |
| `value` | `string` | — | 当前选中值 |
| `disabled` | `boolean` | `false` | 禁用 |
| `placeholder` | `string` | — | 占位文本 |
| `error` | `string` | — | 错误提示 |

| 事件 | `event.detail` | 说明 |
|------|----------------|------|
| `change` | `string` | 选中值变化 |
| `focus` / `blur` | `FocusEvent` | 焦点变化 |

### sys-switch — 开关

```html
<sys-switch id="enabled" label="启用通知" />
```

```javascript
const sw = root.querySelector('#enabled')
console.log(sw.value)        // "true" / "false" 或 boolean
sw.addEventListener('change', (e) => {
  console.log('开关状态：', e.detail)   // boolean
})
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `label` | `string` | — | 标签 |
| `value` | `string \| boolean` | — | 当前值（`"true"` / `"false"` 或布尔） |
| `disabled` | `boolean` | `false` | 禁用 |
| `color` | `string` | — | 开启时轨道颜色 |

| 事件 | `event.detail` | 说明 |
|------|----------------|------|
| `change` | `boolean` | 状态变化 |

### sys-slider — 滑块

```html
<sys-slider id="volume" label="音量" min="0" max="100" step="1" show-value />
```

```javascript
const sl = root.querySelector('#volume')
console.log(Number(sl.value))   // 数字（属性是字符串，值是数字）
sl.addEventListener('change', (e) => {
  console.log('新值：', e.detail)   // number
})
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `label` | `string` | — | 标签 |
| `value` | `string \| number` | `50` | 当前值 |
| `min` | `string \| number` | `0` | 最小值 |
| `max` | `string \| number` | `100` | 最大值 |
| `step` | `string \| number` | `1` | 步长 |
| `disabled` | `boolean` | `false` | 禁用 |
| `show-value` | `boolean` | `false` | 显示当前数值 |

| 事件 | `event.detail` | 说明 |
|------|----------------|------|
| `change` | `number` | 拖动时触发 |

### sys-date-picker — 日期选择器

```html
<sys-date-picker id="birthday" label="生日" type="date" min="1900-01-01" max="2025-12-31" />
<sys-date-picker id="meeting" label="时间" type="time" />
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `label` | `string` | — | 标签 |
| `value` | `string` | — | 当前日期值（ISO 字符串） |
| `disabled` | `boolean` | `false` | 禁用 |
| `type` | `string` | `date` | `date` / `time` / `month` / `week` / `datetime-local` |
| `min` | `string` | — | 最小值 |
| `max` | `string` | — | 最大值 |

| 事件 | `event.detail` | 说明 |
|------|----------------|------|
| `change` | `string` | 值变化 |

### sys-button — 按钮

```html
<sys-button id="save" variant="filled" icon="save" size="medium">保存</sys-button>
<sys-button variant="outlined" block>整行按钮</sys-button>
```

```javascript
const btn = root.querySelector('#save')
btn.addEventListener('click', () => {
  btn.setAttribute('loading', 'true')   // 进入加载态
  // ... 异步操作完成后 btn.removeAttribute('loading')
})
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `variant` | `string` | `filled` | `filled` / `outlined` / `text` / `tonal` / `elevated` |
| `icon` | `string` | — | Material Symbols 图标名 |
| `disabled` | `boolean` | `false` | 禁用 |
| `loading` | `string \| boolean` | `false` | `"true"` 时显示旋转动画并禁用点击 |
| `block` | `boolean` | `false` | 撑满父容器宽度 |
| `size` | `string` | `medium` | `small` / `medium` / `large` |

原生 `click` 事件会冒泡到自定义元素，可直接 `addEventListener('click', ...)`。

### sys-icon-button — 图标按钮

```html
<sys-icon-button id="delete" icon="delete" variant="standard" size="medium" />
<sys-icon-button icon="add" variant="filled" />
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `icon` | `string` | `circle` | Material Symbols 图标名 |
| `variant` | `string` | `standard` | `standard` / `filled` / `tonal` / `outlined` |
| `size` | `string` | `medium` | `small` (32px) / `medium` (40px) / `large` (48px) |
| `disabled` | `boolean` | `false` | 禁用 |
| `loading` | `string` | `"false"` | `"true"` 时显示旋转动画 |

### sys-icon — 图标

```html
<sys-icon name="settings" />
<sys-icon name="loading" size="32px" spin />
<sys-icon name="warning" color="#f59e0b" />
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `name` | `string` | — | Material Symbols 图标名 |
| `size` | `string` | `24px` | 尺寸 |
| `color` | `string` | — | 颜色 |
| `spin` | `boolean` | `false` | 旋转 |

### sys-tag — 标签

```html
<sys-tag>新功能</sys-tag>
<sys-tag variant="success" icon="check">已通过</sys-tag>
<sys-tag variant="error" closable id="t1">阻塞性</sys-tag>
```

::: warning 没有 text 属性
`sys-tag` 没有 `text` 属性。文本通过**默认插槽**传入。
:::

```javascript
const tag = root.querySelector('#t1')
tag.addEventListener('close', () => tag.remove())
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `variant` | `string` | `default` | `default` / `primary` / `error` / `success` / `warning` / `info` |
| `color` | `string` | — | 自定义背景色 |
| `icon` | `string` | — | 前置图标 |
| `closable` | `boolean` | `false` | 显示关闭按钮 |

| 事件 | 说明 |
|------|------|
| `close` | 点击关闭按钮时触发 |

### sys-badge — 徽章

包装在子元素周围，子元素写在默认插槽里。

```html
<sys-badge value="3">
  <sys-icon-button icon="notifications" />
</sys-badge>

<sys-badge value="99+" variant="error">
  <sys-icon name="mail" />
</sys-badge>
```

::: warning 没有 text 属性
`sys-badge` 没有 `text` 属性。徽章文字用 `value` 属性传入，被标记的内容写在**默认插槽**里。
:::

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `value` | `string \| number` | — | 徽章内容（数字会与 `max` 比较） |
| `max` | `number` | — | 数字上限，超过显示 `N+` |
| `variant` | `string` | `error` | `error` / `primary` / `success` / `warning` / `info` |
| `color` | `string` | — | 自定义背景色 |

## 高级组件

### sys-table — 数据表格

```html
<sys-table id="users-table" striped="true" hoverable page-size="10" />
```

```javascript
const table = root.querySelector('#users-table')

// 直接赋值数组（推荐）
table.data = [
  { name: '张三', email: 'z3@example.com', status: 'active' },
  { name: '李四', email: 'l4@example.com', status: 'inactive' },
]

// 显式声明列（不传则从首行推断）
table.columns = [
  { key: 'name',  label: '姓名', width: '120px' },
  { key: 'email', label: '邮箱', width: '200px' },
  { key: 'status', label: '状态', align: 'center' },
]
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `data` | `string \| array` | — | 数据数组（JS 端直接赋值数组即可） |
| `columns` | `string \| array` | — | 列定义数组：`[{key, label, width?, align?}]` |
| `striped` | `string` | `"false"` | 斑马纹 |
| `page-size` | `string` | — | 每页行数，`0` 不分页 |
| `hoverable` | `boolean` | `true` | 行 hover 高亮 |
| `animated` | `boolean` | `true` | stagger 入场动画 |

### sys-chart — 图表

```html
<sys-chart id="metrics" type="line" height="320px" />
```

```javascript
const chart = root.querySelector('#metrics')

// 简化数据格式
chart.data = {
  title: '周访问量',
  xAxis: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  series: [
    { name: '邮件', data: [120, 132, 101, 134, 90] },
    { name: '访问', data: [220, 182, 191, 234, 290] },
  ],
}

// 切换图表类型
chart.type = 'bar'

// 完整 ECharts option
chart.removeAttribute('type')
chart.data = {
  option: {
    title: { text: '自定义' },
    xAxis: { type: 'category', data: ['A', 'B', 'C'] },
    yAxis: { type: 'value' },
    series: [{ type: 'bar', data: [10, 20, 30] }],
  },
}
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `type` | `string` | `line` | `line` / `bar` / `pie` / `scatter` / `radar`；不传且 `data.option` 存在时用完整 option |
| `data` | `string \| object` | — | 图表数据（JS 端直接赋值对象） |
| `height` | `string` | `300px` | 高度 |
| `theme` | `string` | — | `light` / `dark`（默认跟随系统） |
| `loading` | `string` | — | `"true"` 显示 ECharts loading |

### sys-form — 表单容器

```html
<sys-form id="my-form" gap="1rem" layout="block">
  <sys-input label="名称" />
  <sys-input label="邮箱" type="email" />
  <sys-button variant="filled" id="submit">提交</sys-button>
</sys-form>
```

```javascript
const form = root.querySelector('#my-form')
form.addEventListener('submit', (e) => {
  e.preventDefault()
  // 校验 + 提交...
})
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `gap` | `string` | `1rem` | 子元素间距 |
| `layout` | `string` | `block` | `block` / `inline` |
| `loading` | `boolean` | `false` | 显示 loading 遮罩 |

| 事件 | `event.detail` | 说明 |
|------|----------------|------|
| `submit` | `Event` | 提交时（已 `preventDefault`） |
| `reset` | `Event` | 重置时 |

### sys-list — 列表

```html
<sys-list id="users" divider="true" two-line />
```

```javascript
const list = root.querySelector('#users')
list.data = [
  { name: '张三', email: 'z3@example.com' },
  { name: '李四', email: 'l4@example.com' },
]
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `data` | `string \| array` | — | 数据数组 |
| `divider` | `string` | `"true"` | 分割线 |
| `two-line` | `boolean` | `false` | 两行布局 |
| `animated` | `boolean` | `true` | stagger 入场动画 |

| 插槽 | 作用域参数 | 说明 |
|------|------------|------|
| `item` | `item`, `index` | 自定义每项渲染 |
| `empty` | — | 空数据占位 |

## 浮层组件

### sys-toast — Toast 通知

**HTML 轨通常不直接使用此组件**，通过 `sys.ui.toast(msg, level)` 触发系统级 Toast 即可。本组件主要用于声明式场景（手动控制显示）。

```html
<sys-toast id="my-toast" message="保存成功" level="success" duration="3000" placement="top" />
```

```javascript
const t = root.querySelector('#my-toast')
t.show?.()        // 命令式显示（如果暴露了 show 方法）
t.message = '失败了'
t.level = 'error'

t.addEventListener('close', () => console.log('关闭'))
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `message` | `string` | — | Toast 文本 |
| `level` | `string` | `info` | `info` / `success` / `warning` / `error` |
| `duration` | `number` | `3000` | 显示时长（毫秒），`0` 不自动关闭 |
| `placement` | `string` | `top` | `top` / `bottom` |

| 事件 | 说明 |
|------|------|
| `show` | 显示时 |
| `close` | 关闭时（点击 Toast 也会触发） |

## 通用属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `disabled` | `boolean` | 禁用组件 |
| `hidden` | `boolean` | 隐藏组件（HTML 原生属性，直接生效） |

## 命令式操作示例

### 表单 + 表格 + API 联动

```html
<sys-card title="任务管理" variant="elevated">
  <sys-vbox gap="0.75rem">
    <sys-hbox gap="0.5rem" align="flex-end">
      <sys-input id="title" label="任务标题" style="flex:1"></sys-input>
      <sys-select id="priority" label="优先级" style="width:140px">
        <option value="low">低</option>
        <option value="medium" selected>中</option>
        <option value="high">高</option>
      </sys-select>
      <sys-button id="add" variant="filled" icon="add">添加</sys-button>
    </sys-hbox>
    <sys-table id="tasks" striped="true" page-size="10"></sys-table>
  </sys-vbox>
</sys-card>
```

```javascript
const host = document.querySelector('.html-sandbox-host')
const root = host.shadowRoot
const $ = (s) => root.querySelector(s)

async function loadTasks() {
  const tasks = await sys.request('/my-plugin/tasks')
  $('#tasks').data = tasks
}

$('#add').addEventListener('click', async () => {
  const title = $('#title').value.trim()
  const priority = $('#priority').value
  if (!title) {
    sys.ui.toast('请输入任务标题', 'warn')
    return
  }
  await sys.request('/my-plugin/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, priority }),
  })
  $('#title').value = ''
  await loadTasks()
  sys.ui.toast('任务创建成功', 'success')
})

loadTasks()
```

### 自定义 Dialog 控制开关

```html
<sys-dialog id="editDlg" title="编辑任务">
  <sys-vbox gap="0.5rem">
    <sys-input id="edit-title" label="标题" />
  </sys-vbox>
  <template #footer>
    <sys-button id="cancel" variant="text">取消</sys-button>
    <sys-button id="save" variant="filled">保存</sys-button>
  </template>
</sys-dialog>
```

```javascript
// 通过 sys.ui.dialog.open/close 控制
$('#edit-btn').addEventListener('click', () => {
  $('#edit-title').value = currentTask.title
  sys.ui.dialog.open('editDlg')
})

$('#cancel').addEventListener('click', () => sys.ui.dialog.close('editDlg'))
$('#save').addEventListener('click', async () => {
  await sys.request('/my-plugin/tasks/' + currentTask.id, {
    method: 'PUT',
    body: JSON.stringify({ title: $('#edit-title').value }),
  })
  sys.ui.dialog.close('editDlg')
  await loadTasks()
  sys.ui.toast('已保存', 'success')
})
```

## 相关文档

- [HTML 开发](./html) — HTML 轨快速入门、沙箱环境、资源结构
- [sys API](./sys-api) — `sys` 桥接对象完整 API
- [XML 组件参考](./components) — XML 轨下的组件用法对照
