# MoFox_Bot Docs

🚀 基于 MaiCore 的增强版智能体，提供更完善的功能和更好的使用体验。

本文档旨在帮助您了解 MoFox_Bot 的功能、部署和开发。

## ✨ 功能

- **核心功能保留与增强 🔧**: 保留原版所有核心功能，如智能对话、持久记忆和情感表达，并进行了全面优化和增强。
- **强大的插件系统 🔌**: 全面重构的插件架构，支持完整的管理 API 和权限控制，让拓展功能变得前所未有的简单。
- **数据库自由切换 🔄**: 支持 SQLite、MySQL 以及多种向量数据库，为长期记忆和知识库提供了强大的存储支持。
- **内置安全防护 🛡️**: 集成了一整套回复前注入过滤系统，有效防止提示词注入攻击，为人格保驾护航。
- **多模态能力 🎥**: 不仅仅是文本！支持多种视频识别模式，拓展了原版的视觉能力，让交互更丰富。
- **独特的个性化系统 😴**: 引入了苏醒、睡眠、失眠等状态，内置强大的日程系统，让智能体更具“人性”，充满乐趣。

## 📚 文档

有关完整文档，请访问 [MoFox_Bot Docs](https://mofox-studio.github.io/MoFox-Bot-Docs/)。

## 🚀 快速开始

通过 [Windows 部署指南](https://mofox-studio.github.io/MoFox-Bot-Docs/docs/deployment_guide.html) 快速开始。

## 🤝 为此文档做出贡献

感谢您有兴趣为 MoFox_Bot 文档做出贡献！我们欢迎所有形式的贡献，从修正拼写错误到撰写全新的章节。

### 本地开发

要在本地预览和编辑文档站点，请按照以下步骤操作：

1.  **克隆仓库**
    ```bash
    git clone https://github.com/MoFox-Studio/MoFox-Bot-Docs.git
    cd MoFox-Bot-Docs
    ```

2.  **安装依赖**
    ```bash
    npm install
    ```

3.  **运行开发服务器**
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

## 🔗 相关链接

- **MoFox_Bot GitHub**: [https://github.com/MoFox-Studio/MoFox-Core](https://github.com/MoFox-Studio/MoFox-Core)
- **MoFox_Docs GitHub**: [https://github.com/MoFox-Studio/MoFox-Bot-Docs](https://github.com/MoFox-Studio/MoFox-Bot-Docs)
- **MoFox-Bot QQ 交流群**: [169850076](https://qm.qq.com/q/jfeu7Dq7VS)

## 📄 许可证

本仓库根据 [GPL-3.0 许可证](LICENSE) 的条款获得许可。