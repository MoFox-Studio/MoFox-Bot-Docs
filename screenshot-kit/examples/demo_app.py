#!/usr/bin/env python3
"""演示用假交互程序：有面板、颜色、emoji、交互提问，用来验证 screenshot-kit。"""
import os
import sys

CYAN = "\x1b[96m"
GREEN = "\x1b[32m"
RED = "\x1b[91m"
YELLOW = "\x1b[93m"
RESET = "\x1b[0m"


def main():
    print("╭────────────────────────────────────╮")
    print("│      Neo-Demo 启动面板 v1.0        │")
    print("╰────────────────────────────────────╯")
    print(f"工作目录：{os.getcwd()}")
    print(f"{GREEN}✔{RESET} 配置加载完成：config/core.toml")
    print(f"{YELLOW} ⚠️ 警告：示例目录不存在，已自动创建{RESET}")
    print(f"{CYAN} ℹ️ 提示：这是一条信息，用来测试宽度{RESET}")
    print()
    print(f"{CYAN}[demo]{RESET} 请输入指令 (start / quit): ", flush=True)
    for line in sys.stdin:
        cmd = line.strip()
        if cmd == "start":
            print(f"{GREEN}[INFO]{RESET} 服务已启动，监听 0.0.0.0:8080")
            print(f"{RED}[ERROR]{RESET} 演示错误：连接超时（假消息）")
            print(f"{YELLOW}[WARN]{RESET} 磁盘剩余空间不足 10%")
            print(f"{CYAN}[demo]{RESET} 输入 /help 查看可用命令", flush=True)
        elif cmd == "quit":
            print("再见！")
            break
        else:
            print(f"未知指令：{cmd!r}，请输入 start 或 quit")
            print(f"{CYAN}[demo]{RESET} 请输入指令 (start / quit): ", flush=True)


main()
