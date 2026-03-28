# Progress

**Philosophy:** Great defaults out of the box. One way to customize each thing. Maximum type safety. Minimal DOM. Dark mode ready. Consolidated logic.

**Workflow:** Copy a batch from IDEA.md → work through it → user reviews demo → confirm or iterate → mark done → next batch.

**Review checklist (every phase):**

- Great defaults — everything works out of the box
- No overlapping options — one way to customize each thing
- Maximum type safety — no `as const`, no `as any`, no `@ts-ignore`
- Minimal DOM — every element earns its place
- Dark mode ready — all colors use CSS variables
- Consolidated logic — no duplicate code paths
- Use shadcn components from src/ui/ — never hand-roll UI that shadcn already provides
- Never style what shadcn already styles — no manual icon sizing, spacing, or colors on shadcn primitives
- Read shadcn component source before using — understand DOM structure and usage patterns
- Every new interaction must have activityLog — exhaustive verbose logging for all features

---

## Phase 3 — Breadcrumbs, shadcn leverage, preview mode, polish (completed)

Breadcrumbs, skeleton loading, preview mode, tree context menu, virtual file auto-scroll, expandExclude prop, dark mode auto-detection via MutationObserver.

## Phase 2 — Context menus, status bar, quick open (completed)

Quick file open (Cmd+P), status bar, tab context menu, jotai atoms, cmdk/CommandDialog, shadcn ContextMenu.

## Phase 1 — Styling, Monaco defaults, keyboard shortcuts (completed)

Active tab styling, indent guides, watermark, reduced motion, scrollbars, sticky scroll, bracket colorization, smooth scrolling, cursor animation, font ligatures, @tanstack/react-hotkeys, all keyboard shortcuts, tree-tab sync, tab label dedup, collapse/expand toggle, editorOptions/onTabChange/shortcuts/activityLog props.
