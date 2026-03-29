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
- Memory overflow avoidance — cap arrays, use refs for high-frequency state, no unbounded growth

---

## Phase 4 — Tree keyboard nav, tab history, layout, viewer polish

### Tree

- [ ] Keyboard navigation (arrow keys to move, enter to open/toggle folders/files)
- [ ] Tree search/filter (type to filter visible items)

### Tabs

- [ ] Undo close tab `Ctrl+Shift+T` (closed tabs stack)
- [ ] Tab history back/forward `Alt+Left` / `Alt+Right`
- [ ] Remember scroll position per file when switching tabs
- [ ] Pinned tabs (double-click to pin, distinct style, always leftmost, no close button)
- [ ] Open/close tab transitions
- [ ] Tab scroll into view when activated programmatically

### Navigation

- [ ] Breadcrumb dropdown (click segment shows siblings in popover)
- [ ] Command palette `Ctrl+Shift+P` (all actions searchable, not just files)
- [ ] Go back / go forward `Alt+Left` / `Alt+Right`

### Panels

- [ ] Sidebar accordion sections (explorer, search, outline in one sidebar)
- [ ] Activity bar (leftmost icon strip — files, search)
- [ ] Notification toasts via shadcn sonner (copy path success, errors)

### Performance

- [ ] Lazy Monaco instantiation (only load when tab focused)
- [ ] Code splitting for shiki languages (load on demand)
- [ ] Debounce virtual file content updates

### State

- [ ] Layout persistence (open tabs, sidebar width) via localStorage
- [ ] Recently opened files list

---

## Phase 3 — Breadcrumbs, shadcn leverage, preview mode, polish (completed)

Breadcrumbs, skeleton loading, preview mode, tree context menu, virtual file auto-scroll, expandExclude prop, dark mode auto-detection via MutationObserver.

## Phase 2 — Context menus, status bar, quick open (completed)

Quick file open (Cmd+P), status bar, tab context menu, jotai atoms, cmdk/CommandDialog, shadcn ContextMenu.

## Phase 1 — Styling, Monaco defaults, keyboard shortcuts (completed)

Active tab styling, indent guides, watermark, reduced motion, scrollbars, sticky scroll, bracket colorization, smooth scrolling, cursor animation, font ligatures, @tanstack/react-hotkeys, all keyboard shortcuts, tree-tab sync, tab label dedup, collapse/expand toggle, editorOptions/onTabChange/shortcuts/activityLog props.
