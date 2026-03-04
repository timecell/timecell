#!/usr/bin/env python3
"""
TimeCell E2E Onboarding Test — Simulates a full /setup conversation.

Runs a multi-turn conversation via the Anthropic API simulating a new user
going through the complete onboarding flow. Validates each step produces
expected outputs.

Usage:
    python3 scripts/test-onboarding.py              # Full test
    python3 scripts/test-onboarding.py --dry-run     # Show conversation plan
    python3 scripts/test-onboarding.py --verbose     # Show full responses

Requires: ANTHROPIC_API_KEY environment variable
"""

import anthropic
import json
import sys
import os
import argparse
import re

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)

def read_file(path):
    full_path = os.path.join(PROJECT_ROOT, path)
    with open(full_path, 'r') as f:
        return f.read()

def build_system_prompt():
    claude_md = read_file("CLAUDE.md")
    profile = read_file("memory/profile.md")
    setup_skill = read_file("skills/core/setup.md")
    beliefs = read_file("packs/bitcoin-fo/beliefs.md")
    return f"""{claude_md}

---
Current contents of memory/profile.md:
{profile}

---
Skill definition (skills/core/setup.md):
{setup_skill}

---
Active pack beliefs (packs/bitcoin-fo/beliefs.md):
{beliefs}

---
IMPORTANT: You are being tested. Respond as the CIO would in a real onboarding session.
Do NOT mention that this is a test or simulation. Act naturally.
When you would normally write files (entity files, profile updates), describe exactly what you would write,
including the file path and content, using markdown code blocks.
"""

# Simulated user persona: a mid-career Bitcoin investor
CONVERSATION_TURNS = [
    {
        "step": "1. Initial greeting (auto-detect empty profile)",
        "user": "Hello",
        "checks": {
            "required": ["welcome", "setup", "office"],
            "forbidden": ["how can I help"],
            "description": "Should auto-detect empty profile and start /setup"
        }
    },
    {
        "step": "2. Identity & life context",
        "user": "I'm Alex Chen, 42, living in Austin, Texas. Software engineer turned investor. Married, two kids (8 and 12). Monthly income from consulting: about $25K. Monthly expenses around $15K.",
        "checks": {
            "required": ["alex", "goal"],  # Should acknowledge name and ask about goals
            "forbidden": [],
            "description": "Should capture identity and ask about goals"
        }
    },
    {
        "step": "3. Goals",
        "user": "Three main goals: 1) Financial independence by 50 — want to stop consulting. 2) Buy a house in Austin, budget $800K-1M, within 2 years. 3) College fund for both kids — about $200K each over 10 years.",
        "checks": {
            "required": ["portfolio", "own", "asset"],  # Should move to portfolio
            "forbidden": [],
            "description": "Should capture goals and move to portfolio structure"
        }
    },
    {
        "step": "4. Portfolio structure",
        "user": "Here's what I have: 15 BTC in a Coldcard hardware wallet (self-custody). 3 BTC on Coinbase for trading. $200K in a Fidelity brokerage (index funds). $80K in savings accounts. $50K in a Roth IRA. Total roughly $1.7M at current BTC prices around $90K.",
        "checks": {
            "required": ["entity", "coldcard", "coinbase", "fidelity"],  # Should create entities
            "forbidden": [],
            "description": "Should identify entities and create entity files"
        }
    },
    {
        "step": "5. Burn & runway",
        "user": "Monthly expenses are about $15K. The $80K in savings is my liquid reserve. I also get $25K/month from consulting so I'm net positive right now.",
        "checks": {
            "required": ["runway", "month"],  # Should calculate runway
            "forbidden": [],
            "description": "Should calculate runway and show result"
        }
    },
    {
        "step": "6. Pack beliefs confirmation",
        "user": "I agree with most of the bitcoin-fo beliefs. No leverage — absolutely. Self-custody — yes, that's why most is on the Coldcard. But I'm not as extreme on concentration — I think 60-70% BTC is my comfort zone, not 80%+.",
        "checks": {
            "required": ["concentration", "override", "guardrail"],  # Should note the override
            "forbidden": [],
            "description": "Should capture disagreement as user override"
        }
    },
    {
        "step": "7. Bucket allocation",
        "user": "The default buckets look good. Safety Floor should be my savings ($80K) plus maybe some consulting income buffer. Core Conviction is the BTC. Growth Engine is the Fidelity account. I don't have moonshots or hard assets yet. Lifestyle Fund — that's where the house downpayment goes.",
        "checks": {
            "required": ["bucket", "safety", "conviction"],
            "forbidden": [],
            "description": "Should map holdings to buckets"
        }
    },
    {
        "step": "8. Risk conversation",
        "user": "If BTC dropped 60% tomorrow? Honestly, I'd be stressed but I wouldn't sell. I rode through 2022. What keeps me up at night is more about losing my consulting income — if that dried up AND BTC crashed, that would be tough. I've never panic-sold but I did almost take a BTC-backed loan once and I'm glad I didn't.",
        "checks": {
            "required": ["risk", "conviction"],
            "forbidden": ["conservative", "aggressive"],  # Should NOT use labels
            "description": "Should capture revealed preferences without labeling"
        }
    },
    {
        "step": "9. Guardrail calibration",
        "user": "Min runway of 6 months feels right — I have income so I don't need 12. Max single custodian at 30% is fine. For BTC concentration, let's set the upper comfort at 70% instead of 80%. Estate stuff — I have a will but no POA or digital asset plan yet.",
        "checks": {
            "required": ["guardrail", "runway", "6", "70"],
            "forbidden": [],
            "description": "Should calibrate guardrails with user values"
        }
    },
    {
        "step": "10. CIO preferences + completion",
        "user": "I like concise communication — just the numbers and what to do. And be direct with me, don't sugarcoat. What's my status?",
        "checks": {
            "required": ["concise", "direct", "/start", "complete"],  # Should show completion + next steps
            "forbidden": [],
            "description": "Should set preferences, run coverage check, show next steps"
        }
    },
]

def run_conversation(client, model="claude-sonnet-4-20250514", verbose=False):
    """Run the full onboarding conversation and check each turn."""
    system = build_system_prompt()
    messages = []
    results = []

    print(f"\n{'='*70}")
    print(f"  TimeCell E2E Onboarding Test")
    print(f"  Persona: Alex Chen, 42, Austin TX, 18 BTC, $1.7M total")
    print(f"  Model: {model}")
    print(f"{'='*70}\n")

    for i, turn in enumerate(CONVERSATION_TURNS):
        step = turn["step"]
        user_msg = turn["user"]
        checks = turn["checks"]

        print(f"Step {step}")
        print(f"  User: {user_msg[:80]}{'...' if len(user_msg) > 80 else ''}")

        # Add user message
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

            # Run checks
            step_passed = True
            for keyword in checks["required"]:
                found = keyword.lower() in assistant_msg.lower()
                if not found:
                    print(f"  ❌ Missing required: '{keyword}'")
                    step_passed = False

            for keyword in checks.get("forbidden", []):
                found = keyword.lower() in assistant_msg.lower()
                if found:
                    print(f"  ❌ Found forbidden: '{keyword}'")
                    step_passed = False

            status = "✅ PASS" if step_passed else "❌ FAIL"
            print(f"  {status} — {checks['description']}")

            if verbose:
                print(f"\n  Response ({len(assistant_msg)} chars):")
                # Show first 500 chars indented
                for line in assistant_msg[:500].split('\n'):
                    print(f"    {line}")
                if len(assistant_msg) > 500:
                    print(f"    ... ({len(assistant_msg) - 500} more chars)")
                print()

            results.append({"step": step, "passed": step_passed})

        except Exception as e:
            print(f"  ❌ API Error: {e}")
            results.append({"step": step, "passed": False})
            # Add a placeholder assistant message to continue
            messages.append({"role": "assistant", "content": f"[Error: {e}]"})

        print()

    # Final summary
    total = len(results)
    passed = sum(1 for r in results if r["passed"])
    failed = total - passed

    print(f"{'='*70}")
    print(f"  RESULTS: {passed}/{total} steps passed, {failed} failed")
    print(f"{'='*70}")

    for r in results:
        status = "✅" if r["passed"] else "❌"
        print(f"  {status} {r['step']}")

    # Check final response for completeness indicators
    if messages:
        final = messages[-1]["content"] if messages[-1]["role"] == "assistant" else ""
        completeness_checks = {
            "mentions /start": "/start" in final,
            "mentions /weekly": "/weekly" in final.lower() or "weekly" in final.lower(),
            "shows coverage summary": any(word in final.lower() for word in ["guardrail", "runway", "status", "coverage"]),
        }

        print(f"\n  Final response completeness:")
        for check, passed in completeness_checks.items():
            status = "✅" if passed else "⚠️"
            print(f"    {status} {check}")

    return failed == 0

def main():
    parser = argparse.ArgumentParser(description="TimeCell E2E Onboarding Test")
    parser.add_argument("--dry-run", action="store_true", help="Show conversation plan without API calls")
    parser.add_argument("--verbose", action="store_true", help="Show full API responses")
    parser.add_argument("--model", default="claude-sonnet-4-20250514", help="Model to use")
    args = parser.parse_args()

    if args.dry_run:
        print("TimeCell E2E Onboarding — Conversation Plan\n")
        for turn in CONVERSATION_TURNS:
            print(f"  {turn['step']}")
            print(f"    User: {turn['user'][:100]}...")
            print(f"    Checks: {', '.join(turn['checks']['required'])}")
            if turn['checks'].get('forbidden'):
                print(f"    Forbidden: {', '.join(turn['checks']['forbidden'])}")
            print()
        return

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("Error: ANTHROPIC_API_KEY environment variable not set")
        sys.exit(1)

    client = anthropic.Anthropic(api_key=api_key)
    success = run_conversation(client, model=args.model, verbose=args.verbose)
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
