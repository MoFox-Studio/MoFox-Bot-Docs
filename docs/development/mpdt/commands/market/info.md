# mpdt market info

查看插件的详细信息，包括所有版本、依赖、作者等。

## 用法

```bash
mpdt market info <plugin_id>
```

## 参数

### plugin_id

插件 ID（必需）。

```bash
mpdt market info my-plugin
```

## 示例

### 查看插件信息

```bash
mpdt market info weather-query
```

输出：
```
插件信息
────────────────────────────────────────

ID:           weather-query
名称:         Weather Query
作者:         Developer
版本:         2.1.0
分类:         utility
标签:         weather, api, query
描述:         查询实时天气信息

仓库:         https://github.com/user/weather-query
主页:         https://example.com
许可证:       MIT

可用版本
────────────────────────────────────────
2.1.0 (最新)
2.0.0
1.5.0
1.0.0

依赖
────────────────────────────────────────
Python:
  - requests>=2.28.0
  - pydantic>=2.0.0

插件:
  - location-service>=1.0.0
```

## 相关命令

- [mpdt market search](./search) - 搜索插件
- [mpdt depend add](../depend/add) - 添加依赖
