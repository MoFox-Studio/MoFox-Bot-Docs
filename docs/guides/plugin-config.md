# 插件配置怎么改

不管是你 clone 下来就自带的[内置插件](/docs/guides/builtin)，还是从[插件市场](/docs/guides/plugins)装的第三方插件，配置方式都是同一套：配置文件统一放在 `config/plugins/<插件名>/config.toml`，插件**第一次被加载时**会自动生成带注释的默认配置文件，不用手动建。

::: tip 看不懂某个词？
文中出现的 [TOML](/docs/guides/glossary#toml) 等术语，都收录在[名词小课堂](/docs/guides/glossary)里，随时可以翻。
:::

两种改法选你顺手的：

<MethodTabs dimension="config" :options="[{ value: 'file', label: '配置文件', icon: 'mdi:file-document-outline' }, { value: 'webui', label: 'WebUI', icon: 'mdi:monitor-dashboard' }]">

<MethodTab value="file">

1. 用任意文本编辑器（记事本、VS Code 都行）打开 `config/plugins/<插件名>/config.toml`，直接改字段。
2. 保存后重启 Bot 生效；核心升级带来新配置字段时，文件也会自动补上，不用手动合并。

</MethodTab>

<MethodTab value="webui">

1. 打开 WebUI 的「插件配置」页面（WebUI 本身怎么装见 [WebUI 指南](/docs/guides/webui)），选择要改的插件。
2. 在表单里修改、保存，重启 Bot 生效。

![图片：WebUI 插件配置页，选择插件后在表单里修改](/guide/webui/config-plugins.png)

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
