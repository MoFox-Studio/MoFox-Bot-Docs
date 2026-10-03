# screenshot-kit —— 文档截图工具箱

`docs/guides/` 里那些「终端窗口」「编辑器」风格的截图（首次启动、运行日志、配置文件等）
都是这套工具做的。**核心思路：不是伪造图，而是让程序在真实终端里跑一遍，把真实输出渲染成网页，再截图。**

```
真实程序 ──capture.py（pty 伪终端）──▶ 快照（screen.txt + colors.json）──┐
                                                                        ├──▶ render.py ──▶ .html ──▶ 截图 ──▶ PNG 成品
纯日志文件 ──────────────────────────────────────────────────────────────┤
配置文件（TOML）─────────────────────────────────────────────────────────┘
```

本目录只是制作截图的原材料和工具，不参与 VitePress 站点构建（不在 `docs/` 里）。

## 文件说明

| 文件 | 作用 |
| --- | --- |
| `capture.py` | **pty 转快照**：把命令行程序放进伪终端真实跑一遍，屏幕出现指定关键词时自动保存整屏快照（文本 + 逐格颜色），并能自动回答交互提问 |
| `render.py` | **快照/日志/配置转 HTML**，三种模式：`screen`（快照 → 终端窗口）、`log`（日志 → 终端窗口，支持 ANSI 颜色码）、`editor`（TOML 配置 → VS Code 风格） |
| `examples/` | 自测样例：一个假交互程序、一份 TOML、一份日志。装完环境先拿它们跑一遍验证 |

## 环境准备

```bash
python3 -m venv .venv-kit
. .venv-kit/bin/activate
pip install pyte wcwidth
```

- `pyte`：终端模拟器（把程序输出的 ANSI 流变成"屏幕"）
- `wcwidth`：字符宽度计算（CJK 对齐的关键，见文末踩坑记录）

最终 HTML → PNG 那一步需要 playwright（`pip install playwright && playwright install chromium`），
或者直接用浏览器 DevTools 手工截图，见下文。

装完先自测一下（约 30 秒，产出三个 HTML，打开都正常说明环境 OK）：

```bash
python3 capture.py --cmd "python3 examples/demo_app.py" \
    --snap panel:"请输入指令" --send "请输入指令:start" \
    --snap final:"输入 /help" --outdir /tmp/kit-demo
python3 render.py screen /tmp/kit-demo/panel.screen.txt /tmp/kit-demo/panel.colors.json \
    /tmp/kit-demo/panel.html "python3 demo_app.py"
python3 render.py log examples/demo.log /tmp/kit-demo/log.html "logs/demo.log"
python3 render.py editor examples/demo-model.toml /tmp/kit-demo/editor.html
```

## 第一步：capture.py（pty 转快照）

```bash
python3 capture.py --cmd "uv run main.py" --cwd /path/to/项目 \
    --snap agreement:"[EULA] 请输入" \
    --send "[EULA] 请输入:agree" \
    --snap telemetry:"[云端遥测] 请输入" \
    --send "[云端遥测] 请输入:decline" \
    --snap success:"输入 /help 查看可用命令" \
    --subst "/home/me/tmp-run=/home/mofox/src/Neo-MoFox" \
    --outdir captures
```

| 参数 | 说明 |
| --- | --- |
| `--cmd` | 要运行的命令（shell 语法，在 pty 里执行） |
| `--cwd` | 命令的工作目录 |
| `--snap 名称:标记文本` | 屏幕上出现「标记文本」时保存快照，可多次；标记就是屏幕上能看到的一句提示 |
| `--send 标记文本:回复` | 屏幕上出现「标记文本」时自动发送「回复」+ 回车（模拟用户输入），可多次 |
| `--subst 旧=新` | 输出文本替换（比如把本机临时路径换成文档里展示的路径），**旧和新必须等长** |
| `--cols` / `--rows` | 终端尺寸，默认 110×85。列数要够宽，别让程序把面板挤变形 |
| `--settle` | 每次快照前先等几秒，让最后一波日志刷完（默认 2.0） |
| `--timeout` | 总超时秒数（默认 900），防止程序卡住把人挂死 |
| `--outdir` | 快照输出目录（默认 `captures/`） |

输出两个文件 per 快照：

- `captures/NAME.screen.txt` —— 快照时刻的整屏文本
- `captures/NAME.colors.json` —— 逐格颜色 `{"行,列": [前景, 背景, 是否加粗]}`

规则匹配的是**当前整屏文本**，所以标记挑一句屏幕上稳定出现的提示语即可；
`--snap`/`--send` 按命令行里出现的顺序依次触发，每条规则只触发一次。
**所有规则都触发完后 capture.py 会自动收工**（服务类程序永远不会自己退出，别等它），
想等程序自然退出再结束，加 `--wait-exit`。
上面这条命令抓出来的三张快照，正对应 `docs/guides/manual.md` 首启章节的
`first-start-agreement.png` 和 `first-start-success.png` 两张图。

## 第二步：render.py（快照/日志转 HTML）

```bash
# screen 模式：快照 → HTML（颜色按单元格精确还原）
python3 render.py screen captures/agreement.screen.txt captures/agreement.colors.json \
    agreement.html "uv run main.py"

# 只渲染某几行（0 起、左闭右开），首启成功图就是用 10:81 裁掉头尾杂讯的：
python3 render.py screen captures/success.screen.txt captures/success.colors.json \
    success.html "uv run main.py" --rows 10:81

# log 模式：纯日志文件 → HTML（自带 ANSI 颜色码的日志会自动上色）
python3 render.py log logs/mofox_2026-01-01.log mofox-log.html "logs/mofox_2026-01-01.log"

# editor 模式：TOML 配置 → VS Code 风格 HTML（文件名标签、面包屑、行号、语法高亮）
python3 render.py editor config/model.toml model-editor.html "model.toml — Neo-MoFox"

# 也可以模拟「滚到文件中部」的观感：行号从 5 起算、标注面包屑、
# 给指定行画 VS Code 选中蓝条（行号按 --start-line 之后的显示行号算）、加宽窗口
python3 render.py editor /tmp/kit-run/config.toml onebot-editor.html \
    "config.toml — Neo-MoFox — Visual Studio Code" \
    --start-line 5 --highlight 15,19 \
    --breadcrumb "Neo-MoFox > config > plugins > onebot_adapter > config.toml" --width 900
```

editor 模式的限制：多行字符串（`"""…"""`）不参与高亮，内容按普通文本渲染——截图足够用；
标题默认是「文件名 — Neo-MoFox」，第三个位置参数可以改。
注意高亮行号是**显示行号**（受 `--start-line` 影响），想看清源文件第几行就别和 `--start-line` 混用。

## 第三步：HTML → PNG

用 playwright 对窗口元素（`body > div`，即整个终端窗口）做元素截图，
背景干净、不带多余空白，`device_scale_factor=2` 保证清晰度：

```python
# shot.py —— python3 shot.py <html目录> <名字> ...
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

base = Path(sys.argv[1]).resolve()
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1600, "height": 1200}, device_scale_factor=2)
    for name in sys.argv[2:]:
        page.goto(f"file://{base / (name + '.html')}")
        page.locator("body > div").screenshot(path=str(base / (name + ".png")))
    browser.close()
```

注意事项：

- 本地文件直接 `file://` 打开一般没问题；但部分自动化浏览器禁 `file://`，
  那就先 `python3 -m http.server 8791` 再访问 `http://127.0.0.1:8791/xxx.html`。
- **用完记得停掉 http.server**：先 `ps aux | grep http.server | grep -v grep` 确认 PID 再杀。
  `pkill -f "http.server"` 这种模式可能匹配到执行命令的 shell 自身，把自己杀掉。
- 成品 PNG 放到 `docs/public/guide/<章节>/` 下，在 md 里 `![...](/guide/<章节>/xxx.png)` 引用
  （`public/` 下的文件按站点根路径引用，不带 `/docs/` 前缀）。

## 踩坑记录（都是真踩过的，改代码前先读一遍）

1. **字体是对齐的命根子**。渲染 CSS 里的字体栈是 `"JetBrains Maple Mono","DejaVu Sans Mono",monospace`，
   它要求：半角 1 格、CJK 严格 2 格、制表线（`─ │ ┌` 等）只占 1 格。
   常见的 Noto Sans Mono CJK 的制表线是 2 格宽，用它整个边框全错位。
   换机器先量一下：'a'、'你'、'─' 的渲染宽度应是 1 : 2 : 1。
2. **emoji 宽度**。pyte 对变体选择符 U+FE0F（⚠️ℹ️ 里的隐形字符）的宽度算法和 Rich 不一致，
   会错位丢字。capture.py 已自动处理：去掉 VS16，并把 ⚠/ℹ 补一个空格凑成 2 格。
   渲染端对 ℹ 用 2 格宽的 inline-block 修正（ℹ 在 Maple Mono 里只有 3.49px，不是整格）。
3. **颜色是"单元格"下标，不是字符串下标**。屏幕上一行 CJK 占 2 格但只是 1 个字符，
   直接拿字符下标去查 colors.json 必然错位。render.py 已用 wcwidth 做了映射，别改回字符串下标。
4. **--subst 必须等长**。终端光标按列定位，替换前后的文本长度不一致，后面整行全部错位。
   想把 `/home/me/tmp-run-dir` 换成 `/home/mofox/src/Neo-MoFox`，就挑一个字节数一样的路径来跑。
5. **进程清理**。capture.py 结束时会对整个进程组发 SIGKILL（有些程序忽略 SIGTERM，
   残留进程会一直占着端口）。确认进程组里只有你抓的那个程序再跑，别误伤别的实例。
6. **快照要赶在程序还活着的时候**。规则按顺序触发，最后一张快照的标记出现后再等 `--settle`
   秒让日志刷完；程序退出后的屏幕就不再是"运行中"的样子了。

## 成品对照

`docs/public/guide/manual/` 下的 `first-start-agreement.png`、`first-start-success.png`
是 screen 模式产的；`model-toml-editor.png`、`onebot-config-editor.png`（`qq_id`、
`qq_nickname` 两行带选中蓝条）等配置文件截图是 editor 模式产的；
其余页面（`docker.md`、`faq.md` 等）引用的日志截图用 log 模式即可。
