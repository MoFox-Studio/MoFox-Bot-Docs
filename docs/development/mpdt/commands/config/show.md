# mpdt config show

显示当前的 MPDT 配置。

## 用法

```bash
mpdt config show
```

## 功能

以格式化方式显示所有配置项及其值。

## 示例

```bash
mpdt config show
```

输出：
```
┏━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 配置项         ┃ 值                               ┃
┡━━━━━━━━━━━━━━━━╇━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┩
│ 配置文件       │ /home/yishan/.mpdt/config.toml   │
│ Neo-MoFox 路径 │ /home/yishan/developer/Neo-MoFox │
│ 市场地址       │ http://39.96.71.162              │
│ GitHub Token   │ 已配置                           │
│ 自动重载       │ 是                               │
│ 重载延迟       │ 0.3秒                            │
└────────────────┴──────────────────────────────────┘
```

## 配置状态

### Neo-MoFox 路径
- ✓ 有效 - 路径存在且包含 `main.py`
- ✗ 无效 - 路径不存在或不是有效的 Neo-MoFox 目录

### GitHub Token
- ✓ 已配置 - Token 已设置（显示时部分隐藏）
- ✗ 未配置 - Token 未设置

## 相关命令

- [mpdt config init](./init) - 初始化配置
- [mpdt config edit](./edit) - 编辑配置
- [mpdt config open](./open) - 打开配置文件
