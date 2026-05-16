# mpdt depend info

查看依赖的详细信息和可用版本。

## 用法

```bash
mpdt depend info <dependency> [options]
```

## 参数

### dependency

依赖名称（必需）。

```bash
mpdt depend info requests
```

## 选项

### --type

依赖类型。

**可选值**：
- `auto` - 自动判断 *默认*
- `plugin` - 插件
- `python` - Python 包

```bash
mpdt depend info requests --type python
```

## 示例

### 查看 Python 包信息

```bash
mpdt depend info requests
```

输出：
```
ℹ️  正在获取 Python 包信息: requests
╭──────────────────────────────────── Python 包信息 ────────────────────────────────────╮
│ 包名: requests                                                                        │
│ 版本: 2.34.2                                                                          │
│ 描述: Python HTTP for Humans.                                                         │
│ 作者: None                                                                            │
│ 许可证: Apache-2.0                                                                    │
│ 主页: None                                                                            │
│ PyPI: https://pypi.org/project/requests/                                              │
╰───────────────────────────────────────────────────────────────────────────────────────╯
可用版本 
（显示最 
  近 10  
 个，共  
160 个） 
┏━━━━━━━┓
┃ 版本  ┃
┡━━━━━━━┩
│ 2.9.2 │
│ 2.9.1 │
│ 2.9.0 │
│ 2.8.1 │
│ 2.8.0 │
│ 2.7.0 │
│ 2.6.2 │
│ 2.6.1 │
│ 2.6.0 │
│ 2.5.3 │
└───────┘
```

### 查看插件信息

```bash
mpdt depend info weather-api --type plugin
```

输出：
```
ℹ️  正在获取插件信息: nai_artist
╭────────────────────────────────────── 插件信息 ──────────────────────────────────────╮
│ 插件 ID: nai_artist                                                                  │
│ 名称: nai_artist                                                                     │
│ 描述: NAI Artist — 让 bot 像真人一样用手机拍照或画画并分享给对方。                   │
│ 作者: nano                                                                           │
│ 状态: published                                                                      │
│ 分类: tool                                                                           │
│ 标签: action, clothes, novel ai, text-to-image generation                            │
│ 仓库: https://github.com/bingyv92/nai_artist                                         │
│ 链接: https://market.mofox-sama.com/plugins/nai_artist                               │
╰──────────────────────────────────────────────────────────────────────────────────────╯
         可用版本 (2 个)          
┏━━━━━━━┳━━━━━━━━━━━┳━━━━━━━━━━━━┓
┃ 版本  ┃ 状态      ┃ 发布时间   ┃
┡━━━━━━━╇━━━━━━━━━━━╇━━━━━━━━━━━━┩
│ 1.0.1 │ published │ 2026-05-15 │
│ 1.0.0 │ published │ 2026-05-14 │
└───────┴───────────┴────────────┘
```

## 相关命令

- [mpdt depend search](./search) - 搜索依赖
- [mpdt depend add](./add) - 添加依赖
- [mpdt market info](../market/info) - 查看插件详情（仅插件）
