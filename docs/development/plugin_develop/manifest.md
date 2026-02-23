# manifest.json 格式说明

`manifest.json` 是插件元数据入口，用于发现、依赖校验和加载顺序计算。

## 最小可用示例

```json
{
  "name": "my_plugin",
  "version": "1.0.0",
  "description": "插件说明",
  "author": "作者",
  "dependencies": {
    "plugins": [],
    "components": []
  },
  "entry_point": "plugin.py"
}
```

## 顶级字段

| 字段 | 类型 | 是否必填 | 说明 |
| --- | --- | --- | --- |
| `name` | `string` | 是 | 插件唯一名，建议与 `BasePlugin.plugin_name` 一致 |
| `version` | `string` | 是 | 语义化版本 |
| `description` | `string` | 是 | 插件描述 |
| `author` | `string` | 是 | 作者 |
| `dependencies` | `object` | 是 | 插件/组件依赖 |
| `entry_point` | `string` | 是 | 入口文件路径（默认通常为 `plugin.py`） |
| `include` | `array` | 否 | 组件清单；未提供时按空列表处理 |
| `min_core_version` | `string` | 强烈建议必填 | 最低核心版本；当前实现中请务必显式填写并与当前核心版本兼容（如 `1.0.0`） |

::: danger 当前实现注意（务必阅读）
`min_core_version` 会参与版本检查。当前加载器在该字段缺失时会回退到 `3.0.0`，会导致插件被判定为不兼容并拒绝加载。

因此在当前版本中，`min_core_version` 应视为“必须显式填写”的字段，推荐填写不高于实际核心版本的值。
:::

## `dependencies`

```json
"dependencies": {
  "plugins": ["other_plugin"],
  "components": ["other_plugin:service:memory"]
}
```

- `plugins`：依赖的插件名
- `components`：依赖的组件签名（`plugin:type:name`）

## `include`（可选）

用于声明插件包含组件及组件级依赖。

```json
"include": [
  {
    "component_type": "action",
    "component_name": "send_emoji",
    "dependencies": ["other_plugin:service:emoji"],
    "enabled": true
  }
]
```

| 字段 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `component_type` | `string` | `""` | 组件类型 |
| `component_name` | `string` | `""` | 组件名 |
| `dependencies` | `string[]` | `[]` | 组件级依赖 |
| `enabled` | `bool` | `true` | 是否启用 |

## `component_type` 可用值

- `action`
- `tool`
- `adapter`
- `chatter`
- `command`
- `event_handler`
- `service`
- `router`
- `collection`
- `config`

## 推荐完整示例

```json
{
  "name": "default_chatter",
  "version": "1.0.0",
  "description": "默认对话插件",
  "author": "MoFox Team",
  "dependencies": {
    "plugins": [],
    "components": []
  },
  "include": [
    {
      "component_type": "chatter",
      "component_name": "default_chatter",
      "dependencies": [],
      "enabled": true
    }
  ],
  "entry_point": "plugin.py",
  "min_core_version": "1.0.0"
}
```
