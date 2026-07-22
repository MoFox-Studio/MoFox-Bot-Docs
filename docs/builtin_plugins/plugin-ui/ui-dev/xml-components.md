# XML 组件参考

Plugin UI XML 轨提供一套内置的 Material Design 3 风格组件。本文列出所有可用组件的标签名、属性、事件和用法示例。

组件分为四大类：

- **布局组件** — 控制页面结构和容器
- **基础组件** — 文本、输入、按钮等交互元素
- **高级组件** — 表格、图表、表单等复合组件
- **浮层组件** — Toast 通知等浮层

::: tip 标签命名约定
XML 轨标签名不必带连字符（如 `vbox` / `card` / `sys-text`），可直接使用。HTML 轨因受自定义元素命名约束，布局类标签统一加 `sys-` 前缀（`sys-vbox` 等）。本文只描述 XML 轨用法，标签名以 XML 轨为准。
:::


## 布局组件

### vbox — 垂直布局容器

将子元素按垂直方向排列（flex column）。

```xml
<vbox>
  <sys-text>第一行</sys-text>
  <sys-text>第二行</sys-text>
</vbox>
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `gap` | `string` | `0.5rem` | 子元素间距，如 `"8px"`、`"1rem"` |
| `justify` | `string` | `flex-start` | 主轴对齐：`flex-start` / `center` / `flex-end` / `space-between` / `space-around` / `space-evenly` |
| `align` | `string` | `stretch` | 交叉轴对齐：`stretch` / `flex-start` / `center` / `flex-end` |
| `padding` | `string` | — | 内边距 |
| `fill` | `boolean` | `false` | 是否撑满父容器剩余空间（`flex: 1`） |


### hbox — 水平布局容器

将子元素按水平方向排列（flex row）。

```xml
<hbox gap="12px" align="center">
  <sys-button variant="filled">确认</sys-button>
  <sys-button variant="outlined">取消</sys-button>
</hbox>
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `gap` | `string` | `0.5rem` | 子元素间距 |
| `justify` | `string` | `flex-start` | 主轴对齐 |
| `align` | `string` | `center` | 交叉轴对齐 |
| `wrap` | `string` | `"false"` | 是否换行：`"true"` / `"false"` |
| `padding` | `string` | — | 内边距 |
| `fill` | `boolean` | `false` | 是否撑满父容器剩余空间 |


### grid — 网格布局容器

CSS Grid 布局。

```xml
<grid columns="3" gap="16px">
  <card title="卡片1" />
  <card title="卡片2" />
  <card title="卡片3" />
</grid>
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `columns` | `string` | `repeat(auto-fit, minmax(200px, 1fr))` | 列定义；纯数字会自动转 `repeat(N, 1fr)`，也可直接传任意 CSS grid-template-columns 值 |
| `rows` | `string` | — | 行模板（grid-template-rows） |
| `gap` | `string` | `1rem` | 网格间距 |
| `padding` | `string` | — | 内边距 |


### card — 卡片容器

MD3 风格的 Surface 容器，带圆角和阴影。支持 `header` / `actions` / `footer` 三个具名插槽。

```xml
<card title="用户信息" variant="elevated" padding="1.5rem">
  <sys-text>内容区域</sys-text>

  <template #actions>
    <sys-icon-button icon="edit" />
  </template>

  <template #footer>
    <sys-text variant="caption">最后更新：刚刚</sys-text>
  </template>
</card>
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `title` | `string` | — | 卡片标题（也可用 `#header` 插槽自定义） |
| `variant` | `string` | `elevated` | 变体：`elevated` / `outlined` / `filled` |
| `padding` | `string` | `1rem` | 内边距 |
| `clickable` | `boolean` | `false` | 是否启用悬停 / 按下交互反馈 |

| 插槽 | 说明 |
|------|------|
| 默认插槽 | 卡片主体内容 |
| `header` | 自定义头部（与 `title` 互斥） |
| `actions` | 头部右侧操作区 |
| `footer` | 卡片底部 |


### tabs — 标签页容器

标签切换组件，子节点通过 `label` 属性指定 tab 标题。

```xml
<tabs default-tab="0" placement="top">
  <card label="基本设置">...</card>
  <card label="高级设置">...</card>
</tabs>
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `default-tab` | `string` | `"0"` | 默认激活的 tab 索引（从 0 开始） |
| `placement` | `string` | `top` | 标签位置：`top` / `bottom` / `start` / `end` |
| `fill` | `boolean` | `false` | 内容区是否撑满高度 |

| 事件 | 参数 | 说明 |
|------|------|------|
| `on-change` | `(index: number, label: string)` | 切换 tab 时触发 |

```xml
<tabs on-change="set: active_tab={0}">
  <vbox label="首页">...</vbox>
  <vbox label="设置">...</vbox>
</tabs>
```


### dialog — 对话框

通过 `id` 与管道指令 `open-dialog` / `close-dialog` 控制的模态对话框。XML 轨下，渲染器检测到 `<dialog id="x">` 时会自动展开 `:open` / `@update:open` 双向绑定到变量池 `__dialog_x_open`，作者无需手写绑定。

```xml
<dialog id="confirmDlg" title="确认操作" close-on-backdrop="true" close-on-esc="true">
  <sys-text>确定要执行此操作吗？</sys-text>

  <template #footer>
    <sys-button variant="text" on-click="close-dialog: confirmDlg">取消</sys-button>
    <sys-button variant="filled" on-click="api: doDelete | close-dialog: confirmDlg">确定</sys-button>
  </template>
</dialog>

<sys-button on-click="open-dialog: confirmDlg">打开</sys-button>
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `id` | `string` | — | 对话框 ID（必填，用于 `open-dialog` / `close-dialog` 指令） |
| `title` | `string` | — | 对话框标题 |
| `open` | `boolean \| string` | `false` | 是否打开（一般由 `id` 自动绑定，无需手写） |
| `close-on-backdrop` | `boolean \| string` | `true` | 点击遮罩是否关闭 |
| `close-on-esc` | `boolean \| string` | `true` | 按 ESC 是否关闭 |
| `no-transition` | `boolean \| string` | `false` | 禁用过渡动画（用于嵌套场景） |

| 插槽 | 说明 |
|------|------|
| 默认插槽 | 对话框主体内容 |
| `header` | 自定义头部 |
| `footer` | 底部操作区（插槽 prop `close` 可直接调用关闭） |


### divider — 分割线

水平或垂直分割线。

```xml
<sys-text>上方内容</sys-text>
<divider />
<sys-text>下方内容</sys-text>

<hbox>
  <sys-text>左</sys-text>
  <divider direction="vertical" />
  <sys-text>右</sys-text>
</hbox>
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `direction` | `string` | `horizontal` | 方向：`horizontal` / `vertical` |
| `variant` | `string` | `solid` | 样式：`solid` / `dashed` / `dotted` / `thick` |
| `margin` | `string` | `0.5rem 0`（水平）/ `0 0.5rem`（垂直） | 外边距 |


### spacer — 弹性间距

占据剩余空间的弹性间距元素。在 `hbox` / `vbox` 中常用作"把后续元素挤到末尾"的占位符。

```xml
<hbox>
  <sys-text>左对齐</sys-text>
  <spacer />
  <sys-button>右对齐按钮</sys-button>
</hbox>
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `height` | `string` | — | 固定高度（设置后不再弹性撑开） |
| `width` | `string` | — | 固定宽度（设置后不再弹性撑开） |

::: tip
不传 `height` / `width` 时，`spacer` 默认 `flex: 1`，撑满剩余空间。
:::


## 基础组件

### sys-text — 文本显示

显示静态或动态文本内容，支持 MD3 排版变体。

```xml
<sys-text variant="headline">大标题</sys-text>
<sys-text variant="caption" color="#888">辅助说明</sys-text>
<sys-text truncate>这段超长文字会被截断为省略号</sys-text>
<sys-text>你好，{username}</sys-text>
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `variant` | `string` | `body` | 排版变体：`body` / `title` / `subtitle` / `caption` / `headline` / `overline` |
| `color` | `string` | — | 文本颜色（任意 CSS 颜色值） |
| `align` | `string` | — | 对齐：`left` / `center` / `right` / `justify` |
| `bold` | `boolean` | `false` | 加粗 |
| `italic` | `boolean` | `false` | 斜体 |
| `truncate` | `boolean` | `false` | 超出省略号截断 |

::: warning 没有 value 属性
`sys-text` 没有名为 `value` 的属性，文本通过**默认插槽**传入：`<sys-text>内容</sys-text>`。在插槽里可以使用 `{占位符}` 表达式。
:::

变体样式参考：

| 变体 | 字号 / 字重 |
|------|-------------|
| `headline` | 1.75rem / 700 |
| `title` | 1.25rem / 700 |
| `subtitle` | 1rem / 600 |
| `body` | 0.875rem / 400 |
| `caption` | 0.75rem，使用次级文字色 |
| `overline` | 0.6875rem / 700，大写 + 字间距 |


### sys-input — 输入框

单行文本输入框。

```xml
<sys-input label="用户名" bind:value="username" placeholder="请输入用户名" />
<sys-input label="邮箱" type="email" bind:value="email" />
<sys-input label="数量" type="number" bind:value="count" disabled="{!editable}" />
<sys-input label="名称" bind:value="form.name" error="名称不能为空" />
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `label` | `string` | — | 输入框标签（聚焦时上浮高亮） |
| `placeholder` | `string` | — | 占位文本（聚焦时隐藏） |
| `type` | `string` | `text` | 输入类型：`text` / `email` / `password` / `number` / `search` / `tel` / `url` |
| `value` | `string \| number` | — | 当前值（一般用 `bind:value` 双向绑定） |
| `disabled` | `boolean \| 表达式` | `false` | 是否禁用 |
| `readonly` | `boolean` | `false` | 是否只读 |
| `error` | `string` | — | 错误提示信息（出现时有抖动动画） |
| `animated` | `boolean` | `true` | 聚焦时是否启用动画 |

| 事件 | 参数 | 说明 |
|------|------|------|
| `on-change` | `(value: string)` | 值变化时触发（`bind:value` 自动写回，通常无需手动监听） |
| `on-focus` | `(event: FocusEvent)` | 获得焦点 |
| `on-blur` | `(event: FocusEvent)` | 失去焦点 |


### sys-textarea — 多行文本框

多行文本输入框。

```xml
<sys-textarea label="描述" bind:value="description" rows="4" placeholder="请输入描述" />
<sys-textarea label="备注" bind:value="note" maxlength="500" error="最多 500 字" />
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `label` | `string` | — | 标签 |
| `placeholder` | `string` | — | 占位文本 |
| `value` | `string` | — | 当前值 |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `rows` | `string` | `"3"` | 可见行数 |
| `maxlength` | `string \| number` | — | 最大字符数 |
| `error` | `string` | — | 错误提示 |

| 事件 | 参数 | 说明 |
|------|------|------|
| `on-change` | `(value: string)` | 值变化时触发 |
| `on-focus` | `(event: FocusEvent)` | 获得焦点 |
| `on-blur` | `(event: FocusEvent)` | 失去焦点 |


### sys-select — 下拉选择

下拉选择框，**通过默认插槽的 `<option>` 子元素**声明选项。

```xml
<sys-select label="语言" bind:value="lang" placeholder="请选择">
  <option value="zh">中文</option>
  <option value="en">English</option>
  <option value="ja">日本語</option>
</sys-select>

<sys-select label="主题" bind:value="theme" error="请选择主题">
  <option value="light">浅色</option>
  <option value="dark">深色</option>
</sys-select>
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `label` | `string` | — | 标签 |
| `value` | `string` | — | 当前选中值 |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `placeholder` | `string` | — | 占位文本（渲染为禁用的首项） |
| `error` | `string` | — | 错误提示 |

| 事件 | 参数 | 说明 |
|------|------|------|
| `on-change` | `(value: string)` | 选中值变化时触发 |
| `on-focus` | `(event: FocusEvent)` | 获得焦点 |
| `on-blur` | `(event: FocusEvent)` | 失去焦点 |

::: warning 没有 options 属性
`sys-select` 没有 `options` 属性。选项必须通过默认插槽的 `<option>` 子元素声明（与原生 `<select>` 一致）。
:::


### sys-switch — 开关

开关切换组件。

```xml
<sys-switch label="启用通知" bind:value="notifications_enabled" />
<sys-switch label="深色模式" bind:value="dark_mode" color="#705575" />
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `label` | `string` | — | 标签文本 |
| `value` | `string \| boolean` | — | 当前值（`"true"` / `"false"` 字符串或布尔值） |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `color` | `string` | — | 开启时轨道颜色（任意 CSS 颜色） |

| 事件 | 参数 | 说明 |
|------|------|------|
| `on-change` | `(value: boolean)` | 状态变化时触发 |


### sys-slider — 滑块

滑块选择组件。

```xml
<sys-slider label="音量" bind:value="volume" min="0" max="100" step="1" show-value="true" />
<sys-slider label="亮度" bind:value="brightness" min="0" max="255" disabled="{!editable}" />
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `label` | `string` | — | 标签 |
| `value` | `string \| number` | `50` | 当前值 |
| `min` | `string \| number` | `0` | 最小值 |
| `max` | `string \| number` | `100` | 最大值 |
| `step` | `string \| number` | `1` | 步长 |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `show-value` | `boolean` | `false` | 是否在头部右侧显示当前数值 |

| 事件 | 参数 | 说明 |
|------|------|------|
| `on-change` | `(value: number)` | 拖动时触发 |


### sys-date-picker — 日期选择器

日期 / 时间 / 月选择组件，基于原生 `<input type="date|time|month|datetime-local">`。

```xml
<sys-date-picker label="选择日期" bind:value="selected_date" />
<sys-date-picker label="时间" type="time" bind:value="meeting_time" />
<sys-date-picker label="生日" type="date" bind:value="birthday" min="1900-01-01" max="2025-12-31" />
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `label` | `string` | — | 标签 |
| `value` | `string` | — | 当前日期值（ISO 字符串） |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `type` | `string` | `date` | 输入类型：`date` / `time` / `month` / `week` / `datetime-local` |
| `min` | `string` | — | 最小值 |
| `max` | `string` | — | 最大值 |

| 事件 | 参数 | 说明 |
|------|------|------|
| `on-change` | `(value: string)` | 值变化时触发 |


### sys-button — 按钮

MD3 风格按钮，支持五种变体、loading 状态、icon、ripple 涟漪动画。

```xml
<sys-button variant="filled" on-click="api: saveData">保存</sys-button>
<sys-button variant="outlined" on-click="notify: '已取消'">取消</sys-button>
<sys-button variant="text">了解更多</sys-button>
<sys-button variant="tonal" icon="settings">设置</sys-button>
<sys-button variant="elevated" icon="upload">上传</sys-button>

<sys-button
  variant="filled"
  on-click="api: saveProfile"
  loading="{api.saveProfile.pending}"
  disabled="{!form_valid}"
  block="true"
>
  提交
</sys-button>
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `variant` | `string` | `filled` | 变体：`filled` / `outlined` / `text` / `tonal` / `elevated` |
| `icon` | `string` | — | Material Symbols 图标名（位于文本左侧） |
| `disabled` | `boolean \| 表达式` | `false` | 是否禁用 |
| `loading` | `string \| boolean` | `false` | `"true"` 时显示旋转动画并禁用点击 |
| `block` | `boolean` | `false` | 是否撑满父容器宽度（`display: flex; width: 100%`） |
| `size` | `string` | `medium` | 尺寸：`small` / `medium` / `large` |

| 事件 | 参数 | 说明 |
|------|------|------|
| `on-click` | — | 点击时触发（loading / disabled 时不触发） |

::: tip loading 用法
`loading` 接受字符串 `"true"` / `"false"` 或布尔值。常配合 API 模板的自动状态变量使用：`loading="{api.saveProfile.pending}"`。
:::


### sys-icon-button — 图标按钮

仅显示图标的圆形按钮，支持多种变体与尺寸。

```xml
<sys-icon-button icon="delete" on-click="confirm: '确定删除？' | api: deleteItem" />
<sys-icon-button icon="add" variant="filled" on-click="api: newItem" />
<sys-icon-button icon="settings" variant="outlined" size="small" />
<sys-icon-button icon="save" loading="{api.save.pending}" on-click="api: save" />
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `icon` | `string` | `circle` | Material Symbols 图标名 |
| `variant` | `string` | `standard` | 变体：`standard` / `filled` / `tonal` / `outlined` |
| `size` | `string` | `medium` | 尺寸：`small` (32px) / `medium` (40px) / `large` (48px) |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `loading` | `string` | `"false"` | `"true"` 时显示旋转动画并禁用点击 |

| 事件 | 参数 | 说明 |
|------|------|------|
| `on-click` | — | 点击时触发 |


### sys-icon — 图标

显示 Material Symbols 图标。可设尺寸、颜色、自旋。

```xml
<sys-icon name="settings" />
<sys-icon name="loading" size="32px" spin />
<sys-icon name="warning" color="#f59e0b" size="24px" />
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `name` | `string` | — | Material Symbols 图标名 |
| `size` | `string` | `24px` | 图标尺寸（CSS font-size） |
| `color` | `string` | — | 图标颜色 |
| `spin` | `boolean` | `false` | 是否旋转（用于 loading 类图标） |


### sys-tag — 标签

小标签组件，通过**默认插槽**设置文本，可选关闭按钮和前置图标。

```xml
<sys-tag>新功能</sys-tag>
<sys-tag variant="primary">置顶</sys-tag>
<sys-tag variant="success" icon="check">已通过</sys-tag>
<sys-tag variant="error" closable on-close="api: removeTag">阻塞性</sys-tag>
<sys-tag color="#ff5722">自定义颜色</sys-tag>
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `variant` | `string` | `default` | 变体：`default` / `primary` / `error` / `success` / `warning` / `info` |
| `color` | `string` | — | 自定义背景色（覆盖 `variant`） |
| `icon` | `string` | — | 前置 Material Symbols 图标名 |
| `closable` | `boolean` | `false` | 是否显示关闭按钮 |

| 事件 | 参数 | 说明 |
|------|------|------|
| `on-close` | — | 点击关闭按钮时触发 |

::: warning 没有 text 属性
`sys-tag` 没有 `text` 属性。文本通过**默认插槽**传入：`<sys-tag>标签文字</sys-tag>`。
:::


### sys-badge — 徽章

状态徽章 / 数字标记，包装在子元素周围（默认插槽是被标记的内容）。

```xml
<sys-icon-button icon="notifications" />
<sys-badge value="3">
  <sys-icon-button icon="notifications" />
</sys-badge>

<sys-badge value="99+" variant="error">
  <sys-icon name="mail" />
</sys-badge>

<sys-badge variant="primary">
  <sys-icon name="account" />
</sys-badge>
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `value` | `string \| number` | — | 徽章内容（数字会与 `max` 比较） |
| `max` | `number` | — | 数字上限，超过显示为 `N+` |
| `variant` | `string` | `error` | 变体：`error` / `primary` / `success` / `warning` / `info` |
| `color` | `string` | — | 自定义背景色 |

::: warning 没有 text 属性
`sys-badge` 没有 `text` 属性。徽章文字用 `value` 属性传入，被标记的内容写在**默认插槽**里。无 `value` 时显示为小圆点。
:::


## 高级组件

### sys-table — 数据表格

接收 JSON 数据和列配置，渲染为 MD3 风格表格，支持斑马纹、行 hover、空状态、内置分页。

```xml
<definitions>
  <api id="loadUsers" method="GET" url="/api/users" response-to="users" auto-fetch="true" />
</definitions>

<sys-table
  data="{users}"
  columns='[{"key":"name","label":"姓名"},{"key":"email","label":"邮箱","width":"200px"},{"key":"status","label":"状态","align":"center"}]'
  striped="true"
  page-size="10"
/>
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `data` | `string \| array` | — | JSON 数据（字符串或数组对象，建议用占位符 `{users}` 直接传数组） |
| `columns` | `string \| array` | — | 列定义 JSON：`[{"key":"字段名","label":"显示名","width":"宽度","align":"left\|center\|right"}]`。省略时自动从数据首行推断列 |
| `striped` | `string` | `"false"` | 是否显示斑马纹 |
| `page-size` | `string` | — | 每页行数（不传或 `0` 表示不分页） |
| `hoverable` | `boolean` | `true` | 行是否响应 hover 高亮 |
| `animated` | `boolean` | `true` | 行是否启用 stagger 入场动画 |

::: tip 占位符传数组
当 `data` 通过占位符 `{users}` 绑定且值为数组时，由于表达式求值保留原始类型，组件会直接接收到数组对象，无需 `JSON.parse`。`columns` 同理。
:::


### sys-chart — 图表

基于 ECharts 的交互式图表组件，自动读取 MD3 主题色，与主页面保持一致风格。

```xml
<definitions>
  <var name="chart_data" default='{"xAxis":["Mon","Tue","Wed"],"series":[{"name":"访问量","data":[120,200,150]}]}' />
</definitions>

<sys-chart type="line" data="{chart_data}" height="320px" />
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `type` | `string` | `line` | 图表类型：`line` / `bar` / `pie` / `scatter` / `radar`；不传且 `data` 含 `option` 字段时使用完整 ECharts option |
| `data` | `string \| object` | — | 图表数据 JSON（简化格式或完整 ECharts option） |
| `height` | `string` | `300px` | 图表高度 |
| `theme` | `string` | — | 主题：`light` / `dark`（默认跟随系统） |
| `loading` | `string` | — | `"true"` 时显示 ECharts 内置 loading 动画 |

**简化数据格式（type=line/bar）：**

```json
{
  "title": "周访问量统计",
  "xAxis": ["Mon", "Tue", "Wed"],
  "series": [
    { "name": "邮件", "data": [120, 132, 101] },
    { "name": "访问", "data": [220, 182, 191] }
  ]
}
```

**简化数据格式（type=pie）：**

```json
{
  "title": "访问来源分布",
  "series": [
    { "name": "搜索引擎", "value": 1048 },
    { "name": "直接访问", "value": 735 },
    { "name": "邮件营销", "value": 580 }
  ]
}
```

**简化数据格式（type=scatter）：**

```json
{
  "series": [
    { "name": "样本A", "data": [[10, 8.04], [8, 6.95], [13, 7.58]] }
  ]
}
```

**简化数据格式（type=radar）：**

```json
{
  "title": "部门能力评估",
  "indicator": [
    { "name": "销售", "max": 6500 },
    { "name": "管理", "max": 16000 }
  ],
  "series": [
    { "name": "预算", "data": [4200, 3000] },
    { "name": "实际", "data": [5000, 14000] }
  ]
}
```

**完整 ECharts option：**

当不指定 `type` 或 `data` 含 `option` 字段时，直接作为 ECharts 配置使用，未指定 `color` 时会自动注入 MD3 配色：

```xml
<sys-chart data='{"option":{"title":{"text":"自定义图表"},"xAxis":{"type":"category","data":["A","B"]},"yAxis":{"type":"value"},"series":[{"type":"bar","data":[10,20]}]}}' />
```


### sys-form — 表单容器

表单容器，包装原生 `<form>`，提供间距、布局、loading 遮罩与提交事件。

```xml
<sys-form gap="1rem" layout="block" loading="{api.saveForm.pending}" on-submit="api: saveForm | notify: '已提交'">
  <sys-input label="名称" bind:value="form.name" />
  <sys-input label="邮箱" bind:value="form.email" type="email" />
  <sys-switch label="启用" bind:value="form.enabled" />
  <hbox>
    <sys-button variant="filled" on-click="api: saveForm">提交</sys-button>
    <sys-button variant="text" on-click="reset: form">重置</sys-button>
  </hbox>
</sys-form>
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `gap` | `string` | `1rem` | 子元素间距 |
| `layout` | `string` | `block` | 布局：`block`（纵向）/ `inline`（横向 wrap） |
| `loading` | `boolean` | `false` | 是否显示 loading 遮罩（遮住整个表单） |

| 事件 | 参数 | 说明 |
|------|------|------|
| `on-submit` | `(event: Event)` | 表单提交时触发（已自动 `preventDefault`） |
| `on-reset` | `(event: Event)` | 表单重置时触发 |


### sys-list — 列表

渲染数组数据为列表项，支持分割线、两行布局、stagger 入场动画，可通过具名插槽 `item` 自定义每项展示。

```xml
<sys-list data="{items}" divider="true" />

<sys-list data="{users}" two-line="true" animated="true">
  <template #item="{ item, index }">
    <hbox>
      <sys-text variant="subtitle">{item.name}</sys-text>
      <sys-text variant="caption">{item.email}</sys-text>
    </hbox>
  </template>
  <template #empty>
    <sys-text>暂无用户</sys-text>
  </template>
</sys-list>
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `data` | `string \| array` | — | JSON 数据数组（建议用占位符传数组） |
| `divider` | `string` | `"true"` | 是否显示分割线（设为 `"false"` 关闭） |
| `two-line` | `boolean` | `false` | 是否启用两行布局（纵向 flex） |
| `animated` | `boolean` | `true` | 是否启用 stagger 入场动画 |

| 插槽 | 作用域参数 | 说明 |
|------|------------|------|
| `item` | `item`, `index` | 自定义每一项的渲染（默认序列化为字符串） |
| `empty` | — | 无数据时的占位（默认显示"暂无数据"） |


## 浮层组件

### sys-toast — Toast 通知

浮层通知组件。**XML 轨通常不直接使用此组件**——通过 `notify:` 管道指令或调用前端 `sys.ui.notify()` 即可触发系统级 Toast。本组件主要用于 HTML 轨直接以自定义元素形式展示 toast。

```xml
<sys-toast message="保存成功" level="success" duration="3000" placement="top" />
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `message` | `string` | — | Toast 文本 |
| `level` | `string` | `info` | 级别：`info` / `success` / `warning` / `error` |
| `duration` | `number` | `3000` | 显示时长（毫秒），`0` 表示不自动关闭 |
| `placement` | `string` | `top` | 显示位置：`top` / `bottom` |

| 事件 | 参数 | 说明 |
|------|------|------|
| `on-show` | — | 显示时触发 |
| `on-close` | — | 关闭时触发（点击 Toast 也会触发） |

::: tip 推荐用法
XML 轨里几乎不会直接写 `<sys-toast>`，使用 `notify:` 管道指令更简洁：

```xml
<sys-button on-click="api: save | notify: '保存成功', success">保存</sys-button>
```
:::


## 通用属性

以下属性可应用于任何 XML 组件：

| 属性 | 类型 | 说明 |
|------|------|------|
| `hidden` | `string` | 条件表达式，求值为 `true` 时隐藏组件（不传递给底层组件） |
| `disabled` | `string` | 条件表达式，求值为 `true` 时禁用组件 |
| `mobile-only` | — | 仅在移动端显示（无需值） |
| `desktop-only` | — | 仅在桌面端显示（无需值） |
| `bind:propName` | `string` | 将 `propName` prop 双向绑定到变量池路径 |
| `on-eventName` | `string` | 绑定事件到管道指令（kebab-case 自动转 camelCase：`on-click` → `onClick`） |

## 完整示例

```xml
<page>
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
        <sys-button variant="outlined"
                    on-click="api: loadUsers | notify: '已刷新'">
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
