# mpdt depend search

搜索可用的依赖（插件或 Python 包）。

## 用法

```bash
mpdt depend search <query> [options]
```

## 参数

### query

搜索关键词（必需）。

```bash
mpdt depend search weather
```

## 选项

### --type

搜索类型。

**可选值**：
- `all` - 搜索所有类型 *默认*
- `plugin` - 仅搜索插件
- `python` - 仅搜索 Python 包

```bash
mpdt depend search requests --type python
```

### --limit

返回结果数量。默认 20。

```bash
mpdt depend search keyword --limit 50
```

## 示例

### 搜索所有类型

```bash
mpdt depend search weather
```

输出：
```
                                  插件搜索结果 (14 个)                                  
┏━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━┳━━━━━━━┳━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━┓
┃ ID                ┃ 名称              ┃ 版本  ┃ 描述              ┃ 链接             ┃
┡━━━━━━━━━━━━━━━━━━━╇━━━━━━━━━━━━━━━━━━━╇━━━━━━━╇━━━━━━━━━━━━━━━━━━━╇━━━━━━━━━━━━━━━━━━┩
│ nai_artist        │ nai_artist        │ 1.0.1 │ NAI Artist — 让   │ https://market.… │
│                   │                   │       │ bot               │                  │
│                   │                   │       │ 像真人一样用手机… │                  │
│ kokoro_flow_chat… │ kokoro_flow_chat… │ 2.0.1 │ KokoroFlow        │ https://market.… │
│                   │                   │       │ 对话引擎 —        │                  │
│                   │                   │       │ 基于心理活动流的… │                  │
│ chat_flow_control │ 聊天频率限制和群… │ 1.0.0 │ 聊天流控制插件，… │ https://market.… │
│ image_generator_… │ NovelAI 绘图      │ 2.0.3 │ 基于 NovelAI 官 … │ https://market.… │
│                   │                   │       │ API 的 AI         │                  │
│                   │                   │       │ 图片生成插件，支… │                  │
│                   │                   │       │ 参考图等功能      │                  │
│ kokoro_flow_chat… │ KokoroFlow        │ 2.0.1 │ KokoroFlow        │ https://market.… │
│                   │ 对话引擎          │       │ 对话引擎 —        │                  │
│                   │                   │       │ 基于心理活动流的… │                  │
└───────────────────┴───────────────────┴───────┴───────────────────┴──────────────────┘
                                   Python 包搜索结果                                    
┏━━━━━━┳━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 包名 ┃ 版本 ┃ 描述                         ┃ 作者      ┃ 链接                        ┃
┡━━━━━━╇━━━━━━╇━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╇━━━━━━━━━━━╇━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┩
│ a    │ 1.0  │ Python Distribution          │ Greg Ward │ https://pypi.org/project/a/ │
│      │      │ Utilities                    │           │                             │
└──────┴──────┴──────────────────────────────┴───────────┴─────────────────────────────┘
```

### 仅搜索插件

```bash
mpdt depend search weather --type plugin
```

输出：
```
                                  插件搜索结果 (1 个)                                   
┏━━━━━━━━━━━━┳━━━━━━━━━━━━┳━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ ID         ┃ 名称       ┃ 版本  ┃ 描述                     ┃ 链接                    ┃
┡━━━━━━━━━━━━╇━━━━━━━━━━━━╇━━━━━━━╇━━━━━━━━━━━━━━━━━━━━━━━━━━╇━━━━━━━━━━━━━━━━━━━━━━━━━┩
│ nai_artist │ nai_artist │ 1.0.1 │ NAI Artist — 让 bot      │ https://market.mofox-s… │
│            │            │       │ 像真人一样用手机拍照或 … │                         │
└────────────┴────────────┴───────┴──────────────────────────┴─────────────────────────
```

### 仅搜索 Python 包

```bash
mpdt depend search requests --type python
```

输出：
```
ℹ️  正在搜索 Python 包...
                                   Python 包搜索结果                                    
┏━━━━━━━━━━┳━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━┳━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 包名     ┃ 版本   ┃ 描述                    ┃ 作者 ┃ 链接                            ┃
┡━━━━━━━━━━╇━━━━━━━━╇━━━━━━━━━━━━━━━━━━━━━━━━━╇━━━━━━╇━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┩
│ requests │ 2.34.2 │ Python HTTP for Humans. │      │ https://pypi.org/project/reque… │
└──────────┴────────┴─────────────────────────┴──────┴─────────────────────────────────┘
```

### 限制结果数量

```bash
mpdt depend search api --limit 10
```

## 搜索来源

### 插件

从 Neo-MoFox 插件市场搜索。

### Python 包

从 PyPI (Python Package Index) 搜索。

## 相关命令

- [mpdt depend info](./info) - 查看依赖详情
- [mpdt depend add](./add) - 添加依赖
- [mpdt market search](../market/search) - 搜索插件市场
