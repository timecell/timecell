#!/usr/bin/env python3
"""
TimeCell Eval Runner — Execute, score, and track skill quality over time.

Usage:
    python3 scripts/evals/eval-runner.py run --case setup-btc-investor
    python3 scripts/evals/eval-runner.py run --all
    python3 scripts/evals/eval-runner.py list
    python3 scripts/evals/eval-runner.py score --result <file> --score 5 --notes "Great"
    python3 scripts/evals/eval-runner.py promote --result <file>
    python3 scripts/evals/eval-runner.py regression
    python3 scripts/evals/eval-runner.py report

Requires: ANTHROPIC_API_KEY environment variable (for run/regression commands)
"""

import anthropic
import json
import sys
import os
import argparse
import glob
from datetime import datetime

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(os.path.dirname(SCRIPT_DIR))
CASES_DIR = os.path.join(SCRIPT_DIR, "cases")
RESULTS_DIR = os.path.join(SCRIPT_DIR, "results")
GOLDEN_DIR = os.path.join(SCRIPT_DIR, "golden")

# Ensure directories exist
for d in [CASES_DIR, RESULTS_DIR, GOLDEN_DIR]:
    os.makedirs(d, exist_ok=True)


def read_project_file(path):
    """Read a file relative to project root."""
    full_path = os.path.join(PROJECT_ROOT, path)
    with open(full_path, 'r') as f:
        return f.read()


def load_case(name):
    """Load a test case by name."""
    path = os.path.join(CASES_DIR, f"{name}.json")
    if not os.path.exists(path):
        print(f"Error: Case '{name}' not found at {path}")
        sys.exit(1)
    with open(path) as f:
        return json.load(f)


def list_cases():
    """List all available test cases."""
    cases = glob.glob(os.path.join(CASES_DIR, "*.json"))
    if not cases:
        print("No test cases found in cases/")
        return
    print(f"\n{'='*60}")
    print(f"  Available Test Cases ({len(cases)})")
    print(f"{'='*60}\n")
    for path in sorted(cases):
        with open(path) as f:
            case = json.load(f)
        tags = ", ".join(case.get("tags", []))
        turns = len(case.get("turns", []))
        print(f"  {case['name']}")
        print(f"    {case['description']}")
        print(f"    Skill: {case['skill']} | Turns: {turns} | Tags: {tags}")
        print()


def build_system(case):
    """Build system prompt from case's system_files."""
    parts = []
    for f in case.get("system_files", ["CLAUDE.md"]):
        try:
            parts.append(read_project_file(f))
        except FileNotFoundError:
            parts.append(f"[File not found: {f}]")

    # Use profile_override if specified, otherwise load actual profile
    if "profile_override" in case:
        parts.append(f"\n---\nCurrent memory/profile.md:\n{case['profile_override']}")
    else:
        try:
            parts.append(f"\n---\nCurrent memory/profile.md:\n{read_project_file('memory/profile.md')}")
        except FileNotFoundError:
            pass

    return "\n\n---\n\n".join(parts)


def judge_turn(client, turn, assistant_msg):
    """Use LLM-as-judge to score a turn on quality criteria."""
    criteria = turn.get("criteria", [])
    if not criteria:
        return None

    criteria_text = "\n".join(f"- {c}" for c in criteria)
    judge_prompt = f"""You are evaluating an AI CIO assistant's response quality.

USER MESSAGE:
{turn['user']}

ASSISTANT RESPONSE:
{assistant_msg}

EVALUATION CRITERIA (each worth 1 point):
{criteria_text}

For each criterion, output PASS or FAIL with a brief reason.
Then give a total score as: SCORE: X/{len(criteria)}

Be strict but fair. The criterion should be met in spirit, not just by keyword."""

    try:
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=500,
            messages=[{"role": "user", "content": judge_prompt}],
        )
        judge_text = response.content[0].text

        # Extract score
        import re
        score_match = re.search(r'SCORE:\s*(\d+)/(\d+)', judge_text)
        if score_match:
            return {
                "score": int(score_match.group(1)),
                "total": int(score_match.group(2)),
                "detail": judge_text,
            }
        return {"score": 0, "total": len(criteria), "detail": judge_text}
    except Exception as e:
        return {"score": 0, "total": len(criteria), "detail": f"Judge error: {e}"}


def run_case(case, client, model="claude-sonnet-4-20250514"):
    """Run a single test case through the API."""
    system = build_system(case)
    messages = []
    turn_results = []

    print(f"\n{'='*60}")
    print(f"  Running: {case['name']}")
    print(f"  {case['description']}")
    print(f"  Model: {model}")
    print(f"{'='*60}\n")

    for i, turn in enumerate(case["turns"]):
        user_msg = turn["user"]
        print(f"  Turn {i+1}: {turn.get('description', '')}")
        print(f"    User: {user_msg[:80]}{'...' if len(user_msg) > 80 else ''}")

        messages.append({"role": "user", "content": user_msg})

        try:
            response = client.messages.create(
                model=model,
                max_tokens=2000,
                system=system,
                messages=messages,
            )

            assistant_msg = response.content[0].text
            messages.append({"role": "assistant", "content": assistant_msg})

            # Keyword checks (legacy — kept for quick sanity)
            checks = {}
            keyword_passed = True

            for keyword in turn.get("required", []):
                found = keyword.lower() in assistant_msg.lower()
                checks[keyword] = found
                if not found:
                    print(f"    MISSING: '{keyword}'")
                    keyword_passed = False

            for keyword in turn.get("forbidden", []):
                found = keyword.lower() in assistant_msg.lower()
                if found:
                    checks[f"!{keyword}"] = False
                    print(f"    FOUND FORBIDDEN: '{keyword}'")
                    keyword_passed = False

            # LLM-as-judge (primary quality signal)
            judge_result = judge_turn(client, turn, assistant_msg)
            if judge_result:
                judge_passed = judge_result["score"] == judge_result["total"]
                passed = judge_passed  # Judge overrides keywords
                print(f"    Keywords: {'PASS' if keyword_passed else 'FAIL'} | Judge: {judge_result['score']}/{judge_result['total']}")
            else:
                passed = keyword_passed
                print(f"    Keywords: {'PASS' if keyword_passed else 'FAIL'}")

            status = "PASS" if passed else "FAIL"
            print(f"    [{status}]")

            turn_results.append({
                "user": user_msg,
                "assistant": assistant_msg,
                "checks": checks,
                "keyword_passed": keyword_passed,
                "judge": judge_result,
                "passed": passed,
                "description": turn.get("description", ""),
            })

        except Exception as e:
            print(f"    API Error: {e}")
            turn_results.append({
                "user": user_msg,
                "assistant": f"[Error: {e}]",
                "checks": {},
                "passed": False,
                "error": str(e),
            })
            messages.append({"role": "assistant", "content": f"[Error: {e}]"})

    # Build result
    total_checks = sum(len(t.get("checks", {})) for t in turn_results)
    passed_checks = sum(
        sum(1 for v in t.get("checks", {}).values() if v)
        for t in turn_results
    )

    result = {
        "case": case["name"],
        "timestamp": datetime.now().isoformat(),
        "model": model,
        "turns": turn_results,
        "auto_score": {
            "passed": passed_checks,
            "failed": total_checks - passed_checks,
            "total": total_checks,
            "all_turns_passed": all(t["passed"] for t in turn_results),
        },
        "human_score": None,
        "human_notes": None,
        "is_golden": False,
    }

    # Save result
    timestamp = datetime.now().strftime("%Y-%m-%d-%H%M")
    result_file = os.path.join(RESULTS_DIR, f"{timestamp}-{case['name']}.json")
    with open(result_file, 'w') as f:
        json.dump(result, f, indent=2)

    # Summary
    print(f"\n  Auto-score: {passed_checks}/{total_checks} checks passed")
    print(f"  All turns passed: {result['auto_score']['all_turns_passed']}")
    print(f"  Saved: {os.path.relpath(result_file, PROJECT_ROOT)}")

    return result, result_file


def score_result(result_file, score, notes):
    """Add human score and notes to a result."""
    with open(result_file) as f:
        result = json.load(f)

    result["human_score"] = score
    result["human_notes"] = notes

    with open(result_file, 'w') as f:
        json.dump(result, f, indent=2)

    print(f"Scored: {result['case']} -> {score}/5")
    if notes:
        print(f"Notes: {notes}")

    if score == 5:
        print("Score is 5/5 -- consider promoting to golden with: eval-runner.py promote --result <file>")


def promote_to_golden(result_file):
    """Promote a result to golden baseline."""
    with open(result_file) as f:
        result = json.load(f)

    result["is_golden"] = True
    golden_file = os.path.join(GOLDEN_DIR, f"{result['case']}.json")

    with open(golden_file, 'w') as f:
        json.dump(result, f, indent=2)

    # Also update the original
    with open(result_file, 'w') as f:
        json.dump(result, f, indent=2)

    print(f"Promoted to golden: {golden_file}")


def run_regression(client, model):
    """Run all cases that have golden baselines and compare."""
    golden_files = glob.glob(os.path.join(GOLDEN_DIR, "*.json"))
    if not golden_files:
        print("No golden baselines found. Run cases and promote good results first.")
        return

    print(f"\n{'='*60}")
    print(f"  Regression Test -- {len(golden_files)} golden baselines")
    print(f"{'='*60}\n")

    for golden_file in sorted(golden_files):
        with open(golden_file) as f:
            golden = json.load(f)

        case = load_case(golden["case"])
        result, _ = run_case(case, client, model)

        # Compare auto scores
        golden_score = golden["auto_score"]["passed"]
        new_score = result["auto_score"]["passed"]

        if new_score >= golden_score:
            print(f"  [PASS] {case['name']}: {new_score}/{result['auto_score']['total']} (golden: {golden_score})")
        else:
            print(f"  [REGRESSION] {case['name']}: {new_score}/{result['auto_score']['total']} (golden: {golden_score})")


def show_report():
    """Show a summary of all results over time."""
    result_files = sorted(glob.glob(os.path.join(RESULTS_DIR, "*.json")))
    if not result_files:
        print("No results found. Run some cases first.")
        return

    print(f"\n{'='*60}")
    print(f"  Eval Results Report ({len(result_files)} runs)")
    print(f"{'='*60}\n")

    by_case = {}
    for path in result_files:
        with open(path) as f:
            result = json.load(f)
        case_name = result["case"]
        if case_name not in by_case:
            by_case[case_name] = []
        by_case[case_name].append(result)

    for case_name, results in sorted(by_case.items()):
        latest = results[-1]
        auto = latest["auto_score"]
        human = latest.get("human_score", "-")
        golden = " [GOLDEN]" if latest.get("is_golden") else ""

        print(f"  {case_name}{golden}")
        print(f"    Runs: {len(results)} | Latest: {auto['passed']}/{auto['total']} auto | Human: {human}/5")
        if latest.get("human_notes"):
            print(f"    Notes: {latest['human_notes']}")
        print()


def main():
    parser = argparse.ArgumentParser(description="TimeCell Eval Runner")
    subparsers = parser.add_subparsers(dest="command", help="Command")

    # list
    subparsers.add_parser("list", help="List available test cases")

    # run
    run_parser = subparsers.add_parser("run", help="Run test case(s)")
    run_parser.add_argument("--case", help="Case name to run")
    run_parser.add_argument("--all", action="store_true", help="Run all cases")
    run_parser.add_argument("--model", default="claude-sonnet-4-20250514", help="Model")

    # score
    score_parser = subparsers.add_parser("score", help="Score a result")
    score_parser.add_argument("--result", required=True, help="Result file path")
    score_parser.add_argument("--score", type=int, required=True, choices=[1, 2, 3, 4, 5])
    score_parser.add_argument("--notes", default="", help="Human notes")

    # promote
    promote_parser = subparsers.add_parser("promote", help="Promote result to golden")
    promote_parser.add_argument("--result", required=True, help="Result file path")

    # regression
    reg_parser = subparsers.add_parser("regression", help="Run regression tests")
    reg_parser.add_argument("--model", default="claude-sonnet-4-20250514", help="Model")

    # report
    subparsers.add_parser("report", help="Show results report")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    if args.command == "list":
        list_cases()
    elif args.command == "run":
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            print("Error: ANTHROPIC_API_KEY not set")
            sys.exit(1)
        client = anthropic.Anthropic(api_key=api_key)

        if args.all:
            cases = glob.glob(os.path.join(CASES_DIR, "*.json"))
            for path in sorted(cases):
                with open(path) as f:
                    case = json.load(f)
                run_case(case, client, args.model)
        elif args.case:
            case = load_case(args.case)
            run_case(case, client, args.model)
        else:
            print("Specify --case <name> or --all")
    elif args.command == "score":
        score_result(args.result, args.score, args.notes)
    elif args.command == "promote":
        promote_to_golden(args.result)
    elif args.command == "regression":
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            print("Error: ANTHROPIC_API_KEY not set")
            sys.exit(1)
        client = anthropic.Anthropic(api_key=api_key)
        run_regression(client, args.model)
    elif args.command == "report":
        show_report()


if __name__ == "__main__":
    main()
