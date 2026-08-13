# pm4ai — Managed Repo Guide

## Contents

- [Getting Started](#getting-started)
- [Agent execution](#agent-execution)
- [Bun](#bun)
- [Code Quality](#code-quality)
- [Git](#git)
- [Lintmax](#lintmax)
- [Minimal DOM](#minimal-dom)
- [React & Next.js](#react-next-js)
- [Security](#security)
- [shadcn](#shadcn)
- [tsdown](#tsdown)
- [TypeScript](#typescript)

---

## Getting Started

pm4ai manages every repo with lintmax in deps — syncs configs, generates `CLAUDE.md`, enforces conventions, runs maintenance.

### MUST

- Read root `README.md` first WHEN it exists. Why: project-specific entry.
- Determine role via `gh auth status`: owner (`1qh`) may edit pm4ai rules/checks directly; never hand-edit a synced managed file. Why: synced files are regenerated on the next fix.
- Extend an extendable managed file (currently `.github/workflows/ci.yml`) by appending project steps AFTER the canonical block, leaving the canonical prefix byte-identical. Why: `fix`/`status` preserve it via the starts-with check (`isExtended`), so project CI coexists with the synced baseline.
- Keep project-specific docs — decisions, gotchas, plans — in the project’s doc repo (the `X-doc` sibling), never in code-repo companion files. Why: the code repo carries only code and machine-readable config; docs have one home in the doc repo.
- Capture a gotcha into its topic-owner doc in the project doc repo the moment it surfaces, committed with the work that taught it. Why: an uncaptured surprise re-costs the same hour; one home per fact, never duplicated.
- Owner adds a universal rule → `.mdx` in pm4ai `apps/docs/content/rules/` with `infer` frontmatter; a new check → `packages/pm4ai/src/{audit,checks}.ts`. Why: rules generate CLAUDE.md, checks run in status.
- Note any cross-project discovery for pm4ai. Why: a lesson hit on many projects becomes a universal rule/check.
- Act only on a current check: proceed on `check: passed` (current); wait on `check: running...` (don’t edit); fix violations on `check: failed`; re-run + wait when stale (passed before N commits); run `bunx pm4ai@latest fix` first on `check: never run`. Why: stale/absent checks aren’t evidence.

### NEVER

- Never edit a synced managed file directly — `CLAUDE.md`, `clean.sh`, `up.sh`, `bunfig.toml`, `.gitignore`, `readonly/ui/`. Cost: next `pm4ai fix` overwrites it.
- Never alter the canonical prefix of an extendable file (`.github/workflows/ci.yml`) or interleave custom steps inside it. Cost: breaks the starts-with check, so `fix` overwrites the whole file and drops your steps.

### Key repos

- **pm4ai** — manager; rules `apps/docs/content/rules/*.mdx`, checks `packages/pm4ai/src/`.
- **lintmax** — max-strict lint/format orchestrator; every project depends on it.
- **cnsync** — canonical `readonly/ui` (shadcn + ai-elements).

### Commands

- `bunx pm4ai@latest status` — check current project (`--all` for every project).
- `bunx pm4ai@latest fix` — sync + maintain, requires clean git (`--all` for every project).
- `curl https://pm4ai.vercel.app/llms-full.txt` — full docs.

---

## Agent execution

Execution discipline for an agent working this codebase. Engineering posture lives in `philosophy`; this is how to run a turn.

### MUST

##### Autonomy and decisions

- Continue to the next task while autonomous-feasible work remains; identify it and start. Why: idle and handoff are the costliest parts of the loop.
- Lock the full surfaced scope into the project doc repo the moment it rounds out and ship every item in one pass; the locked set is the immovable target. Why: a “this round / next round” split is where items go to die.
- Parallelize independent work against any known wait (build, codegen, install, network) — the parent grinds another file while a subagent runs. Why: idle wait is the costliest non-stop state in the loop.
- Self-decide reversible, config-only, or rule-settled choices; surface only a genuine fork as one question + options (each with pros/cons) + recommendation + reasoning. Why: most “decisions” are already settled by the rules, and a stacked or unreasoned MCQ drops answer quality.
- Exhaust code, docs, git history, and memory before asking; ask only what cannot be discovered. Why: the discovery cost is already paid.

##### Action and verification

- Run the action yourself; never ask the user to run a command the agent can run. Why: handing work upward breaks the loop.
- State an expected outcome and deadline before any observable action (build, navigate, poll); flag stuck the moment it deviates. Why: no criterion means silent stuck loops.
- Scan vendor issue trackers and changelogs before declaring a third-party blocker. Why: the training cutoff lags the ecosystem by months.
- Commit the moment a bug is found and again when fixed during any verification loop. Why: a per-bug trail maps failure to fix.

##### Concurrency and dispatch

- Foreground any command under ~2 min; background only with concurrent work in flight, never background-then-poll. Why: background-then-poll is an idle pattern.
- Dispatch concurrent subagents sliced by file/dir/rule boundary, packed in one message; restrict edit-only subagents to read/edit/write/grep/glob; verify build-green on the shared branch first; audit their self-reports before any destructive cleanup. Why: throughput without thrash, and agents misreport.
- Parent-author the shared types/signatures before dispatching an edit wave; subagents edit call sites against the stable signature. Why: divergent parallel authoring causes stuck-thrash.
- Use a write-capable subagent type (`general-purpose` or a custom edit agent) for any wave that produces edits; never `Explore` (read-only by construction). Why: read-only agents return plans, zero edits — the whole wave is wasted.
- Run dependent subagent waves sequentially after the sibling lands; never brief a subagent to wait on a notification. Why: the subagent runtime has no wait-for-event — it terminates without work.

##### Output and destructive-op safety

- Keep command output terse — a single `ok` or silence on success, full detail only on failure. Why: every line spends the context budget.
- Wrap streaming-CLI chatter (`bun install`, `docker`, `gh`, `wrangler`, `convex deploy`) with redirection — `… >/dev/null 2>&1 && echo ok || cat err`. Why: progress text burns the context budget.
- Hold at most one long-running background slot; reap it after consuming its output. Why: the runtime leaves stale “(running)” slots that mislead.
- Check image dimensions before Read on `.png`/`.jpg`/`.heic`/`.webp`; downscale via `sips -Z 2000 "$f" --out /tmp/$(basename "$f")` when over 2000px. Why: a many-image request over 2000px locks the whole session until `/compact`.
- Confirm the exact target with the user before any destructive or irreversible action — delete, overwrite, `git push --force`, `reset --hard`, `git clean`, `DROP`, `TRUNCATE`, prune, or mass mutation; name precisely what will be affected and wait for an explicit go. Why: irreversible loss has no undo, so the autonomy default never extends to it.
- Scope a delete/cleanup task to the precise paths named and confirmed first; remove only the named child, never a parent directory that also holds unrelated data. Why: deleting a folder to clear its contents takes every sibling inside it, unrecoverably.

### NEVER

- Never stop at a status summary while autonomous-feasible work remains, or close with “want me to / should I / which one / ready?” (confirming a destructive or irreversible action is the sole exception). Cost: a wasted turn seeking permission instead of progress.
- Never enumerate remaining items and ask which to do. Cost: the cue is to do all of them.
- Never treat effort, size, or “diminishing returns” as a stop reason. Cost: real work dressed up as a judgment call.
- Never propose dropping scope to simplify — deleting an enum case/type/prop, removing a UI affordance, replacing a control with a label, collapsing screens, or hiding behind a flag. Cost: ONLY MORE, NEVER LESS — a surface shipped narrower than approved makes the absence the new baseline; fix the cause, never amputate the feature.
- Never ask for a fact the agent could discover after one consent, or guess one not in source. Cost: re-explaining paid-for evidence, or shipping code on an unverified value.
- Never invent a file path, export name, config key, version pin, or API signature, or pattern-match against what similar projects “usually” do — read to confirm first, quote verbatim or do not cite. Cost: a fabricated identifier or assumed convention ships as a real bug.
- Never idle through a wait — background-then-poll, heartbeat, or “a subagent will handle it”. Cost: an idle agent is the most expensive state in the loop.
- Never delegate diagnostics (“paste the log”, “tell me what you see”). Cost: inverts loop ownership, slows everything.
- Never orchestrate other AI providers in the dev loop (GPT/Gemini juries, cross-provider supervisors). Cost: Claude-Code subagents are the parallelism primitive; multi-provider adds coordination cost without gain.
- Never `rm` or overwrite a parent directory to remove something within it — target the specific child. Cost: sibling data is destroyed with it (e.g. session transcripts beside a `memory/` folder).
- Never read “be autonomous, never ask” as permission for a destructive or irreversible step. Cost: autonomy covers reversible work only; irreversible loss needs explicit consent.

### Fleet inventory

- Reconcile `pm4ai list` against the filesystem before treating it as the fleet: it returns the projects it manages, which is NOT every repo in the workspace — it omits pm4ai itself, cnsync, and lintmax-go. Why: a repo no sync reaches keeps whatever it had forever and is invisible to anyone trusting the list — lintmax-go silently held two pre-fix CI scripts every managed sibling had fixed, because nothing enumerates it. `status --all` reports drift across the projects it knows, never the fleet’s membership; a tool-listed set trusted as complete is the same broken probe as a memory-listed one.

### Valid stops — only these

- The user says stop or pivots.
- A hard external blocker — a credential or decision the agent cannot obtain.
- All work done, verified, and green.

### Pairs with

- `philosophy` (engineering posture); `testing` (cheapest harness; verify by running).

---

## Bun

Bun is the only runtime + package manager.

### MUST

- Use only `bun`. Why: one toolchain, no manager drift.
- `bun fix` passes before done. Why: lint/format gate.
- Update deps via `bun clean && bun i`. Why: refreshes `"latest"` cleanly.
- All deps `"latest"`; WHEN a pin is unavoidable, pin major only (`"eslint": "9"`). Why: no legacy lock-in.
- Every direct dep shows an upstream release within ~6 months; replace an abandoned or archived dep, never keep it. Why: stale-but-stable rots — force the migration early.
- A newly required CLI or dep lands in `package.json` (or the documented setup script) the same turn it is first used. Why: never re-litigate the install next session.
- `import { X } from 'bun'` (`$`, `file`, `write`, `Glob`, `spawn`, …) in bun-runtime apps (CLI, standalone server). Why: explicit + tree-shakeable; `Bun` is a registered biome global so either form lints clean.
- Use the `Bun` global (`Bun.S3Client`, `Bun.s3`, …) in Next/Turbopack apps AND in a published library that keeps `bun` external (`deps: { neverBundle: ['bun'] }`) because a Next consumer bundles it. Why: `import { X } from 'bun'` is unresolvable in `next build`’s Node page-data-collection workers, and a library’s named import propagates that break into every Next consumer; the global needs no module resolution, so it survives the build and resolves under the bun runtime. The bun-globals check exempts a project that declares `next` OR keeps `bun` external.
- Run `bun i` immediately after renaming a workspace `name:`. Why: dependents resolve old name via stale `node_modules/<scope>/` symlink.
- Read an opaque eslint `ResolveMessage {}` as a stale workspace symlink → reinstall first. Why: it masks every other violation; not a lint-internals bug.
- Scripts silent on success, verbose on failure. Why: agent context budget.

### NEVER

- Never use yarn / npm / npx / pnpm. Cost: toolchain drift.
- Never run `bun update`. Cost: rewrites `"latest"` to resolved versions.
- Never commit `bun.lock` (keep in `.gitignore`). Cost: lockfile drift across machines.
- Never run `git clean`. Cost: deletes `.env` + uncommitted files — use explicit `rm -rf`.

### Scripts

- `sh clean.sh` — nuke artifacts (node_modules, lockfile, caches, dist, .next).
- `sh up.sh` — clean + install + fix + check (universal maintenance cycle).

---

## Code Quality

Code quality bans, single-source-of-truth, canonical-state, bounded waits, codegen integrity.

### MUST

##### SSOT and reuse

- One definition per piece of data — shared constant defined once, imported everywhere; extract any value appearing in 2+ files. Why: drift surface.
- Check existing utilities/components FIRST before writing inline logic. Why: avoid duplication.
- Land any reusable script/helper/harness/probe as a tracked file (`scripts/*.ts`, a test, a `package.json` script), never throwaway `/tmp` scratch. Why: a `/tmp` probe is re-discovered next session; in-repo evidence re-runs.
- Extract a shared util/component/factory on its second use, never a speculative first. Why: a one-call abstraction guesses the wrong shape and rots as unmaintained surface.

##### Correctness and change management

- Fix every known bug the moment it surfaces — lint, type error, audit, review, or your own reading — regardless of severity, blast radius, or whether it fires on current data. Why: a latent bug is one input from a live one; the discovery cost is already paid, so the same pass that found it fixes it.
- Name things for what they ARE, not their lineage. Why: code reads as the single intended design, authored fully-formed.
- When reworking, rename in place + delete the old, zero transitional duplicate. Why: result reads as if always so.
- One declarative present-tense schema definition. Why: a numbered migration chain (`001_*`) encodes history in the repo.
- Land a breaking change expand-contract — add the new shape, dual-write/backfill, drop the old in a later release; applies to DB schema, wire format, Convex tables, exported types, and public API signatures. Why: no destructive change ships in the same release as the code still depending on the old shape.

##### Timeouts, types, and fail-fast

- `AbortSignal.timeout(ms)` (or SDK timeout) on every `await` on network/IPC/subprocess. Why: bare `await` on external state can hang silently.
- Bounded polling — compute a deadline once, exit with a specific stderr reason on timeout (`"api healthz timeout 60s"`). Why: `while(!ready){}` hangs with no clue.
- Change source + regenerate for any codegen output; regenerate-and-diff gate fails on staleness. Why: committed output must equal a fresh regen; don’t trust the pre-commit hook alone.
- Land the lint/check policing a class of artifact before the first artifact of that class lands. Why: phase ordering — the gate exists when the artifacts arrive, not after they drift.
- Carry the declared type across every boundary (persistence, wire, service, codegen, runtime); ratchet toward precise types, never widen a typed surface back. Why: type erasure is the slowest class of bug.
- Fail fast on any missing required input — throw, return non-zero, or refuse to construct. Why: a substituted default turns missing config into a wrong-value bug.
- Inline styles only for truly dynamic values. Why: colors/static props belong in classes.

### NEVER

- Never write comments (lint-ignore directives are the only allowed comment). Cost: lintmax strips them.
- Never use `!` non-null assertion, `any`, `as any`, `@ts-ignore`, `@ts-expect-error`, `@ts-nocheck`. Cost: type holes — see lintmax never-ignore.
- Never erase types at a boundary — `any`/`string` for JSON/array/blob, `Map<string, unknown>` for a structured payload, a closed set as `string`/`number` instead of a union, a bare id string where a typed `Id<X>`/branded id exists, an unchecked cast where the compiler warned. Cost: slowest class of bug to debug.
- Never duplicate types. Cost: drift; single source of truth.
- Never disable lint rules globally/per-directory. Cost: hides real bugs — fix the code.
- Never ignore written source from linters — only auto-generated (`_generated/`, `generated/`, `module_bindings/`, `readonly/ui/`). Cost: source escapes the gate.
- Never reduce lintmax strictness. Cost: removing a rule needs false-positive evidence, adding needs none — WHEN upstream drops a rule, find a replacement.
- Never skip, defer, or “note” a known bug via severity/occurrence framing — “latent”, “won’t fire on current data”, “low-severity”, “backstopped elsewhere”, “the source already guards it”, “fix when that path ships”, “improvement not a bug”. Cost: the severity twin of effort-framing — the exact loophole that lets a found bug rot into an incident; severity sets ordering within the pass, never whether it is fixed. The only non-fix is an unobtainable credential, a shared-blast-radius irreversible op, or a fix that would corrupt correct data — and each still fixes the code path and files a tracked task, never a silent “noted”.
- Never touch `readonly/ui/` manually. Cost: overwritten by cnsync sync.
- Never copy a shared-package primitive (cnsync `readonly/ui`, a lintmax or published-package export) into a consumer repo — import it. Cost: copies drift from the substrate and skip its upstream fixes.
- Never hand-edit codegen output (`_generated/`, `.source/`, `*.generated.ts`, typed-query records). Cost: lost on next regen.
- Never use lineage in names (`legacy`, `old`, `deprecated`, `v2`, `-new`, `-rewrite`) or history narrative in comments/commits/logs/docs ("previously", “we switched”, “used to”, “instead of X”, “no longer”, “as of [date]”, defining a thing by what it is NOT). Cost: filler the agent re-reads forever; a `Why:` may give a timeless reason, never a past-incident story.

### Pitfall

- Adding a wrapper div → check parent `gap-*`/`space-*` first.
- Copy-pasting from another file → extract to a shared utility/component.
- Call internal functions by typed reference (e.g. Convex `internal.x.y`), never a dotted-string `Record<string, unknown>` lookup. Dynamic-path traversal forces `no-unsafe-*` suppressions.

---

## Git

Git commit + push conventions.

### MUST

- Commit frequently; push logical groups. Why: small auditable units, easy revert.
- Commit subject `type: description` — `fix|feat|docs|chore|refactor|test`. Why: conventional-commit parse.
- Land on `main` directly or via a short-lived feature branch + PR. Why: trunk-based, single `main`.

### NEVER

- Never mention AI / Claude / coauthor / “generated with” in commits. Cost: AI attribution unwanted in history.
- Never maintain long-lived `develop` / `release-*` / `feature/*` branch hierarchies. Cost: divergent long branches rot and conflict against trunk.

---

## Lintmax

lintmax = biome + oxlint + eslint + prettier + sort-package-json in one command; we own it.

Every lintmax version runs configless by default. `lintmax` (TypeScript) is the sole exception — its max-strict default is dense enough that a project needs `lintmax.config.ts` to opt a rule out, so it supports one; every other version (`lintmax-go`, `lintmax-rs`, …) stays config-free. A project config opts a rule out only with documented false-positive evidence, never to dodge a fix.

### MUST

- Run only `bun run fix` for code maintenance. Why: it fixes then verifies internally (all 5 linters twice); a clean run prints `ok` on a single line + exit 0 — `ok` IS the success signal, not silence.
- Read failure output directly: grouped file→linter→rule, and each rule line is `L<line>,<line>,… rule/name`. Why: the numbers are SOURCE LINE LOCATIONS — the `L` prefix says so — and a rule’s finding COUNT is how many locations it lists, never the numbers themselves; `L89 useTopLevelRegex` is ONE finding at line 89, not 89 findings, so never read a leading number as a count.
- Make ALL edits first, then run `fix` foreground to completion. Why: editing during a backgrounded `fix` races it — the formatter writes its pre-edit buffer back and silently reverts your change.
- WHEN a `fix` is running, wait until `pgrep -f 'lintmax|bun.*fix'` is clear before editing. Why: same revert race.
- Commit a checkpoint before any multi-file mutator (`fix` after stripping directives, audit/codemod, sed-all/rename-all). Why: `fix` mixes autofixes with your edits; `git reset --hard` then restores in one command.
- Batch many edits, run `fix` once at the end. Why: `fix` is slow per run.
- File code-lint gaps upstream against lintmax. Why: it is the only lint tool — domain-specific hand-rolled `tools/*.ts` checks (banned vocab, spec-vs-code diff) are fine; code-lint is not.

### NEVER

- Never run `bun run check` / `lintmax check` for maintenance — `check` is CI-only; `fix` is the agent-side maintenance command. Cost: redundant after `fix`, wastes 2+ min re-running 5 linters.
- Never use `| tail` / `| head` on any lintmax command. Cost: empty output IS success; failure output is already agent-formatted — truncation hides violations.
- Never run `lintmax check --human` to “see violations”. Cost: run `bun run fix` and read its failure output.
- Never add a second code-lint tool — extra eslint plugins, stylelint, knip, depcheck, dependency-cruiser, size-limit. Cost: fragments lintmax’s curated surface, drifts.
- Never use the `void` operator. Cost: `fix` auto-deletes it (`no-void`) — `void promise()` → bare expr → `noUnusedExpressions`; `() => { void mutate() }` → `() => { undefined }`, dropping the call.

### void replacements

- Unused promise: `promise.catch(() => {})` or `try { await ... } catch {}`.
- Async in a `() => void` slot (`onClick`): `() => { mutate().catch(console.error) }`, or widen the prop type to `() => void | Promise<void>`.
- Async inside a `useEffect` body (slot type can’t be widened): wrap in an IIFE `;(async () => { ... })()` or `.catch(noop)`.
- Unused var: rename `_x` or remove it.

### Ignore syntax

| Linter | File-level                                      | Per-line                                    |
| ------ | ----------------------------------------------- | ------------------------------------------- |
| oxlint | `/* oxlint-disable rule */`                     | `// oxlint-disable-next-line rule`          |
| eslint | `/* eslint-disable rule */`                     | `// eslint-disable-next-line rule`          |
| biome  | `/** biome-ignore-all lint/cat/rule: reason */` | `/** biome-ignore lint/cat/rule: reason */` |

### Ignore strategy

- Fix every legit, fixable finding by fixing the code, never the rule; ignore is last resort. Why: a found-and-fixable finding disabled is the severity/effort loophole that lets a real defect rot — the rule stays, the code changes. The only legitimate disable is a documented false-positive-rate, logged as an exception.
- File-level disable WHEN a file has many unavoidable same-rule violations (sequential DB mutations, standard React patterns, external images); per-line for an isolated one. Why: scale-appropriate.
- File-level directive at absolute file top, above imports/code (incl `'use client'`/`'use node'`); per-line on the line ABOVE the code. Why: per-line inline trips `no-inline-comments`.
- WHEN 2+ linters flag one line, file-level for one + per-line for the other. Why: stacking multiple per-line above one line is banned.
- One top `eslint-disable` per file, multiple rules comma-joined; keep one canonical block, remove duplicates. Why: dedupe.
- WHEN a file-level `biome-ignore-all` exists, drop the redundant per-line `biome-ignore` for that same rule. Why: file-level already covers every line.
- NEVER 5+ per-line ignores for one rule. Cost: use file-level instead.
- Don’t hand-remove dead directives or add one “just in case”. Why: `fix` auto-removes UNUSED file-level `oxlint-disable` / `biome-ignore-all` (both `/**` and `//` forms) by strip-relint-in-place; if a rule doesn’t fire, `fix` drops it and `check` fails on it.

### Cross-linter

- Same rule in 2 linters (biome `noAwaitInLoops` + oxlint `no-await-in-loop`) = double enforcement, not conflict — never disable one. Why: both must pass.
- Suppress a shared eslint/oxlint rule on eslint’s side. Why: oxlint auto-picks up eslint rules and is faster.
- oxlint `eslint/sort-keys` is disabled in lintmax. Why: conflicts with perfectionist (ASCII vs natural sort).

### Never-ignore rules

`lintmax check` FAILS on these suppressions, used or unused — no suppress-for-now path reaches CI. Fix the code:

- `@typescript-eslint/no-unsafe-*` (assignment, call, member-access, return, argument) — use proper types.
- `@typescript-eslint/no-explicit-any` — define the actual type.
- `@ts-ignore` / `@ts-expect-error` / `@ts-nocheck` — fix the type error.
- `@typescript-eslint/no-non-null-assertion` — handle the null case.

Fixes, not suppressions:

- Test-file exception: `@ts-expect-error` + `no-explicit-any` allowed in test files only (asserting a wrong type is rejected); the rest forbidden everywhere.
- Untyped third-party dep (types resolve to `any`: broken `exports.types`, unresolved `typeof import(...)`): cast through a typed facade at one boundary — `const get = rawGet as <T>(k: string) => Promise<T | undefined>`, or `const x: unknown = await loader.init(); return x as MonacoApi` with a minimal interface. Never `as any`.
- Non-null (`x[i]!`): null-check (`const v = x[i]; if (v) ...`) or `const`-tuple (`[...] as const`) so fixed indices type as defined.
- `no-unsafe-*` on a visible-shape stub: `(() => undefined) as never` (bottom type, no visible ops); `((..._: unknown[]) => ({})) as never` still trips. Tighten with `never` / branded / generic.

### Safe-to-ignore

- **oxlint:** `promise/prefer-await-to-then` (Promise.race, ky chaining).
- **eslint:** `no-await-in-loop`, `max-statements`, `max-depth`, `complexity` (sequential ops) · `no-unnecessary-condition` (narrowing) · `promise-function-async` (thenable returns) · `max-params` · `@next/next/no-img-element` (external images) · `react-hooks/refs`.
- **biome:** `style/noProcessEnv` (env files) · `performance/noAwaitInLoops` (sequential ops) · `nursery/noForIn` · `performance/noImgElement` · `suspicious/noExplicitAny` (generic boundaries).

### Playbook maintenance

- Merge each new lesson into the most relevant existing section immediately; correct rules in place, remove superseded guidance. Why: single source of truth, no append-only “recent lessons” buckets.

### Gotchas

- A rule oxlint REPORTS may not exist in oxlint’s own config namespace, because oxlint auto-adopts eslint plugin rules that `--print-config` never lists — naming such a rule in `oxlintrc.json` is a hard parse error (`Rule 'function-component-definition' not found in plugin 'react'`), and setting it `'off'` in the eslint config does not silence oxlint’s copy. The only suppression path is the CLI allow-list (`OXLINT_CLI_ALLOW`), which is exactly why that list mirrors rules eslint deliberately turns off. Grep the resolved `--print-config` output for the real id first: searching it for the reported `react/function-component-definition` and `node/no-top-level-await` returns `react/prefer-function-component` and `unicorn/prefer-top-level-await` — different rules entirely, so editing what looks like the match changes nothing.
- A green `fix` proves nothing about a tree whose `node_modules` predates the current oxlint release: `up.sh` deletes `bun.lock` and reinstalls, so CI resolves a newer oxlint whose newly-enabled rules fire on files nobody touched, while a warm local tree reads green. Reproduce CI’s own lane (`sh up.sh`, then `LINTMAX_NO_CACHE=1 bun run check`) before blaming a red on the latest commit — and never conclude a `fix`-versus-`check` divergence from two runs taken against different installs, which is the false trail this exact skew lays.
- A plugin’s own `all`/`recommended` config is NOT automatically max-strict, in two separate ways, and both read as adopted while enforcing less than they look. `recommended` is the author’s SUBSET — extending it alone leaves the rest of the plugin’s surface unenforced (sonarjs ships 279 rules; its recommended enables a fraction), so enable every rule the plugin ships and drop only the ones whose `meta.deprecated` is set, since an upstream major deletes those and eslint hard-errors on an unknown id. And an `all` config can still ship rules at WARN — regexp’s `flat/all` sets six that way, and a warn enforces nothing; the gate’s own `warnToError` covers consumer overrides, never a config reached through `extends`, so route the config’s rules through it explicitly. Prove both by asking eslint for the EFFECTIVE config of a real file and asserting zero rules resolved to warn.
- The gate turns a failed lookup into a benign value in more places than any one bug shows, and each one reads as a healthy answer: `catch { return null }` on a registry fetch made “unknown” indistinguishable from “fresh”; `catch { process.exitCode ??= 0 }` swallowed an error AND pinned success; a `.nothrow()` whose output is never checked rendered a whole linter as contributing nothing; a day-long cache returned `[]` so a stale dep found yesterday read as clean today. Grep the gate’s own source for `.nothrow()` with an unread `exitCode`, and for a `catch` returning `null`/`[]`/`{}`/`0` — a check that cannot say “I could not tell” is a check that always says yes. An unanswerable lookup raises; it never shares a value with a healthy one.
- Ask a tool for its rule set through a call you have PROVEN prints something, and assert the result is non-empty — a flag can die upstream while staying in `--help` and still exiting 0. `oxlint --rules` emits zero bytes on 1.74 (documented, exit 0, both streams empty) while `--print-config` returns the resolved JSON; parsing the dead flag’s table yielded an empty oxlint section, so `rules` reported 1012 rules (biome 525 + eslint 487) and hid oxlint’s 726 — understating the enforced surface by 42% while looking complete. oxlint severities are `deny`/`allow`, not `error`/`warn`, and its plugin prefixes use underscores (`jsx_a11y`, `react_perf`) — a check written for the eslint spelling silently finds nothing.
- Read the tracked-dep set from the manifest that declares it, never a hand-kept list: a list of eight watched 8 of 24 shipped linters, and all three stale deps sat outside it. Staleness is measured on the PUBLISH TIME of `dist-tags.latest`, which the abbreviated packument (`application/vnd.npm.install-v1+json`) does not carry — request the full document or every package resolves to “unknown”.
- A stale npm wrapper is not a dead tool, and “no alternative exists” is a claim to prove, not assume: `@taplo/cli` sat 896 days at 0.7.0 while taplo upstream shipped 0.10.0 and its author stepped back as maintainer — the wrapper was stale, the tool was not, and the replacement (`tombi`: formatter + linter + language server, weekly releases) was one search away. Swapping to a formatter-only tool would have traded the lint half away; check the capability set, not just the freshness.
- `@types/react-dom` at 247 days is a stable package, not an abandoned one — DefinitelyTyped publishes actively (`@types/react` ships within weeks) and `react-dom` bundles no types of its own, so this is the only source and the age just means its type surface has not moved. Exception with a revisit trigger: react-dom shipping bundled types, or a new publish.
- Pin `typescript` to `6.0.x` (never `latest`) in lintmax’s own repo and in every consuming project that runs type-aware linting. Why: `typescript-eslint` (peer `>=4.8.4 <6.1.0`), Next’s build-time `verifyTypeScriptSetup`, and `tsdown`’s dts generation all need the classic sync type-checker API, which the TS-7-native `typescript` package does not expose at its main entry (it ships a version stub there, the compiler API living under `typescript/unstable/*`); `6.0.x` sits inside typescript-eslint’s range and holds all 61 type-aware rules at full fidelity. The TS-7-native type-aware linter `oxlint-tsgolint` (oxlint `options.typeAware:true`) is alpha at 59/61 rules — missing `naming-convention` + `prefer-destructuring` — so it lowers strictness (monotonic-up violation); the deferral trigger to adopt it is 61/61 stable OR typescript-eslint native tsgo support at TS 7.1 (`typescript-eslint#10940`). A version-consistency checker (sherif) that rejects an intentional app-6 vs synced-lib-5 mismatch is scoped (`sherif -i typescript`), never fought.
- A range pin on a lintmax dependency is a silent staleness freeze the never-stale cadence does NOT catch — `latest` self-updates, a caret does not, and on a `0.x` package a caret locks the MINOR (`^0.139.0` froze oxc-parser while 0.140.0 shipped). Audit the gate’s OWN manifest for any non-`latest` spec; each one is either a documented exception with a revisit trigger or a bug. Real case: `eslint: ^9` is legitimate (eslint-plugin-react peers `^3||…||^9.7` with no eslint-10 support, while every other plugin already accepts `^10`) and needs the reason recorded; `@eslint-react/eslint-plugin: ^2` was NOT blocked (peer `eslint:*`) and sat three majors stale for nothing. A duplicate in the lock is not automatically a bug — `@eslint/js` resolves to both 10.x (lintmax’s own `latest`) and 9.x (eslint 9’s transitive), and their `configs.all` rule sets are identical, so pinning it would cost latest-only for zero gain.
- Adopting an eslint plugin across a major is a RULE-ID REMAP plus a CONFIG-UNION problem, never a version bump — and the rule COUNT is the only honest measure of whether strictness survived. eslint-react v5 flattened the namespace separator (`dom/no-render` → `dom-no-render`, `naming-convention/ref-name` → `naming-convention-ref-name`) and folded its relocated `react-jsx` rules back into the unified package, so every explicitly-set id must be remapped — eslint hard-errors on an unknown id in the CONFIG, which is the one mercy, but an inline `eslint-disable-next-line` naming a renamed-or-deleted rule fails SILENTLY: it suppresses nothing, the real rule fires on the line below, and a rule the major deleted leaves the directive as dead weight forever. Grep the consuming tree for every inline disable carrying the plugin’s prefix and retarget it in the same pass as the bump. Its `configs.all` is NOT a superset of `strict-type-checked` (each carries rules the other lacks), so extending one config silently drops the rest; compose the union. Before believing any rule is gone, check whether a plugin ALREADY loaded covers it: eslint-plugin-react’s `flat.all` (spread wholesale) already owns `jsx-boolean-value`, `jsx-fragments`, `jsx-pascal-case`, `jsx-no-undef`, `no-string-refs`, `no-children-prop` and `jsx-no-useless-fragment` at error, and react-hooks owns `void-use-memo`, while six more react-hooks rules (`memo-dependencies`, `memoized-effect-dependencies`, `exhaustive-effect-dependencies`, `no-deriving-state-in-effects`, `capitalized-calls`, `component-hook-factories`) ship but stay dormant until enabled — so upstream’s deletions cost nothing once each is rehomed. Diff rule ids only after normalizing the rename, or every rule reads as both lost and gained. A RULE COUNT IS NOT A STRICTNESS MEASURE — it counts names, and a name proves nothing on its own: a rule loaded with no configuration (`no-restricted-syntax` ships in `configs.all` carrying zero patterns) counts as active while enforcing nothing, and the count is blind to a severity downgrade. Verify BOTH: ask eslint for the EFFECTIVE config of a real file (`new ESLint({overrideConfig}).calculateConfigForFile(f)`) and assert no rule resolved to warn — a raw scan of the flat blocks reports the pre-`warnToError` severity and lies. Then, for every rule upstream deleted, exercise a planted violation: `no-restricted-syntax` with `JSXExpressionContainer CallExpression[callee.type=/^(Arrow)?FunctionExpression$/]` replaces a dropped IIFE-in-JSX rule only once a fixture proves it fires and a named-call fixture proves it does not.
- TWO PLUGINS CAN SHIP THE SAME RULE, so it fires under TWO ids and a disable naming one silences only that copy — `eslint-plugin-react-hooks` and `@eslint-react` both provide `refs`, `immutability`, `static-components`, `exhaustive-deps`, `set-state-in-effect`. This is why a line that already looks suppressed reports again after a bump: the file disabled `react-hooks/X` and the twin `@eslint-react/X` is untouched. Fixing the CODE kills both ids at once and is preferred; when a disable is genuinely earned, add only the id the gate actually reports — a directive for a rule that does not fire is an UNUSED-DIRECTIVE ERROR under max-strict, so a speculative twin turns the gate red. Never guess which id fires: run the gate and read it.
- The false positives cluster in EXTERNAL IMPERATIVE STORES, where mutation IS the library’s designed api and no pure alternative exists — a three.js object in a `useFrame` loop (reallocating uniforms per frame is the anti-pattern the renderer warns against), a `motion/react` MotionValue whose `set()` deliberately bypasses render, a canvas 2D context, a portal host node, a test spy whose captured-local mutation IS how it observes a callback. Those earn a disable with the evidence stated. A ref MIRRORING ordinary react state, or a global written during render, is the opposite — a real bug the rule caught; fix the code.
- Spreading a plugin’s config INTO a later flat-config block silently re-enables a rule an earlier block deliberately turned off — later wins. Adding `configs.all` to the second block re-armed `no-missing-context-display-name` against lintmax’s own `'off'`, and only a real consumer’s tree surfaced it. Re-assert every deliberate `'off'` AFTER the spreads, and read the rule count back to confirm.
- Parse lintmax’s own comment-stripper, JSX-extension detector, and className-rule checker with `oxc-parser`, never `import ts from 'typescript'`. Why: they need real parsing (a regex mistakes `//` inside a string/regex/JSX for a comment), and `oxc-parser` gives comment ranges + an ESTree AST independent of the TypeScript version, where the classic sync `ts.createSourceFile`/`ts.ScriptTarget`/`ts.getLeadingCommentRanges` API is absent from the TS-7-native package. Against oxc’s flat comment list, NEVER strip a comment that is the sole content of a block (`catch { /* intentional */ }`, `noop() { /* empty */ }`): a comment bounded only by `{ … }` whitespace attaches to no AST node, so removing it leaves an empty `{}` that trips `noEmptyBlockStatements` and deletes the intentional-empty documentation — keep any comment whose enclosing block content is only comments plus whitespace.
- A `test.skip` / `test.todo` trips biome `lint/suspicious/noSkippedTests`, so a skip that deliberately documents a known-deferred failure (a confirmed-but-parked security hole, an un-built feature) needs an inline `// biome-ignore lint/suspicious/noSkippedTests: <reason>` carrying why it is parked and when it un-skips — the skip is legit, the silent skip is not.
- A TS project that runs the gate via `bunx lintmax@latest` (not installed in its own `node_modules`) can fail eslint with `exit 2` + an empty `ResolveMessage {}` on a FRESH checkout while passing locally on a stale green-cache (bust with `LINTMAX_NO_CACHE=1`): the lintmax-generated `node_modules/.cache/lintmax/eslint.generated.mjs` does `export { default } from 'lintmax/eslint'`, which eslint cannot resolve because lintmax is bunx-ephemeral, not a project dep. Fix in the consumer: add `lintmax` (and any type pkg the project’s own `tsconfig` `types` array declares, e.g. `@types/bun`) to `devDependencies` so the specifier resolves. This bit a real release — CI’s clean checkout self-cancelled the whole pipeline while local cached-green hid it.
- A per-line disable cannot survive a local-vs-CI plugin-version skew: a rule that fires in CI but not in the locally-cached plugin gets its disable stripped as unused by `fix`, so CI fails again — fix-forward with a code change the rule accepts, never a disable.
- The gate self-installs EVERY child binary it shells out to (deny, machete, nextest, typos, AND dprint) via binstall-or-install on a fresh machine — a missing child binary is the gate’s job to resolve, never a manual operator step. A formatter/linter the gate invokes but omits from the self-install list fails SILENTLY on a fresh CI runner where it is absent: `Command::new(tool).output()` returns `Err`, the stage returns failure with no stdout/stderr, and the whole gate reads as a generic stage error — the local machine passes only because the operator already has the tool on PATH. Audit the self-install list against EVERY tool the gate spawns, never a remembered subset.
- A file-level `/** biome-ignore-all <rule>: … */` placed directly above a statement binds to it as JSDoc, so biome reads it as a statement-range suppression and reports `suppressions/incorrect` while the rule still fires; and a plain `/* … */` buffer inserted to detach it is itself flagged `comments/deletable` and stripped by the comment survivor-set, re-binding the block. Fix: suppress at the offending line with an inline `// biome-ignore <rule>: …` (a survivor), or buffer the file-level block from code with a survivor directive the file genuinely needs (`/* eslint-disable … */`, `/* oxlint-disable … */`) — never a bare comment.
- The full `lintmax` wrapper can abort locally on a consumer’s eslint typed-linting (`@eslint-react/no-implicit-key` … `parserOptions … type information`) from a muddied `node_modules`, blinding local validation while CI’s clean install passes — so a child linter’s findings reach you only as a red CI. Reproduce a single child linter directly against its shipped config to validate before pushing: `oxlint -c node_modules/lintmax/oxlintrc.json --allow <each OXLINT_CLI_ALLOW rule> <paths>` (the `--allow` flags matter — without them lintmax-allowed rules like `unicorn/prefer-export-from` show as false errors), and read biome’s own findings from the wrapper’s pre-eslint output.
- The TS gate’s `promise-function-async` + `useAwait` + `return-await` jointly constrain a thin promise-passthrough: `return p` fails promise-function-async (a Promise-returning fn must be `async`), `async … { return p }` fails useAwait (async with no await), and `async … { return await p }` fails return-await (redundant await outside try) — only `async … { const x = await p; return x }` satisfies all three.
- The `void` operator is BANNED and its autofix is DESTRUCTIVE: `void someCall()` is rewritten to `undefined`, DROPPING the call — a fire-and-forget `void navigator.clipboard.writeText(x)` silently becomes `undefined`, the feature breaks, and the gate goes GREEN. Never use `void` for fire-and-forget; the autofix loses the side effect with no error. Always re-grep the call after `fix` to confirm it survived.
- Fire-and-forget a promise from a `() => void` handler (a context-menu `onSelect`, a DOM event handler) hits a four-way conflict: an `async` handler trips `no-misused-promises` + `strict-void-return`, `.then`/`.catch` trips oxlint `promise/prefer-await-to-then`, a bare call trips `no-floating-promises`, and `void` is banned + mangled. The only working form is a SYNC handler with `.then`/`.catch` + a file-level `/* oxlint-disable promise/prefer-await-to-then */` (idecn ships exactly this disable for its clipboard writes).
- Read the REAL failure set from `bun run check` / `fix`, NEVER from a raw `oxlint -c node_modules/lintmax/oxlintrc.json` run: the raw run omits lintmax’s `OXLINT_CLI_ALLOW` allow-list AND its path excludes, so it floods with false errors (`jsx-no-literals`, `no-underscore-dangle`, `func-style` are allow-listed; `readonly/ui` + `generated/` are excluded) and over-reports a rule by 10×. The gate is the only truth; a raw-oxlint count sends you chasing phantom rules.
- The gate groups all of a file’s hits for one rule onto a single output line (` 8,46 unicorn(max-nested-calls)`), so a `uniq -c` over the rule name counts FILES, not cases — “21 max-nested” can be ~80 actual lines. Parse `<file>` header + the ` <comma-lines> <rule>` body to get real per-line targets.
- Run `fix` to a formatting fixed-point BEFORE inserting any disable, then take line numbers from `check` and insert descending per file. Why: `fix` reflows code, so a directive placed on unstable formatting lands off its target — `suppressions/unused` on the stale line while the rule re-fires below; fix-first makes the gate’s next `fix` a no-op so the directive holds.
- An inline `// oxlint-disable-next-line node/no-sync` survives `fix`; a file-level `/* oxlint-disable node/no-sync */` gets STRIPPED for that rule (kept for others like `unicorn/max-nested-calls` on whole-idiomatic files) — so a multi-sync-call script needs a per-line disable on EACH call, never one file-level. A borderless `for … if (syncCall())` makes `fix` move the inline directive above the `for` (mis-targeting the `if`), and braces alone do NOT hold it — the form that survives is HOISTING the sync call to its own plain `const x = existsSync(...)` statement with the disable above the const, then testing the const (the formatter never moves a disable off a plain assignment). The DISABLE is the expedient fix; the PROPER one is converting to Bun-native async — `Bun.file(p).text()/.json()/.exists()`, `Bun.write(p, data)`, `Bun.$\`cmd\``for spawn (all async, no`Sync`name) plus`node:fs/promises` (`mkdir`/`rm`/`readdir`) for what Bun lacks — which eliminates `node/no-sync`entirely (no disable, no name-match fragility) and matches the Bun-native preference. Cost is async propagation through the call tree (top-level`await`covers module-init); reach for disables only where a context is genuinely synchronous. NB`Bun.spawnSync`still trips the`*Sync(`NAME match — use`Bun.$`/`Bun.spawn` instead.
- `node/no-sync` matches the `*Sync(` call-NAME, so a hand-named helper ending in `Sync` (`setupAndSync()`, `loadConfigSync()`) is a FALSE POSITIVE even though it touches no fs — RENAME it (`setupProject`), never disable, since a spurious disable on a non-sync call reads as real. Tell: the flagged line has no `*Sync` fs/child_process call on it.
- A dogfood/integration test that writes a code FIXTURE and runs the gate on it breaks when a newer lintmax adds a rule the fixture trips UNFIXABLY (`readFileSync`/`existsSync` in the fixture now fails `node/no-sync`, which `fix` cannot auto-resolve → `fix` exits 1 → the “fix should exit 0” assert fails). The fixture must only hold dirt the gate fully auto-fixes (comments, `function`→arrow, formatting) — strip constructs needing a manual disable, especially since such tests often assert NO disable comments survive in the fixed output. Also delete any stale fixture a prior failed run left in `src/` (not gitignored → the next gate lints it).
- A no-unsafe wall confined to ONE test/file that persists across a clean reinstall is NOT a missing build artifact — it is either (a) the package has NO `tsconfig.json`, so eslint’s typed-linting projectService cannot type it and every import resolves to `any` (fix: add a `tsconfig.json` extending the shared base, mirroring a sibling package that lints clean), or (b) a STALE test importing names absent from the module under test’s current export surface — the missing imports are `undefined`/`any`, manufacturing the wall (fix: rewrite the test against the module’s CURRENT exports; the wall is a real dead-test bug wearing a lint disguise, not a suppression target). Also: a dot-directory (e.g. `.well-known/`) is skipped by TypeScript’s default include glob, so eslint hits a `parse-error: file not in project` on it — add an explicit `include` entry for the dot-dir path in the project `tsconfig.json`.
- A wall of `@typescript-eslint/no-unsafe-*` (assignment/member-access/argument/call/return) clustered in one app or file is usually NOT real debt — it is a MISSING BUILD ARTIFACT erasing a typed import to `any`: a workspace package with no `dist/` (its `exports` point at absent `.d.ts`), an unbuilt fumadocs `.source/`, or a removed `.next/types` (so `PageProps`/route types resolve to `any`). A `bun clean` (which nukes `dist`/`.next`/`.source`/`node_modules`) manufactures the whole wall. Fix by REBUILDING (`bun run build` to regenerate the artifacts) BEFORE trusting any no-unsafe finding — never paper over it with local type-redeclarations or `as unknown as` casts; the cast is a band-aid that hides the missing build. Order the gate `build` before `fix` (or pre-build) so the linter sees real types, since `fix` alone does not regenerate them.
- A rule whose autofix an ALREADY-ENABLED rule reverts cannot be adopted — the two oscillate and `fix` leaves whichever ran last, so the finding never clears however many times you rewrite the source. The tell: you fix a finding, `fix` runs, and the SOURCE has reverted to the flagged form (read the file, not the log). Real case: `eslint-plugin-de-morgan` wants `!a && !b`, but an already-enabled simplification rule autofixes it back to `!(a || b)`; every hand-edit and subagent fix reverted on the next `fix`, across 8 sites. De Morgan vs collapsed-negation is pure style, so the resolution is to DROP the newcomer (de-morgan), not fight the existing autofix — dropping a rule that oscillates with an installed one is not a strictness cut, it is removing an unwinnable conflict. Distinct from the useAwait↔async oscillation below (same file, one rule pair) — this is TWO rules with OPPOSITE fixes.
- The release `verify` gate runs `build && fix && check && smoke && test` — running only `fix` + `test` locally is NOT the release bar, and a green local check still fails the release. `smoke` scaffolds a throwaway package (`bun init -y`) and runs `lintmax fix` on it expecting zero; after adding a package.json rule set, that minimal generated manifest tripped `require-description` + `specify-peers-locally` (a workspace-only opinion), failing the publish. Run the FULL verify chain before a version-bump push, and treat the scaffold/smoke fixture as a consumer the new rules must not break.
- A regex with the `/v` (unicodeSets) flag reserves `/` inside a character class — write `[\w\/]`, not `[\w/]`, or the pattern throws `Invalid character class` at parse time (silently, until the file loads). Switching a regex from `/u` to `/v` (e.g. to satisfy `require-unicode-sets-regexp`) is a semantic change, not cosmetic: re-run the tests. And a literal `*/` inside a `/** ... */` JSDoc closes the comment early — never put one in comment prose.
- Asserting on captured CLI output, match a CONTIGUOUS substring — colored output interleaves ANSI escape codes, so `Score: 100/100` prints as `Score:\x1b[22m \x1b[32m100/100` and `toContain('Score: 100/100')` fails while `toContain('100/100')` passes. Assert the shortest ansi-free run that proves the behaviour, or strip ANSI before matching.
- A plugin that exports BOTH a `default` and a named `configs` trips a different rule on each import style: `import * as p` → biome `noNamespaceImport` + oxlint `no-namespace`; `import p from` then `p.configs` → oxlint `import/no-named-as-default-member`. The escape that satisfies both is the named import: `import { configs as pConfigs } from '...'`. Check the plugin actually names-exports `configs` first (most flat-config plugins do).
- Turning a swallow honest can trip a DIFFERENT linter, and the pipeline’s own autofixers do the tripping: rewriting `catch { return '' }` to `catch { return undefined }` in a `string | undefined` function makes one pass strip the redundant `return undefined`, leaving `catch {}` — which biome then fails as `noEmptyBlockStatements`, 150+ of them. The empty catch is CORRECT (an unreadable input yields the declared `undefined`, and the caller reports it and exits non-zero) so the fix is a `biome-ignore` carrying that reasoning, never a revert to `''` — which would restore the lie that the file was read and empty. Expect this shape whenever a fix removes a value the linter then considers redundant.
- A large diff across vendored read-only paths the run never touched is the SYNC, not the linter — `pm4ai fix` refreshes `readonly/ui` from cnsync as part of its job, and a current lintmax leaves those paths alone (verified: reverting the churn and re-running a latest lintmax touches zero of them). Read the version before blaming it (`node_modules/lintmax/package.json` against the registry); attributing the churn to staleness sends the next reader upgrading a toolchain that is already latest. Refresh (`bun clean && bun i`) is still the right move for a wrapper that aborts on muddied `node_modules` — never fall back to a raw `oxlint -c node_modules/lintmax/oxlintrc.json` run, which bypasses the allow-list and path excludes and over-reports by 10×, sending you after phantom rules.
- The orchestrated `bun run fix` re-adds `async` to a synchronous method that NO single linter (`biome`/`oxlint`/`eslint`) re-adds when run alone — eslint’s `@typescript-eslint/promise-function-async` autofix fires only in the multi-pass pipeline, then biome `useAwait` fails the now-async-but-awaitless body, an oscillation a naive remove-async loses every gate. For a method that MUST stay sync (a React class `render()` — an async render returns a Promise and crashes at runtime), stop the adder with `// eslint-disable-next-line @typescript-eslint/promise-function-async` above it; suppressing `useAwait` instead would leave the runtime-breaking `async` in place. Isolate which child linter mutates a file by running each `--fix` alone before assuming it’s the gate’s pipeline.
- `node/no-sync`, `noProcessEnv`, `noAwaitInLoops`, `noUndeclaredClasses` are good rules in the wrong CONTEXT when they hit CLI scripts / codegen / e2e / env-modules / tailwind-v4 classes: there sync/sequential/env/unresolvable-class are idiomatic, so a documented per-line disable is the sanctioned false-positive exception — but it stays per-CASE with a reason, never a blanket lintmax scope, and `max-nested-calls` on a Convex `defineTable`/zod schema gets one file-level disable (the whole file is declarative), while on real logic it gets the var extracted.
- The TS gate runs TWO class-member-order rules that conflict on accessors: oxlint `perfectionist/sort-classes` puts `get-method` before private fields, `@typescript-eslint/member-ordering` wants fields first — no arrangement satisfies both. Expose accessors as plain methods (`foo(): T` not `get foo(): T`) so they fall in the method group both rules sort alphabetically; update call sites from `.foo` to `.foo()`.
- `@eslint-react/refs` NAME-MATCHES any identifier CONTAINING “ref” (case-insensitive), so a non-React value that merely reads like one — a file reference, a document id, a git ref — trips “Passing a ref to a function may read its value during render” wherever a hook passes it on. Fix by RENAMING to a word with no `ref` substring (`locator`, `key`, `handle`), never a disable — a disable on a non-ref value reads as a real ref finding forever. The trap: a HALF rename does not escape it. `ref` → `fileRef` STILL matches (it ends in `Ref`), and renaming only the caller’s variable while the CALLEE’s param stays `ref` also still fires — the match follows the callee’s parameter name. Rename every binding in the chain and prove it with a fixture: same file, `fileRef` → 2 errors, `locator` → 0. Same shape as the `node/no-sync` `*Sync(` call-NAME match.
- `react-hooks/memo-dependencies` is UNSATISFIABLE beside `react-hooks/exhaustive-deps`, so it stays `off` (earned exception, evidence below) while `exhaustive-deps` gates. The two encode opposite eras: `memo-dependencies` assumes the React Compiler memoizes everything and reads EVERY hand-written `useCallback`/`useMemo` dep as redundant; `exhaustive-deps` requires those same deps be listed. Proven on a real hook: baseline deps → “Unnecessary dependency `errorHandler`”; remove it → BOTH `exhaustive-deps` ids fire “missing dependency `errorHandler`”; hoist the derivation and re-dep → the rule then calls `mutate` AND `packageName` unnecessary, and both are demonstrably used inside the callback — a false positive, not advice. Its sibling `react-hooks/preserve-manual-memoization` is `off` for the same reason and is the tell that the pair is compiler-native. Decisive for a general-purpose gate: a PUBLISHED library cannot assume its consumer enables the compiler, so obeying the rule (dropping `useCallback`) returns a fresh function per render and breaks every memoized consumer. Re-enable only if lintmax ever gates compiler-only codebases, and then `exhaustive-deps` goes off in the same change — never both on.
- An index/barrel file must use explicit named re-exports (`export { A, B } from './x.ts'`), never `export *` (oxlint `no-barrel-file` + biome `noReExportAll`).
- Name every integration/e2e test `*.test.ts` (or `*.spec.ts`, `__tests__/**`) so the gate’s test-file glob relaxations apply (off there: `noAwaitInLoops`, `noProcessEnv`, `useTopLevelRegex`, `useAwait`, `no-await-in-loop`); a non-`.test.ts` integration file is held to full source strictness and floods on poll-loop awaits + direct env reads.
- TS narrows a closure-mutated `let`/object-property back to its reset literal across an `await` (it cannot see the notification-callback mutation), so a post-`await` `state.failed === null` reads as an always-true `no-unnecessary-condition`; return the outcome from the awaited helper with an explicit `Promise<{…}>` annotation and read THAT, never the mutable closure var after the await.
- The TS consumer config is `defineConfig({ ignores, eslint: { append: [{ files, rules }] }, oxlint: { overrides: [{ files, off: [] }] } })` imported from `lintmax` — a bare `export default { overrides: {…} }` silently fails validation (`overrides[…].eslint must be an array` / `not supported`) and applies nothing; reserve it for genuine ecosystem-fit opt-outs, never to dodge a real finding.
- `bun test`’s per-test timeout defaults to 5000ms, so a multi-turn integration test that lints clean is SILENTLY KILLED at 5s (`timed out after 5000ms`) unless it passes an explicit `it(name, fn, timeoutMs)` (or `{ timeout }`) — lint never catches the missing timeout, only a live run does. Every long-running `*.test.ts` carries an explicit timeout.
- Gate a live/integration test on the DETERMINISTIC signal, never a best-effort one: a hard `expect` on a non-deterministic model behaviour (the model actually USING an MCP tool, obeying a steer, grounding a specific fact) is flaky-by-construction — it passes on a capable tier and fails on the cheap one. Assert the deterministic plumbing (tool surfaced + direct call returns, turn completed) and treat model-USE as a logged best-effort, per the product’s own documented limitations.
- A test FIXTURE that writes source containing a template literal cannot sit in a plain string: eslint `no-template-curly-in-string` fires on any `${…}` inside a quoted string, reading deliberate fixture text as a mistaken template. Build it by concatenation (`'const n = "x-" + Date.now()'`) or interpolate a variable into a real template — never a quoted string carrying a bare `${`.
- biome `noMisplacedAssertion` does not recognise `test.skipIf(cond)(name, fn)` as a test context, so every `expect` inside a skipIf-gated test reads as an assertion outside a test and fails the gate — while the identical body under a plain `test(name, fn)` passes. Gate such a test with a plain `test()` plus an early return (`if (!process.env.FLAG) return`), never `test.skipIf`.
- biome `noUndeclaredEnvVars` validates every `process.env.X` read against turbo.json’s task `env` array, so a NEW env seam fails the gate until its name is listed there — and a `biome-ignore lint/style/noProcessEnv` does NOT satisfy it, because the two are separate rules: a seam needs BOTH the turbo.json entry and the noProcessEnv suppression. The tell: an env read that lints clean beside an existing seam (already declared) fails the moment you add a differently-named one.
- The green-tree-hash cache keys on the tree, so an edit to the BIGGEST package re-lints that whole package — a warm no-change run still pays the type-aware floor (measured: 60s warm vs 148s cold on a large Go tree). A session that edits one big package repeatedly never sees the warm path; that is the cache working as designed, not a regression, and the lever is fewer gate invocations rather than a faster gate.
- Restoring `process.exitCode` to a captured `prev` that was `undefined` does NOT clear a value the code set to `1` in between — bun keeps the `1`, so a test that sets/asserts exitCode (a codegen `checkSchema`, a CLI `fix`) leaks `0 fail but exit 1`, failing the suite while every test passes. Reset with `?? 0` on the restore AND a global `afterEach(() => { process.exitCode = 0 })` via a `bunfig [test] preload`; a package `bunfig.toml` REPLACES the root one (not merged), so carry the root’s `[install]`/`[run]` blocks into it. The tell: `bun test` exits 1 with `0 fail` and no `(fail)` line — a leaked global, not a failing assertion.
- Bun’s shell-tag has no `.timeout()` method — a `.quiet().nothrow().timeout(ms)` chain throws `not a function`. Bound an external scan/spawn with `Bun.spawn(args, { timeout: ms, stdout: 'pipe' })` and read `await new Response(proc.stdout).text()`, never a shell-tag `.timeout`. An unbounded home scan (a bare `rg --files` over `$HOME`) hangs for MINUTES (models, caches, deep node_modules); bound it with a spawn timeout AND `--max-depth`, but give the depth to the HOME scans only — a per-project cwd scan must keep full depth or it silently misses nested files.
- A `process.env.NEXT_PUBLIC_*` read must stay the literal `process.env.NEXT_PUBLIC_X` — Next replaces it by STRING SUBSTITUTION at build time, so routing it through an env-boundary function/getter leaves the browser bundle with `undefined`. When consolidating scattered env reads into one typed boundary, route only SERVER-side reads and leave every `NEXT_PUBLIC_*`, framework config (`next.config`/`playwright`/`instrumentation`), and self-contained zod-schema runtime script alone. The boundary module must read LIVE (`() => raw.X` getters), not capture `process.env` into consts at import — tests set the seams AFTER the module loads, and import-time capture freezes the pre-test values.
- A consumer `lintmax.config.ts` `ignores` entry, or a package `tsconfig`’s `exclude`/`strict:false`/`noUncheckedIndexedAccess:false`, may cover ONLY auto-generated or vendored (read-only synced) output — excluding or loosening HAND-WRITTEN source is a strictness hole that hides real findings (found: repos ignoring hand-written scripts/test files from lint, an app running `strict:false` on its own source that typechecked clean once restored). Audit every config exclusion against “is this generated/vendored?”; the resolved config (`tsc --showConfig`), not a `head` of the override file, is the authority on the effective strict flags — a package `extends` the shared `lintmax/tsconfig` base whose strictness a narrow override silently drops.
- A spec-of-code doc-diff check that reads a SIBLING doc repo silently SKIPS (passes vacuously) when that repo is absent — CI has only the code checkout, so the sibling is missing and the gate enforces nothing. Clone it in the CI job (`git clone --depth 1 <doc-repo> ../<sibling>`) before the check runs, or the doc-vs-code drift the check exists to catch ships green.
- The class-sweep is a FIX-TIME obligation, not a challenge-time one: the moment a finding is fixed, grep the whole fleet for the SHAPE (an unbounded scan, a refusal-returning-0, an exitCode leak, an env read outside the boundary) and fix every sibling in the same pass — waiting to be asked “did you sweep the class?” means the sweep was skipped and the siblings rotted. Verify a repo green by remote HEAD == CI `headSha` == `success`, never by push-time optimism: pushed is not CI-green.
- An MDX inline code span (single backticks) CANNOT contain a backtick — a nested or backslash-escaped backtick desyncs the span pairing, so text meant as code falls OUTSIDE it and any `{…}` there is parsed as a JSX expression, failing the Turbopack/fumadocs build with `Could not parse expression with acorn` / `Unexpected content after expression` at a column deep in the line. A brace group inside ONE valid span is fine; a broken span exposes it. This is a docs-only edit that reds CI, so build the docs app locally (`bun run build` in `apps/docs`) before pushing any `.mdx` edit — the gate runs the build, and lint/present-tense checks never see the MDX parse.
- `import-shadowing` fires only in the file that imports the shadowed package: a parameter named `text`, `url`, `path`, `time`, `sort`, `bytes`, or `user` is fine until that file gains an import of the same name, then the untouched function’s declaration line is flagged with nothing visibly wrong on it. Rename the param.
- (lintmax-go) Hoisting an error out of its `if` can REBIND a later `:=` rather than declare a new variable, so a concrete `*MyError` lands in a variable already typed as the `error` interface — a nil pointer in an interface is not nil, so every success takes the failure branch. Give each error its own name when the types differ; treat `nilness`’s “tautological condition: non-nil != nil” as a defect report, not a style nit.
- Two gate stages can demand OPPOSITE quoting of one shell literal that PRINTS an example command: the formatter rewrites it to single quotes to keep it literal, the analyser reads single quotes as a suppressed expansion and pings back — the edit ping-pongs between stages and reads as unsatisfiable. Neither disable: move the text into a quoted heredoc, which no stage rewrites because nothing inside one is a shell token.
- The gate lints git-TRACKED paths, so a tracked file moved with a plain `mv` leaves it linting a path absent from disk and the finding names an innocent file it CAN see. Use `git mv`; when a finding cannot be reproduced by running the tool directly, compare the gate’s file set against `git ls-files` before suspecting the tool — an unreproducible finding is evidence about the file set, not the gate.
- lintmax keeps only its single newest release, so a consumer with a LOCKED lockfile 404s the moment lintmax prunes the pinned version, and it fails in the invisible shape — the developer’s warm `node_modules` keeps the pruned copy so local commands work while a fresh install resolves nothing and CI dies on whatever first reads the package (a `tsconfig extends lintmax/tsconfig` reports an unresolvable path). A consumer manifest may only carry `lintmax: latest`; on a fresh-install lane that cannot resolve, `bun update lintmax` and re-commit — removing the lock trades the 404 for a permanent unresolved error on a restricted/offline runner.
- PUBLISH a lintmax capability BEFORE any consumer declares config data only the new version understands — a consumer’s CI installs the PUBLISHED lintmax, not a local build, so the local tree goes green while the lane reds on the same commit. Worse, a config schema that DENIES UNKNOWN FIELDS fails the whole file to parse, silently dropping every exception the project had declared, and the lane then fails its supply-chain stage on advisories and duplicates that were exempted for good reasons — pointing at the dependency tree rather than at the one added key, with nothing naming the version. So ACCEPT an unknown field in a project-supplied config/exceptions file rather than denying it, once consumers upgrade independently: denying is right for catching a typo and wrong for a shared schema that grows, because a consumer running last week’s lintmax cannot parse this week’s file at all, and a project could never adopt a new key without every lane failing until each is upgraded.

---

## Minimal DOM

Same UI, fewest DOM nodes — every element earns its place. If deleting it breaks nothing (semantics, layout, behavior, required styling), it must not exist.

### MUST

- Keep a node ONLY if it provides one of: semantics/a11y (`ul/li`, `button`, `label`, `form`, `nav`, `section`, ARIA, focus); a layout constraint (own containing block / positioning / clip / scroll / stacking — `relative`, `overflow-*`, `sticky`, `z-*`, `min-w-0`); behavior (measurement ref, observer, portal, event boundary, virtualization); or component API (can’t pass props/classes to the real root after trying `as`/`asChild`/forwarding). Why: every node is render + memory cost.
- Spacing via parent `gap-*` (flex/grid) or `space-x/y-*`. Why: no wrapper for gaps.
- Separators via parent `divide-y`/`divide-x`. Why: no separator elements.
- Alignment via `flex`/`grid` on the existing parent. Why: no alignment wrapper.
- Visual (padding/bg/border/shadow/radius) on the element that owns the box. Why: no decoration wrapper.
- Group JSX with `<>...</>` fragment, not `<div>`. Why: zero DOM cost.
- Style mapped components by passing `className` to the item; uniform direct children via `*:` or `[&>tag]:`. Why: props first, selectors second — no repeat-class wrapper.

### NEVER

- Never add a wrapper a `gap`/`space`/`divide`/`className`/`[&>...]:` could replace. Cost: dead node, render + read budget.

### Examples

| Good (selector pushdown)                           | Bad (repeated classes)                                      |
| -------------------------------------------------- | ----------------------------------------------------------- |
| `<div className='divide-y [&>p]:px-3 [&>p]:py-2'>` | `<div className='divide-y'>` with `px-3 py-2` on each `<p>` |

### Pitfall

- Selector tools: `*:` direct children · `[&>li]:py-2` targeted · `[&_a]:underline` descendant (sparingly) · `group`/`peer` on existing nodes → `group-hover:*`/`peer-focus:*` · `data-[state=open]:*`/`aria-expanded:*`/`disabled:*` · `first:`/`last:`/`odd:`/`even:`/`only:` structural.
- Review each node: can I delete it → delete; can `gap/space/divide` replace it → do it; can I pass `className` → do it; can `[&>...]:` remove repetition → do it.

---

## React & Next.js

React 19 + Next.js component conventions.

### MUST

- Server components by default — `layout.tsx`, `loading.tsx`, `error.tsx` are server. Why: minimal client bundle.
- `'use client'` ONLY when a component uses hooks/interactivity. Why: keep server-rendered by default.
- shadcn component over raw HTML — `Button` not `<button>`, `Table` not `<table>`, `Progress` not nested divs. Why: consistency + a11y.
- `use*` naming for hooks. Why: lint-enforced, rules-of-hooks detection.
- Stable array keys. Why: index keys corrupt reconciliation on reorder.
- Wrap `useSearchParams()` in `<Suspense>`. Why: else build/runtime bailout.

### NEVER

- Never write an IIFE in JSX — extract to a named component. Cost: re-creates on every render, unreadable.
- Never use an array index as key. Cost: stale reconciliation on reorder/insert.
- Never call `Date.now()` / `Math.random()` in render. Cost: hydration mismatch / nondeterminism.

---

## Security

Credential handling, env scoping, server/client boundary, mechanism-asserted invariants.

### MUST

- Route any credentialed client-side work through a server action / API route / Convex action reading the unprefixed var. Why: `NEXT_PUBLIC_*` is inlined into the client bundle, visible in page source.
- Read server-only vars via `process.env.X` only inside `'use server'`, `'use node'`, `convex/`, `backend/spacetimedb/`, or `app/api/*/route.ts`. Why: server boundary.
- Fail fast on a missing required var — validate via schema (`z.string().min(1)`, `z.url()`, NO `.default()`) or throw. Why: silent default = undebuggable wrong value.
- Absence-as-off is allowed ONLY as a documented intentional toggle (`if (env.SENTRY_DSN) initSentry(env.SENTRY_DSN)`) — test: can a user intentionally configure absence to mean off? yes = toggle (allowed), no = fallback (banned). Why: separates a real feature toggle from a silent wrong-value default.
- Bash `${VAR:?VAR is required}`; docker-compose `${VAR:?}`. Why: crash on absence, not fallback.
- Set every var explicitly in `.env` (sole source of truth), even conventional ones. Why: nothing implicit.
- Enforce auth/isolation/ownership by a mechanism the caller can’t bypass — Convex `v.*` validator + auth guard at the boundary, DB NOT NULL/CHECK/unique constraint, server-side challenge. Why: call-site checks get forgotten.
- Two independent enforcement points per isolation/security invariant. Why: defense in depth.
- A regression test flips the mechanism off and asserts the invariant fails. Why: if it passes mechanism-off, it was call-site-asserted.

### NEVER

- Never use `NEXT_PUBLIC_*` for a credential — API keys, tokens, DB secrets, anything `*_SECRET`/`*_PASSWORD`/`*_PRIVATE_KEY`. Cost: shipped to browser.
- Never write `process.env.X ?? 'fallback'` / `|| 'default'` on a config read. Cost: silent wrong-value behavior.
- Never read server-only vars from a `'use client'` component. Cost: leaks to bundle or is undefined.
- Never log PII unredacted. Cost: privacy + regulatory violation.

### Allowed `NEXT_PUBLIC_*`

- Public deploy URLs (`NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_SPACETIMEDB_URI`) where auth is via session token, not the URL.
- Feature flags / build-time constants.
- Public OAuth client IDs (paired with server-side PKCE / redirect-URI checks).

### Migration

- Found a `NEXT_PUBLIC_*` API key: (1) rename to drop the prefix (`NEXT_PUBLIC_TMDB_API_KEY` → `TMDB_KEY`); (2) move the call into a server action / Convex action; (3) client invokes the server action, never sees the key; (4) add a server-side test-mode stub (`isStdbTestMode()` / `isCvxTestMode()`) so playwright stays hermetic.

### Caught by

- PR env-var audit: no `NEXT_PUBLIC_*` name with key/secret/token/password/private; new client fetch goes through a server boundary; credential server actions short-circuit in test-mode; `.env.example` marks server-only vars without the prefix.

---

## shadcn

shadcn components used as-is, native look, semantic classes only.

### MUST

- Use shadcn components as-is. Why: no override drift.
- Semantic Tailwind colors only — `text-foreground`/`text-muted-foreground`/`text-destructive`, `bg-primary`/`bg-muted`/`bg-destructive`, `text-primary` for links. Why: theme-driven, dark-mode safe.
- `cn()` for conditional classes. Why: merge precedence + the only composition path.

### NEVER

- Never hardcode hex / palette colors in `className` or `style` — `text-red-500`, `bg-blue-500`, `text-green-500`. Cost: bypasses theme.
- Never use `fd-*` aliases (`bg-fd-muted`, `text-fd-muted-foreground`, `bg-fd-primary`). Cost: fumadocs internals; use the shadcn name.
- Never use a template literal for conditional className. Cost: no merge precedence; use `cn()`.
- Never use `cva` / bare `clsx` / bare `twMerge`. Cost: fragments the single `cn()` composition path.

### Examples

| Good                                | Bad                              |
| ----------------------------------- | -------------------------------- |
| `cn('base', cond && 'on')`          | `` `base ${cond ? 'on' : ''}` `` |
| `cn('base', v === 'a' ? 'x' : 'y')` | `clsx('base', ...)` / `cva(...)` |
| `bg-muted` `text-primary`           | `bg-fd-muted` `text-blue-500`    |

### Pitfall

- `global.css` aliases `--color-*` → `--color-fd-*` via `@theme inline`, so `bg-muted`/`text-primary`/`border-border` resolve to the same theme as `fd-*` — always use the shadcn name.
- fumadocs’ own UI (sidebar/search/TOC) keeps `fd-*` internally — that is library code, not yours.

---

## tsdown

Building + publishing library packages with tsdown.

### MUST

- Build/publish packages with `tsdown`. Why: standard ecosystem build.
- Emit ESM + declaration files. Why: consumers need types.
- `prepublishOnly` builds before publish. Why: never ship stale `dist/`.
- Export every type used in the public API. Why: DTS generation fails on unexported internal types leaking through re-exports.

### NEVER

- Never bundle a dep the consumer installs itself. Cost: duplicate/version-conflict in consumer tree.

---

## TypeScript

TypeScript code style + formatting.

### MUST

##### Functions, exports, and control flow

- Arrow functions only. Why: one function form.
- All exports in a single block at end of file. Why: lint-enforced, scan-once.
- `.tsx` single component → `export default`; utilities/backend → named exports. Why: convention.
- ANY file with JSX uses `.tsx` — even a context provider `<Ctx value={...}>`. Why: biome parses `.ts` as non-JSX, misreads `<Foo>` as comparison/regex, fixer infinite-loops (90-min hang).
- `for` loops over `reduce()`/`forEach()`. Why: readability + perf.
- Exhaustive `switch` with `default: never`. Why: compile-time case coverage.

##### Naming and imports

- Descriptive `catch (error)` state-var names (`chatError`, `formError`). Why: oxlint shadow rule.
- Short map callback names (`t`, `m`, `i`). Why: convention.
- Destructured object for 4+ args (max 3 positional). Why: call-site clarity.
- Co-locate components with their page; move to `~/components` only when reused. Why: locality.
- Explicit imports from exact file paths; no barrel `index.ts` in app code (library packages use barrels for public API). Why: avoids barrel cycle + bloat.

##### Dependencies and types

- Prefer existing libraries over new dependencies. Why: minimize surface.
- `node:` prefix for Node builtins (`import { join } from 'node:path'`). Why: explicit builtin.
- `interface` over `type` where possible; properties sorted alphabetically. Why: lint-enforced.
- `import type` for type-only imports. Why: erased at build.

### NEVER

- Never write `function` declarations. Cost: violates arrow-only.
- Never duplicate types. Cost: drift; single source of truth.
- Never use `import as` aliases. Cost: rename the variable instead.
- Never leave empty lines between statements. Cost: biome deletes them — wasted diff.
- Never add a trailing comma single-line (keep it multi-line). Cost: format violation.

### Formatting

- Single quotes, no semicolons; imports sorted alphabetically by source.
