# mpdt plugin build

将插件目录打包为 `.mfp` 文件（MoFox Plugin），用于分发和安装。

## 用法

```bash
mpdt plugin build [path] [options]
```

## 参数

### path

插件根目录路径（可选）。默认为当前目录（`.`）。

```bash
mpdt plugin build /path/to/plugin
```

## 选项

### --output, -o

输出目录路径。默认为 `dist/`。

```bash
mpdt plugin build --output release
```

### --with-docs

将文档文件包含在插件包中。

```bash
mpdt plugin build --with-docs
```

默认情况下，`docs/` 目录不会被打包。

### --format

构建格式。

**可选值**：
- `mfp` - MoFox Plugin 格式 *默认*，推荐使用
- `zip` - 标准 ZIP 格式

```bash
mpdt plugin build --format zip
```

::: tip 推荐使用 .mfp 格式
`.mfp` 是 Neo-MoFox 的标准插件包格式，本质上是 ZIP 格式，但语义更明确。
:::

## 示例

### 基本构建

```bash
mpdt plugin build
```

输出：
```
📦 构建插件: my_plugin
✓ 插件: my_plugin v1.0.0
✓ 打包完成: my_plugin-1.0.0.mfp
✓ 构建完成

插件名称      my_plugin
版本          1.0.0
作者          Developer
入口文件      plugin.py
打包文件数    15
原始大小      245.6 KB
包大小        82.3 KB
SHA256        a3f5e7b9c...
输出路径      /path/to/plugin/dist/my_plugin-1.0.0.mfp

✓ 构建完成: my_plugin-1.0.0.mfp
```

### 包含文档

```bash
mpdt plugin build --with-docs
```

将 `docs/` 目录和文档文件打包到插件中。

### 自定义输出目录

```bash
mpdt plugin build --output release
```

插件包将输出到 `release/my_plugin-1.0.0.mfp`。

### 构建为 ZIP 格式

```bash
mpdt plugin build --format zip
```

输出：`dist/my_plugin-1.0.0.zip`

## 打包内容

### 默认包含的文件

- `plugin.py` - 插件主文件
- `manifest.json` - 插件元数据
- `LICENSE` - 许可证文件
- `README.md` - 说明文档
- `requirements.txt` - Python 依赖
- `components/` - 组件目录
- `utils/` - 工具函数目录
- 其他 `.py` 文件

### 默认排除的文件/目录

- `__pycache__/` - Python 缓存
- `*.pyc` - 字节码文件
- `.git/` - Git 仓库
- `.venv/` - 虚拟环境
- `node_modules/` - Node.js 依赖
- `.DS_Store` - macOS 系统文件
- `*.egg-info/` - Python 包信息
- `dist/` - 构建输出目录
- `build/` - 构建临时目录
- `docs/` - 文档目录（除非使用 `--with-docs`）

### 使用 --with-docs 时额外包含

- `docs/` - 文档目录
- `*.md` - 所有 Markdown 文件

## 包格式说明

### .mfp 文件结构

`.mfp` 文件是标准的 ZIP 压缩包，结构如下：

```
my_plugin-1.0.0.mfp
├── manifest.json
├── plugin.py
├── LICENSE
├── README.md
├── requirements.txt
├── components/
│   ├── __init__.py
│   ├── actions/
│   └── tools/
└── utils/
    └── __init__.py
```


## 文件校验

构建完成后，MPDT 会计算插件包的 SHA256 校验和：

```
SHA256: a3f5e7b9c1d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2b4c6d8e0f2a4b6c8d0e2f4
```

用于验证包的完整性：

```bash
sha256sum dist/my_plugin-1.0.0.mfp
```

## 工作流集成

### 完整发布流程

```bash
# 1. 检查插件质量
mpdt plugin check --fix

# 2. 升级版本号
mpdt plugin bump --type minor

# 3. 构建插件包
mpdt plugin build

# 4. 发布到市场
mpdt market publish
```

### 自动化构建脚本

```bash
#!/bin/bash
# build.sh

# 检查
mpdt plugin check --level error
if [ $? -ne 0 ]; then
  echo "检查失败，请修复错误后重试"
  exit 1
fi

# 清理旧构建
rm -rf dist/

# 构建
mpdt plugin build --with-docs

echo "✓ 构建完成，文件位于 dist/ 目录"
```

### CI/CD 集成

```yaml
# .github/workflows/build.yml
name: Build Plugin

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install MPDT
        run: pip install mofox-plugin-toolkit
      
      - name: Check plugin
        run: mpdt plugin check --level error
      
      - name: Build plugin
        run: mpdt plugin build --with-docs
      
      - name: Upload artifact
        uses: actions/upload-artifact@v3
        with:
          name: plugin-package
          path: dist/*.mfp
```

## 本地安装测试

构建完成后，可以测试安装：

```bash
# 复制到 Neo-MoFox 插件目录
cp dist/my_plugin-1.0.0.mfp /path/to/Neo-MoFox/plugins/

# 或解压后复制
unzip dist/my_plugin-1.0.0.mfp -d /path/to/Neo-MoFox/plugins/my_plugin
```

## 常见问题

### 包太大

**问题**：构建的包文件过大

**解决方案**：
1. 检查是否包含了不必要的文件
2. 移除大型测试数据
3. 不使用 `--with-docs`
4. 检查 `requirements.txt`，移除不必要的依赖

### 缺少文件

**问题**：构建后发现缺少某些文件

**解决方案**：
确保文件位于正确的位置且不在排除列表中。如果需要包含特殊文件，请检查打包规则。

### manifest.json 错误

**问题**：
```
✗ manifest.json 不存在或无法解析
```

**解决方案**：
```bash
# 检查 manifest.json
mpdt plugin check --no-component --no-style --no-type
```

## 最佳实践

1. **构建前先检查**
 ```bash
   mpdt plugin check --fix
   mpdt plugin build
 ```

2. **使用版本控制**
 ```bash
   git tag "v1.0.0"
   mpdt plugin build
 ```

3. **自动化构建**
   使用 CI/CD 自动构建和发布

4. **保留校验和**
   记录 SHA256 校验和，便于验证包完整性

5. **测试安装**
   构建后在本地 Neo-MoFox 中测试安装和运行

## 相关命令

- [mpdt plugin check](./check) - 检查插件（构建前推荐）
- [mpdt plugin bump](./bump) - 升级版本号
- [mpdt market publish](../market/publish) - 发布插件（会自动构建）

## 相关文档

- [插件结构与最佳实践](/docs/development/plugin_develop/structure)
- [manifest.json 格式说明](/docs/development/plugin_develop/manifest)
