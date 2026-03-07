#!/usr/bin/env python3
"""Simple version - no streaming, just print statements to test VHS capture."""
import time

BOLD = "\033[1m"
GREEN = "\033[32m"
YELLOW = "\033[33m"
GRAY = "\033[90m"
RESET = "\033[0m"

print(f"{BOLD}$ claude{RESET}")
print()
time.sleep(0.5)
print(f"> Welcome back, Alex. Say {BOLD}/start{RESET} for your daily snapshot.")
print()
time.sleep(0.8)
print(f"{BOLD}> start{RESET}")
print()
time.sleep(0.6)
print(f"Good morning, Alex.")
print()
print(f"{BOLD}Daily Snapshot — Mar 7, 2026{RESET}")
print()
time.sleep(0.3)

tl = GRAY
r = RESET
print(f"{tl}┌──────────────────┬────────────┬─────────────┐{r}")
print(f"{tl}│{r} {BOLD}Metric{r}           {tl}│{r} {BOLD}Value{r}      {tl}│{r} {BOLD}Zone{r}        {tl}│{r}")
print(f"{tl}├──────────────────┼────────────┼─────────────┤{r}")
time.sleep(0.3)
print(f"{tl}│{r} Portfolio        {tl}│{r} $2.1M      {tl}│{r} —           {tl}│{r}")
time.sleep(0.2)
print(f"{tl}│{r} BTC Allocation   {tl}│{r} 62%        {tl}│{r} {YELLOW}WATCH{r}    {tl}│{r}")
time.sleep(0.2)
print(f"{tl}│{r} Temperature      {tl}│{r} 38 (Fear)  {tl}│{r} {GREEN}SAFE{r}     {tl}│{r}")
time.sleep(0.2)
print(f"{tl}│{r} Runway           {tl}│{r} 48 months  {tl}│{r} {GREEN}SAFE{r}     {tl}│{r}")
time.sleep(0.2)
print(f"{tl}│{r} Ruin Test        {tl}│{r} PASS       {tl}│{r} {GREEN}SAFE{r}     {tl}│{r}")
print(f"{tl}└──────────────────┴────────────┴─────────────┘{r}")
print()
time.sleep(0.3)
print(f"{BOLD}Priorities:{RESET}")
print(f"1. Temperature is in fear territory — your DCA multiplier is {BOLD}1.5x{RESET} this week")
print(f"2. Concentration at 62% exceeds your 55% target — review after next sell trigger")
print()
print(f"Say {BOLD}/check{RESET} for a full stress test, or ask me anything.")
