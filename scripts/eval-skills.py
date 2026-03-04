#!/usr/bin/env python3
"""
TimeCell Skill Eval — Validates skill outputs via API simulation.

Sends simulated user messages to Claude with TimeCell's system prompt
(CLAUDE.md + memory/profile.md + skill file) and checks that the response
contains expected sections. Catches regressions in skill behavior.

Usage:
    python3 scripts/eval-skills.py                    # Run all evals
    python3 scripts/eval-skills.py --skill setup      # Run one skill
    python3 scripts/eval-skills.py --dry-run           # Show what would be tested
    python3 scripts/eval-skills.py --model claude-sonnet-4-20250514  # Use specific model

Requires: ANTHROPIC_API_KEY environment variable
Install:  pip install anthropic
"""

import anthropic
import json
import sys
import os
import re
import argparse

# Project root
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)

def read_file(path):
    """Read a file relative to project root."""
    full_path = os.path.join(PROJECT_ROOT, path)
    with open(full_path, 'r') as f:
        return f.read()

def build_system_prompt():
    """Build the full system prompt from CLAUDE.md + relevant files."""
    claude_md = read_file("CLAUDE.md")
    profile = read_file("memory/profile.md")
    return f"""{claude_md}

---
Current contents of memory/profile.md:
{profile}
"""

def check_response(response_text, required_sections, forbidden_patterns=None):
    """Check if response contains required sections and no forbidden patterns."""
    results = []
    for section in required_sections:
        found = section.lower() in response_text.lower()
        results.append({"section": section, "found": found})

    if forbidden_patterns:
        for pattern in forbidden_patterns:
            found = pattern.lower() in response_text.lower()
            if found:
                results.append({"section": f"FORBIDDEN: {pattern}", "found": True})

    return results

# Define eval cases for each skill
EVAL_CASES = {
    "setup": {
        "description": "First-time onboarding should start automatically",
        "user_message": "Hello",
        "skill_file": "skills/core/setup.md",
        "required_sections": [
            "welcome",
            "family office",
            "tell me about",  # Should ask about the user
        ],
        "forbidden_patterns": [
            "I don't know what to do",
            "How can I help you",  # Should NOT be generic — should start setup
        ],
        "max_tokens": 1000,
    },
    "start": {
        "description": "Daily snapshot with guardrail status",
        "user_message": "/start\n\nMy current portfolio: $5M total, 60% BTC ($3M), 40% cash/bonds ($2M). Monthly burn: $15K. Liquid reserves: $500K. BTC price: $90,000. MVRV: 2.5, RHODL: 50000.",
        "skill_file": "skills/core/start.md",
        "profile_override": """# My Office
Updated: 2026-03-04
Active pack: bitcoin-fo

## Identity
- name: Test User
- tax_jurisdiction: US
- life_context: Mid-career, building wealth through Bitcoin conviction.

## Portfolio Summary
- total_value_usd: 5000000
- primary_currency: USD

## Burn & Runway
- monthly_burn_usd: 15000
- liquid_reserve_usd: 500000
- runway_months: 33

## Goals
- Build long-term wealth through Bitcoin

## Risk Profile
- risk_context: Moderate conviction, reasonable runway
- leverage_stance: No leverage

## CIO Preferences
- communication_density: concise
- challenge_level: direct
""",
        "required_sections": [
            "snapshot",
            "runway",
            "guardrail",
            "temperature",  # bitcoin-fo pack should add this
        ],
        "max_tokens": 2000,
    },
    "check": {
        "description": "On-demand risk assessment with clear verdict",
        "user_message": "/check\n\nI'm worried about a crash. Portfolio: $5M, 60% BTC, $15K/month burn, $500K liquid. BTC at $90K.",
        "skill_file": "skills/core/check.md",
        "profile_override": """# My Office
Updated: 2026-03-04
Active pack: bitcoin-fo

## Identity
- name: Test User

## Portfolio Summary
- total_value_usd: 5000000

## Burn & Runway
- monthly_burn_usd: 15000
- liquid_reserve_usd: 500000

## CIO Preferences
- communication_density: concise
- challenge_level: direct
""",
        "required_sections": [
            "verdict",  # Must have a clear verdict
            "stress",   # Must include stress test
            "runway",
            "survive",  # Must mention crash survival
        ],
        "forbidden_patterns": [],
        "max_tokens": 2000,
    },
    "ask": {
        "description": "Free-form CIO conversation",
        "user_message": "/ask\n\nWhat happens if I sell 10% of my BTC position?",
        "skill_file": "skills/core/ask.md",
        "profile_override": """# My Office
Updated: 2026-03-04
Active pack: bitcoin-fo

## Identity
- name: Test User

## Portfolio Summary
- total_value_usd: 5000000

## Burn & Runway
- monthly_burn_usd: 15000
- liquid_reserve_usd: 500000

## CIO Preferences
- communication_density: concise
- challenge_level: direct
""",
        "required_sections": [
            "btc",       # Should discuss BTC
            "portfolio", # Should show portfolio impact
            "runway",    # Should mention runway impact
        ],
        "max_tokens": 1500,
    },
}

def run_eval(skill_name, case, client, model="claude-sonnet-4-20250514"):
    """Run a single eval case."""
    print(f"\n{'='*60}")
    print(f"EVAL: {skill_name} -- {case['description']}")
    print(f"{'='*60}")

    # Build system prompt
    system = build_system_prompt()

    # Add skill file content to system prompt
    skill_content = read_file(case["skill_file"])
    system += f"\n\n---\nSkill definition ({case['skill_file']}):\n{skill_content}"

    # Override profile if specified
    if "profile_override" in case:
        # Replace the profile section in the system prompt
        system = system.replace(read_file("memory/profile.md"), case["profile_override"])

    try:
        response = client.messages.create(
            model=model,
            max_tokens=case.get("max_tokens", 1500),
            system=system,
            messages=[{"role": "user", "content": case["user_message"]}]
        )

        response_text = response.content[0].text

        # Check required sections
        checks = check_response(
            response_text,
            case["required_sections"],
            case.get("forbidden_patterns", [])
        )

        # Report
        all_passed = True
        for check in checks:
            if check["section"].startswith("FORBIDDEN:"):
                if check["found"]:
                    print(f"  FAIL {check['section']} -- FOUND (should not be present)")
                    all_passed = False
                # Don't report if forbidden pattern is correctly absent
            else:
                status = "PASS" if check["found"] else "FAIL"
                if not check["found"]:
                    all_passed = False
                print(f"  {status} Contains '{check['section']}'")

        # Show excerpt
        print(f"\n  Response excerpt ({len(response_text)} chars):")
        print(f"  {response_text[:300]}...")

        return all_passed

    except Exception as e:
        print(f"  FAIL API Error: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description="TimeCell Skill Eval")
    parser.add_argument("--skill", help="Run eval for a specific skill only")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be tested")
    parser.add_argument("--model", default="claude-sonnet-4-20250514", help="Model to use")
    args = parser.parse_args()

    if args.dry_run:
        print("TimeCell Skill Eval -- Dry Run\n")
        for name, case in EVAL_CASES.items():
            print(f"  {name}: {case['description']}")
            print(f"    User: {case['user_message'][:80]}...")
            print(f"    Checks: {', '.join(case['required_sections'])}")
            print()
        return

    # Check API key
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("Error: ANTHROPIC_API_KEY environment variable not set")
        sys.exit(1)

    client = anthropic.Anthropic(api_key=api_key)

    # Filter skills if specified
    cases = EVAL_CASES
    if args.skill:
        if args.skill not in cases:
            print(f"Error: Unknown skill '{args.skill}'. Available: {', '.join(cases.keys())}")
            sys.exit(1)
        cases = {args.skill: cases[args.skill]}

    # Run evals
    results = {}
    for name, case in cases.items():
        passed = run_eval(name, case, client, model=args.model)
        results[name] = passed

    # Summary
    total = len(results)
    passed = sum(1 for v in results.values() if v)
    failed = total - passed

    print(f"\n{'='*60}")
    print(f"RESULTS: {passed}/{total} passed, {failed} failed")
    print(f"{'='*60}")

    for name, result in results.items():
        status = "PASS" if result else "FAIL"
        print(f"  {status} -- {name}")

    sys.exit(0 if failed == 0 else 1)

if __name__ == "__main__":
    main()
