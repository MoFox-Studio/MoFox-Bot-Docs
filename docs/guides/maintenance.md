# 维护：备份、迁移与日志

Bot 跑起来之后，日常维护就三件事：备份、搬家、看日志。都不难，一条条来。

## 备份

要备份的其实只有**三个目录**，都在 Neo-MoFox 根目录下：

| 目录 | 里面是什么 |
| --- | --- |
| `config/` | 你的所有配置（`core.toml`、`model.toml` 等） |
| `data/` | 运行数据：数据库（`MoFox.db`）、记忆、缓存等 |
| `plugins/` | 你装的所有插件 |

::: tip 改过目录名的话
这三个目录名对应 `config/core.toml` 里 `[bot]` 节的 `plugins_dir`、`data_dir`、`logs_dir` 字段（默认值就是 `plugins`、`data`、`logs`）。如果你改过，备份你自己改的那个目录。
:::

一条命令打包备份：
```bash

# Linux / macOS，在 Neo-MoFox 目录下执行，打包到上一级目录
tar -czvf ../mofox-backup-$(date +%Y%m%d).tar.gz config data plugins
```

Windows 下用 robocopy 逐个目录复制：
```powershell

# Windows PowerShell，把三个目录复制到备份盘（按你的实际路径改）
robocopy "D:\Neo-MoFox\config"  "E:\mofox-backup\config"  /E
robocopy "D:\Neo-MoFox\data"    "E:\mofox-backup\data"    /E
robocopy "D:\Neo-MoFox\plugins" "E:\mofox-backup\plugins" /E
```

**什么时候备份**：[更新](/docs/guides/update)或[切通道](/docs/guides/channels)之前必做一次；平时建议每周定期来一次，挂机群尤其别偷懒。

## 迁移到新机器

把 Bot 搬到新电脑，三步：

1. **旧机器**：停掉 Bot，按上面的方法备份 `config/`、`data/`、`plugins/` 三个目录。
2. **新机器**：用你惯用的任一方式把 Neo-MoFox 重新部署好（启动器、安卓 App、Docker、手动命令行都行，见[更新与回滚](/docs/guides/update)）。
3. 把备份的三个目录覆盖到新部署的 Neo-MoFox 目录里，启动，完事。

::: tip 跨数据库迁移不用管
默认的 SQLite 数据库就是一个文件（`data/MoFox.db`），老老实实待在 `data/` 里，跟着目录一起搬走，不需要任何导出导入操作。
:::

Docker 部署同理：新机器上把 compose 文件准备好，三个目录拷到它旁边，`docker compose up -d` 就接上了。

![图片：Neo-MoFox 目录结构中的三个关键目录](/guide/maintenance/backup-dirs.png)
<!-- TODO-SCREENSHOT: 文件管理器里展开 Neo-MoFox 根目录，高亮 config、data、plugins 三个文件夹 -->

## 日志

**日志在哪**：`logs/` 目录，文件名形如 `mofox_20260804_172920_….log`（时间戳命名），一段时间前的旧日志会被自动压缩成 `.gz`。

**去哪看**：

- **启动器**：实例管理页的「**终端**」分区，或实例的终端标签页。
- **Docker**：`docker compose logs -f`（按 `Ctrl+C` 退出跟踪），或者直接看 `logs/` 目录里的文件。
- **手动命令行**：启动时的终端就是实时日志，历史日志在 `logs/` 目录。
```bash

# Docker 部署时实时跟踪日志
docker compose logs -f
```

**日志自动清理**：`config/core.toml` 的 `[bot]` 节里有几个清理项，默认就够用，不用动：

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `log_cleanup_enabled` | `true` | 日志自动清理总开关 |
| `log_max_age_days` | `30` | 日志最多保留 30 天，超龄自动删，`0` 表示不按时间清理 |
| `log_max_files` | `100` | 日志目录最多存 100 个文件，超了删最旧的，`0` 表示不限制 |

**排障怎么搜**：在日志里搜这两个关键词——

- `ERROR`：报错行，紧跟其后的几行就是出错原因。
- `Traceback`：Python 崩溃现场，从这行往下读，最后一行是错误类型和原因。

看不懂没关系，把报错附近整段复制给开发者或贴到群里提问，比自己瞎猜快。

## 磁盘空间

挂机久了，`data/` 里有两个目录会悄悄变大：

- **`data/media_cache/`**：收发媒体的缓存（图片、表情、视频、语音等），可以放心清理——停掉 Bot 后清空即可，之后需要时 Bot 会自己重新缓存。程序其实自带自动清理（`[bot]` 节的 `media_cache_cleanup_*` 和 `media_file_cleanup_*` 配置项，已识别的媒体默认保留 7 天），一般不用手动管。
- **`data/chroma_db/`**：记忆插件（如 booku_memory）存放向量记忆的数据库，也会变大，但**不要清理**——删掉后记忆索引就没了。

想省空间的顺序：优先清 `media_cache/`，别碰 `chroma_db/`；日志占的地方交给自动清理就好。

## 数据库进阶

一句话：默认的 SQLite 完全够用，不用折腾。真有进阶需求（比如多实例共用一个 PostgreSQL），仓库里有个 `scripts/migrate_database.py` 脚本，支持 SQLite ↔ PostgreSQL 互相迁移——进阶玩家才用得到，进 [Neo-MoFox 仓库](https://github.com/MoFox-Studio/Neo-MoFox/tree/main/scripts)的 `scripts/` 目录看脚本自带的说明即可。
