# Neo-MoFox Docs

Neo-MoFox 的官方文档站。包含部署指南、配置说明、插件开发文档等。

## Neo-MoFox 特性

- **插件驱动**: 一切功能皆插件，按需组合 Action、Tool、Chatter、Adapter 等组件，无需修改核心代码。
- **LLM 原生**: 内置多厂商 LLM 支持，Action 与 Tool 自动生成 Schema，Chatter 流式对话无缝接入 AI 能力。
- **多平台适配**: 基于 mofox-wire 标准通信协议，通过 Adapter 组件适配 QQ、Telegram、Discord 等任意平台。
- **严格三层架构**: kernel（技术基础）→ core（领域逻辑）→ app（装配运行），清晰的分层边界确保代码可维护性。
- **类型安全配置**: 基于 Pydantic + TOML 的配置系统，自动验证、自动补全、自动生成默认配置文件。
- **异步并发**: 全面异步架构，TaskManager 统一管理并发任务，WatchDog 监控任务健康。

## 文档

有关完整文档，请访问 [Neo-MoFox Docs](https://docs.mofox-sama.com/)。

## 快速开始

通过 [部署指南](https://docs.mofox-sama.com/docs/guides/) 快速开始。

## 为此文档做出贡献

感谢您有兴趣为 Neo-MoFox 文档做出贡献！我们欢迎所有形式的贡献，从修正拼写错误到撰写全新的章节。

### 本地开发

要在本地预览和编辑文档站点，请按照以下步骤操作：

1. **克隆仓库**

    ```bash
    git clone https://github.com/MoFox-Studio/MoFox-Bot-Docs.git
    cd MoFox-Bot-Docs
    ```

2. **安装依赖**

    ```bash
    npm install
    ```

3. **运行开发服务器**

    ```bash
    npm run docs:dev
    ```

    此命令将启动本地开发服务器，您可以在浏览器中通过 `http://localhost:5173` 访问。

### 构建站点

要生成站点的静态文件，请运行：

```bash
npm run docs:build
```

构建的文件将位于 `docs/.vitepress/dist` 目录中。

## 相关链接

- **Neo-MoFox GitHub**: [https://github.com/MoFox-Studio/Neo-MoFox](https://github.com/MoFox-Studio/Neo-MoFox)
- **MoFox_Docs GitHub**: [https://github.com/MoFox-Studio/MoFox-Bot-Docs](https://github.com/MoFox-Studio/MoFox-Bot-Docs)
- **MoFox-Bot QQ 交流群**: 169850076

## 许可证

本仓库根据 [AGPL-3.0 许可证](LICENSE) 的条款获得许可。
