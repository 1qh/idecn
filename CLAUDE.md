If `README.md` exists at the repo root, read it first.

## Ecosystem

All projects with lintmax in deps are managed by pm4ai (`bunx pm4ai@latest`). The tool syncs configs, generates CLAUDE.md, enforces conventions, and runs maintenance.

Key repos:

- **pm4ai** — the management tool. Rules in `apps/docs/content/rules/*.mdx`. Checks in `packages/pm4ai/src/`.
- **lintmax** — max-strict lint/format orchestrator. All projects depend on it.
- **cnsync** — canonical source for `readonly/ui` (shadcn + ai-elements components).

For full documentation: `curl https://pm4ai.vercel.app/llms-full.txt`

## Managed Files

These files are auto-generated and synced by pm4ai. Never edit them directly:

- `CLAUDE.md` — generated from rules based on project dependencies
- `clean.sh` — universal cleanup script
- `up.sh` — universal maintenance cycle (clean + install + build + fix + check)
- `bunfig.toml` — bun configuration
- `.gitignore` — universal ignore patterns
- `readonly/ui/` — synced from cnsync

## Role Detection

Run `gh auth status` to determine your role:

- If you are the repo owner (`1qh`): you can modify pm4ai rules and checks directly in the pm4ai repo
- Otherwise: do not edit managed files, only use companion files

## Owner Workflow

- `bunx pm4ai@latest status` — check current project
- `bunx pm4ai@latest fix` — sync + maintain (requires clean git)
- `bunx pm4ai@latest fix --all` — all projects
- New universal rule → add `.mdx` to pm4ai `apps/docs/content/rules/` with `infer` frontmatter
- New check → add to pm4ai `packages/pm4ai/src/audit.ts` or `checks.ts`
- If you discover something during this session that should apply to all projects, note it for pm4ai

## Companion Files

Use these for project-specific content:

- `LEARNING.md` — lessons learned, gotchas, known issues
- `RULES.md` — project-specific rules that don’t apply to other projects
- `PROGRESS.md` — tracking ongoing work
- `PLAN.md` — planning and architecture decisions

## Health Check

Run `bunx pm4ai@latest status` to see issues in this project. Run `bunx pm4ai@latest fix` to sync and maintain.

Check states:

- `check: passed 5m ago (current)` — safe to proceed
- `check: passed 3h ago (before 2 commits)` — stale, run `bunx pm4ai@latest status` again and wait for refresh
- `check: failed 5m ago (current), 15 violations` — fix violations before proceeding
- `check: running...` — wait, do not edit files until complete
- `check: never run` — run `bunx pm4ai@latest fix` first

---

## Package Manager

- Only `bun` — yarn/npm/npx/pnpm forbidden
- `bun fix` must always pass
- Never `bun update` — it replaces `"latest"` with resolved versions
- Always `bun clean && bun i` to update deps
- All deps use `"latest"` tag — no pinned versions unless necessary
- For deps that must be pinned, pin major version only (e.g. `"eslint": "9"`)
- No lockfile committed (`bun.lock` in `.gitignore`)

## Bun APIs

- Always `import { X } from 'bun'` — never use `Bun.X` global (triggers `noUndeclaredVariables` in biome)
- `import { $, file, write, Glob, spawn } from 'bun'`

## Scripts

- `sh clean.sh` — nuke all artifacts (node_modules, lockfile, caches, dist, .next)
- `sh up.sh` — clean + install + fix + check (the universal maintenance cycle)
- Scripts: silent on success, verbose on failure
- Never use `git clean` — it deletes `.env` and uncommitted files. Use explicit `rm -rf`.

---

## Must NOT Do

- NEVER write comments (lint ignores allowed)
- NEVER touch `readonly/ui/` manually
- NEVER use `!` (non-null assertion), `any`, `as any`, `@ts-ignore`, `@ts-expect-error`
- NEVER duplicate types — single source of truth
- NEVER disable lint rules globally/per-directory — fix the code
- NEVER ignore written source code from linters — only auto-generated code (`_generated/`, `generated/`, `module_bindings/`, `readonly/ui/`)
- NEVER reduce lintmax strictness — if upstream removes rules, find replacements

## Type Safety & Single Source of Truth

Every piece of data flows through exactly one definition:

- Shared constants → define once, import everywhere. If a value appears in 2+ files, extract it.
- When adding new features, check existing utilities FIRST before writing inline logic.

## Code Consolidation Checklist

Before writing any new code, verify:

1. Does this function already exist? Check existing utilities first
2. Is this constant defined elsewhere? Check shared files
3. Am I adding a wrapper div? Check if parent `gap-*`, `space-*` can handle it
4. Am I adding inline styles? Only allowed for truly dynamic values. NEVER for colors or static properties.
5. Am I copy-pasting from another file? Extract to a shared utility/component

---

## Commits

- Commit frequently, push logical groups
- No AI tooling in commits
- Format: `type: description` (fix, feat, docs, chore, refactor, test)

---

## Lintmax

lintmax is our own max-strict lint/format orchestrator. We own it — read the source code to understand the pipeline, and feel free to suggest improvements that bring better strictness or better defaults.

### Ignore Syntax

| Linter | File-level                                           | Per-line                                         |
| ------ | ---------------------------------------------------- | ------------------------------------------------ |
| oxlint | `/* oxlint-disable rule-name */`                     | `// oxlint-disable-next-line rule-name`          |
| eslint | `/* eslint-disable rule-name */`                     | `// eslint-disable-next-line rule-name`          |
| biome  | `/** biome-ignore-all lint/category/rule: reason */` | `/** biome-ignore lint/category/rule: reason */` |

### Ignore Strategy

1. **Fix the code** — always first choice
2. **File-level disable** — when a file has many unavoidable violations of the same rule (sequential DB mutations, standard React patterns, external images)
3. **Per-line ignore** — isolated unavoidable violations
4. **Consolidate** — if file-level `biome-ignore-all` exists, remove redundant per-line `biome-ignore` for the same rule
5. NEVER 5+ per-line ignores for the same rule — use file-level

- File-level directives go at absolute file top, above any imports/code (including `'use client'`/`'use node'`).
- Per-line directives go on the line ABOVE the code, NEVER inline on the same line (triggers `no-inline-comments`).
- When 2+ linters flag the same line, use file-level for one and per-line for the other — don’t stack multiple per-line directives above one line.
- Remove duplicate directives; keep one canonical directive block.
- Use one top `eslint-disable` line per file; combine multiple rules with commas.

### Cross-linter Rules

- 2 linters with the same rule (biome `noAwaitInLoops` + oxlint `no-await-in-loop`) = double enforcement, NOT a conflict. Never disable one because the other covers it.
- To suppress a shared eslint/oxlint rule: suppress eslint’s version — oxlint auto-picks up eslint rules and is faster.
- oxlint `eslint/sort-keys` conflicts with perfectionist (ASCII vs natural sort) — disabled in lintmax.

### Never-ignore Rules

These rules exist to catch real bugs. Suppressing them is NEVER acceptable — fix the code instead:

- `@typescript-eslint/no-unsafe-*` (no-unsafe-assignment, no-unsafe-call, no-unsafe-member-access, no-unsafe-return, no-unsafe-argument) — use proper types, never suppress type safety
- `@typescript-eslint/no-explicit-any` — define the actual type
- `@ts-ignore`, `@ts-expect-error`, `@ts-nocheck` — fix the type error
- `@typescript-eslint/no-non-null-assertion` — handle the null case

If an agent suppresses any of these, the code must be rewritten to satisfy the rule.

### Safe-to-ignore Rules

**oxlint:** `promise/prefer-await-to-then` (Promise.race, ky chaining)

**eslint:** `no-await-in-loop`, `max-statements`, `max-depth`, `complexity` (sequential ops) · `@typescript-eslint/no-unnecessary-condition` (type narrowing) · `@typescript-eslint/promise-function-async` (thenable returns) · `@typescript-eslint/max-params` · `@next/next/no-img-element` (external images) · `react-hooks/refs`

**biome:** `style/noProcessEnv` (env files) · `performance/noAwaitInLoops` (sequential ops) · `nursery/noForIn` · `performance/noImgElement` · `suspicious/noExplicitAny` (generic boundaries)

## Playbook Maintenance

- Every new lesson must be merged into the most relevant existing section immediately; do NOT create append-only “recent lessons” buckets.
- Correct rules in place (single source of truth), then remove superseded guidance.

---

## Minimal DOM (React + Tailwind)

Same UI, fewest DOM nodes. Every element must earn its place. If you can delete it and nothing breaks (semantics, layout, behavior, required styling) → it shouldn’t exist.

A node is allowed only if it provides:

- **Semantics/a11y** — correct elements (`ul/li`, `button`, `label`, `form`, `nav`, `section`), ARIA patterns, focus behavior
- **Layout constraint** — needs its own containing block / positioning / clipping / scroll / stacking context (`relative`, `overflow-*`, `sticky`, `z-*`, `min-w-0`)
- **Behavior** — measurement refs, observers, portals, event boundary, virtualization
- **Component API** — can’t pass props/classes to the real root (and you tried `as`/`asChild`/prop forwarding)

Before adding wrappers:

- Spacing → parent `gap-*` (flex/grid) or `space-x/y-*`
- Separators → parent `divide-y / divide-x`
- Alignment → `flex`/`grid` on existing parent
- Visual (padding/bg/border/shadow/radius) → on the element that owns the box
- JSX grouping → `<>...</>` (Fragment), not `<div>`

Styling children — props first, selectors second:

- Mapped component → pass `className` to the item
- Uniform direct children → `*:` or `[&>tag]:` to avoid repeating classes

```tsx
// bad: repeated classes
<div className='divide-y'>
  <p className='px-3 py-2'>A</p>
  <p className='px-3 py-2'>B</p>
</div>
// good: selector pushdown
<div className='divide-y [&>p]:px-3 [&>p]:py-2'>
  <p>A</p>
  <p>B</p>
</div>
```

Tailwind selector tools:

- `*:` direct children · `[&>li]:py-2` targeted · `[&_a]:underline` descendant (sparingly)
- `group`/`peer` on existing nodes → `group-hover:*`, `peer-focus:*`
- `data-[state=open]:*`, `aria-expanded:*`, `disabled:*`
- `first:` `last:` `odd:` `even:` `only:` — structural variants

Review checklist: Can I delete this node? → delete. Can `gap/space/divide` replace it? → do it. Can I pass `className`? → do it. Can `[&>...]:` remove repetition? → do it.

---

## React 19 + Next.js

- Server components by default — layout.tsx, loading.tsx, error.tsx are server components
- `'use client'` only when needed — components with hooks must be client components
- No IIFEs in JSX — extract to a named component instead
- No raw HTML elements when shadcn has a component — use `Button` not `<button>`, `Table` not `<table>`, `Progress` not nested divs
- `use*` hook naming enforced
- Stable array keys — never use indices
- `<Suspense>` around `useSearchParams()`
- No `Date.now()` / `Math.random()` in render

---

## shadcn — Native Look, No Overrides

Use shadcn components as-is. No custom color overrides, no inline style hacks.

### Colors

Use semantic Tailwind classes ONLY. Never hardcode hex colors in className or style.

- `text-foreground` / `text-muted-foreground` / `text-destructive` — NEVER `text-red-500`, `text-green-500`
- `bg-primary` / `bg-muted` / `bg-destructive` — NEVER `bg-blue-500`, `bg-red-500`
- `text-primary` for interactive links — NEVER `text-blue-500`

### Conditional classNames

ALWAYS use `cn()` for conditional classes:

```tsx
className={cn('base-classes', condition && 'conditional-class')}
className={cn('base-classes', variant === 'a' ? 'class-a' : 'class-b')}
```

NEVER use template literals for conditional classNames.

---

## Library Publishing

- Use `tsdown` for building and publishing packages
- ESM format with declaration files
- `prepublishOnly` script to build before publish
- Never bundle dependencies that consumers should install themselves
- Export all types used in public API — DTS generation fails on unexported internal types leaking through re-exports

---

## Code Style

- Only arrow functions — no `function` declarations
- All exports at end of file
- `.tsx` with single component → `export default`; utilities/backend → named exports
- `for` loops instead of `reduce()` or `forEach()`
- Exhaustive `switch` with `default: never`
- `catch (error)` enforced by oxlint — name state vars descriptively to avoid shadow (`chatError`, `formError`)
- Short map callback names: `t`, `m`, `i`
- Max 3 positional args — use destructured object for 4+
- Co-locate components with their page; only move to `~/components` when reused
- Explicit imports from exact file paths — no barrel `index.ts` in app code (library packages use barrels for their public API)
- Prefer existing libraries over new dependencies

## Formatting

- Single quotes, no semicolons
- No empty lines between statements
- `node:` prefix for Node.js builtins (`import { join } from 'node:path'`)
- Imports sorted alphabetically by source
- `interface` over `type` when possible
- Object/interface properties sorted alphabetically
- No `import as` aliases — rename variables to avoid conflicts
- No trailing commas in single-line, trailing commas in multi-line
- `import type` for type-only imports
