#!/usr/bin/env python3
"""
Engine Bridge — Calls TimeCell engine functions from Python/CLI.

Usage:
    python3 scripts/engine-bridge.py <function> '<json_args>'

Examples:
    python3 scripts/engine-bridge.py calculateRunwayMonths '{"availableLiquidity": 1200000, "monthlyBurn": 100000}'
    python3 scripts/engine-bridge.py calculateTemperature '{"mvrv": 2.5, "rhodl": 50000}'
    python3 scripts/engine-bridge.py calculateCrashSurvival '{"totalValueUsd": 5000000, "btcPercentage": 70, "monthlyBurnUsd": 15000, "liquidReserveUsd": 500000, "btcPriceUsd": 100000}'
"""

import json
import subprocess
import sys
import os

# Map function names to their module paths and call signatures
FUNCTION_MAP = {
    "calculateRunwayMonths": {
        "import": "calculateRunwayMonths",
        "args": "availableLiquidity,monthlyBurn"
    },
    "calculateCrashSurvival": {
        "import": "calculateCrashSurvival",
        "args": "portfolio,hedgePositions"
    },
    "ruinTest": {
        "import": "ruinTest",
        "args": "portfolio"
    },
    "calculateTemperature": {
        "import": "calculateTemperature",
        "args": "mvrv,rhodl"
    },
    "calculatePositionSizing": {
        "import": "calculatePositionSizing",
        "args": "input"
    },
    "generateActionPlan": {
        "import": "generateActionPlan",
        "args": "input"
    },
    "calculateSleepTest": {
        "import": "calculateSleepTest",
        "args": "input"
    },
    "calculateCapacityGate": {
        "import": "calculateCapacityGate",
        "args": "input"
    },
    "calculateAllocationDrift": {
        "import": "calculateAllocationDrift",
        "args": "input"
    },
    "calculateSellingRules": {
        "import": "calculateSellingRules",
        "args": "input"
    },
    "calculateDownsideInsurance": {
        "import": "calculateDownsideInsurance",
        "args": "input"
    },
    "calculateDCA": {
        "import": "calculateDCA",
        "args": "input"
    },
    "calculateTemperatureAdjustedDCA": {
        "import": "calculateTemperatureAdjustedDCA",
        "args": "temperature,baseAmount"
    },
    "calculateCustodyRisk": {
        "import": "calculateCustodyRisk",
        "args": "input"
    },
    "simulateAllHistoricalCrashes": {
        "import": "simulateAllHistoricalCrashes",
        "args": "portfolio"
    },
}


def build_js_code(func_name: str, args_json: str) -> str:
    """Build the Node.js code to execute the engine function."""
    func_info = FUNCTION_MAP[func_name]
    import_name = func_info["import"]
    arg_names = func_info["args"].split(",")

    # Parse the input JSON
    parsed_args = json.loads(args_json)

    # Build the argument list for the function call
    if len(arg_names) == 1 and arg_names[0] in ("portfolio", "input"):
        # Single object argument — pass the whole JSON
        call_args = json.dumps(parsed_args)
    else:
        # Multiple named arguments — extract from the JSON
        call_parts = []
        for name in arg_names:
            val = parsed_args.get(name.strip())
            call_parts.append(json.dumps(val))
        call_args = ", ".join(call_parts)

    js_code = f"""
import {{ {import_name} }} from './packages/engine/dist/index.js';
try {{
    const result = {import_name}({call_args});
    console.log(JSON.stringify(result, null, 2));
}} catch (e) {{
    console.error(JSON.stringify({{ error: e.message }}));
    process.exit(1);
}}
"""
    return js_code


def main():
    if len(sys.argv) < 3:
        print("Usage: python3 scripts/engine-bridge.py <function> '<json_args>'")
        print(f"Available functions: {', '.join(sorted(FUNCTION_MAP.keys()))}")
        sys.exit(1)

    func_name = sys.argv[1]
    args_json = sys.argv[2]

    if func_name not in FUNCTION_MAP:
        print(f"Error: Unknown function '{func_name}'")
        print(f"Available: {', '.join(sorted(FUNCTION_MAP.keys()))}")
        sys.exit(1)

    # Validate JSON
    try:
        json.loads(args_json)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON arguments: {e}")
        sys.exit(1)

    js_code = build_js_code(func_name, args_json)

    # Get the project root (where this script lives in scripts/)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)

    # Execute via Node.js with --input-type=module for ESM support
    try:
        result = subprocess.run(
            ["node", "--input-type=module", "-e", js_code],
            capture_output=True,
            text=True,
            cwd=project_root,
            timeout=30
        )

        if result.returncode != 0:
            error_msg = result.stderr.strip() or "Unknown error"
            print(json.dumps({"error": error_msg}))
            sys.exit(1)

        # Output the result
        print(result.stdout.strip())

    except subprocess.TimeoutExpired:
        print(json.dumps({"error": "Engine function timed out (30s)"}))
        sys.exit(1)
    except FileNotFoundError:
        print(json.dumps({"error": "Node.js not found. Install Node.js to use engine functions."}))
        sys.exit(1)


if __name__ == "__main__":
    main()
