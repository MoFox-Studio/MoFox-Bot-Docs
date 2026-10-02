# 更新通道：main 与 dev

Neo-MoFox 有两个更新通道，装的时候选一个跟着走：

- **main（稳定版）**：经过完整测试后发布的版本，更新节奏慢一些，但更稳，适合大多数人。
- **dev（开发版）**：开发分支的最新代码，新功能、新修复第一时间就有，但也可能带着还没被发现的新 bug。

**版本号长这样**：`1.3.0-alpha.0`、`1.2.0-rc.2`。格式是「主版本.次版本.修订号-预发布标识」，预发布标识从 alpha（内测）到 beta（公测）再到 rc（发布候选），一路打磨，最后去掉后缀成为正式版。仓库的 tag 也按这个规律走，比如 `1.1.0-alpha.2` → `1.1.0-beta` → `1.1.0-rc`。

::: tip
dev 验证过的功能和修复会合入 main，所以 dev 可以理解成「预览版」：你先尝鲜，稳了再进稳定版。
:::

按你的部署方式选择下面的标签页操作：

<MethodTabs dimension="channel" :options="[
  { value: 'launcher', label: '启动器', icon: 'mdi:rocket-launch-outline' },
  { value: 'android', label: '安卓 App', icon: 'material-symbols:android' },
  { value: 'docker', label: 'Docker', icon: 'mdi:docker' },
  { value: 'manual', label: '手动命令行', icon: 'mdi:console' }
]">

<MethodTab value="launcher">

**安装新实例时**：安装向导里就有「**更新通道**」下拉框，两个选项——稳定版 (main) / 开发版 (dev)。选哪个，实例就克隆哪个分支。

![图片：安装向导中的更新通道选择](/guide/launcher/install-channel-dropdown.png)

**已有实例换通道**：不用重装，直接切分支：

1. 实例管理页 → 「**更新**」分区 → Neo-MoFox 标签。
2. 找到「**分支切换**」，在下拉框里选 main 或 dev。
3. 点「**切换**」。启动器会拉取目标分支的最新代码（本地有改动会先自动暂存），并自动同步 Python 依赖。本质是 git fetch + checkout + pull + uv sync 一条龙。

![图片：实例更新分区的分支切换](/guide/launcher/instance-update.png)

</MethodTab>

<MethodTab value="android">

**安装新实例时**：安装向导的「网络」步骤里可以选通道——稳定版 / 开发版，默认是稳定版（main）。

**已有实例**：目前**不能在 App 里换通道**——通道是安装时写进实例信息的，实例信息页里只能看不能改。想换通道有两个办法：

- 删掉实例，重新走向导，这次选另一个通道（注意：删除实例会清掉它的本地记录和实例目录，先备份）。
- 用实例详情页右上角的「**Bot 目录终端**」，在 Bot 目录里手动切：
```bash

# 在 Bot 目录终端里执行
git switch main   # 切到稳定版；换开发版用 git switch dev
uv sync           # 重新同步依赖
```

</MethodTab>

<MethodTab value="docker">

Docker 方式没有「切换」这个动作，选通道就是**选镜像 tag**。把 `docker-compose.yml` 里 mofox 服务的 `image` 在两个 tag 之间改：
```yaml

# 稳定版：
image: ikun11451/neo-mofox-main:latest
# 开发版（默认）：
# image: ikun11451/neo-mofox-dev:latest
```

改完拉新镜像、重建容器：
```bash

docker compose pull    # 拉取所选通道的最新镜像
docker compose up -d   # 用新镜像重建容器
```

main 和 dev 分支每次有推送，CI 都会自动构建并推送对应镜像，所以切到哪个 tag 就跟哪个通道的最新版走。

</MethodTab>

<MethodTab value="manual">

手动方式就是直接切分支，用 [git](/docs/guides/glossary#分支-main-与-dev) 的 switch 或 checkout 都行：
```bash

cd Neo-MoFox
git switch dev    # 切到开发版；切回稳定版用 git switch main
uv run main.py    # 启动，uv 会自动按新分支同步依赖
```

- 老版本 git 不支持 `switch` 的话，用 `git checkout dev` 效果一样。
- 切之前先把正在跑的 Bot 停掉，切完再启动。

</MethodTab>

</MethodTabs>

::: warning 切通道前先备份
- **dev → main 的数据不会自动回退。** 抢先体验期间产生的新格式数据（比如新版数据库里的新字段记录）切回 main 后不会被「翻译」回去，它们就保持着 dev 写入时的样子。
- **配置文件是向后兼容的，反过来不行。** main 上启动时会自动补齐缺失的配置项并保留你的值；但 dev 新增的配置字段在 main 上不认识，通常会被忽略（配置文件里对应的行也会被清掉），个别严格校验的配置节不排除报错的可能。
- 所以切通道前，把 `config/` 和 `data/` 备份一份，见 [维护：备份、迁移与日志](/docs/guides/maintenance)。
:::

## 两边怎么选

| 你的情况 | 建议 |
| --- | --- |
| 挂机群聊，稳定第一，不想折腾 | main |
| 第一次部署，刚入坑 | main |
| 想第一时间体验新功能，能接受偶尔出 bug | dev |
| 帮开发者测试新特性、反馈问题 | dev |

::: tip
dev 上出了 bug 别慌：先按[更新与回滚](/docs/guides/update#回滚)退回旧版本或切回 main（记得先备份），然后去 [GitHub 仓库](https://github.com/MoFox-Studio/Neo-MoFox/issues)提 issue。
:::
