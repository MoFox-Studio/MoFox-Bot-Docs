# 插件配置怎么改

不管是你 clone 下来就自带的[内置插件](/docs/guides/builtin)，还是从[插件市场](/docs/guides/plugins)装的第三方插件，配置方式都是同一套：配置文件统一放在 `config/plugins/<插件名>/config.toml`，插件**第一次被加载时**会自动生成带注释的默认配置文件，不用手动建。

::: tip 看不懂某个词？
文中出现的 [TOML](/docs/guides/glossary#toml) 等术语，都收录在[名词小课堂](/docs/guides/glossary)里；TOML 具体怎么写（包括三引号多行字符串），见 [TOML 与编辑器](/docs/guides/toml)。
:::

两种改法选你顺手的：

<MethodTabs dimension="config" :options="[{ value: 'file', label: '配置文件', icon: 'mdi:file-document-outline' }, { value: 'webui', label: 'WebUI', icon: 'mdi:monitor-dashboard' }]">

<MethodTab value="file">

1. 用任意文本编辑器（记事本、VS Code 都行）打开 `config/plugins/<插件名>/config.toml`，直接改字段。
2. 保存后重启 Bot 生效；核心升级带来新配置字段时，文件也会自动补上，不用手动合并。

</MethodTab>

<MethodTab value="webui">

1. 打开 WebUI 的「插件配置」页面（WebUI 本身怎么装见 [WebUI 指南](/docs/guides/webui)），选择要改的插件。

![WebUI 插件配置入口：先在左侧选择要修改的插件，右侧才会显示配置表单](/guide/webui/config-plugins.png)

2. 选中插件后，右侧会显示它的配置表单。下面以 OneBot 适配器的账号设置为例：左侧是选中的插件，顶部显示配置文件路径，右侧可以修改字段并点「保存」。**QQ 账号与 QQ 昵称都要填写**。图中的号码和昵称是示例，实际字段以你安装的插件版本为准。

![实际 WebUI 界面中的插件配置表单：选中 OneBot 适配器后编辑账号字段，右上角有保存按钮；图中使用示例配置](/guide/webui/config-plugin-form.png)

3. 保存后重启 Bot，让修改生效。

</MethodTab>

</MethodTabs>

## 插件依赖要自己装吗？

不用。插件声明的 Python 依赖会自动安装：`core.toml` 里 `[plugin_deps]` 的 `enabled` 默认开启，只在缺包时才装；某个插件依赖装失败且它要求严格时会被跳过，启动日志里能看到原因（详见[核心配置要点](/docs/guides/core-config)）。

## 每个插件都有哪些字段可配？

- **内置插件**：[内置插件一览](/docs/guides/builtin)的速查表和各插件小节列出了值得改的常用配置，更完整的字段说明见[内置插件深度文档](/docs/builtin_plugins/)。
- **第三方插件**：以插件自带的 README / 说明文档为准；装完打开它生成的 `config.toml`，每个字段都带注释。

## 下一步

- **还没装插件**：看[插件市场使用](/docs/guides/plugins)。
- **想知道内置插件都能干嘛**：看[内置插件一览](/docs/guides/builtin)。
- **想把 TOML 学得更扎实、配个好编辑器**：看 [TOML 与编辑器](/docs/guides/toml)。
