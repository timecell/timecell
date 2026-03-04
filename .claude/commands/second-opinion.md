# /second-opinion — Multi-AI Consultation

**Get perspectives from OpenAI, Gemini, and DeepSeek on decisions, analysis, or creative work.**

---

## Purpose

Query OpenAI, Gemini, and DeepSeek via direct API for independent perspectives, then synthesize all views into a recommendation. Useful when:
1. Making architecture decisions with significant consequences
2. Validating technical analysis or reasoning
3. Getting diverse options for design problems
4. Checking for blindspots in your thinking

**Why this matters:** Multiple AI perspectives are better than one. Different training creates different blindspots and strengths. Claude + OpenAI + Gemini + DeepSeek provides four distinct viewpoints.

---

## Usage

```
/second-opinion [question or context]
/second-opinion --raw [question]         # Skip context passing
/second-opinion --openai-only [question] # Only query OpenAI
/second-opinion --gemini-only [question] # Only query Gemini
/second-opinion --deepseek-only [question]  # Only query DeepSeek
/second-opinion --deep [question]        # Iterative multi-round dialogue
/second-opinion --verify [question]      # Fact-check key claims via Perplexity
/second-opinion --light [question]       # Force single-round
/second-opinion --challenge [question]   # Steelman the opposite of your leaning
/second-opinion --save [question]        # Save output to /Users/goenkas/Projects/timecell/notes/
/second-opinion --include [path] [question]  # Include specific file in context
```

**Examples:**
- `/second-opinion Should we use Turso or SQLite for the API persistence layer?`
- `/second-opinion Review this crash-survival score algorithm for edge cases`
- `/second-opinion --raw What's the best TypeScript monorepo tooling in 2026?`
- `/second-opinion --deep Should we build the portfolio input as a form or as a CLI import?`
- `/second-opinion --verify Is Fastify actually faster than Express for this workload?`
- `/second-opinion --challenge I'm thinking of moving all state management to the engine package`
- `/second-opinion --include "/Users/goenkas/Projects/timecell/packages/engine/src/index.ts" Is this API surface clean?`

**Auto-flag detection:** Flags activate automatically based on query content. Use `--light` to override auto-deep, `--raw` to suppress all auto-detection.

---

## Context Loading

**Auto-detected and passed to external AIs** for relevant advice.

### What Gets Shared

| Context | When | Source |
|---------|------|--------|
| **Project context** | Always (unless --raw) | `CLAUDE.md` or `README.md` from timecell root — extract max 30 lines (project purpose, architecture, key decisions) |
| **Package context** | If detected from question | Up to 2 package files, max 50 lines each (package purpose + current state) |

**Strict extraction rules:**
- **Project context (30 lines max):** Project purpose, architecture overview, key design decisions. Skip detailed implementation, line counts, boilerplate.
- **Package context (50 lines each max):** Package purpose and public API. Skip internal implementation details.

### Domain Detection Keywords

| Keywords | Package Context |
|----------|-----------------|
| engine, calculation, score, IRR, algorithm | `packages/engine/src/index.ts` + README |
| api, endpoint, route, fastify, server | `packages/api/README.md` |
| web, UI, component, react, tailwind, vite | `packages/web/README.md` |
| cli, command, terminal | `packages/cli/README.md` |

### Skip Context

Add `--raw` or say "no context" to skip context passing:
```
/second-opinion --raw What's the best TypeScript pattern for this?
```

### Explicit Context Inclusion (--include)

**When to use:** When you want to share a specific file (e.g., a module's source, a design doc).

**Processing logic:**
1. Read the specified file
2. If file >200 lines: Extract key sections (exports, interfaces, main functions) — aim for ~50-100 lines
3. If file ≤200 lines: Include full content
4. Add to context block as "ADDITIONAL CONTEXT" section

---

## Instructions

### 1. Parse Query

Extract the question/context from user input.

**Model selection:** Always use the best models.
- OpenAI: `gpt-5.2` (current flagship) — via `query_ai.py --provider openai`
- Gemini: `gemini-2.5-pro` (stable flagship) — via `query_ai.py --provider gemini`
- DeepSeek: `deepseek-reasoner` (R1/V3.2, strong at math/logic) — via `query_ai.py --provider deepseek`

**How to query:** Write the full prompt to a temp file, then run:
```bash
python3 /Users/goenkas/Obsidian/SandeepPKM/Claude/scripts/query_ai.py --provider [provider] --model [model] --prompt-file /tmp/so_[provider].txt
```
Run all 3 providers in parallel (3 Bash calls in one message). After all queries complete, clean up: `rm -f /tmp/so_*.txt`

**Flag compatibility:** `--challenge` and `--deep` are mutually exclusive. If both specified, use `--challenge` only. Show: `Note: --challenge is single-round only. Ignoring --deep.`

### 1.1. Auto-Flag Detection

**Skip if:** User included `--raw` in query.

Analyze the query and auto-activate flags the user didn't explicitly set.

**Detection rules:**

| Auto-Flag | Signal |
|-----------|--------|
| `--deep` | Architecture decision + "should I", "whether to", "decide", "choose between", cross-package design question |
| `--verify` | Benchmarks, "is X faster than Y", "does X support", technical claims with numbers, version-specific features |

**Override hierarchy:**
1. `--raw` → suppresses ALL auto-detection and context loading
2. `--light` → suppresses auto-deep (forces single round)
3. Explicit flags → always respected
4. Auto-detected flags → lowest priority, additive only

### 1.2. Cost Confirmation (when auto-deep triggers)

**Skip if:** All active flags were explicit OR only --verify was auto-detected.

**When auto-deep triggers**, show a one-line confirmation before making API calls:

```
Auto-detected: --deep (architecture decision). Est. cost ~$5.50. Proceed? [y / --light for ~$1.85]
```

Wait for user confirmation. If user says `--light` or `n`, downgrade accordingly.

### 1.5. Load Context (unless --raw)

**Skip if:** User included `--raw` or "no context" in query.

**Otherwise:**

1. **Extract project context** from `CLAUDE.md` or `README.md` at `/Users/goenkas/Projects/timecell/`:
   - Project purpose (what timecell does)
   - Architecture overview (monorepo, packages, stack)
   - Key design decisions made so far
   - **Hard cap: 30 lines total.**

2. **Detect packages** from query keywords (see Domain Detection table above)

3. **Load package context** (max 2 packages) from `packages/{name}/`
   - Extract package purpose + public API surface
   - **Hard cap: 50 lines per package.**

4. **Prepare context block** for external AI prompts

### 2. Form Claude's View First

Before querying external AIs, form your own perspective:
- State your analysis
- Identify key considerations
- Note confidence level (high/medium/low)
- Flag any uncertainties

**Why first:** Prevents anchoring on external responses.

### 3. Query External AIs (Parallel)

Query all three AIs in parallel (all tool calls in a single message).

**CRITICAL: Model-specific prompt framing.** Each AI gets a different analytical lens:

#### 3a. OpenAI (GPT-5.2) — Decision & Probability Lens

Write prompt to `/tmp/so_openai.txt`, then run `python3 /Users/goenkas/Obsidian/SandeepPKM/Claude/scripts/query_ai.py --provider openai --model gpt-5.2 --prompt-file /tmp/so_openai.txt`:

**Prompt template (with context):**
```
I'd like your independent analysis on a technical question from a developer. Here's project context:

---
PROJECT CONTEXT:
[Project context — max 30 lines]

RELEVANT PACKAGE CONTEXT:
[Package context if detected — max 50 lines per package]

ADDITIONAL CONTEXT (if --include used):
[Contents of included file — summarized if >200 lines]
---

Their question/situation:
[user's query]

YOUR ANALYTICAL FOCUS: Decision structure and expected value.
Please provide:
1. Frame this as a decision tree — what are the branches, trade-offs, and payoffs?
2. What is the expected value of each option? Where is the asymmetry?
3. What would change your recommendation? (Key variables and their thresholds)
4. Your confidence level (high/medium/low) and what would raise/lower it
```

**Model:** Always `gpt-5.2` (fallback: `o3`)

#### 3b. Gemini — Information Gap Lens

Write prompt to `/tmp/so_gemini.txt`, then run `python3 /Users/goenkas/Obsidian/SandeepPKM/Claude/scripts/query_ai.py --provider gemini --model gemini-2.5-pro --prompt-file /tmp/so_gemini.txt`:

**Prompt template (with context):**
```
[Same context block as OpenAI above]

Their question/situation:
[user's query]

YOUR ANALYTICAL FOCUS: Missing information and external factors.
Please provide:
1. What information is this developer likely NOT considering? What context, docs, or research would change the answer?
2. What external factors (ecosystem trends, future deprecations, community direction) could affect this?
3. What's the strongest counterargument to their likely default choice?
4. Your confidence level (high/medium/low) and what would raise/lower it
```

**Model:** Always `gemini-2.5-pro`

#### 3c. DeepSeek — Logic & Assumptions Lens

Write prompt to `/tmp/so_deepseek.txt`, then run `python3 /Users/goenkas/Obsidian/SandeepPKM/Claude/scripts/query_ai.py --provider deepseek --model deepseek-reasoner --prompt-file /tmp/so_deepseek.txt`:

**Prompt template (with context):**
```
[Same context block as OpenAI above]

Their question/situation:
[user's query]

YOUR ANALYTICAL FOCUS: Logical structure and hidden assumptions.
Please provide:
1. Is the framing of this question correct, or is there a better way to think about it?
2. What assumptions are being made implicitly? Which ones are fragile?
3. If the reasoning is sound, where could the execution fail?
4. Your confidence level (high/medium/low) and what would raise/lower it
```

**Model:** Always `deepseek-reasoner`

#### 3d. Challenge Mode (--challenge only)

**When --challenge is active**, first extract the user's likely position from their question. Then replace the model-specific focus with a challenge prompt for ALL AIs:

```
[Same context block]

Their question/situation:
[user's query]

THE PERSON'S LEANING: [extracted position — be specific]
Your job is to make the STRONGEST POSSIBLE CASE AGAINST this position.
Do NOT provide a balanced analysis. Be a rigorous devil's advocate.

Please provide:
1. The strongest 3-5 arguments against their likely position
2. What they're probably underweighting or ignoring
3. Under what specific conditions would their position be clearly wrong?
4. Historical analogues or common patterns where this type of decision led to poor outcomes
5. Your confidence in the counter-case (high/medium/low)
```

**Parallel execution:** Query OpenAI, Gemini, and DeepSeek in parallel.

### 4. Present Comparison

```markdown
## Second Opinion: [Brief Topic]

*Context shared: Project (30 lines) + [Package].md (~X lines)*
*Models: OpenAI gpt-5.2 + Gemini gemini-2.5-pro + DeepSeek deepseek-reasoner*
*Flags: [list active flags with source — e.g., "--deep (auto: architecture decision)" or "--deep (explicit)"]*

### Claude's View
[Your analysis - 2-4 sentences]
**Confidence:** [High/Medium/Low]

### OpenAI's View (Decision & Probability)
[Their analysis - 2-4 sentences]
**Confidence:** [Their stated confidence]

### Gemini's View (Information Gaps)
[Their analysis - 2-4 sentences]
**Confidence:** [Their stated confidence]

### DeepSeek's View (Logic & Assumptions)
[Their analysis - 2-4 sentences]
**Confidence:** [Their stated confidence]

### Agreement & Divergence
**All agree on:** [Common ground]
**Key differences:** [Where perspectives diverge, what each uniquely surfaced]

### Synthesis
[Unified recommendation considering all views]

### Recommendation
[Clear action item or decision]
```

**If --challenge mode:** Replace section headers with "OpenAI's Counter-Case", etc. Replace "Agreement & Divergence" with "Strongest Counter-Arguments" and "Weakest Counter-Arguments".

**If --raw mode:** Show `*Context: None (raw mode)*` instead.

**If any AI unavailable:** Omit that section and note which AIs responded.

**If only one AI requested (--openai-only, --gemini-only, or --deepseek-only):** Show only Claude + that AI.

### 4.5. Fact Check via Perplexity (--verify only)

**Skip if:** `--verify` flag is NOT active.

1. **Extract 3-5 key factual claims** from the AI responses (prioritize: benchmarks, library capabilities, version support, ecosystem facts)

2. **Query Perplexity** — write to `/tmp/so_perplexity.txt`, then run:
   ```bash
   python3 /Users/goenkas/Obsidian/SandeepPKM/Claude/scripts/query_ai.py --provider perplexity --model sonar-reasoning-pro --prompt-file /tmp/so_perplexity.txt
   ```
   Prompt: "Please verify the following technical claims with current sources. For each claim, state whether it is Supported, Outdated, Incorrect, or Unverifiable, and cite your sources.\n\n1. [claim 1]\n2. [claim 2]..."

3. **Present verification results:**

```markdown
### Fact Check (Perplexity)
*Verified [N] key claims from AI responses*

| Claim | Status | Source |
|-------|--------|--------|
| "[claim text]" | Supported | [source] |
| "[claim text]" | Outdated | [what changed] |
```

**If Perplexity unavailable:**
```
Perplexity fact-check skipped (unavailable). Claims not independently verified.
```

### 4.7. Save Output (--save only)

**Skip if:** `--save` flag is NOT active.

**When --save is active:**

1. Write the full output to:
   ```
   /Users/goenkas/Projects/timecell/notes/second-opinion-YYYY-MM-DD-[brief-topic-slug].md
   ```
   (Create `notes/` directory if it doesn't exist.)

2. Add a simple header:
   ```markdown
   # Second Opinion: [topic]
   Date: YYYY-MM-DD
   Flags: [list]
   Models: [list]
   ---
   [full output]
   ```

3. Confirm save location to user:
   ```
   Saved to: /Users/goenkas/Projects/timecell/notes/second-opinion-2026-02-27-fastify-vs-express.md
   ```

---

## Iterative Mode (--deep)

**When to use:** High-stakes architecture decisions, significant AI disagreement, stress-testing a conclusion.

### Round Structure

| Round | What Happens | Purpose |
|-------|--------------|---------|
| **1** | Independent views (standard behavior) | Unbiased initial perspectives |
| **2** | Each AI responds to disagreements only | Challenge assumptions, preserve dissent |
| **3** | Final synthesis given the exchange | Converge on recommendation |

**Hard cap:** 3 rounds.

### Round 2 Prompt Template

After Round 1, each AI sees only the views that **disagree** with its position:

```
In Round 1, you analyzed this question and concluded: [summary of this AI's Round 1 position]

Here are the perspectives that DISAGREE with your position:
---
[Only include views from AIs that reached different conclusions]
---

Given these counterarguments:
1. Which of their points do you find compelling? Have any changed your view?
2. Where do you still disagree, and why?
3. What's the strongest version of your original position given these challenges?
4. Has your confidence level changed?
```

### Early Termination

After Round 2, check for convergence. If all AIs agree on core recommendation:
```
AIs converging after Round 2. Synthesizing now.
```

### Iterative Output Format

```markdown
## Second Opinion (Deep): [Brief Topic]

*Mode: Iterative (--deep) | Rounds: [X]*
*Context shared: Project (30 lines) + [Package]*

### Round 1: Independent Views

**Claude:** [view]
**OpenAI (Decision):** [view]
**Gemini (Gaps):** [view]
**DeepSeek (Logic):** [view]

### Round 2: Challenges

**OpenAI responds to [AI name]:** [response]
**Gemini responds to [AI name]:** [response]
**DeepSeek responds to [AI name]:** [response]

### Round 3: Final Positions

**Claude:** [refined view]
**OpenAI:** [refined view]
**Gemini:** [refined view]
**DeepSeek:** [refined view]

### Convergence Analysis

**Started with:** [initial disagreement summary]
**Ended with:** [final state — consensus/persistent disagreement]
**Key shifts:** [what changed through dialogue]
**Unresolved:** [topics where AIs persistently disagree — signals genuine uncertainty]

Anchoring Note: Persistent disagreement after 3 rounds often signals genuine uncertainty — treat it as informative, not as failure.

### Synthesis & Recommendation

[Final recommendation considering full dialogue]
```

---

## Error Handling

**Retry protocol:**

| AI | Primary Model | Fallback Model |
|----|--------------|----------------|
| OpenAI | `gpt-5.2` | `o3` |
| Gemini | `gemini-2.5-pro` | `gemini-2.5-flash` |
| DeepSeek | `deepseek-reasoner` | `deepseek-chat` |
| Perplexity | `sonar-reasoning-pro` | `sonar-pro` |

All use `python3 /Users/goenkas/Obsidian/SandeepPKM/Claude/scripts/query_ai.py --provider [provider] --model [fallback-model] --prompt-file /tmp/so_[provider].txt`

**Steps on failure:**
1. **First failure:** Flag immediately, retry with SAME model
2. **Second failure:** Retry with FALLBACK model
3. **Third failure:** Ask user before proceeding without this AI:
   ```
   [AI name] failed 3 times (primary: [error], fallback: [error]).
   Continue without [AI name]? [y/n]
   ```

**If all external AIs unavailable:**
```
External AIs not responding. Options:
1. Proceed with Claude-only analysis
2. Try again in a few minutes
3. Skip second opinion for now
```

---

## Cost Awareness

| Mode | Rounds | Est. Cost |
|------|--------|-----------|
| Standard (default) | 1 | ~$1.85 |
| Standard + `--verify` | 1 + verify | ~$2.05 |
| `--challenge` | 1 | ~$1.85 |
| `--deep` | 3 | ~$5.50 |
| `--deep --verify` | 3 + verify | ~$5.70 |

**Auto-detection note:** Architecture decision questions auto-activate `--deep` (~$5.50). Cost confirmation prompt appears before API calls. Use `--light` to force single-round (~$1.85).

---

## Model Maintenance

**Current models (as of 2026-02-27):**
- OpenAI: `gpt-5.2`. Fallback: `o3`.
- Gemini: `gemini-2.5-pro`. Fallback: `gemini-2.5-flash`.
- DeepSeek: `deepseek-reasoner`. Fallback: `deepseek-chat`.
- Perplexity: `sonar-reasoning-pro`. Fallback: `sonar-pro`.

**Script:** All providers use `/Users/goenkas/Obsidian/SandeepPKM/Claude/scripts/query_ai.py` (direct API calls via urllib). No MCP servers needed. API keys are stored in the script.

**To update:** Edit model names in sections 1, 3a, 3b, and 3c of this file + Error Handling fallback table + Cost Awareness section.

---

## Integration Points

**Triggered by:**
- `/second-opinion [query]` command
- User asking "get another AI's perspective" or "what does OpenAI think"

**Dependencies:**
- `/Users/goenkas/Obsidian/SandeepPKM/Claude/scripts/query_ai.py` — Python script for API calls
- Python 3 with `urllib` (stdlib, no pip installs needed)

---

## Relationship to Other Skills

**This is a standalone utility.** No overlap with other timecell skills.

| This Skill | `/plan` | Difference |
|------------|---------|------------|
| `/second-opinion` | `/plan` | Plan iterates internally; second-opinion queries external AIs for outside perspective |

---

## Success Criteria

1. **Context extracted within strict limits** (30 lines project, 50 lines/package) — External AIs get focused, relevant info
2. **Claude's view formed BEFORE querying externals** (prevents anchoring)
3. **Model-specific prompts used** — Each AI applies its designated analytical lens
4. **Agreement & divergence explicitly identified**
5. **Clear synthesis and recommendation** (actionable)
6. **Graceful degradation with retries** — Retry with fallback before asking user

---

## Known Failure Modes

| Issue | Resolution |
|-------|------------|
| All AIs give same answer | Note strong consensus, still valuable confirmation |
| Models disagree fundamentally | Present all views, mark as "Unresolved", let user decide |
| Query too broad | Ask user to narrow scope |
| MCP/script timeout | Retry protocol: same model → fallback → ask user |
| Auto-deep false positive | Cost confirmation step catches it; user can downgrade to --light |
| Temp files left with context | `rm -f /tmp/so_*.txt` runs after queries complete |

---

*Ported from SandeepPKM second-opinion.md: 2026-02-27. Key changes: removed personal PKM context (Personal Context.md, Investment.md, etc.) and replaced with timecell project/package context; removed FO mode (--fo flag); changed save path from draft/review/ to /Users/goenkas/Projects/timecell/notes/; removed Obsidian frontmatter from save output; changed script path reference to absolute path at /Users/goenkas/Obsidian/SandeepPKM/Claude/scripts/query_ai.py. Core multi-AI workflow, model selection, --deep/--challenge/--verify flags, and retry protocol unchanged.*
