# mpdt plugin

插件开发命令组，提供插件项目的完整生命周期管理。

## 命令列表

| 命令 | 功能说明 |
|------|----------|
| [init](./init) | 初始化新插件项目 |
| [generate](./generate) | 生成插件组件代码 |
| [check](./check) | 检查插件质量 |
| [bump](./bump) | 升级插件版本号 |
| [build](./build) | 构建插件包 |
| [dev](./dev) | 启动开发模式 |

## 基本工作流

典型的插件开发流程：

```bash
# 1. 创建新插件
mpdt plugin init my-plugin --template full

# 2. 进入插件目录
cd my-plugin

# 3. 生成组件
mpdt plugin generate action MyAction

# 4. 开发模式（热重载）
mpdt plugin dev

# 5. 检查代码质量
mpdt plugin check --fix

# 6. 升级版本并构建
mpdt plugin bump patch
mpdt plugin build
```

## 快速参考

### 创建插件
```bash
mpdt plugin init <plugin_name> --template <type>
```

### 生成组件
```bash
mpdt plugin generate <component_type> <component_name>
```

### 开发模式
```bash
mpdt plugin dev
```

### 检查和构建
```bash
mpdt plugin check --fix
mpdt plugin bump patch
mpdt plugin build
```

## 相关文档

- [插件开发概述](/docs/development/plugin_develop/)
- [插件结构与最佳实践](/docs/development/plugin_develop/structure)
- [manifest.json 格式说明](/docs/development/plugin_develop/manifest)
