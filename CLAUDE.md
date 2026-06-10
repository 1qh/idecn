pm4ai manages every repo with lintmax in deps — syncs configs, generates `CLAUDE.md`, enforces conventions, runs maintenance.

## MUST

- Read root `README.md` first WHEN it exists. Why: project-specific entry.
- Determine role via `gh auth status`: owner (`1qh`) may edit pm4ai rules/checks directly; otherwise edit only companion files. Why: managed files are regenerated.
- Put project-specific content in companion files — `LEARNING.md` (gotchas), `RULES.md` (project-only rules), `PROGRESS.md` (ongoing), `PLAN.md` (architecture). Why: managed files get overwritten.
- Capture a gotcha into `LEARNING.md` the moment it surfaces, committed with the work that taught it. Why: an uncaptured surprise re-costs the same hour every few weeks; one home per fact, never duplicated.
- Owner adds a universal rule → `.mdx` in pm4ai `apps/docs/content/rules/` with `infer` frontmatter; a new check → `packages/pm4ai/src/{audit,checks}.ts`. Why: rules generate CLAUDE.md, checks run in status.
- Note any cross-project discovery for pm4ai. Why: a lesson hit on many projects becomes a universal rule/check.
- Act only on a current check: proceed on `check: passed` (current); wait on `check: running...` (don’t edit); fix violations on `check: failed`; re-run + wait when stale (passed before N commits); run `bunx pm4ai@latest fix` first on `check: never run`. Why: stale/absent checks aren’t evidence.

## NEVER

- Edit a managed file directly — `CLAUDE.md`, `.github/workflows/ci.yml`, `clean.sh`, `up.sh`, `bunfig.toml`, `.gitignore`, `readonly/ui/`. Cost: next `pm4ai fix` overwrites it.

## Key repos

- **pm4ai** — manager; rules `apps/docs/content/rules/*.mdx`, checks `packages/pm4ai/src/`.
- **lintmax** — max-strict lint/format orchestrator; every project depends on it.
- **cnsync** — canonical `readonly/ui` (shadcn + ai-elements).

## Commands

- `bunx pm4ai@latest status` — check current project (`--all` for every project).
- `bunx pm4ai@latest fix` — sync + maintain, requires clean git (`--all` for every project).
- `curl https://pm4ai.vercel.app/llms-full.txt` — full docs.

---

Execution discipline for an agent working this codebase. Engineering posture lives in `philosophy`; this is how to run a turn.

## MUST

- Continue to the next task while autonomous-feasible work remains; identify it and start. Why: idle and handoff are the costliest parts of the loop.
- Lock the full surfaced scope into `PLAN.md` the moment it rounds out and ship every item in one pass; the locked set is the immovable target. Why: a “this round / next round” split is where items go to die.
- Parallelize independent work against any known wait (build, codegen, install, network) — the parent grinds another file while a subagent runs. Why: idle wait is the costliest non-stop state in the loop.
- Self-decide reversible, config-only, or rule-settled choices; surface only a genuine fork as one question + options (each with pros/cons) + recommendation + reasoning. Why: most “decisions” are already settled by the rules, and a stacked or unreasoned MCQ drops answer quality.
- Exhaust code, docs, git history, and memory before asking; ask only what cannot be discovered. Why: the discovery cost is already paid.
- Run the action yourself; never ask the user to run a command the agent can run. Why: handing work upward breaks the loop.
- State an expected outcome and deadline before any observable action (build, navigate, poll); flag stuck the moment it deviates. Why: no criterion means silent stuck loops.
- Scan vendor issue trackers and changelogs before declaring a third-party blocker. Why: the training cutoff lags the ecosystem by months.
- Commit the moment a bug is found and again when fixed during any verification loop. Why: a per-bug trail maps failure to fix.
- Foreground any command under ~2 min; background only with concurrent work in flight, never background-then-poll. Why: background-then-poll is an idle pattern.
- Dispatch concurrent subagents sliced by file/dir/rule boundary, packed in one message; restrict edit-only subagents to read/edit/write/grep/glob; verify build-green on the shared branch first; audit their self-reports before any destructive cleanup. Why: throughput without thrash, and agents misreport.
- Parent-author the shared types/signatures before dispatching an edit wave; subagents edit call sites against the stable signature. Why: divergent parallel authoring causes stuck-thrash.
- Use a write-capable subagent type (`general-purpose` or a custom edit agent) for any wave that produces edits; never `Explore` (read-only by construction). Why: read-only agents return plans, zero edits — the whole wave is wasted.
- Run dependent subagent waves sequentially after the sibling lands; never brief a subagent to wait on a notification. Why: the subagent runtime has no wait-for-event — it terminates without work.
- Keep command output terse — a single `ok` or silence on success, full detail only on failure. Why: every line spends the context budget.
- Wrap streaming-CLI chatter (`bun install`, `docker`, `gh`, `wrangler`, `convex deploy`) with redirection — `… >/dev/null 2>&1 && echo ok || cat err`. Why: progress text burns the context budget.
- Hold at most one long-running background slot; reap it after consuming its output. Why: the runtime leaves stale “(running)” slots that mislead.
- Check image dimensions before Read on `.png`/`.jpg`/`.heic`/`.webp`; downscale via `sips -Z 2000 "$f" --out /tmp/$(basename "$f")` when over 2000px. Why: a many-image request over 2000px locks the whole session until `/compact`.
- Confirm the exact target with the user before any destructive or irreversible action — delete, overwrite, `git push --force`, `reset --hard`, `git clean`, `DROP`, `TRUNCATE`, prune, or mass mutation; name precisely what will be affected and wait for an explicit go. Why: irreversible loss has no undo, so the autonomy default never extends to it.
- Scope a delete/cleanup task to the precise paths named and confirmed first; remove only the named child, never a parent directory that also holds unrelated data. Why: deleting a folder to clear its contents takes every sibling inside it, unrecoverably.

## NEVER

- Stop at a status summary while autonomous-feasible work remains, or close with “want me to / should I / which one / ready?” (confirming a destructive or irreversible action is the sole exception). Cost: a wasted turn seeking permission instead of progress.
- Enumerate remaining items and ask which to do. Cost: the cue is to do all of them.
- Treat effort, size, or “diminishing returns” as a stop reason. Cost: real work dressed up as a judgment call.
- Propose dropping scope to simplify — deleting an enum case/type/prop, removing a UI affordance, replacing a control with a label, collapsing screens, or hiding behind a flag. Cost: ONLY MORE, NEVER LESS — a surface shipped narrower than approved makes the absence the new baseline; fix the cause, never amputate the feature.
- Ask for a fact the agent could discover after one consent, or guess one not in source. Cost: re-explaining paid-for evidence, or shipping code on an unverified value.
- Invent a file path, export name, config key, version pin, or API signature, or pattern-match against what similar projects “usually” do — read to confirm first, quote verbatim or do not cite. Cost: a fabricated identifier or assumed convention ships as a real bug.
- Idle through a wait — background-then-poll, heartbeat, or “a subagent will handle it”. Cost: an idle agent is the most expensive state in the loop.
- Delegate diagnostics (“paste the log”, “tell me what you see”). Cost: inverts loop ownership, slows everything.
- Orchestrate other AI providers in the dev loop (GPT/Gemini juries, cross-provider supervisors). Cost: Claude-Code subagents are the parallelism primitive; multi-provider adds coordination cost without gain.
- `rm` or overwrite a parent directory to remove something within it — target the specific child. Cost: sibling data is destroyed with it (e.g. session transcripts beside a `memory/` folder).
- Read “be autonomous, never ask” as permission for a destructive or irreversible step. Cost: autonomy covers reversible work only; irreversible loss needs explicit consent.

## Valid stops — only these

- The user says stop or pivots.
- A hard external blocker — a credential or decision the agent cannot obtain.
- All work done, verified, and green.

## Pairs with

- `philosophy` (engineering posture); `testing` (cheapest harness; verify by running).

---

Bun is the only runtime + package manager.

## MUST

- Use only `bun`. Why: one toolchain, no manager drift.
- `bun fix` passes before done. Why: lint/format gate.
- Update deps via `bun clean && bun i`. Why: refreshes `"latest"` cleanly.
- All deps `"latest"`; WHEN a pin is unavoidable, pin major only (`"eslint": "9"`). Why: no legacy lock-in.
- Every direct dep shows an upstream release within ~6 months; replace an abandoned or archived dep, never keep it. Why: stale-but-stable rots — force the migration early.
- A newly required CLI or dep lands in `package.json` (or the documented setup script) the same turn it is first used. Why: never re-litigate the install next session.
- `import { X } from 'bun'` (`$`, `file`, `write`, `Glob`, `spawn`, …) in bun-runtime apps (CLI, standalone server). Why: explicit + tree-shakeable; `Bun` is a registered biome global so either form lints clean.
- Use the `Bun` global (`Bun.S3Client`, `Bun.s3`, …) in Next/Turbopack apps. Why: `import { X } from 'bun'` is unresolvable in `next build`’s Node page-data-collection workers; the global needs no module resolution, so it survives the build and resolves under the bun runtime.
- Run `bun i` immediately after renaming a workspace `name:`. Why: dependents resolve old name via stale `node_modules/<scope>/` symlink.
- Read an opaque eslint `ResolveMessage {}` as a stale workspace symlink → reinstall first. Why: it masks every other violation; not a lint-internals bug.
- Scripts silent on success, verbose on failure. Why: agent context budget.

## NEVER

- yarn / npm / npx / pnpm. Cost: toolchain drift.
- `bun update`. Cost: rewrites `"latest"` to resolved versions.
- Commit `bun.lock` (keep in `.gitignore`). Cost: lockfile drift across machines.
- `git clean`. Cost: deletes `.env` + uncommitted files — use explicit `rm -rf`.

## Scripts

- `sh clean.sh` — nuke artifacts (node_modules, lockfile, caches, dist, .next).
- `sh up.sh` — clean + install + fix + check (universal maintenance cycle).

---

Code quality bans, single-source-of-truth, canonical-state, bounded waits, codegen integrity.

## MUST

- One definition per piece of data — shared constant defined once, imported everywhere; extract any value appearing in 2+ files. Why: drift surface.
- Check existing utilities/components FIRST before writing inline logic. Why: avoid duplication.
- Land any reusable script/helper/harness/probe as a tracked file (`scripts/*.ts`, a test, a `package.json` script), never throwaway `/tmp` scratch. Why: a `/tmp` probe is re-discovered next session; in-repo evidence re-runs.
- Extract a shared util/component/factory on its second use, never a speculative first. Why: a one-call abstraction guesses the wrong shape and rots as unmaintained surface.
- Fix every known bug the moment it surfaces — lint, type error, audit, review, or your own reading — regardless of severity, blast radius, or whether it fires on current data. Why: a latent bug is one input from a live one; the discovery cost is already paid, so the same pass that found it fixes it.
- Name things for what they ARE, not their lineage. Why: code reads as the single intended design, authored fully-formed.
- When reworking, rename in place + delete the old, zero transitional duplicate. Why: result reads as if always so.
- One declarative present-tense schema definition. Why: a numbered migration chain (`001_*`) encodes history in the repo.
- Land a breaking change expand-contract — add the new shape, dual-write/backfill, drop the old in a later release; applies to DB schema, wire format, Convex tables, exported types, and public API signatures. Why: no destructive change ships in the same release as the code still depending on the old shape.
- `AbortSignal.timeout(ms)` (or SDK timeout) on every `await` on network/IPC/subprocess. Why: bare `await` on external state can hang silently.
- Bounded polling — compute a deadline once, exit with a specific stderr reason on timeout (`"api healthz timeout 60s"`). Why: `while(!ready){}` hangs with no clue.
- Change source + regenerate for any codegen output; regenerate-and-diff gate fails on staleness. Why: committed output must equal a fresh regen; don’t trust the pre-commit hook alone.
- Land the lint/check policing a class of artifact before the first artifact of that class lands. Why: phase ordering — the gate exists when the artifacts arrive, not after they drift.
- Carry the declared type across every boundary (persistence, wire, service, codegen, runtime); ratchet toward precise types, never widen a typed surface back. Why: type erasure is the slowest class of bug.
- Fail fast on any missing required input — throw, return non-zero, or refuse to construct. Why: a substituted default turns missing config into a wrong-value bug.
- Inline styles only for truly dynamic values. Why: colors/static props belong in classes.

## NEVER

- Write comments (lint-ignore directives are the only allowed comment). Cost: lintmax strips them.
- `!` non-null assertion, `any`, `as any`, `@ts-ignore`, `@ts-expect-error`, `@ts-nocheck`. Cost: type holes — see lintmax never-ignore.
- Erase types at a boundary — `any`/`string` for JSON/array/blob, `Map<string, unknown>` for a structured payload, a closed set as `string`/`number` instead of a union, a bare id string where a typed `Id<X>`/branded id exists, an unchecked cast where the compiler warned. Cost: slowest class of bug to debug.
- Duplicate types. Cost: drift; single source of truth.
- Disable lint rules globally/per-directory. Cost: hides real bugs — fix the code.
- Ignore written source from linters — only auto-generated (`_generated/`, `generated/`, `module_bindings/`, `readonly/ui/`). Cost: source escapes the gate.
- Reduce lintmax strictness. Cost: removing a rule needs false-positive evidence, adding needs none — WHEN upstream drops a rule, find a replacement.
- Skip, defer, or “note” a known bug via severity/occurrence framing — “latent”, “won’t fire on current data”, “low-severity”, “backstopped elsewhere”, “the source already guards it”, “fix when that path ships”, “improvement not a bug”. Cost: the severity twin of effort-framing — the exact loophole that lets a found bug rot into an incident; severity sets ordering within the pass, never whether it is fixed. The only non-fix is an unobtainable credential, a shared-blast-radius irreversible op, or a fix that would corrupt correct data — and each still fixes the code path and files a tracked task, never a silent “noted”.
- Touch `readonly/ui/` manually. Cost: overwritten by cnsync sync.
- Copy a shared-package primitive (cnsync `readonly/ui`, a lintmax or published-package export) into a consumer repo — import it. Cost: copies drift from the substrate and skip its upstream fixes.
- Hand-edit codegen output (`_generated/`, `.source/`, `*.generated.ts`, typed-query records). Cost: lost on next regen.
- Lineage in names (`legacy`, `old`, `deprecated`, `v2`, `-new`, `-rewrite`) or history narrative in comments/commits/logs/docs ("previously", “we switched”, “used to”, “instead of X”, “no longer”, “as of [date]”, defining a thing by what it is NOT). Cost: filler the agent re-reads forever; a `Why:` may give a timeless reason, never a past-incident story.

## Pitfall

- Adding a wrapper div → check parent `gap-*`/`space-*` first.
- Copy-pasting from another file → extract to a shared utility/component.
- Call internal functions by typed reference (e.g. Convex `internal.x.y`), never a dotted-string `Record<string, unknown>` lookup. Dynamic-path traversal forces `no-unsafe-*` suppressions.

---

Git commit + push conventions.

## MUST

- Commit frequently; push logical groups. Why: small auditable units, easy revert.
- Commit subject `type: description` — `fix|feat|docs|chore|refactor|test`. Why: conventional-commit parse.
- Land on `main` directly or via a short-lived feature branch + PR. Why: trunk-based, single `main`.

## NEVER

- Mention AI / Claude / coauthor / “generated with” in commits. Cost: AI attribution unwanted in history.
- Maintain long-lived `develop` / `release-*` / `feature/*` branch hierarchies. Cost: divergent long branches rot and conflict against trunk.

---

lintmax = biome + oxlint + eslint + prettier + sort-package-json in one command; we own it.

Every lintmax version runs configless by default. `lintmax` (TypeScript) is the sole exception — its max-strict default is dense enough that a project needs `lintmax.config.ts` to opt a rule out, so it supports one; every other version (`lintmax-go`, `lintmax-rs`, …) stays config-free. A project config opts a rule out only with documented false-positive evidence, never to dodge a fix.

## MUST

- Run only `bun run fix` for code maintenance. Why: it fixes then verifies internally (all 5 linters twice); a clean run prints `ok` on a single line + exit 0 — `ok` IS the success signal, not silence.
- Read failure output directly. Why: already grouped file→linter→rule, compressed line numbers, deduped across 5 linters.
- Make ALL edits first, then run `fix` foreground to completion. Why: editing during a backgrounded `fix` races it — the formatter writes its pre-edit buffer back and silently reverts your change.
- WHEN a `fix` is running, wait until `pgrep -f 'lintmax|bun.*fix'` is clear before editing. Why: same revert race.
- Commit a checkpoint before any multi-file mutator (`fix` after stripping directives, audit/codemod, sed-all/rename-all). Why: `fix` mixes autofixes with your edits; `git reset --hard` then restores in one command.
- Batch many edits, run `fix` once at the end. Why: `fix` is slow per run.
- File code-lint gaps upstream against lintmax. Why: it is the only lint tool — domain-specific hand-rolled `tools/*.ts` checks (banned vocab, spec-vs-code diff) are fine; code-lint is not.

## NEVER

- Run `bun run check` / `lintmax check` for maintenance — `check` is CI-only; `fix` is the agent-side maintenance command. Cost: redundant after `fix`, wastes 2+ min re-running 5 linters.
- `| tail` / `| head` on any lintmax command. Cost: empty output IS success; failure output is already agent-formatted — truncation hides violations.
- `lintmax check --human` to “see violations”. Cost: run `bun run fix` and read its failure output.
- Add a second code-lint tool — extra eslint plugins, stylelint, knip, depcheck, dependency-cruiser, size-limit. Cost: fragments lintmax’s curated surface, drifts.
- Use the `void` operator. Cost: `fix` auto-deletes it (`no-void`) — `void promise()` → bare expr → `noUnusedExpressions`; `() => { void mutate() }` → `() => { undefined }`, dropping the call.

## void replacements

- Unused promise: `promise.catch(() => {})` or `try { await ... } catch {}`.
- Async in a `() => void` slot (`onClick`): `() => { mutate().catch(console.error) }`, or widen the prop type to `() => void | Promise<void>`.
- Async inside a `useEffect` body (slot type can’t be widened): wrap in an IIFE `;(async () => { ... })()` or `.catch(noop)`.
- Unused var: rename `_x` or remove it.

## Ignore syntax

| Linter | File-level                                      | Per-line                                    |
| ------ | ----------------------------------------------- | ------------------------------------------- |
| oxlint | `/* oxlint-disable rule */`                     | `// oxlint-disable-next-line rule`          |
| eslint | `/* eslint-disable rule */`                     | `// eslint-disable-next-line rule`          |
| biome  | `/** biome-ignore-all lint/cat/rule: reason */` | `/** biome-ignore lint/cat/rule: reason */` |

## Ignore strategy

- Fix every legit, fixable finding by fixing the code, never the rule; ignore is last resort. Why: a found-and-fixable finding disabled is the severity/effort loophole that lets a real defect rot — the rule stays, the code changes. The only legitimate disable is a documented false-positive-rate, logged as an exception.
- File-level disable WHEN a file has many unavoidable same-rule violations (sequential DB mutations, standard React patterns, external images); per-line for an isolated one. Why: scale-appropriate.
- File-level directive at absolute file top, above imports/code (incl `'use client'`/`'use node'`); per-line on the line ABOVE the code. Why: per-line inline trips `no-inline-comments`.
- WHEN 2+ linters flag one line, file-level for one + per-line for the other. Why: stacking multiple per-line above one line is banned.
- One top `eslint-disable` per file, multiple rules comma-joined; keep one canonical block, remove duplicates. Why: dedupe.
- WHEN a file-level `biome-ignore-all` exists, drop the redundant per-line `biome-ignore` for that same rule. Why: file-level already covers every line.
- NEVER 5+ per-line ignores for one rule. Cost: use file-level instead.
- Don’t hand-remove dead directives or add one “just in case”. Why: `fix` auto-removes UNUSED file-level `oxlint-disable` / `biome-ignore-all` (both `/**` and `//` forms) by strip-relint-in-place; if a rule doesn’t fire, `fix` drops it and `check` fails on it.

## Cross-linter

- Same rule in 2 linters (biome `noAwaitInLoops` + oxlint `no-await-in-loop`) = double enforcement, not conflict — never disable one. Why: both must pass.
- Suppress a shared eslint/oxlint rule on eslint’s side. Why: oxlint auto-picks up eslint rules and is faster.
- oxlint `eslint/sort-keys` is disabled in lintmax. Why: conflicts with perfectionist (ASCII vs natural sort).

## Never-ignore rules

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

## Safe-to-ignore

- **oxlint:** `promise/prefer-await-to-then` (Promise.race, ky chaining).
- **eslint:** `no-await-in-loop`, `max-statements`, `max-depth`, `complexity` (sequential ops) · `no-unnecessary-condition` (narrowing) · `promise-function-async` (thenable returns) · `max-params` · `@next/next/no-img-element` (external images) · `react-hooks/refs`.
- **biome:** `style/noProcessEnv` (env files) · `performance/noAwaitInLoops` (sequential ops) · `nursery/noForIn` · `performance/noImgElement` · `suspicious/noExplicitAny` (generic boundaries).

## Playbook maintenance

- Merge each new lesson into the most relevant existing section immediately; correct rules in place, remove superseded guidance. Why: single source of truth, no append-only “recent lessons” buckets.

---

Same UI, fewest DOM nodes — every element earns its place. If deleting it breaks nothing (semantics, layout, behavior, required styling), it must not exist.

## MUST

- Keep a node ONLY if it provides one of: semantics/a11y (`ul/li`, `button`, `label`, `form`, `nav`, `section`, ARIA, focus); a layout constraint (own containing block / positioning / clip / scroll / stacking — `relative`, `overflow-*`, `sticky`, `z-*`, `min-w-0`); behavior (measurement ref, observer, portal, event boundary, virtualization); or component API (can’t pass props/classes to the real root after trying `as`/`asChild`/forwarding). Why: every node is render + memory cost.
- Spacing via parent `gap-*` (flex/grid) or `space-x/y-*`. Why: no wrapper for gaps.
- Separators via parent `divide-y`/`divide-x`. Why: no separator elements.
- Alignment via `flex`/`grid` on the existing parent. Why: no alignment wrapper.
- Visual (padding/bg/border/shadow/radius) on the element that owns the box. Why: no decoration wrapper.
- Group JSX with `<>...</>` fragment, not `<div>`. Why: zero DOM cost.
- Style mapped components by passing `className` to the item; uniform direct children via `*:` or `[&>tag]:`. Why: props first, selectors second — no repeat-class wrapper.

## NEVER

- Add a wrapper a `gap`/`space`/`divide`/`className`/`[&>...]:` could replace. Cost: dead node, render + read budget.

## Examples

| Good (selector pushdown)                           | Bad (repeated classes)                                      |
| -------------------------------------------------- | ----------------------------------------------------------- |
| `<div className='divide-y [&>p]:px-3 [&>p]:py-2'>` | `<div className='divide-y'>` with `px-3 py-2` on each `<p>` |

## Pitfall

- Selector tools: `*:` direct children · `[&>li]:py-2` targeted · `[&_a]:underline` descendant (sparingly) · `group`/`peer` on existing nodes → `group-hover:*`/`peer-focus:*` · `data-[state=open]:*`/`aria-expanded:*`/`disabled:*` · `first:`/`last:`/`odd:`/`even:`/`only:` structural.
- Review each node: can I delete it → delete; can `gap/space/divide` replace it → do it; can I pass `className` → do it; can `[&>...]:` remove repetition → do it.

---

React 19 + Next.js component conventions.

## MUST

- Server components by default — `layout.tsx`, `loading.tsx`, `error.tsx` are server. Why: minimal client bundle.
- `'use client'` ONLY when a component uses hooks/interactivity. Why: keep server-rendered by default.
- shadcn component over raw HTML — `Button` not `<button>`, `Table` not `<table>`, `Progress` not nested divs. Why: consistency + a11y.
- `use*` naming for hooks. Why: lint-enforced, rules-of-hooks detection.
- Stable array keys. Why: index keys corrupt reconciliation on reorder.
- Wrap `useSearchParams()` in `<Suspense>`. Why: else build/runtime bailout.

## NEVER

- IIFE in JSX — extract to a named component. Cost: re-creates on every render, unreadable.
- Array index as key. Cost: stale reconciliation on reorder/insert.
- `Date.now()` / `Math.random()` in render. Cost: hydration mismatch / nondeterminism.

---

Credential handling, env scoping, server/client boundary, mechanism-asserted invariants.

## MUST

- Route any credentialed client-side work through a server action / API route / Convex action reading the unprefixed var. Why: `NEXT_PUBLIC_*` is inlined into the client bundle, visible in page source.
- Read server-only vars via `process.env.X` only inside `'use server'`, `'use node'`, `convex/`, `backend/spacetimedb/`, or `app/api/*/route.ts`. Why: server boundary.
- Fail fast on a missing required var — validate via schema (`z.string().min(1)`, `z.url()`, NO `.default()`) or throw. Why: silent default = undebuggable wrong value.
- Absence-as-off is allowed ONLY as a documented intentional toggle (`if (env.SENTRY_DSN) initSentry(env.SENTRY_DSN)`) — test: can a user intentionally configure absence to mean off? yes = toggle (allowed), no = fallback (banned). Why: separates a real feature toggle from a silent wrong-value default.
- Bash `${VAR:?VAR is required}`; docker-compose `${VAR:?}`. Why: crash on absence, not fallback.
- Set every var explicitly in `.env` (sole source of truth), even conventional ones. Why: nothing implicit.
- Enforce auth/isolation/ownership by a mechanism the caller can’t bypass — Convex `v.*` validator + auth guard at the boundary, DB NOT NULL/CHECK/unique constraint, server-side challenge. Why: call-site checks get forgotten.
- Two independent enforcement points per isolation/security invariant. Why: defense in depth.
- A regression test flips the mechanism off and asserts the invariant fails. Why: if it passes mechanism-off, it was call-site-asserted.

## NEVER

- `NEXT_PUBLIC_*` for a credential — API keys, tokens, DB secrets, anything `*_SECRET`/`*_PASSWORD`/`*_PRIVATE_KEY`. Cost: shipped to browser.
- `process.env.X ?? 'fallback'` / `|| 'default'` on a config read. Cost: silent wrong-value behavior.
- Read server-only vars from a `'use client'` component. Cost: leaks to bundle or is undefined.
- Log PII unredacted. Cost: privacy + regulatory violation.

## Allowed `NEXT_PUBLIC_*`

- Public deploy URLs (`NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_SPACETIMEDB_URI`) where auth is via session token, not the URL.
- Feature flags / build-time constants.
- Public OAuth client IDs (paired with server-side PKCE / redirect-URI checks).

## Migration

- Found a `NEXT_PUBLIC_*` API key: (1) rename to drop the prefix (`NEXT_PUBLIC_TMDB_API_KEY` → `TMDB_KEY`); (2) move the call into a server action / Convex action; (3) client invokes the server action, never sees the key; (4) add a server-side test-mode stub (`isStdbTestMode()` / `isCvxTestMode()`) so playwright stays hermetic.

## Caught by

- PR env-var audit: no `NEXT_PUBLIC_*` name with key/secret/token/password/private; new client fetch goes through a server boundary; credential server actions short-circuit in test-mode; `.env.example` marks server-only vars without the prefix.

---

shadcn components used as-is, native look, semantic classes only.

## MUST

- Use shadcn components as-is. Why: no override drift.
- Semantic Tailwind colors only — `text-foreground`/`text-muted-foreground`/`text-destructive`, `bg-primary`/`bg-muted`/`bg-destructive`, `text-primary` for links. Why: theme-driven, dark-mode safe.
- `cn()` for conditional classes. Why: merge precedence + the only composition path.

## NEVER

- Hardcode hex / palette colors in `className` or `style` — `text-red-500`, `bg-blue-500`, `text-green-500`. Cost: bypasses theme.
- `fd-*` aliases (`bg-fd-muted`, `text-fd-muted-foreground`, `bg-fd-primary`). Cost: fumadocs internals; use the shadcn name.
- Template literal for conditional className. Cost: no merge precedence; use `cn()`.
- `cva` / bare `clsx` / bare `twMerge`. Cost: fragments the single `cn()` composition path.

## Examples

| Good                                | Bad                              |
| ----------------------------------- | -------------------------------- |
| `cn('base', cond && 'on')`          | `` `base ${cond ? 'on' : ''}` `` |
| `cn('base', v === 'a' ? 'x' : 'y')` | `clsx('base', ...)` / `cva(...)` |
| `bg-muted` `text-primary`           | `bg-fd-muted` `text-blue-500`    |

## Pitfall

- `global.css` aliases `--color-*` → `--color-fd-*` via `@theme inline`, so `bg-muted`/`text-primary`/`border-border` resolve to the same theme as `fd-*` — always use the shadcn name.
- fumadocs’ own UI (sidebar/search/TOC) keeps `fd-*` internally — that is library code, not yours.

---

Building + publishing library packages with tsdown.

## MUST

- Build/publish packages with `tsdown`. Why: standard ecosystem build.
- Emit ESM + declaration files. Why: consumers need types.
- `prepublishOnly` builds before publish. Why: never ship stale `dist/`.
- Export every type used in the public API. Why: DTS generation fails on unexported internal types leaking through re-exports.

## NEVER

- Bundle deps consumers should install themselves. Cost: duplicate/version-conflict in consumer tree.

---

TypeScript code style + formatting.

## MUST

- Arrow functions only. Why: one function form.
- All exports in a single block at end of file. Why: lint-enforced, scan-once.
- `.tsx` single component → `export default`; utilities/backend → named exports. Why: convention.
- ANY file with JSX uses `.tsx` — even a context provider `<Ctx value={...}>`. Why: biome parses `.ts` as non-JSX, misreads `<Foo>` as comparison/regex, fixer infinite-loops (90-min hang).
- `for` loops over `reduce()`/`forEach()`. Why: readability + perf.
- Exhaustive `switch` with `default: never`. Why: compile-time case coverage.
- Descriptive `catch (error)` state-var names (`chatError`, `formError`). Why: oxlint shadow rule.
- Short map callback names (`t`, `m`, `i`). Why: convention.
- Destructured object for 4+ args (max 3 positional). Why: call-site clarity.
- Co-locate components with their page; move to `~/components` only when reused. Why: locality.
- Explicit imports from exact file paths; no barrel `index.ts` in app code (library packages use barrels for public API). Why: avoids barrel cycle + bloat.
- Prefer existing libraries over new dependencies. Why: minimize surface.
- `node:` prefix for Node builtins (`import { join } from 'node:path'`). Why: explicit builtin.
- `interface` over `type` where possible; properties sorted alphabetically. Why: lint-enforced.
- `import type` for type-only imports. Why: erased at build.

## NEVER

- `function` declarations. Cost: violates arrow-only.
- Duplicate types. Cost: drift; single source of truth.
- `import as` aliases. Cost: rename the variable instead.
- Empty lines between statements. Cost: biome deletes them — wasted diff.
- Trailing comma single-line (keep it multi-line). Cost: format violation.

## Formatting

- Single quotes, no semicolons; imports sorted alphabetically by source.
