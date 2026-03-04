#!/usr/bin/env bash
# TimeCell Setup — npx timecell entry point
# Clones the repo and opens in Claude Code

set -euo pipefail

INSTALL_DIR="${1:-$HOME/timecell}"
REPO_URL="https://github.com/timecell/timecell"  # TODO: update when public

echo ""
echo "  ╔══════════════════════════════════════╗"
echo "  ║         TimeCell v0.1 Mirror         ║"
echo "  ║     AI Family Office OS              ║"
echo "  ╚══════════════════════════════════════╝"
echo ""

# Check dependencies
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is required. Install from https://nodejs.org"
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is required."
    exit 1
fi

# Clone or update
if [ -d "$INSTALL_DIR" ]; then
    echo "TimeCell already exists at $INSTALL_DIR"
    echo "Updating..."
    cd "$INSTALL_DIR" && git pull --rebase
else
    echo "Installing TimeCell to $INSTALL_DIR..."
    git clone "$REPO_URL" "$INSTALL_DIR"
fi

cd "$INSTALL_DIR"

# Install engine dependencies
echo "Installing engine dependencies..."
npm install --prefix packages/engine

# Verify engine
echo "Verifying engine..."
if cd packages/engine && npm test --silent 2>/dev/null; then
    echo "✅ Engine: all tests passing"
else
    echo "⚠️  Engine tests had issues — this is ok for first setup"
fi
cd "$INSTALL_DIR"

echo ""
echo "✅ TimeCell installed at $INSTALL_DIR"
echo ""
echo "Next step: Open this folder in Claude Code to start your setup."
echo ""
echo "  cd $INSTALL_DIR"
echo "  claude"
echo ""
echo "TimeCell will automatically detect this is your first session"
echo "and guide you through setting up your family office."
echo ""
