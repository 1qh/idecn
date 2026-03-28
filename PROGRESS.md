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

## Phase 3: Breadcrumbs, shadcn leverage, preview mode, polish

### Leverage shadcn

- [ ] `breadcrumb` — file path above editor
- [ ] `tooltip` — collapse/expand button, status bar items
- [ ] `kbd` — keyboard shortcuts in context menu items
- [ ] `skeleton` — file loading state
- [ ] `sonner` — toast on copy path
- [ ] `popover` — breadcrumb segment dropdown (click to see siblings)

### New components

- [ ] Tree context menu (copy path, copy relative path)

### Logic

- [ ] Single-click preview mode (italic tab, replaced by next click)
- [ ] Go back / go forward `Alt+Left` / `Alt+Right` (tab history)
- [ ] Tree keyboard navigation (arrow keys, enter to open)

### Fixes

- [ ] Virtual file auto-scroll to bottom (logs)
- [ ] Memory leak from Monaco models not disposed on tab close

---

## Phase 2: Context menus, status bar, quick open ✓

(completed — see git log)

---

## Phase 1: Styling + Monaco defaults + quick fixes ✓

(completed — see git log)

---

## Phase 2: Context menus, status bar, quick open

### Adopt deps

- [ ] `cmdk` — command palette / quick file open
- [ ] `jotai` — atomic state for cross-component communication

### New components

- [ ] Quick file open `Mod+P` (flatten tree → fuzzy search → open)
- [ ] Status bar at bottom (line:col, language, file path)
- [ ] Tab context menu (close, close others, close to right, close all, copy path)
- [ ] Tree context menu (copy path, copy relative path)

### Style

- [ ] Status bar styling (thin bar, muted colors, monospace for line:col)
- [ ] Context menu styling (match VS Code look)
- [ ] Quick open dialog styling (centered overlay, input + results list)

### Logic

- [ ] Status bar updates on cursor move / tab switch
- [ ] Quick open flattens tree into searchable list
- [ ] Tab context menu actions wired to dockview API
- [ ] Copy path to clipboard

### Consumer props

- [ ] `statusBar` — show/hide (default on)

### Fixes from Phase 1 deferred

- [ ] Virtual file auto-scroll to bottom (logs)
- [ ] Memory leak from Monaco models not disposed on tab close
