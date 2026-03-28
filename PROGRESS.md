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
