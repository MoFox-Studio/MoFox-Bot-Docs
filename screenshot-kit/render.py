#!/usr/bin/env python3
"""render.py —— 快照/日志转 HTML：渲染成「终端窗口」风格的截图素材。

两种模式：
  screen 模式  render.py screen <screen.txt> <colors.json> <out.html> [标题] [--rows 起:止]
               输入 capture.py 产出的整屏快照 + 逐格颜色，颜色按「显示单元格」精确还原。
  log 模式     render.py log <日志.txt> <out.html> [标题] [--rows 起:止]
               纯文本日志直接渲染；日志里自带 ANSI 颜色码会自动转成对应颜色。
  editor 模式  render.py editor <配置.toml> <out.html> [标题] [--start-line N] [--highlight 15,19]
               TOML 配置渲染成 VS Code 风格窗口（行号、语法高亮、可标注面包屑和高亮行）。

产出是一个深色圆角的「终端窗口」HTML。用浏览器打开看看效果，
然后按 README 的方法用 playwright 对 body > div 做元素截图，即得最终 PNG。
"""
from __future__ import annotations

import argparse
import html
import json
import os
import re

from wcwidth import wcwidth

FONT_PX = 13.5
LINE_HEIGHT = 1.62
CELL_PX = 8.1  # 该字号下 Maple Mono 的半角格宽（CJK 占 2 格 = 16.2px）
MONO = '"JetBrains Maple Mono","DejaVu Sans Mono",monospace'
DEFAULT_FG = "#cccccc"
BG = "#0c0c0c"

# 基本十六色（Windows Terminal 暗色风格），索引 0-7 常规、8-15 亮色
PAL16 = ["#3a3a3a", "#f14c4c", "#23d18b", "#f5f543", "#3b8eea", "#d670d6", "#29b8db", "#e5e5e5",
         "#7a7a7a", "#ff6e6e", "#3ddc84", "#ffff7a", "#5aa7ff", "#ff8dff", "#5ce6ff", "#ffffff"]
NAMED = {"black": PAL16[0], "red": PAL16[1], "green": PAL16[2], "yellow": PAL16[3],
         "blue": PAL16[4], "magenta": PAL16[5], "cyan": PAL16[6], "white": PAL16[7],
         "brightblack": PAL16[8], "brightred": PAL16[9], "brightgreen": PAL16[10],
         "brightyellow": PAL16[11], "brightblue": PAL16[12], "brightmagenta": PAL16[13],
         "brightcyan": PAL16[14], "brightwhite": PAL16[15]}

# ℹ 在 Maple Mono 里只有 3.49px 宽（不是整格），会把整行顶得错位：
# 用固定 2 格宽的 inline-block 装住它（capture 阶段已在 ℹ 后补了一个空格占位，这里一并吃掉）
INFO_FIX = f'<span style="display:inline-block;width:{CELL_PX * 2:.1f}px">ℹ</span>'


def pyte_color(value: str) -> str:
    """pyte 的颜色值（颜色名 / 6 位 hex）→ CSS 颜色。"""
    if not value or value == "default":
        return DEFAULT_FG
    v = value.lower()
    if v in NAMED:
        return NAMED[v]
    if re.fullmatch(r"[0-9a-f]{6}", v):  # 256 色会被 pyte 存成 6 位 hex
        return "#" + v
    if re.fullmatch(r"#[0-9a-f]{6}", v):
        return v
    return DEFAULT_FG


def parse_rows(spec: str | None) -> tuple[int, int | None]:
    """把 "10:81" 解析成 (10, 81)，0 起、左闭右开；":50"、"10:" 也行。"""
    if not spec:
        return 0, None
    a, _, b = spec.partition(":")
    return int(a or 0), int(b) if b else None


def slice_indexed(lines: list[str], rows: tuple[int, int | None]) -> list[tuple[int, str]]:
    """按 --rows 切片，保留原始行号（screen 模式查颜色表要用），再掐掉头尾空行。"""
    start, end = rows
    indexed = list(enumerate(lines))[start:end]
    while indexed and not indexed[0][1].strip():
        indexed.pop(0)
    while indexed and not indexed[-1][1].strip():
        indexed.pop()
    return indexed


# ---------------- screen 模式 ----------------

def load_colors(path: str) -> dict[tuple[int, int], list]:
    with open(path, encoding="utf-8") as f:
        raw = json.load(f)
    return {tuple(int(v) for v in key.split(",")): val for key, val in raw.items()}


def span_html(text: str, style) -> str:
    text = html.escape(text)
    if not style:
        return text
    fg, bg, bold = style
    parts = []
    fg_hex = pyte_color(fg)
    if fg_hex != DEFAULT_FG:
        parts.append(f"color:{fg_hex}")
    if bg and bg != "default" and pyte_color(bg) != BG:
        parts.append(f"background:{pyte_color(bg)}")
    if bold:
        parts.append("font-weight:700")
    if not parts:
        return text
    return f'<span style="{";".join(parts)}">{text}</span>'


def render_screen_line(y_real: int, line: str, colors) -> str:
    """一行 → HTML。关键点：颜色表是「显示单元格」下标，而字符串里 CJK 只占 1 个
    字符却占 2 个单元格，所以要用 wcwidth 把字符位置映射到单元格位置再查颜色。"""
    spans: list[str] = []
    buf: list[str] = []
    cur_style = None
    cell = 0
    for ch in line:
        width = max(wcwidth(ch), 1)
        style = colors.get((y_real, cell))
        if style != cur_style:
            if buf:
                spans.append(span_html("".join(buf), cur_style))
                buf = []
            cur_style = style
        buf.append(ch)
        cell += width
    if buf:
        spans.append(span_html("".join(buf), cur_style))
    return "".join(spans)


def render_screen(lines: list[str], colors, rows) -> str:
    out = []
    for y_real, line in slice_indexed(lines, rows):
        inner = render_screen_line(y_real, line, colors)
        inner = inner.replace("ℹ ", INFO_FIX)
        out.append(f'<div class="ln">{inner}</div>')
    return "\n".join(out)


# ---------------- log 模式 ----------------

SGR_RE = re.compile(r"\x1b\[([0-9;]*)m")                        # 颜色码
CSI_OTHER_RE = re.compile(r"\x1b\[[0-9;?=!]*[A-LN-Za-ln-z]")    # 光标移动等其它 CSI（不含 m）
OSC_RE = re.compile(r"\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)")       # 窗口标题等 OSC 序列


def ansi_to_html(s: str) -> str:
    s = OSC_RE.sub("", CSI_OTHER_RE.sub("", s)).replace("\r", "")
    out: list[str] = []
    pos = 0
    fg = None
    bold = False

    def flush(a: int, b: int) -> None:
        if a >= b:
            return
        text = html.escape(s[a:b])
        style = ""
        if fg:
            style += f"color:{fg};"
        if bold:
            style += "font-weight:700;"
        out.append(f'<span style="{style}">{text}</span>' if style else text)

    for m in SGR_RE.finditer(s):
        flush(pos, m.start())
        pos = m.end()
        params = [int(p) if p else 0 for p in m.group(1).split(";")] or [0]
        i = 0
        while i < len(params):
            p = params[i]
            if p == 0:
                fg, bold = None, False
            elif p == 1:
                bold = True
            elif p == 22:
                bold = False
            elif p == 39:
                fg = None
            elif 30 <= p <= 37:
                fg = PAL16[p - 30]
            elif 90 <= p <= 97:
                fg = PAL16[p - 90 + 8]
            elif p in (38, 48) and i + 2 < len(params) and params[i + 1] == 5:
                i += 2  # 256 色扩展参数：按默认色渲染，跳过
            i += 1
    flush(pos, len(s))
    return "".join(out)


def render_log(lines: list[str], rows) -> str:
    out = []
    for _, line in slice_indexed(lines, rows):
        inner = ansi_to_html(line.rstrip()).replace("ℹ ", INFO_FIX)
        out.append(f'<div class="ln">{inner}</div>')
    return "\n".join(out)


# ---------------- editor 模式（TOML 配置 → VS Code 风格） ----------------

# 从左到右单遍扫描：字符串在最前，保证字符串里的 # 和 = 不会被误判成注释或键
TOML_TOKEN_RE = re.compile(
    r'(?P<string>"(?:[^"\\]|\\.)*"|\'[^\']*\')'       # 字符串
    r'|(?P<header>\[\[[^\]]*\]\]|\[[^\]]*\])'         # [节] / [[节]]
    r'|(?P<ikey>[A-Za-z0-9_.\-]+(?=\s*=))'            # 键（含行内表里的键）
    r'|(?P<bool>\btrue\b|\bfalse\b)'
    r'|(?P<date>\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)'
    r'|(?P<num>-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)'
    r'|(?P<comment>#.*$)'
    r'|(?P<other>.)'                                  # = , [ ] { } 空白等
)
TOML_COLORS = {"string": "#ce9178", "header": "#d7ba7d", "ikey": "#9cdcfe",
               "bool": "#569cd6", "date": "#b5cea8", "num": "#b5cea8", "comment": "#6a9955"}
EDITOR_FG = "#d4d4d4"


def toml_line_html(line: str) -> str:
    out = []
    for m in TOML_TOKEN_RE.finditer(line):
        color = TOML_COLORS.get(m.lastgroup, EDITOR_FG)
        text = html.escape(m.group())
        out.append(text if color == EDITOR_FG else f'<span style="color:{color}">{text}</span>')
    return "".join(out)


def render_editor(path: str, start_line: int = 1, highlight: frozenset[int] = frozenset()) -> str:
    """start_line：首行显示的行号（模拟编辑器滚到文件中部时行号不从 1 开始）；
    highlight：要高亮的行号集合（display 行号），画成 VS Code 的选中蓝条。"""
    with open(path, encoding="utf-8") as f:
        lines = f.read().rstrip("\n").split("\n")
    rows = []
    for no, line in enumerate(lines, start_line):
        hl = " hl" if no in highlight else ""
        rows.append(f'<div class="row{hl}"><div class="gln">{no}</div>'
                    f'<div class="code">{toml_line_html(line)}</div></div>')
    return "\n".join(rows)


def editor_frame(title: str, tab: str, rows: str, crumbs: str | None = None,
                 min_width: int | None = None) -> str:
    """VS Code 风格外框。crumbs：面包屑路径（None 则不显示）；
    min_width：编辑器最小宽度（像素），用于让窗口比代码宽、接近真实编辑器观感。"""
    style_extra = f"    min-width: {min_width}px;\n" if min_width else ""
    crumbs_html = f'  <div class="crumbs">{html.escape(crumbs)}</div>\n' if crumbs else ""
    return f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>{html.escape(title)}</title>
<style>
  html, body {{ margin: 0; padding: 0; background: #1e1e1e; }}
  .editor {{
    background: #1e1e1e;
    border-radius: 10px;
    box-shadow: 0 0 0 1px #2a2a2a;
    font-family: {MONO};
    width: fit-content;
{style_extra}  }}
  .titlebar {{
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #3c3c3c;
    color: #cccccc;
    font-size: 14px;
    user-select: none;
  }}
  .filetab {{
    height: 26px;
    display: flex;
    align-items: center;
    background: #252526;
    color: #ffffff;
    font-weight: 700;
    font-size: 13px;
    padding: 0 16px;
    user-select: none;
  }}
  .crumbs {{
    height: 22px;
    display: flex;
    align-items: center;
    color: #8a8a8a;
    font-size: 12.5px;
    padding: 0 16px;
    user-select: none;
  }}
  .codearea {{ padding: 6px 0 10px; }}
  .row {{ display: flex; line-height: 18px; min-height: 18px; font-size: 12.5px; }}
  .row.hl {{ background: #264f78; }}
  .gln {{
    flex: none;
    width: 44px;
    text-align: right;
    padding-right: 16px;
    color: #858585;
    user-select: none;
  }}
  .code {{ white-space: pre; color: {EDITOR_FG}; padding-right: 24px; }}
  .statusbar {{
    height: 22px;
    display: flex;
    align-items: center;
    background: #0e639c;
    color: #ffffff;
    font-size: 12px;
    padding: 0 12px;
    user-select: none;
  }}
</style>
</head>
<body>
<div class="editor">
  <div class="titlebar">{html.escape(title)}</div>
  <div class="filetab">{html.escape(tab)}</div>
{crumbs_html}  <div class="codearea">
{rows}
  </div>
  <div class="statusbar"><span>UTF-8&nbsp;&nbsp;LF&nbsp;&nbsp;TOML</span></div>
</div>
</body>
</html>
"""


# ---------------- 公共外框（终端窗口） ----------------

def frame(title: str, inner: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>{html.escape(title)}</title>
<style>
  html, body {{ margin: 0; padding: 0; background: {BG}; }}
  .term {{
    background: {BG};
    border-radius: 10px;
    box-shadow: 0 0 0 1px #2a2a2a;
    font-family: {MONO};
    font-size: {FONT_PX}px;
    line-height: {LINE_HEIGHT};
  }}
  .titlebar {{
    height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #2d2d2d;
    color: #9d9d9d;
    font-size: 13px;
    user-select: none;
  }}
  .body {{ padding: 14px 18px; color: {DEFAULT_FG}; }}
  .ln {{ white-space: pre; min-height: {LINE_HEIGHT}em; }}
</style>
</head>
<body>
<div class="term">
  <div class="titlebar">{html.escape(title)}</div>
  <div class="body">
{inner}
  </div>
</div>
</body>
</html>
"""


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="mode", required=True)

    p1 = sub.add_parser("screen", help="capture.py 的快照 → HTML")
    p1.add_argument("screen_txt")
    p1.add_argument("colors_json")
    p1.add_argument("out_html")
    p1.add_argument("title", nargs="?", default=None, help="窗口标题（默认用输入文件名）")
    p1.add_argument("--rows", metavar="起:止", help="只渲染第 [起,止) 行（0 起、左闭右开），如 10:81")

    p2 = sub.add_parser("log", help="日志/纯文本 → HTML（支持 ANSI 颜色码）")
    p2.add_argument("log_file")
    p2.add_argument("out_html")
    p2.add_argument("title", nargs="?", default=None, help="窗口标题（默认用输入文件名）")
    p2.add_argument("--rows", metavar="起:止")

    p3 = sub.add_parser("editor", help="TOML 配置 → VS Code 风格 HTML")
    p3.add_argument("config_file")
    p3.add_argument("out_html")
    p3.add_argument("title", nargs="?", default=None, help="窗口标题（默认「文件名 — Neo-MoFox」）")
    p3.add_argument("--start-line", type=int, default=1, metavar="N",
                    help="首行显示的行号（模拟滚动到文件中部，默认 1）")
    p3.add_argument("--highlight", default=None, metavar="行号,行号",
                    help="要高亮（选中蓝条）的行号列表，逗号分隔，如 15,19；行号按 --start-line 后的显示行号算")
    p3.add_argument("--breadcrumb", default=None, metavar="路径",
                    help="面包屑路径（如 Neo-MoFox > config > core.toml），不传则不显示")
    p3.add_argument("--width", type=int, default=None, metavar="PX",
                    help="编辑器最小宽度（像素），让窗口比代码宽、接近真实编辑器观感")

    args = ap.parse_args()
    if args.mode == "screen":
        with open(args.screen_txt, encoding="utf-8") as f:
            lines = f.read().split("\n")
        colors = load_colors(args.colors_json)
        title = args.title or args.screen_txt
        page = frame(title, render_screen(lines, colors, parse_rows(args.rows)))
    elif args.mode == "log":
        with open(args.log_file, encoding="utf-8", errors="replace") as f:
            lines = f.read().split("\n")
        title = args.title or args.log_file
        page = frame(title, render_log(lines, parse_rows(args.rows)))
    else:
        name = os.path.basename(args.config_file)
        title = args.title or f"{name} — Neo-MoFox"
        highlight = frozenset()
        if args.highlight:
            highlight = frozenset(int(x) for x in re.split(r"[,\s]+", args.highlight.strip()) if x)
        rows = render_editor(args.config_file, start_line=args.start_line, highlight=highlight)
        page = editor_frame(title, name, rows, crumbs=args.breadcrumb, min_width=args.width)
    with open(args.out_html, "w", encoding="utf-8") as f:
        f.write(page)
    print(f"[render] 已写出 {args.out_html}")


if __name__ == "__main__":
    main()
