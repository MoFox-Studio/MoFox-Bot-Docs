# 更新与回滚

Bot 和所有软件一样会更新：修 bug、加新功能。动手之前，先做两件事：

1. **备份你的配置和数据。** 把 Neo-MoFox 目录下的 `config/` 和 `data/` 复制一份到别处——更新本身不会动它们，但留个后底总是安心。怎么备份见 [维护：备份、迁移与日志](/docs/guides/maintenance)。
2. **看一眼更新说明。** 去 [GitHub Releases](https://github.com/MoFox-Studio/Neo-MoFox/releases) 或官方 QQ 群公告看看这次更新改了什么、有没有需要注意的事项，心里有数再动手。

::: tip 更新会停机吗
会，但很短。启动器更新实例时会自动先停掉正在运行的 Bot 主程序和平台适配器，更新完成后再把它们恢复运行；手动更新则需要你自己先停再更新。整个过程通常一两分钟。
:::

按你的部署方式选择下面的标签页操作：

<MethodTabs dimension="update" :options="[
  { value: 'launcher', label: '启动器', icon: 'mdi:rocket-launch-outline' },
  { value: 'android', label: '安卓 App', icon: 'material-symbols:android' },
  { value: 'docker', label: 'Docker', icon: 'mdi:docker' },
  { value: 'manual', label: '手动命令行', icon: 'mdi:console' }
]">

<MethodTab value="launcher">

**更新 Neo-MoFox 主程序**（本质是 git 拉取当前分支最新代码）：

1. 打开启动器，进入实例列表，点「**管理**」进入实例管理页（首页也有「管理全部」入口）。
2. 切到「**更新**」分区。面板顶部有两个标签：**Neo-MoFox**（主程序）和**平台**（适配器）。
3. 选 Neo-MoFox 标签，点「**检查更新**」看看当前分支落后远程多少提交。
4. 点「**检查并更新**」。启动器会拉取当前分支的最新代码，并自动同步 Python 依赖（`uv sync`），不用你操心。

![图片：实例管理页的「更新」分区](/guide/launcher/instance-update.png)

**更新平台适配器（NapCat / SnowLuma）**：

1. 还是在「更新」分区，切到「**平台**」标签。
2. 启动器会列出该适配器在 GitHub Release 上的可用版本。
3. 选一个版本（或直接「**更新到最新**」），启动器会自动下载安装。你的适配器 `config` 目录（比如 WebSocket 连接配置）会自动保留，不会丢。

![图片：平台适配器的版本列表](/guide/launcher/instance-update-platform.png)

**启动器自己怎么更新**：打开 **设置 → 关于**，点「**检查更新**」。有新版本时会显示版本号和更新说明，点击即可跳转到启动器的 [GitHub Releases](https://github.com/MoFox-Studio/Neo-MoFox-Launcher-Next/releases) 页面，下载新的安装包覆盖安装就行。

::: warning 更新失败怎么办
更新失败时，更新面板会直接显示失败原因。打开实例管理页的「**终端**」分区看看日志输出：最常见的原因是网络连不上 GitHub（可以去设置里换镜像源重试），或者是本地代码有改动和远程冲突。在日志里搜 `ERROR` 或「失败」能快速定位是哪一步出了问题。
:::

</MethodTab>

<MethodTab value="android">

安卓 App 目前**没有「一键更新实例」的按钮**，如实说明一下现状：

- **续装**：安装没完成的实例会保留在主界面。进实例详情页 → 右上角「实例信息」→「**继续安装**」，会从上次中断的地方接着跑完剩余步骤，已经完成的步骤（比如克隆、装依赖）会自动跳过，不会重头再来。
- **更新已装好的实例**：走手动方式。实例详情页右上角有「**Bot 目录终端**」按钮，点进去就到了 Bot 目录，然后照下面的命令手动更新：
```bash

# 在 Bot 目录终端里执行
git pull        # 拉取当前分支最新代码
uv sync         # 同步 Python 依赖
```

- **App 本体更新**：应用内没有自更新。去项目的 nightly 发布页下载新 APK 覆盖安装即可。覆盖安装不会动实例目录；但**不要卸载重装**——卸载会连 rootfs 和里面的实例一起清掉。

::: warning 动手前先备份
更新 Bot 或重装 App 前，建议把实例目录（实例信息页里有路径，可直接复制）备份一份，防止万一。
:::

</MethodTab>

<MethodTab value="docker">

Docker 方式更新最简单：拉新镜像、重建容器，两条命令：
```bash

cd Neo-MoFox
docker compose pull    # 拉取最新镜像
docker compose up -d   # 用新镜像重建容器，旧容器会被替换
```

- **镜像 tag 说明**：compose 文件默认用的是 `ikun11451/neo-mofox-dev:latest`（dev 通道）。想用稳定版，把 `docker-compose.yml` 里 mofox 服务的 `image` 改成 `ikun11451/neo-mofox-main:latest`。main 和 dev 两个分支每次有推送，CI 都会自动构建并推送对应镜像。
- **数据不会丢**：`config/`、`data/`、`logs/`、`plugins/` 都挂载在宿主机上（见 compose 文件的 volumes），容器重建只是换了程序代码，你的数据原封不动地留在磁盘上。

::: tip
这里说的镜像就是 Docker 的「程序包」，挂载卷就是宿主机上的目录。名词不熟可以看[名词小课堂：Docker 与镜像](/docs/guides/glossary#docker-与镜像)。
:::

</MethodTab>

<MethodTab value="manual">

手动命令行更新，两条命令：
```bash

cd Neo-MoFox
git pull        # 拉取当前分支最新代码
uv run main.py  # 启动，uv 会自动按新代码同步依赖
```

- `uv run` 每次启动都会对照 `uv.lock` 检查依赖，新代码需要的包会自动装好，不用手动 `pip install`。
- **配置自动补齐**：启动时框架会把配置文件和程序内置的配置定义做比对（`ConfigBase.load(auto_update=True)`），新版本加的配置项会自动补进文件（连同默认值和注释），你自己改过的值原样保留。所以更新后 `config/*.toml` 可能自己多出几行——正常现象，别慌。

::: warning 改过源码的话
如果你手动改过源码，`git pull` 可能报冲突。要么先 `git stash` 把自己的改动暂存起来再拉，要么放弃本地改动（`git checkout .`）——后者会丢掉你的修改，想清楚再执行。
:::

</MethodTab>

</MethodTabs>

## 回滚

新版用着不对劲？每个方式都有自己的退路：

<MethodTabs dimension="update" :options="[
  { value: 'launcher', label: '启动器', icon: 'mdi:rocket-launch-outline' },
  { value: 'android', label: '安卓 App', icon: 'material-symbols:android' },
  { value: 'docker', label: 'Docker', icon: 'mdi:docker' },
  { value: 'manual', label: '手动命令行', icon: 'mdi:console' }
]">

<MethodTab value="launcher">

启动器装实例时用的是浅克隆，本地只保留**最近 20 条提交**的历史，回退就在这个范围内操作：

1. 实例管理页 → 「**更新**」分区 → Neo-MoFox 标签。
2. 提交历史列表里，每条提交后面都有「**回退**」按钮，点一下就切回那个版本，Python 依赖会自动重新同步。
3. 回退完想回到最新？点「**检查并更新**」拉回来就行。

平台适配器（NapCat / SnowLuma）回退更简单：「**平台**」标签的版本列表里，选一个旧版本号安装即可。

::: tip
想回 20 条提交之前的版本，启动器里就没有历史记录了，可以按本页下方「手动命令行」标签里的做法，在仓库里 `git checkout` 具体的提交号或 tag。
:::

</MethodTab>

<MethodTab value="android">

App 内目前没有版本回退入口。用实例详情页右上角的「**Bot 目录终端**」，在 Bot 目录里手动操作，和本页下方「手动命令行」标签的做法一样：
```bash

# 在 Bot 目录终端里执行
git log --oneline        # 看看最近的提交
git checkout <提交号>     # 切回目标提交，如 git checkout 82e08ee
uv sync                  # 重新同步依赖
```

</MethodTab>

<MethodTab value="docker">

Docker Hub 上只有各分支的 `latest` 标签，**没有历史版本 tag**（CI 只推送 `neo-mofox-main:latest` 和 `neo-mofox-dev:latest`）。所以回滚要用本地还留着的旧镜像：
```bash

docker images | grep neo-mofox                            # 找本地还留着的旧镜像的 Image ID
docker tag <旧ImageID> my-neo-mofox:rollback              # 给它打个本地标签
# 然后把 docker-compose.yml 里 mofox 服务的 image 改成 my-neo-mofox:rollback
docker compose up -d                                      # 用旧镜像重建容器
```

<!-- VERIFY: 本地旧镜像是否还在取决于 docker 的镜像清理策略（docker system prune 等），被清理后只能等上游修复或重新找版本 -->

</MethodTab>

<MethodTab value="manual">

手动方式回滚最自由，可以按 tag 也可以按提交号：
```bash

cd Neo-MoFox
git tag                    # 看看有哪些版本 tag，如 1.2.0-rc.2
git checkout 1.2.0-rc.2    # 检出某个正式版本 tag
uv run main.py             # 启动，uv 会按旧代码同步依赖
```
```bash

cd Neo-MoFox
git log --oneline          # 看看最近的提交记录
git checkout 82e08ee       # 切回某个具体提交
uv run main.py
```

- 想回到最新：`git checkout dev`（或 `main`）切回分支，再 `git pull`。
- 具体哪些 tag 可用，可以看 [GitHub Releases](https://github.com/MoFox-Studio/Neo-MoFox/releases) 页面。

</MethodTab>

</MethodTabs>

## 更新后自检清单

更新完别急着走，花一分钟做三个检查：

- [ ] **日志无报错**：看一眼启动日志，搜 `ERROR` 和 `Traceback`，没有红色报错为佳（[日志在哪看](/docs/guides/maintenance#日志)）。
- [ ] **群里戳一下**：去 Bot 在的群里发条消息，确认它能正常回话。
- [ ] **WebUI 打得开**：浏览器访问 `http://localhost:8000`，管理面板能正常加载。

三个都过了，这次更新就算圆满。有问题就按[回滚](#回滚)退回旧版本，然后去仓库提 issue。
