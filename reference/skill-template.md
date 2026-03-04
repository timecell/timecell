# Skill Template

Use this template to create custom skills in skills/custom/.

## Structure

```markdown
# /skill-name — Short Description

## When This Runs
[When should this skill be invoked? Cadence or trigger]

## Persona
[How should the CIO behave during this skill? Tone, depth, focus]

## Prerequisites
[What must be true before this skill runs?]

## Flow
[Numbered steps the CIO follows]

### Step 1: [Name]
[What to do, what to read, what to compute]

### Step 2: [Name]
[Continue...]

## Output Format
[What the user sees — template or guidelines]

## Save
[What gets persisted — session-log.md, decisions.md, profile.md updates]
```

## Guidelines
- Skills should do ONE thing well
- Always save session context at the end
- Use engine-bridge.py for any numerical computation
- Reference primitives by file path (metrics/, guardrails/, etc.)
- Respect communication_density from profile.md
- Log decisions to memory/decisions.md
