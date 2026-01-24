# 插件数据 API

想要构建自己的插件展示网站或工具吗？我们提供了公开的 JSON API，让你可以轻松获取所有插件的索引数据。

::: warning  重要说明
这是 **MoFox 官方插件站的对外公开 API**，提供所有已发布插件的数据访问接口。任何第三方开发者都可以使用这些 API 来构建自己的插件展示工具或应用。
:::

## 可用的数据文件

### 1. 插件索引列表 (`plugins.json`)

包含所有插件的基本信息和仓库地址。

**获取地址：**
```
https://raw.githubusercontent.com/MoFox-Studio/MoFox-Plugin-Repo/main/plugins.json
```

**数据结构示例：**
```json
[
  {
    "id": "author.plugin-name",
    "repositoryUrl": "https://github.com/author/plugin-repo"
  }
]
```

### 2. 插件详细信息 (`plugin_details.json`)

包含所有插件的完整元数据，包括描述、版本、作者、依赖等详细信息。

**获取地址：**
```
https://raw.githubusercontent.com/MoFox-Studio/MoFox-Plugin-Repo/main/plugin_details.json
```

**数据结构示例：**
```json
[
  {
    "id": "author.plugin-name",
    "manifest": {
      "name": "插件名称",
      "description": "插件描述",
      "version": "1.0.0",
      "author": "作者",
      "license": "MIT",
      "repository_url": "https://github.com/author/plugin-repo",
      "keywords": ["keyword1", "keyword2"],
      "categories": ["category1"],
      "python_dependencies": ["package1", "package2"]
    },
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
]
```

## 数据字段说明

### `plugins.json` 字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 插件的唯一标识符，格式为 `作者.插件名` |
| `repositoryUrl` | string | 插件的 GitHub 仓库地址 |

### `plugin_details.json` 字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 插件的唯一标识符 |
| `manifest` | object | 插件的元数据信息 |
| `manifest.name` | string | 插件的显示名称 |
| `manifest.description` | string | 插件的功能描述 |
| `manifest.usage` | string | 插件的使用说明 |
| `manifest.version` | string | 插件的版本号 |
| `manifest.author` | string | 插件作者 |
| `manifest.license` | string | 开源许可证 |
| `manifest.repository_url` | string | 仓库地址 |
| `manifest.keywords` | array | 关键词列表 |
| `manifest.categories` | array | 分类列表 |
| `manifest.python_dependencies` | array | Python 依赖包列表 |
| `createdAt` | string | 插件添加到仓库的时间（ISO 8601 格式） |

## 使用示例

### 在网页中获取数据

```javascript
// 获取插件列表
fetch('https://raw.githubusercontent.com/minecraft1024a/MoFox-Plugin-Repo/main/plugins.json')
  .then(response => response.json())
  .then(plugins => {
    console.log('插件总数:', plugins.length);
    // 处理插件数据...
  });

// 获取详细信息
fetch('https://raw.githubusercontent.com/minecraft1024a/MoFox-Plugin-Repo/main/plugin_details.json')
  .then(response => response.json())
  .then(details => {
    // 按类别分组
    const byCategory = details.reduce((acc, plugin) => {
      const categories = plugin.manifest.categories || ['其他'];
      categories.forEach(cat => {
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(plugin);
      });
      return acc;
    }, {});
    
    console.log('分类统计:', byCategory);
  });
```

### 在 Python 中获取数据

```python
import requests

# 获取插件详细信息
response = requests.get(
    'https://raw.githubusercontent.com/minecraft1024a/MoFox-Plugin-Repo/main/plugin_details.json'
)
plugins = response.json()

# 显示所有插件
for plugin in plugins:
    manifest = plugin['manifest']
    print(f"{manifest['name']} v{manifest['version']}")
    print(f"  作者: {manifest['author']}")
    print(f"  描述: {manifest['description']}")
    print()

# 搜索特定关键词的插件
keyword = 'memory'
matching = [p for p in plugins 
            if keyword in p['manifest'].get('keywords', [])]
print(f"包含 '{keyword}' 关键词的插件: {len(matching)} 个")
```

## 数据更新频率

- **自动更新**：当有新插件被合并到主分支时，JSON 文件会自动更新
- **建议缓存**：建议在你的应用中实现缓存机制，避免频繁请求
- **检查更新**：可以通过 GitHub API 检查文件的最后更新时间

```javascript
// 检查文件最后更新时间
fetch('https://api.github.com/repos/minecraft1024a/MoFox-Plugin-Repo/commits?path=plugin_details.json&per_page=1')
  .then(r => r.json())
  .then(commits => {
    const lastUpdate = commits[0].commit.committer.date;
    console.log('最后更新:', new Date(lastUpdate));
  });
```

## 使用场景

### 🌐 构建自定义插件展示网站
创建一个美观的网页来展示所有可用插件，提供搜索、筛选、分类等功能。

### 🔍 创建插件搜索和过滤工具
开发命令行工具或桌面应用，帮助用户快速找到需要的插件。

### 📊 生成插件统计和分析报告
分析插件生态系统的趋势，统计最受欢迎的分类、作者贡献度等。

### 🤖 开发插件管理机器人
创建 QQ/Discord 机器人，让用户可以在聊天中查询和浏览插件。

### 📱 制作移动端插件浏览应用
开发移动应用，方便用户随时随地浏览插件信息。

### 🔔 构建插件更新通知系统
监控插件仓库的变化，当有新插件或更新时发送通知。

## 参考实现

想看看如何使用这些数据？可以参考我们的官方实现：

- 🔗 [插件展示页面](https://plugin.mofox-sama.com/)
- 🔗 [插件仓库源码](https://github.com/MoFox-Studio/MoFox-Plugin-Repo)

## CORS 和使用限制

::: tip 提示
由于使用的是 GitHub raw 内容，请注意：
- 数据是公开的，可以自由使用
- 没有速率限制，但建议实现合理的缓存
- 支持 CORS，可以直接在浏览器中使用
- 建议在生产环境中实现错误处理和重试机制
:::


## 常见问题

### Q: 数据多久更新一次？
A: 当有新的插件被合并到主分支时立即更新，通常在 PR 被合并后的几分钟内。

### Q: 可以直接修改 JSON 文件吗？
A: 不建议。这些文件是自动生成的，应该通过提交插件 PR 的方式来添加或更新插件信息。

### Q: 如何获取单个插件的信息？
A: 获取 `plugin_details.json` 后，通过插件 ID 进行过滤即可。

### Q: 数据格式会变化吗？
A: 我们会尽量保持向后兼容，如果有重大变更会提前通知并提供迁移指南。

## 反馈和建议

如果你在使用 API 时遇到问题，或者有改进建议，欢迎：
- 在 [GitHub Issues](https://github.com/minecraft1024a/MoFox-Plugin-Repo/issues) 中提出
- 加入我们的社区讨论
- 提交 PR 改进文档
