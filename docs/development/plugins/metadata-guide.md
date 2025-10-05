# 🧬 插件元数据系统指南

## 概述

MoFox_Bot的插件系统采用了一种现代化的、基于代码的元数据管理方式，取代了原有的 `_manifest.json` 文件。现在，所有插件的元数据都通过一个 `PluginMetadata` 对象在代码中直接定义，提供了更好的类型安全性和开发体验。

## 核心理念：元数据即代码

我们将插件的元数据视为代码的一部分，这意味着：

- **类型安全**：元数据由一个 `dataclass` (`PluginMetadata`) 定义，享受Python的类型检查优势。
- **动态生成**：元数据可以在运行时动态生成或修改（尽管不常见）。
- **易于维护**：所有插件信息都集中在 `__init__.py` 文件中，一目了然。
- **无需额外文件**：不再需要在插件目录中维护一个单独的 `_manifest.json` 文件。

## `PluginMetadata` 类详解

`PluginMetadata` 是一个 `dataclass`，包含了定义一个插件所需的所有信息。它在 `src.plugin_system.base.plugin_metadata` 中定义。

### 如何定义元数据

在你的插件目录下，创建一个 `__init__.py` 文件，并实例化一个 `PluginMetadata` 对象，赋值给名为 `metadata` 的变量。

**示例 (`my_awesome_plugin/__init__.py`):**

```python
from src.plugin_system import PluginMetadata

# 导入你的插件主类
from .plugin import MyAwesomePlugin

# 定义插件元数据
metadata = PluginMetadata(
    name="我的超棒插件",
    description="这个插件能做一些非常厉害的事情。",
    usage="""
    如何使用我的插件：
    1. 发送 `/awesome_command` 来触发酷炫功能。
    2. 等待魔法发生！
    """,
    author="开发者姓名",
    version="2.0.0",
    license="MIT",
    repository_url="https://github.com/your/repo",
    keywords=["示例", "酷炫", "元数据"],
    categories=["工具", "娱乐"]
)
```

### 字段说明

#### 必需字段

这些字段是每个插件都必须提供的。

- `name: str`
  - **说明**: 插件的显示名称，将展示给用户。
  - **示例**: `"我的超棒插件"`

- `description: str`
  - **说明**: 对插件功能的简短描述。
  - **示例**: `"这个插件能做一些非常厉害的事情。"`

- `usage: str`
  - **说明**: 详细的插件使用指南。支持多行文本。
  - **示例**: `"发送 /awesome_command 来触发酷炫功能。"`

#### 推荐字段

这些字段虽然是可选的，但强烈建议填写，以便提供更完整的插件信息。

- `author: str`
  - **说明**: 插件作者的姓名或组织名。
  - **示例**: `"开发者姓名"`

- `version: str`
  - **说明**: 插件的版本号，建议遵循 [语义化版本](https://semver.org/lang/zh-CN/)。
  - **默认值**: `"1.0.0"`

- `license: str | None`
  - **说明**: 插件的开源许可证。
  - **示例**: `"MIT"`

- `repository_url: str | None`
  - **说明**: 插件的源代码仓库地址。
  - **示例**: `"https://github.com/your/repo"`

- `keywords: list[str]`
  - **说明**: 一组描述插件的关键词，便于搜索和分类。
  - **示例**: `["示例", "酷炫", "元数据"]`

- `categories: list[str]`
  - **说明**: 插件所属的分类。
  - **示例**: `["工具", "娱乐"]`

#### 其他字段

- `type: str | None`
  - **说明**: 插件的类型，可以是 `"library"` 或 `"application"`。
  - **默认值**: `None`

- `extra: dict[str, Any]`
  - **说明**: 一个用于存储任何其他自定义信息的字典。
  - **默认值**: `{}`

## 工作流程

1.  **创建插件结构**:
    ```
    my_awesome_plugin/
    ├── __init__.py  # 元数据定义
    └── plugin.py    # 插件主逻辑
    ```

2.  **定义元数据**: 在 `__init__.py` 中创建并配置 `metadata` 变量。

3.  **编写插件逻辑**: 在 `plugin.py` 中，像往常一样编写你的 `BasePlugin` 子类。你不再需要在插件类中定义 `plugin_name` 之外的任何元数据属性。

4.  **加载过程**: 当MoFox_Bot启动时，插件管理器会自动扫描插件目录，找到 `__init__.py` 文件，读取 `metadata` 对象，并将其传递给你的插件实例。

## 常见问题

**Q: 我还需要在 `BasePlugin` 子类中定义 `plugin_name` 吗？**
A: 是的。`plugin_name` 仍然需要在 `BasePlugin` 子类中定义，并且**必须**与你的插件目录名保持一致。这是系统用来在内部识别和引用插件的唯一ID。而 `metadata.name` 是用于向用户显示的名称。

**Q: 如果我不提供可选字段会怎么样？**
A: 不会有任何问题。系统会使用字段的默认值。但是，提供更完整的信息有助于其他用户（以及未来的你）更好地理解和使用你的插件。