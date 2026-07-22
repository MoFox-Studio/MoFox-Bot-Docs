# HTML sys API

`sys` 是 HTML 轨插件与系统交互的**唯一桥接对象**。每个 HTML 沙箱实例都对应一个独立的 `sys`，挂在 `window.__plugin_sys_<pageId>` 上。沙箱在执行你的 `scripts` 之前会自动注入前缀：

```javascript
const sys = window.__plugin_sys_<pageId>;
```

因此你的脚本里直接用 `sys.*` 即可，无需手动取。

::: warning sys 是唯一通道
与系统的所有交互都通过 `sys.*`。裸 `window.fetch` 虽然也被代理（注入 Token），但**不做 BaseResponse 解包**，仅用于兼容第三方库。要拿系统数据请用 `sys.request` / `sys.api`。
:::

## 总览

| 命名空间 | 类型 | 作用 |
|----------|------|------|
| `sys.vars` | 读写代理 | page scope 变量池（响应式） |
| `sys.plugin` | 读写代理 | plugin scope 变量池 |
| `sys.global` | 只读 | global scope 变量池 |
| `sys.api(id, params?)` | `async` | 调用预定义 API 模板 |
| `sys.request(url, options?)` | `async` | fetch 风格的统一请求方法 |
| `sys.bus` | 对象 | page 级事件总线 |
| `sys.ui` | 对象 | UI 交互（toast / confirm / alert / dialog） |
| `sys.theme` | 只读 | 当前主题 |
| `sys.route` | 对象 | 路由信息与跳转 |
| `sys.format` | 对象 | 格式化工具（date / number / currency） |
| `sys.i18n` | 对象 | 国际化 |
| `sys.destroy()` | 方法 | 销毁（一般由沙箱调用，不需要插件主动调） |

## sys.vars / sys.plugin / sys.global — 变量池

变量池分三个 scope，对应不同的生命周期：

| scope | 字段 | 可见范围 | 写入 |
|-------|------|----------|------|
| page | `sys.vars` | 仅当前页面 | 可读可写 |
| plugin | `sys.plugin` | 同一插件的所有页面 | 可读可写 |
| global | `sys.global` | 所有插件所有页面 | **只读** |

### 用法

```javascript
// 读写 page scope
sys.vars.counter = 0
sys.vars.counter++
console.log(sys.vars.counter)        // 1

// 读写 plugin scope（跨页面共享）
sys.plugin.lastVisited = Date.now()
// 在另一个页面：
console.log(sys.plugin.lastVisited)

// 读 global scope
console.log(sys.global.theme?.mode)   // 'auto' / 'light' / 'dark'
```

### 响应式

`sys.vars` / `sys.plugin` 是 Proxy 包装的响应式对象，写入会同时通知 XML 轨道里 `<var>` 声明的同名变量与所有依赖此变量的 `sys-*` 组件。

::: tip 与 XML 轨变量共享
XML 轨用 `<var name="counter" default="0" />` 声明的变量，与 HTML 轨里 `sys.vars.counter` 是**同一份**变量池数据。同一插件切换 XML / HTML 模式时，变量会自动同步。
:::

## sys.api(id, params?) — 调用 API 模板

调用 `<definitions>` 中声明的预定义 API 模板，与 XML 轨的 `api: id` 管道指令等价。

```typescript
sys.api(id: string, params?: Record<string, any>): Promise<any>
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | API 模板 ID（XML 轨 `<api id="...">` 注册的） |
| `params` | `Record<string, any>` | 可选的调用参数，会覆盖模板内的占位符求值 |

**返回**：Promise，resolve 为 API 响应数据（已通过 BaseResponse 解包到 `data`）。失败时 reject `Error`。

### 示例

XML 轨侧声明 API 模板：

```xml
<definitions>
  <api id="loadUsers" method="GET" url="/api/users" response-to="users" />
  <api id="saveUser" method="POST" url="/api/users"
       body='{"name": "{name}", "email": "{email}"}' />
</definitions>
```

HTML 轨侧调用：

```javascript
// 不带参数
const users = await sys.api('loadUsers')
console.log(users)

// 带参数（覆盖占位符）
const result = await sys.api('saveUser', { name: '张三', email: 'zs@example.com' })
sys.ui.toast('保存成功', 'success')
```

::: tip API 模板的复用
`<api>` 模板可在 XML 轨与 HTML 轨之间复用。同一份声明在两个轨道下都能通过 `api: id`（XML）或 `sys.api(id)`（HTML）调用。
:::

## sys.request(url, options?) — 统一请求方法

fetch 风格的统一请求方法，**自动注入 Token + 解包 BaseResponse.data**，是调系统接口的首选入口。

```typescript
sys.request(url: string, options?: RequestInit): Promise<any>
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `url` | `string` | 请求 URL（相对路径会拼到 WebUI 后端基地址） |
| `options` | `RequestInit` | 标准 fetch options：`method` / `headers` / `body` 等 |

**返回**：Promise，resolve 为 BaseResponse 解包后的 `data` 字段（即业务数据）。

### 与裸 `window.fetch` 的差异

| 维度 | `sys.request` | 裸 `window.fetch` |
|------|---------------|---------------------|
| 注入 Token / `X-API-Key` / `X-Plugin-Name` | ✅ | ✅（沙箱已重写 fetch） |
| BaseResponse 解包 | ✅ 自动取 `.data` | ❌ 透传原始 Response |
| 错误统一 Toast | ✅ 失败时自动 Toast | ❌ 需自行处理 |
| 系统重启拦截 | ✅ 重启中拒绝请求 | ❌ 不拦截 |
| 适用场景 | 调系统接口 | 调第三方接口（不需要解包的） |

### 示例

```javascript
// GET 请求
const users = await sys.request('/my-plugin/users')
console.log(users)

// POST 请求
const result = await sys.request('/my-plugin/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: '张三', email: 'zs@example.com' }),
})

// FormData 上传
const fd = new FormData()
fd.append('file', fileInput.files[0])
const uploadResult = await sys.request('/my-plugin/upload', {
  method: 'POST',
  body: fd,        // 不要手动设 Content-Type，让浏览器自动加 boundary
})

// DELETE
await sys.request(`/my-plugin/tasks/${taskId}`, { method: 'DELETE' })
```

### 错误处理

`sys.request` 在以下情况会 reject：

- 网络错误（无法连接后端）
- HTTP 状态码非 2xx
- BaseResponse `code !== 200`（业务错误）

失败时会自动 Toast 提示，**仍会 reject 给你的 catch 块**，便于做后续处理：

```javascript
try {
  const data = await sys.request('/my-plugin/data')
  // ...
} catch (e) {
  // Toast 已自动弹出，这里可做额外处理（如重试 / 跳转）
  console.error('请求失败', e)
}
```

### 调第三方接口

第三方接口通常不返回 BaseResponse 结构，`sys.request` 会因为 `code !== 200` 而 reject。此时**改用裸 `window.fetch`**（沙箱已重写，会注入 Token）：

```javascript
// 第三方接口：直接用 fetch（已被沙箱代理，自动带 Token）
const res = await fetch('https://api.example.com/weather')
const data = await res.json()
```

::: tip 第三方接口的 Token 注入
注意：第三方接口可能不期望收到 `Authorization` / `X-API-Key` 头。如果你的第三方接口对未知头敏感，需在请求时显式覆盖：

```javascript
const res = await fetch('https://api.example.com/weather', {
  headers: { 'Authorization': 'Bearer third-party-token' }  // 覆盖代理注入的头
})
```
:::

## sys.bus — 事件总线

page 级事件总线，用于跨组件 / 跨脚本通信。仅当前页面可见，页面销毁时自动清理。

```typescript
sys.bus.on(event: string, fn: (...args: any[]) => void): void
sys.bus.off(event: string, fn: (...args: any[]) => void): void
sys.bus.emit(event: string, ...args: any[]): void
```

### 示例

```javascript
// 订阅事件
function onUserUpdated(user) {
  console.log('用户已更新：', user)
  sys.ui.toast(`用户 ${user.name} 已更新`, 'info')
}
sys.bus.on('user:updated', onUserUpdated)

// 触发事件（可带任意参数）
sys.bus.emit('user:updated', { id: 1, name: '张三' })

// 取消订阅
sys.bus.off('user:updated', onUserUpdated)
```

::: warning 仅 page scope
事件总线只在当前页面内有效。跳转到其他页面后，所有事件监听器自动随沙箱销毁而清理。
:::

## sys.ui — UI 交互

提供 toast / 对话框 / dialog 控制等快捷方法，所有方法都直接调用系统级 UI（不依赖 `sys-*` 自定义元素）。

```typescript
sys.ui.notify(msg: string, level?: 'info' | 'success' | 'warn' | 'error'): void
sys.ui.toast(msg: string, level?: 'info' | 'success' | 'warn' | 'error'): void
sys.ui.notice(msg: string, opts?: any): void
sys.ui.confirm(msg: string, opts?): Promise<boolean>
sys.ui.alert(msg: string, opts?): Promise<void>
sys.ui.dialog.open(id: string): void
sys.ui.dialog.close(id: string): void
```

### notify / toast — Toast 通知

`notify` 与 `toast` 是同义别名，都触发系统 Toast。

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `msg` | `string` | — | 通知文本 |
| `level` | `'info' \| 'success' \| 'warn' \| 'error'` | `'info'` | 级别 |

```javascript
sys.ui.toast('保存成功', 'success')
sys.ui.toast('请输入名称', 'warn')
sys.ui.toast('网络错误', 'error')
sys.ui.notify('这是一条普通通知')
```

### notice — 通知中心

预留方法，当前实现为 toast。未来接入 WebUI 通知中心。

```javascript
sys.ui.notice('系统将于今晚维护', { title: '系统通知' })
```

### confirm — 确认对话框

异步返回 boolean，用户点击「确认」返回 `true`，点击「取消」返回 `false`。

```typescript
sys.ui.confirm(msg: string, opts?: {
  title?: string
  confirmText?: string
  cancelText?: string
}): Promise<boolean>
```

```javascript
const ok = await sys.ui.confirm('确认要删除这条记录吗？', {
  title: '危险操作',
  confirmText: '删除',
  cancelText: '取消',
})
if (ok) {
  await sys.request(`/my-plugin/records/${id}`, { method: 'DELETE' })
  sys.ui.toast('已删除', 'success')
}
```

### alert — 警告对话框

异步返回，用户点击「确定」后 resolve。

```typescript
sys.ui.alert(msg: string, opts?: { title?: string }): Promise<void>
```

```javascript
await sys.ui.alert('文件大小超过 5MB 限制', { title: '上传失败' })
```

### dialog.open / dialog.close — 控制自定义 Dialog

通过 `id` 控制页面里声明的 `<sys-dialog>` 元素开关。等价于设置 `__dialog_<id>_open` 变量。

```javascript
sys.ui.dialog.open('editDlg')     // 打开 id="editDlg" 的对话框
sys.ui.dialog.close('editDlg')    // 关闭
```

```html
<sys-dialog id="editDlg" title="编辑">
  <sys-input label="名称" />
  <template #footer>
    <sys-button onclick="sys.ui.dialog.close('editDlg')">取消</sys-button>
    <sys-button onclick="save()">保存</sys-button>
  </template>
</sys-dialog>
```

## sys.theme — 当前主题

只读，反映系统当前主题设置。

```typescript
sys.theme: { mode: string; primary: string }
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `mode` | `string` | `'auto'` / `'light'` / `'dark'` |
| `primary` | `string` | 主色十六进制值（如 `'#0058bd'`） |

```javascript
console.log(sys.theme.mode, sys.theme.primary)
// 'auto' '#0058bd'
```

::: tip 主题切换响应
主题在主站设置面板里改后，`sys.theme` 会动态更新。CSS 变量 `--md-sys-color-*` 也会同步刷新，组件样式会自动跟着变。
:::

## sys.route — 路由

提供当前路由信息与跨页面跳转能力。

```typescript
sys.route.current: string         // 当前路径（只读 getter）
sys.route.back(): void            // 返回上一页
sys.route.go(plugin: string, page: string): void  // 跳转到指定插件的页面
```

| 方法 | 说明 |
|------|------|
| `current` | 当前路由 fullPath |
| `back()` | 调用 `router.back()` |
| `go(plugin, page)` | 跳转到指定插件的 UI 页面 |

```javascript
console.log(sys.route.current)
// '/plugin-ui?plugin=my_plugin&page=home'

sys.route.back()                              // 返回上一页
sys.route.go('my_plugin', 'settings')        // 跳到 my_plugin/settings
```

::: warning 路径由系统管理
插件**不能**手写绝对路径跳转（如 `location.href = '/dashboard'`）—— 会绕过 WebUI 路由系统。跨页面跳转一律用 `sys.route.go(plugin, page)`。
:::

## sys.format — 格式化工具

提供日期、数字、货币三件套。

```typescript
sys.format.date(val: any, pattern?: string): string
sys.format.number(val: number, opts?: Intl.NumberFormatOptions): string
sys.format.currency(val: number, opts?: Intl.NumberFormatOptions): string
```

### format.date

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `val` | `any` | — | 日期值（字符串 / Date 实例 / 时间戳） |
| `pattern` | `string` | `'yyyy-MM-dd HH:mm:ss'` | 模式字符串 |

支持的占位符：`yyyy` / `MM` / `dd` / `HH` / `mm` / `ss`。

```javascript
sys.format.date(new Date())
// '2026-07-22 14:30:05'

sys.format.date('2026-07-22T14:30:05Z', 'yyyy/MM/dd HH:mm')
// '2026/07/22 14:30'

sys.format.date(null)        // '' （空值安全）
sys.format.date('不是日期')   // '不是日期'（无法解析时原样返回）
```

### format.number

基于 `Intl.NumberFormat`，可传入任意 `Intl.NumberFormatOptions`。

```javascript
sys.format.number(1234567.89)
// '1,234,567.89'

sys.format.number(0.851, { style: 'percent', minimumFractionDigits: 1 })
// '85.1%'

sys.format.number(1234567, { notation: 'compact' })
// '1.2M'
```

### format.currency

```javascript
sys.format.currency(99.99)
// '¥99.99'

sys.format.currency(99.99, { currency: 'USD' })
// '$99.99'

sys.format.currency(1234567, { currency: 'CNY', notation: 'compact' })
// '¥1.2M'
```

## sys.i18n — 国际化

调用主站 `i18n` 工具，复用 WebUI 已注册的翻译字典。

```typescript
sys.i18n.t(key: string, params?: Record<string, string>): string
```

```javascript
sys.i18n.t('common.save')               // '保存'
sys.i18n.t('common.welcome', { name: '张三' })  // '欢迎你，张三'
```

::: warning 字典与主站共享
`sys.i18n` 复用主站的翻译字典，**插件无法注册自己的字典**。如果需要插件自己的多语言文案，建议在 `sys.vars` 中存一份字典对象，自行查找。
:::

## sys.destroy() — 销毁

清理事件总线、解除监听。**通常不需要插件主动调用** —— 沙箱销毁时会自动调：

```javascript
sys.destroy()    // 清空 bus 监听器
```

## 完整示例

下面是一段典型用法，覆盖了大部分 API：

```javascript
// 沙箱已自动注入：const sys = window.__plugin_sys_<pageId>;

const host = document.querySelector('.html-sandbox-host')
const root = host.shadowRoot
const $ = (s) => root.querySelector(s)

// 1. 写入 page scope 变量
sys.vars.counter = 0

// 2. 调用 API（用 sys.request 拿数据）
async function loadUsers() {
  try {
    const users = await sys.request('/my-plugin/users')
    $('#users-table').data = users
    sys.vars.userCount = users.length
  } catch (e) {
    sys.ui.toast('加载用户列表失败', 'error')
  }
}

// 3. 监听组件事件
$('#refresh-btn').addEventListener('click', loadUsers)

$('#add-btn').addEventListener('click', async () => {
  const name = $('#name-input').value.trim()
  if (!name) {
    sys.ui.toast('请输入用户名', 'warn')
    return
  }

  // 4. 危险操作：先 confirm
  const ok = await sys.ui.confirm(`确认添加用户「${name}」？`)
  if (!ok) return

  try {
    await sys.request('/my-plugin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    $('#name-input').value = ''
    await loadUsers()
    sys.ui.toast('用户添加成功', 'success')

    // 5. 通过事件总线通知其他组件
    sys.bus.emit('user:added', { name })
  } catch (e) {
    // sys.request 已自动 Toast，这里只需做额外处理
    console.error(e)
  }
})

// 6. 订阅事件总线
sys.bus.on('user:added', ({ name }) => {
  $('#last-added').textContent = `最近添加：${name}`
})

// 7. 显示系统信息
$('#theme-info').textContent = `主题：${sys.theme.mode}，主色：${sys.theme.primary}`
$('#now').textContent = sys.format.date(new Date())
$('#route').textContent = sys.route.current

// 8. 初始化加载
loadUsers()
console.log('[my-plugin] 初始化完成')
```

## 相关文档

- [HTML 开发](./html) — HTML 轨快速入门与沙箱环境
- [HTML 组件参考](./html-components) — 所有 `sys-*` 自定义元素的属性与用法
- [XML 入门](./xml) — 对比 XML 轨的声明式写法（API 模板共用）
