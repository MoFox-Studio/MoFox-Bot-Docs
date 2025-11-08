# 插件安装指南

欢迎来到 MoFox 插件的世界！在这里，你可以找到各种有趣的插件来扩展 MoFox Bot 的功能。

## 插件市场

我们为你准备了一个丰富的插件市场，你可以在这里发现、下载和分享插件。

<PluginStats />

## 安装插件

::: danger 重要提示
在安装任何插件之前，请**务必**先进入插件的仓库，仔细阅读插件的 `README.md` 文件！这将帮助你了解插件的具体功能、配置方法和注意事项，避免很多不必要的麻烦。
:::

安装插件的过程非常简单，我们提供多种方式：

### 方式一：通过插件市场（推荐）

1.  **浏览插件市场**: 点击上方的卡片，或者直接访问 [MoFox 插件市场](https://plugin.mofox-sama.com/)，找到你感兴趣的插件。
2.  **下载插件**: 在插件详情页面，点击“下载”按钮，获取插件的压缩包。
3.  **手动安装**: 将下载的插件压缩包解压，然后将解压后的文件夹放入 MoFox Bot 的 `plugins` 目录下。

### 方式二：通过 Git Clone

如果你熟悉 Git，也可以通过 `git clone` 的方式安装插件。

1.  查看插件的 Git 仓库地址,通常就是插件卡片下面那个repo。
2.  进入 MoFox Bot 的 `plugins` 目录。
3.  执行以下命令：
    ```bash
    git clone <插件的 Git 仓库地址>
    ```
4. 根据自述文件里面的教程安装和配置插件
5.  **重启 Bot**: 为了让插件生效，你需要重启 MoFox Bot。

## 重启 Bot

无论是通过哪种方式安装，为了让新插件生效，你都需要**重启 MoFox Bot**。

## 验证安装

重启后，如何确认插件是否成功加载了呢？很简单，去查看日志！

在 MoFox Bot 的 `logs` 文件夹中，找到最新的日志文件，打开它。如果你看到类似下面这样的日志，就说明插件已经成功加载了：

```log
11-08 10:15:08 [插件] ✅ 插件加载成功: affinity_chatter v1.0.0 (1个CHATTER, 1个INTEREST_CALCULATOR, 2个TOOL, 2个EVENT_HANDLER) - Built-in chatter plugin for affinity flow with interest scoring and relationship buildi
```

恭喜你，现在你已经成功安装了一个新的插件！快去体验一下它带来的新功能吧！


## 参与插件开发

如果你对 MoFox 的插件开发感兴趣，想要为社区贡献自己的一份力量，我们非常欢迎！

我们为你准备了详细的插件开发文档，希望能帮助你快速上手。

[前往插件开发指南](../development/plugins/index.md)
