---
description: Validate a skill/command against design principles. Run after creating or significantly modifying skills.
---

# /skill-audit

Audit a skill/command file against timecell project design principles.

**Goal:** Ensure skill quality and consistency — prevent common failure modes.

---

## Usage

```
/skill-audit [skill-name]
```

**Examples:**
- `/skill-audit vibe`
- `/skill-audit plan`
- `/skill-audit session-close-quick`

**When to run:**
- After creating a new skill
- After significantly modifying a skill (adding/removing steps, changing paths)
- When a skill fails unexpectedly
- Quarterly spot-checks

---

## Instructions

### 0. Load Skill File

1. Parse skill name from argument
2. Try to find file at:
   - `/Users/goenkas/Projects/timecell/.claude/commands/{skill-name}.md`
   - `/Users/goenkas/Projects/timecell/.claude/commands/{skill-name}/{skill-name}.md` (for skills with sub-commands)
3. If not found, ask user for correct path
4. Read the skill file into memory

---

### 1. Run Audit Checks

Apply all checks below. Mark each as:
- Pass
- Issue found (describe)
- N/A (not applicable to this skill type)

---

## Audit Checklist

### Check 0: Path Validity

**What to check:** Do all file paths referenced in the skill actually exist?

**Scan for paths in the skill file:**
- Absolute paths (`/Users/goenkas/Projects/timecell/...`)
- Package paths (`packages/engine/...`, etc.)
- Script references (especially `query_ai.py`)

**For each path found:**
```bash
ls [path] 2>/dev/null && echo "EXISTS" || echo "MISSING"
```

**Pass if:** All referenced absolute paths exist, or are paths that will be created by the skill itself (e.g., output files).

**Fail if:** Referenced paths don't exist and aren't expected to be created by the skill.

**Common issues to check:**
- `query_ai.py` at `/Users/goenkas/Obsidian/SandeepPKM/Claude/scripts/query_ai.py`
- Task context directory at `/Users/goenkas/Projects/timecell/.claude/task-context/`
- NOW.md at `/Users/goenkas/Projects/timecell/NOW.md`
- MEMORY.md directory at `/Users/goenkas/.claude/projects/-Users-goenkas-Projects-timecell/memory/`

---

### Check 1: No Vault References

**What to check:** Does the skill contain stale PKM/Obsidian vault references?

**Scan for these patterns:**
- `SandeepPKM/Claude/Commands/` (except in script paths)
- `Claude/memory/` or `Claude/scripts/`
- `Journal/` references (unqualified)
- `Processing-Log.md`
- `pkm_tasks.py`, `pkm_utils.py`, `pkm_dispatch.py`
- `draft/review/` (unqualified, without full timecell path)
- `Personal Context.md`
- Obsidian wikilinks `[[...]]`
- Frontmatter with Obsidian-specific fields (`tags: []`, `aliases:` beyond what's functional)

**Pass if:** No vault-specific references found, or references are intentional (e.g., `query_ai.py` lives in the PKM vault and is intentionally referenced by absolute path).

**Fail if:** Vault references found that should have been adapted to timecell paths.

---

### Check 2: Package Registry Accuracy (vibe.md only)

**What to check:** Does the vibe skill's package registry match actual packages?

**Skip if:** Skill is not `vibe.md`.

**Check each package entry:**
```bash
ls /Users/goenkas/Projects/timecell/packages/engine/ 2>/dev/null
ls /Users/goenkas/Projects/timecell/packages/api/ 2>/dev/null
ls /Users/goenkas/Projects/timecell/packages/web/ 2>/dev/null
ls /Users/goenkas/Projects/timecell/packages/cli/ 2>/dev/null
```

**Pass if:** All registered packages exist.

**Fail if:** Registry lists packages that don't exist, or missing packages that do exist.

---

### Check 3: Script Path for query_ai.py (second-opinion.md only)

**What to check:** Is the query_ai.py path correct and the file accessible?

**Skip if:** Skill doesn't use query_ai.py.

```bash
ls /Users/goenkas/Obsidian/SandeepPKM/Claude/scripts/query_ai.py 2>/dev/null && echo "EXISTS" || echo "MISSING"
```

**Pass if:** Script exists at the referenced path.

**Fail if:** Script not found. Action: Ask user where query_ai.py lives and update the path.

---

### Check 4: Blind Spots

**What to check:** What would break if skill was followed literally?

**Pass if:**
- Error handling section covers common failures
- Edge cases are documented (missing files, missing directories)
- Destructive actions have confirmation steps

**Fail if:**
- No error handling
- Paths assumed to exist without creation steps
- Missing edge case handling for common failures

---

### Check 5: Output Files Have Creation Steps

**What to check:** For any output file or directory the skill writes to, does it include a creation step?

**Scan for write operations:**
- `Write` tool usage
- `open(..., 'w')` patterns
- Files that may not exist yet (NOW.md, MEMORY.md, task context files)

**Pass if:**
- Skill includes `mkdir -p` or "create if doesn't exist" handling
- OR output paths are guaranteed to exist (e.g., files in the repo that are always present)

**Fail if:**
- Skill writes to a file/directory that may not exist, with no creation step

---

### Check 6: Integration Points

**What to check:** Are integration points documented?

**Pass if:**
- "Triggered by" section exists
- "Related files" section exists (with absolute paths)

**Fail if:**
- No integration documentation
- Relative paths used instead of absolute paths in integration docs

---

### Check 7: No Overlaps

**What to check:** Does the skill overlap with other skills?

**Check for "Relationship to Other Skills" section.**

**Also scan other skill files:**
```bash
ls /Users/goenkas/Projects/timecell/.claude/commands/
```

**Pass if:**
- Relationship section exists AND clearly differentiates
- OR no similar skills exist

**Fail if:**
- No relationship section AND similar skills exist

---

### Check 8: Known Failure Modes

**What to check:** Does the skill document past failures or anticipated failure modes?

**Pass if:**
- "Known Failure Modes" section exists (even if it only has "None yet")

**Fail if:**
- No failure modes section

---

### Check 9: Success Criteria

**What to check:** Does the skill define measurable success criteria?

**Pass if:**
- "Success Criteria" section exists with 2+ criteria
- At least one criterion is quality-focused (not just "ran without errors")

**Fail if:**
- No Success Criteria section
- Only execution-focused criteria

---

### Check 10: File Size

**What to check:** Is the file size reasonable?

**Count lines:**
```bash
wc -l /Users/goenkas/Projects/timecell/.claude/commands/{skill-name}.md
```

**Pass if:**
- Under 500 lines
- OR over 500 lines with documented rationale (e.g., second-opinion.md has full prompt templates inline)

**Fail if:**
- Over 500 lines with no rationale for the size

---

## Output Format

```markdown
**Skill Audit: /[skill-name]**

**Summary:**
Passed: X/10 checks
Issues: Y (list)

**Results:**
| # | Check | Status | Notes |
|---|-------|--------|-------|
| 0 | Path Validity | Pass/Issue/N/A | [details] |
| 1 | No Vault References | Pass/Issue/N/A | [details] |
| 2 | Package Registry | Pass/Issue/N/A | [details] |
| 3 | Script Path | Pass/Issue/N/A | [details] |
| 4 | Blind Spots | Pass/Issue/N/A | [details] |
| 5 | Output File Creation | Pass/Issue/N/A | [details] |
| 6 | Integration Points | Pass/Issue/N/A | [details] |
| 7 | No Overlaps | Pass/Issue/N/A | [details] |
| 8 | Known Failure Modes | Pass/Issue/N/A | [details] |
| 9 | Success Criteria | Pass/Issue/N/A | [details] |
| 10 | File Size | Pass/Issue/N/A | [details] |

**Issues to fix:**
1. [Issue description] → [Suggested fix]
2. ...

**Recommended actions:**
- [ ] [Action 1]
- [ ] [Action 2]
```

---

## After Audit

### If Issues Found:

1. **Post audit results** (use Output Format above)
2. **Fix issues immediately** in the skill file — do not ask for permission for straightforward path/reference fixes
3. **Re-run audit** to verify fixes
4. Note fixes in the skill file's Known Failure Modes section if relevant

### If All Checks Pass:

Report that the skill passed all checks. No additional logging required for timecell (unlike PKM, we don't maintain a Skill-Audit-Log.md).

---

## Error Handling

**If skill file not found:**
- List all files in `/Users/goenkas/Projects/timecell/.claude/commands/`
- Ask user to specify correct path

**If skill is a sub-command:**
- Audit as part of parent skill context
- Some checks may be N/A (delegated to parent)

---

## Integration Points

**Triggered by:**
- Manual: `/skill-audit [skill-name]`
- After porting or creating a new skill

**Related:**
- All files in `/Users/goenkas/Projects/timecell/.claude/commands/`

---

## Relationship to Other Skills

This is a utility skill for maintaining the other skills. It doesn't overlap with any timecell project skills — it audits the skill infrastructure itself.

---

## Success Criteria

1. **All applicable checks executed** (not skipped without justification)
2. **Issues identified have clear fixes** (actionable, not just "problem exists")
3. **Path issues fixed immediately** (most common issue for ported skills)
4. **Skill quality improved** (measurable: fewer stale paths and references after audit)

---

## Known Failure Modes

| Failure | Prevention |
|---------|------------|
| False positive on PKM path references | Check 1 explicitly exempts query_ai.py path (intentional absolute reference) |
| Skill is a future state (paths don't exist yet) | Check 0 notes "paths created by the skill" as exempted |
| Over-strict on sub-commands | Mark inherited checks as N/A |

---

*Ported from SandeepPKM skill-audit.md: 2026-02-27. Heavily adapted: replaced PKM-specific checks (Processing-Log, Skill-Cadence, Journal, pkm_utils, context hierarchy layers, Obsidian frontmatter) with timecell-specific checks (path validity, vault reference detection, package registry, query_ai.py script path). Reduced from 16 checks to 10 checks focused on timecell porting issues. Removed Skill-Audit-Log.md logging (not needed for small skill set). Core audit methodology unchanged.*
