#!/usr/bin/env bash
# Pre-compaction hook — saves session state before context is truncated.
# Called by Claude Code before compaction.
#
# What it does:
# 1. Reads a JSON payload from stdin (Claude Code passes conversation summary)
# 2. Appends a compaction marker to memory/session-log.md
# 3. The CLAUDE.md instructions tell Claude to save pending items to NOW.md
#    BEFORE compaction happens — this hook is a safety net.

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SESSION_LOG="$PROJECT_ROOT/memory/session-log.md"
NOW_FILE="$PROJECT_ROOT/NOW.md"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M')

# Append compaction marker to session log
echo "" >> "$SESSION_LOG"
echo "---" >> "$SESSION_LOG"
echo "## Compaction at $TIMESTAMP" >> "$SESSION_LOG"
echo "Context was compacted. Items before this point may be summarized." >> "$SESSION_LOG"

echo "Pre-compaction hook: marked session-log.md at $TIMESTAMP"
