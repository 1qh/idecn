# Progress

**Philosophy:** Great defaults out of the box. Everything on by default, consumer opts out if they want. Every change must be visible in the demo instantly.

**Workflow:** Copy a batch from IDEA.md → work through it → user reviews demo → confirm or iterate → mark done → next batch.

---

## Phase 1: Styling + Monaco defaults + quick fixes

### Style only

- [ ] Active tab underline/border accent
- [ ] Tab separator lines
- [ ] Compact style when many tabs open (shrink padding)
- [ ] Overflow scrollbar styling for tabs
- [ ] Indent guides (vertical lines connecting nested tree items)
- [ ] Section header ("EXPLORER") at top of tree
- [ ] Selection highlight in tree matching active tab
- [ ] Tree horizontal scroll when names overflow
- [ ] Tree icon animation on expand/collapse
- [ ] Expand/collapse animation refinement
- [ ] Editor watermark (faded text when empty)
- [ ] Read-only badge overlay on editor
- [ ] Sidebar resize handle visual grip
- [ ] CSS custom properties for all dimensions (tab height, icon size, tree indent)
- [ ] Custom scrollbar colors (match theme)
- [ ] Reduced motion support (`prefers-reduced-motion`)

### Monaco defaults (turn on best options)

- [ ] Sticky scroll (`stickyScroll.enabled`)
- [ ] Bracket pair colorization (`bracketPairColorization.enabled`)
- [ ] Smooth scrolling (`smoothScrolling`)
- [ ] Cursor smooth caret animation (`cursorSmoothCaretAnimation: 'on'`)
- [ ] Cursor blinking style (`cursorBlinking: 'smooth'`)
- [ ] Font ligatures (`fontLigatures`)
- [ ] Smooth typing animation (`smoothScrolling` + typing)
- [ ] Code folding controls in gutter (verify default)
- [ ] Find in file `Ctrl+F` (verify default)
- [ ] Find and replace `Ctrl+H` (verify default)
- [ ] Go to line `Ctrl+G` (verify default)
- [ ] Column selection mode `Alt+Shift+drag` (verify default)
- [ ] Inline color picker for CSS (verify default)
- [ ] Auto-closing brackets/quotes (verify default)
- [ ] Render whitespace to `selection` by default
- [ ] Minimap highlights for search (verify default)

### Adopt dep

- [ ] `@tanstack/react-hotkeys` — replace manual keydown listeners, scoped to Workspace, Mod key cross-platform, input-aware

### Quick logic

- [ ] `Mod+B` toggle sidebar (migrate from manual listener)
- [ ] `Mod+W` close active tab
- [ ] Middle-click tab to close
- [ ] `Mod+Tab` cycle through open tabs
- [ ] `Alt+Z` toggle word wrap
- [ ] `Mod+\` split editor
- [ ] Tree selection syncs with active tab (click tab highlights tree item)
- [ ] Tab label deduplication (show parent folder when filenames collide)
- [ ] Collapse all folders button in sidebar header
- [ ] Close all tabs action
- [ ] Font size zoom `Mod+=` / `Mod+-`
- [ ] Dark/light theme auto-detection without next-themes dependency

### Quick fixes

- [ ] Virtual file content not auto-scrolling to bottom (for logs)
- [ ] Sidebar icon matching tab icon for virtual files (verify fix)
- [ ] Theme flicker on initial load (FOUC)
- [ ] Monaco editor not resizing on panel resize
- [ ] Shiki highlighting not applied on first render (race condition)
- [ ] Dockview watermark panel showing when all tabs closed
- [ ] Tree not updating when prop reference changes but content same
- [ ] Memory leak from Monaco models not disposed on tab close

### Consumer props (expose with good defaults)

- [ ] `wordWrap` — default off, `Alt+Z` toggles
- [ ] `stickyScroll` — default on
- [ ] `readOnly` — default true (current), expose as prop
- [ ] `emptyState` — custom component when no files open
- [ ] `onTabChange` — callback when active tab changes
- [ ] `shortcuts` — enable/disable keyboard shortcuts
- [ ] `breadcrumbs` — default off (add later), expose prop now
