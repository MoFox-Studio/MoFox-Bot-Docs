#!/usr/bin/env python3
"""capture.py —— pty 转快照：把命令行程序放进伪终端真实跑一遍，按关键词自动抓屏。

原理：程序跑在真实 pty 里（终端模拟用 pyte），屏幕内容与真终端一致；
当屏幕出现指定「标记文本」时，保存当时的整屏快照（屏幕文本 + 逐格颜色），
并可以自动发送回复（模拟用户输入）。

用法：
  python3 capture.py --cmd "uv run main.py" --cwd /path/to/项目 \
      --snap agreement:"[EULA] 请输入" \
      --send "[EULA] 请输入:agree" \
      --snap success:"输入 /help 查看可用命令" \
      --outdir captures

输出：
  captures/NAME.screen.txt   快照时刻的整屏文本（每行已去行尾空白）
  captures/NAME.colors.json  逐格颜色 {"行,列": [前景, 背景, 是否加粗]}（单元格索引）

配套：用 render.py 把快照渲染成终端窗口风格的 HTML。
"""
import argparse
import fcntl
import json
import os
import pty
import select
import signal
import struct
import subprocess
import sys
import termios
import time

import pyte


def parse_args():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--cmd", required=True, help="要运行的命令（在 pty 里执行）")
    ap.add_argument("--cwd", default=".", help="命令的工作目录")
    ap.add_argument("--snap", action="append", default=[], metavar="名称:标记文本",
                    help="屏幕出现「标记文本」时保存快照，命名为 NAME（可多次）")
    ap.add_argument("--send", action="append", default=[], metavar="标记文本:回复",
                    help="屏幕出现「标记文本」时自动发送「回复」+回车（可多次）")
    ap.add_argument("--subst", action="append", default=[], metavar="旧=新",
                    help="喂给终端模拟器前做文本替换；旧和新必须等长（终端列位置依赖字符宽度，不等长会错位）")
    ap.add_argument("--cols", type=int, default=110, help="终端列数（默认 110）")
    ap.add_argument("--rows", type=int, default=85, help="终端行数（默认 85，够高能少滚动）")
    ap.add_argument("--settle", type=float, default=2.0, help="快照前等待秒数，让最后一波日志刷完（默认 2.0）")
    ap.add_argument("--timeout", type=int, default=900, help="总超时秒数（默认 900）")
    ap.add_argument("--wait-exit", action="store_true",
                    help="默认所有快照/回复规则触发完就提前结束；加上本参数则一直等到程序退出或超时")
    ap.add_argument("--outdir", default="captures", help="快照输出目录（默认 captures）")
    return ap.parse_args()


def main():
    args = parse_args()
    os.makedirs(args.outdir, exist_ok=True)

    snaps = []  # [名称, 标记, 是否已完成]
    for rule in args.snap:
        name, _, marker = rule.partition(":")
        if not marker:
            sys.exit(f"--snap 格式应为 名称:标记文本，得到：{rule}")
        snaps.append([name, marker, False])
    sends = []  # [标记, 回复, 是否已发送]
    for rule in args.send:
        marker, _, text = rule.partition(":")
        if not text:
            sys.exit(f"--send 格式应为 标记文本:回复，得到：{rule}")
        sends.append([marker, text, False])
    substs = []
    for rule in args.subst:
        old, _, new = rule.partition("=")
        if len(old) != len(new):
            sys.exit(f"--subst 必须等长（{len(old)} != {len(new)}）：{rule}")
        substs.append((old, new))

    # ---- 起 pty ----
    master, slave = pty.openpty()
    fcntl.ioctl(slave, termios.TIOCSWINSZ, struct.pack("HHHH", args.rows, args.cols, 0, 0))
    env = dict(os.environ, TERM="xterm-256color", COLUMNS=str(args.cols), LINES=str(args.rows))
    proc = subprocess.Popen(args.cmd, shell=True, cwd=args.cwd,
                            stdin=slave, stdout=slave, stderr=slave,
                            env=env, preexec_fn=os.setsid)
    os.close(slave)

    screen = pyte.Screen(args.cols, args.rows)
    stream = pyte.ByteStream(screen)

    def feed(chunk: bytes) -> None:
        text = chunk.decode("utf-8", errors="replace")
        for old, new in substs:
            text = text.replace(old, new)
        # pyte 对 emoji 变体选择符（U+FE0F）的宽度计算与 Rich 不一致，会错位丢字：
        # 去掉 VS16，并把 ⚠/ℹ 补一个空格凑成 Rich 预留的 2 格宽
        text = text.replace("\ufe0f", "")
        text = text.replace("\u26a0", "\u26a0 ").replace("\u2139", "\u2139 ")
        stream.feed(text.encode("utf-8"))

    def screen_text() -> str:
        display = screen.display
        if isinstance(display, list):  # pyte 0.8.x 的 display 是 list
            display = "\n".join(display)
        return "\n".join(line.rstrip() for line in display.split("\n"))

    def drain(timeout: float) -> None:
        """把这段时间新到的输出全部喂进屏幕。"""
        while True:
            r, _, _ = select.select([master], [], [], timeout)
            if not r:
                return
            try:
                chunk = os.read(master, 65536)
            except OSError:
                return
            if not chunk:
                return
            feed(chunk)

    def save(name: str) -> None:
        with open(os.path.join(args.outdir, f"{name}.screen.txt"), "w", encoding="utf-8") as f:
            f.write(screen_text())
        colors = {}
        for y in range(args.rows):
            for x in range(args.cols):
                ch = screen.buffer[y][x]
                if ch.fg or ch.bg:
                    colors[f"{y},{x}"] = [ch.fg or "", ch.bg or "", bool(ch.bold)]
        with open(os.path.join(args.outdir, f"{name}.colors.json"), "w", encoding="utf-8") as f:
            json.dump(colors, f, ensure_ascii=False)
        print(f"[capture] 快照已保存：{name}", flush=True)

    def run_rules() -> None:
        text = screen_text()
        for item in snaps:
            name, marker, done = item
            if not done and marker in text:
                time.sleep(args.settle)
                drain(0.4)
                save(name)
                item[2] = True
        for item in sends:
            marker, reply, done = item
            if not done and marker in text:
                os.write(master, (reply + "\n").encode())
                item[2] = True
                print(f"[capture] 已发送回复：{reply!r}", flush=True)

    print(f"[capture] 运行：{args.cmd}（cwd={args.cwd}，{args.cols}x{args.rows}）", flush=True)
    try:
        deadline = time.time() + args.timeout
        while time.time() < deadline:
            r, _, _ = select.select([master], [], [], 1.0)
            if r:
                try:
                    chunk = os.read(master, 65536)
                except OSError:
                    break
                if not chunk:
                    break
                feed(chunk)
                run_rules()
            if proc.poll() is not None:
                drain(0.5)
                run_rules()
                print(f"[capture] 进程已退出（code={proc.returncode}）", flush=True)
                break
            # 快照和自动回复都完成了，就没必要等程序自己退出（服务类程序永远不退）
            if (not args.wait_exit and (snaps or sends)
                    and all(rule[2] for rule in snaps) and all(rule[2] for rule in sends)):
                drain(0.5)
                print("[capture] 所有规则已触发，提前收工", flush=True)
                break
        else:
            print("[capture] 达到总超时", flush=True)
    finally:
        # 有些程序会忽略 SIGTERM，直接 SIGKILL 整个进程组，避免残留进程占端口。
        # 注意：确认这个进程组里只有你抓的程序，别误杀别的实例。
        try:
            os.killpg(os.getpgid(proc.pid), signal.SIGKILL)
        except Exception:
            pass

    captured = [name for name, _, done in snaps if done]
    print(f"[capture] 完成，共 {len(captured)}/{len(snaps)} 张快照：{captured}", flush=True)
    sys.exit(0 if len(captured) == len(snaps) else 1)


if __name__ == "__main__":
    main()
