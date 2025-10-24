# 插件Python依赖管理

## 概述

为了简化插件开发，插件系统提供了一套强大的Python包依赖自动管理机制。当你的插件被加载时，系统会：

1.  **检查依赖**: 自动分析插件所需的Python包是否已安装。
2.  **版本验证**: 确保已安装的包版本符合插件的要求。
3.  **自动安装**: 若依赖缺失，系统会自动尝试安装（此行为由全局配置控制）。
4.  **提供反馈**: 在出现问题时，提供详细的错误信息和日志，帮助快速定位问题。

## 如何为插件配置依赖

现在，你需要在插件的 `__plugin_meta__` 中通过 `python_dependencies` 属性来声明依赖。

### 方式1: 简单字符串列表 (适用于简单场景)

这是最快捷的方式，适合定义简单的依赖。

```python
from src.plugin_system.base.plugin_metadata import PluginMetadata, PythonDependency
from typing import List

__plugin_meta__ = PluginMetadata(
    name="My Simple Plugin",
    # ... 其他元数据
    python_dependencies=[
        "requests",
        "beautifulsoup4>=4.9.0",
        "httpx[socks]"  # 支持 extras
    ]
)

# @register_plugin
# class MySimplePlugin(BasePlugin):
#     ...
```

### 方式2: 使用 `PythonDependency` 对象 (推荐)

对于复杂的依赖场景，强烈推荐使用 `PythonDependency` 对象。它提供了更强的控制力和更清晰的定义，尤其是在包的 **安装名** 和 **导入名** 不一致时。

```python
from src.plugin_system.base.plugin_metadata import PluginMetadata, PythonDependency
from typing import List

__plugin_meta__ = PluginMetadata(
    name="My Advanced Plugin",
    # ... 其他元数据
    python_dependencies=[
        PythonDependency(
            package_name="requests",
            version=">=2.25.0",
            description="一个强大的HTTP请求库",
            optional=False
        ),
        PythonDependency(
            package_name="bs4",  # 导入名是 bs4
            install_name="beautifulsoup4",  # 安装名是 beautifulsoup4
            version=">=4.9.0",
            description="强大的HTML和XML解析库",
            optional=False
        ),
        PythonDependency(
            package_name="httpx",
            install_name="httpx[socks]",  # 安装时使用的名称
            description="支持SOCKS代理的异步HTTP客户端",
            optional=True  # 标记为可选依赖
        )
    ]
)

# @register_plugin
# class MyAdvancedPlugin(BasePlugin):
#     ...
```

## `PythonDependency` 参数详解

-   `package_name` (str): 包的 **导入名**，用于 `import` 检查。
-   `version` (str, optional): 版本要求，遵循PEP 440格式 (例如 `">_1.0.0"`, `"==2.1.3"`)。
-   `install_name` (str, optional): `pip` 安装时使用的名称。如果未提供，则默认使用 `package_name`。
-   `description` (str, optional): 依赖的描述，会显示在日志和错误信息中，提高可读性。
-   `optional` (bool): 是否为可选依赖。如果为 `True`，即使这个依赖检查失败，也不会阻止插件的加载，仅会记录一条警告。

## 工作流程

依赖管理系统遵循以下步骤：

1.  **插件初始化**: 当插件被加载时，系统会读取 `__plugin_meta__` 中的 `python_dependencies` 属性。
2.  **依赖标准化**: 如果你使用了简单的字符串列表，系统会将其内部转换为 `PythonDependency` 对象。
3.  **检查与验证**: 系统会尝试导入每个依赖包，并验证其版本是否满足要求。
4.  **智能别名解析**: 如果通过 `package_name` 直接导入失败 (例如 `import beautifulsoup4` 失败)，系统会查询一个内置的别名映射表 (例如 `beautifulsoup4` -> `bs4`)，并尝试使用别名再次导入。
5.  **自动安装**: 如果依赖缺失且系统开启了自动安装功能，系统会调用 `pip` 来安装它。
6.  **错误处理**: 任何失败的步骤都会被详细记录，并根据依赖是否为可选来决定是否中止插件加载。

## 智能别名解析 (Smart Alias Resolution)

### 它解决了什么问题？

Python生态中，一些包的 **安装名** 与 **导入名** 并不相同，这常常让开发者感到困惑。例如：

-   安装: `pip install beautifulsoup4` -> 导入: `import bs4`
-   安装: `pip install Pillow` -> 导入: `import PIL`
-   安装: `pip install scikit-learn` -> 导入: `import sklearn`

为了简化开发，依赖管理系统内置了智能别名解析机制。

### 它是如何工作的？

当系统通过包名直接导入失败时，它会自动：

1.  查询一个内置的、包含数百个常见包的别名映射表。
2.  如果在表中找到了对应的导入名，就使用该别名再次尝试导入。
3.  如果别名导入成功，依赖检查通过。

这个过程是全自动的，旨在处理绝大多数常见情况，让你在使用简单字符串格式定义依赖时也无需担心这些恼人的命名差异。

### 注意事项

-   **最佳实践**: 尽管有智能别名解析，我们仍然 **强烈推荐** 使用 `PythonDependency` 对象来明确指定 `package_name` (导入名) 和 `install_name` (安装名)。这能确保最高的准确性和可读性。
-   **覆盖范围**: 内置的别名表已涵盖大量常用库，但无法保证100%覆盖。如果遇到别名库未收录的包，请务必使用 `PythonDependency` 对象进行精确定义。

## 日志输出示例

一个成功的自动安装过程会产生类似以下的日志：

```
[Plugin:web_search_tool] 开始自动安装Python依赖: ['asyncddgs', 'httpx[socks]']
[Plugin:web_search_tool] 使用PyPI镜像源: https://pypi.tuna.tsinghua.edu.cn/simple
[Plugin:web_search_tool] ✅ 成功安装: asyncddgs
[Plugin:web_search_tool] ✅ 成功安装: httpx[socks]
[Plugin:web_search_tool] 🎉 所有依赖安装完成
[Plugin:web_search_tool] Python依赖检查通过
```

## 错误处理

当依赖检查失败时，系统会：

1.  记录详细的错误信息到日志文件。
2.  如果是 **可选依赖** 缺失，仅记录警告，插件会继续加载。
3.  如果是 **必需依赖** 缺失且自动安装失败，将阻止插件加载，并给出清晰的错误提示。

## 最佳实践

1.  **首选 `PythonDependency` 对象**: 这是最可靠、最明确的方式，能从根本上避免命名混淆。
2.  **善用智能别名解析**: 对于 `beautifulsoup4`、`Pillow` 这类常见包，可以直接在字符串列表里使用安装名，系统会自动解析。
3.  **合理设置可选依赖**: 将非核心功能的依赖标记为 `optional=True`，避免因次要功能的问题导致整个插件无法加载。
4.  **明确版本要求**: 为关键依赖指定清晰的版本范围，确保兼容性，避免潜在的冲突。
5.  **添加描述信息**: 好的描述能让其他开发者（以及未来的你）快速理解每个依赖的用途。
6.  **充分测试**: 在不同环境中测试你的插件，确保依赖配置无误。

## 安全考虑

-   自动安装功能由系统管理员在全局配置中统一管理，插件开发者无法覆盖此设置。
-   所有安装操作都有详细的日志记录，便于审计和追踪。
-   安装过程有超时限制，以避免因网络问题导致系统长时间挂起。

## 故障排除

### 依赖安装失败

1.  **检查网络连接**: 确保你的设备可以访问外部网络，特别是PyPI源。
2.  **查看日志**: 检查详细的错误日志，通常日志中会包含 `pip` 的原始错误输出，这是定位问题的关键。
3.  **手动安装**: 尝试在你的环境中手动运行 `pip install <package_name>`，看看是否能复现问题。这有助于判断是环境问题还是依赖定义问题。

### 导入错误

1.  **确认包名与导入名**: 检查你的 `package_name` 是否真的是导入时使用的名称。如果不是，请使用 `install_name` 来指定安装名。
2.  **利用自动别名解析**: 对于常见库，系统会自动尝试解析别名。如果你的库比较冷门且名称不一致，请务必使用 `PythonDependency` 对象。
3.  **检查可选依赖配置**: 确认 `optional=True` 是否被正确设置。
