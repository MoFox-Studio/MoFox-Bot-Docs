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
  "entry_point": "plugin.py",
  "min_core_version": "1.0.0"
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
| `min_core_version` | `string` | 是 | 最低核心版本（如 `1.0.0`） |
| `include` | `array` | 否 | 组件清单；未提供时按空列表处理 |
| `python_dependencies` | `array` | 否 | Python 包依赖列表（pip requirement 格式） |
| `dependencies_required` | `bool` | 否 | Python 依赖是否必需（默认 `true`） |

::: warning 版本兼容性检查
`min_core_version` 用于版本兼容性检查。插件要求的最低核心版本必须 <= 当前运行的核心版本，否则插件将被拒绝加载。

请填写不高于实际核心版本的值（如当前核心版本为 `1.0.0`，则填写 `1.0.0`）。
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
python_dependencies`（可选）

Python 包依赖列表，使用 pip requirement 格式。

```json
"python_dependencies": [
  "requests>=2.28.0",
  "pandas>=1.5.0",
  "numpy"
]
```

配合 `dependencies_required` 字段使用：
- 若 `dependencies_required` 为 `true`（默认）：Python 依赖安装失败时，插件将被跳过
- 若 `dependencies_required` 为 `false`：安装失败仅发出警告，仍尝试加载插件

## `
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
  "min_core_version": "1.0.0",
  "python_dependencies": [],
  "dependencies_required": true
}
```
