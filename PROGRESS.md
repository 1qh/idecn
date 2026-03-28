# Progress

**Philosophy:** Great defaults out of the box. Everything on by default, consumer opts out if they want. One way to customize each thing — no overlapping APIs. Every change must be visible in the demo instantly.

**Workflow:** Copy a batch from IDEA.md → work through it → user reviews demo → confirm or iterate → mark done → next batch.

---

## Phase 1: Styling + Monaco defaults + quick fixes ✓

### Done

- [x] Active tab 1px bottom border accent
- [x] Tab separator lines
- [x] Indent guides (absolute positioned vertical lines)
- [x] Section header ("EXPLORER") with collapse/expand all toggle
- [x] Selection highlight in tree matching active tab
- [x] Watermark when no files open
- [x] Reduced motion support
- [x] Tabs overflow thin scrollbar + tree custom scrollbar
- [x] Sticky scroll, bracket colorization, smooth scrolling, cursor animation, font ligatures
- [x] All Monaco built-ins verified (find, replace, go-to-line, color picker, code folding, auto-close brackets)
- [x] `@tanstack/react-hotkeys` adopted
- [x] Shortcuts: Mod+B sidebar, Alt+W close tab, Alt+E cycle tabs, Alt+Z word wrap, Mod+\ split, Mod+=/- zoom, Mod+0 reset zoom, Mod+Shift+W close all
- [x] Middle-click tab to close
- [x] Tree-tab sync (click tab highlights tree item)
- [x] Tab label deduplication (parent folder shown when names collide)
- [x] `editorOptions` single prop for all Monaco customization
- [x] `onTabChange` callback
- [x] `shortcuts` enable/disable prop

### Deferred

- Compact tab style when many tabs — needs more tabs to test
- Read-only badge, cursor blinking, render whitespace — editor mode features
- CSS custom properties for dimensions — scope too broad
- Virtual file auto-scroll to bottom — needs editor scroll API
- Memory leak from Monaco models — needs investigation
- `emptyState` prop — removed to keep API small
- `breadcrumbs` — Phase 2
