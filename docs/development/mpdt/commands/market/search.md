# mpdt market search

搜索插件市场中的插件。

## 用法

```bash
mpdt market search [query] [options]
```

## 参数

### query

搜索关键词（可选）。省略则显示所有插件。

```bash
mpdt market search music
```

## 选项

### --category

按分类过滤。

```bash
mpdt market search --category utility
```

### --tag

按标签过滤。

```bash
mpdt market search --tag music
```

### --limit

返回结果数量。默认 20。

```bash
mpdt market search keyword --limit 50
```

## 示例

### 搜索所有插件

```bash
mpdt market search
```

### 搜索关键词

```bash
mpdt market search weather
```

### 按分类搜索

```bash
mpdt market search --category entertainment
```

### 组合搜索

```bash
mpdt market search music --tag audio --limit 10
```

## 输出示例

```
搜索结果（共 3 个插件）

名称              版本     作者          描述
──────────────────────────────────────────────────
music-player      1.0.0    Developer     音乐播放器插件
weather-query     2.1.0    AnotherDev    查询天气信息
translator        1.5.2    Translator    多语言翻译工具
```

## 相关命令

- [mpdt market info](./info) - 查看插件详情
- [mpdt depend add](../depend/add) - 添加插件依赖
