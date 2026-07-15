# mpdt config init

交互式初始化 MPDT 配置文件。

## 用法

```bash
mpdt config init
```

## 功能

启动交互式配置向导，引导你完成所有必要配置。

## 配置项

### 1. Neo-MoFox 路径

主程序路径，用于开发模式和依赖管理。

```
Neo-MoFox 路径: /path/to/Neo-MoFox
```

### 2. GitHub Token

用于发布插件到市场。

```
GitHub Token: ghp_xxxxxxxxxxxxx
```

### 3. 编辑器设置

配置文件编辑器。

```
编辑器命令: code
```

## 示例

```bash
mpdt config init
```

输出：
```
MPDT 配置向导

让我们配置 Neo-MoFox 主程序的路径和 GitHub Token

请输入 Neo-MoFox 主程序路径 (): /home/xxxxx/developer/Neo-MoFox
✅ Neo-MoFox 路径已设置: /home/xxxxx/developer/Neo-MoFox

GitHub Token 用于插件市场发布功能
如果暂不需要发布插件到市场，可以跳过此步骤

是否配置 GitHub Token？ [y/n] (n): y
请输入 GitHub Personal Access Token: 

编辑器命令用于 'mpdt config open' 命令打开文件
如果不确定，可以跳过此步骤，默认为系统默认编辑器
请输入编辑器命令 (): code
✅ 编辑器命令已设置: code
✅ 
配置已保存: /home/xxxxx/.mpdt/config.toml
```

## 配置文件

生成的配置文件示例：

```toml
# ~/.mpdt/config.toml

[mofox]
path = "/home/user/Neo-MoFox"

[github]
token = "ghp_xxxxxxxxxxxxx"

[editor]
command = "code"
```

## 相关命令

- [mpdt config show](./show) - 查看配置
- [mpdt config edit](./edit) - 编辑配置
- [mpdt config open](./open) - 打开配置文件
