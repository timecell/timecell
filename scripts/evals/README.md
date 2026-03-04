# TimeCell Eval Framework

A compounding test suite for TimeCell skills. Test cases accumulate over time — each scored result can become a golden baseline for regression testing.

## Concepts

- **Case:** A test scenario (persona + conversation turns + expected outputs)
- **Result:** The actual API response + automated scores + human rating
- **Golden:** A human-approved response that becomes the regression baseline

## Workflow

1. **Add a case:** `python3 scripts/evals/eval-runner.py add-case --name "setup-btc-investor" --skill setup`
2. **Run cases:** `python3 scripts/evals/eval-runner.py run --case setup-btc-investor`
3. **Run all:** `python3 scripts/evals/eval-runner.py run --all`
4. **Score results:** `python3 scripts/evals/eval-runner.py score --result results/2026-03-04-setup-btc-investor.json`
5. **Promote to golden:** `python3 scripts/evals/eval-runner.py promote --result results/2026-03-04-setup-btc-investor.json`
6. **Regression test:** `python3 scripts/evals/eval-runner.py regression` (runs all cases, compares to golden)
7. **Report:** `python3 scripts/evals/eval-runner.py report` (summary of all results over time)

## Case Format (JSON)

```json
{
  "name": "setup-btc-investor",
  "skill": "setup",
  "description": "Bitcoin-conviction investor, 18 BTC, $1.7M total",
  "persona": "Alex Chen, 42, Austin TX, software engineer turned investor",
  "turns": [
    {
      "user": "Hello",
      "required": ["welcome", "setup"],
      "forbidden": ["how can I help"],
      "description": "Should auto-start onboarding"
    }
  ],
  "created": "2026-03-04",
  "tags": ["setup", "bitcoin-fo", "onboarding"]
}
```

## Result Format (JSON)

```json
{
  "case": "setup-btc-investor",
  "timestamp": "2026-03-04T16:30:00",
  "model": "claude-sonnet-4-20250514",
  "turns": [
    {
      "user": "Hello",
      "assistant": "Welcome to TimeCell...",
      "checks": {"welcome": true, "setup": true},
      "passed": true
    }
  ],
  "auto_score": {"passed": 10, "failed": 0, "total": 10},
  "human_score": null,
  "human_notes": null,
  "is_golden": false
}
```

## Human Scoring

After running a case, review the result and score:
- **5/5:** Perfect — promote to golden
- **4/5:** Good — minor issues, still usable
- **3/5:** Acceptable — works but needs improvement
- **2/5:** Poor — significant issues
- **1/5:** Failed — doesn't work

Use: `python3 scripts/evals/eval-runner.py score --result <file> --score 5 --notes "Great tone, good flow"`
