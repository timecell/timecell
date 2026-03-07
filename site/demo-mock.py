#!/usr/bin/env python3
"""Simulates a TimeCell /start session with streaming output for VHS demo recording."""

import sys
import time

BOLD = "\033[1m"
GREEN = "\033[32m"
YELLOW = "\033[33m"
GRAY = "\033[90m"
RESET = "\033[0m"


def stream(text, delay=0.015):
    """Print text character by character."""
    for ch in text:
        sys.stdout.write(ch)
        sys.stdout.flush()
        time.sleep(delay)


def stream_fast(text, delay=0.005):
    """Print text faster (for table/data lines)."""
    stream(text, delay)


def instant(text):
    """Print text instantly (user input)."""
    sys.stdout.write(text)
    sys.stdout.flush()


def pause(seconds):
    time.sleep(seconds)


def main():
    # User prompt + command
    instant(f"{BOLD}$ claude{RESET}\n\n")
    pause(0.5)

    stream(f"> Welcome back, Alex. Say {BOLD}/start{RESET} for your daily snapshot, or ask me anything.\n\n")
    pause(0.8)

    instant(f"{BOLD}> start{RESET}\n\n")
    pause(0.6)

    stream(f"Good morning, Alex.")
    pause(0.5)
    stream(f"\n\n")

    stream(f"{BOLD}Daily Snapshot — Mar 7, 2026{RESET}\n\n")
    pause(0.3)

    # Table
    tl = GRAY  # table line color
    r = RESET

    stream_fast(f"{tl}┌──────────────────┬────────────┬─────────────┐{r}\n")
    pause(0.1)
    stream_fast(f"{tl}│{r} {BOLD}Metric{r}           {tl}│{r} {BOLD}Value{r}      {tl}│{r} {BOLD}Zone{r}        {tl}│{r}\n")
    stream_fast(f"{tl}├──────────────────┼────────────┼─────────────┤{r}\n")
    pause(0.3)

    stream_fast(f"{tl}│{r} Portfolio        {tl}│{r} $2.1M      {tl}│{r} —           {tl}│{r}\n")
    pause(0.3)
    stream_fast(f"{tl}│{r} BTC Allocation   {tl}│{r} 62%        {tl}│{r} {YELLOW}WATCH{r}    {tl}│{r}\n")
    pause(0.3)
    stream_fast(f"{tl}│{r} Temperature      {tl}│{r} 38 (Fear)  {tl}│{r} {GREEN}SAFE{r}     {tl}│{r}\n")
    pause(0.3)
    stream_fast(f"{tl}│{r} Runway           {tl}│{r} 48 months  {tl}│{r} {GREEN}SAFE{r}     {tl}│{r}\n")
    pause(0.3)
    stream_fast(f"{tl}│{r} Ruin Test        {tl}│{r} PASS       {tl}│{r} {GREEN}SAFE{r}     {tl}│{r}\n")
    pause(0.1)

    stream_fast(f"{tl}└──────────────────┴────────────┴─────────────┘{r}\n")
    pause(0.4)

    stream(f"\n{BOLD}Priorities:{RESET}\n")
    pause(0.2)
    stream(f"1. Temperature is in fear territory — your DCA multiplier is {BOLD}1.5x{RESET} this week\n")
    pause(0.2)
    stream(f"2. Concentration at 62% exceeds your 55% target — review after next sell trigger\n")
    pause(0.3)

    stream(f"\nSay {BOLD}/check{RESET} for a full stress test, or ask me anything.\n")

    # Blinking cursor effect
    pause(1.0)
    sys.stdout.write("\n")
    sys.stdout.flush()


if __name__ == "__main__":
    main()
