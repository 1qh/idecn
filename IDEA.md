# Ideas

Effort: `css` `monaco` `dep` `component` `logic` `prop` `fix` `perf` `test` `doc`

---

# Topics (what the user sees)

## Tabs

- Reordering visual feedback `css`
- Compact style when many tabs open `css`
- Open/close transitions `css`
- Tab sticky scroll (tab bar stays visible when editor scrolls) `css`
- Close all tabs `logic`
- Tab scroll into view when activated programmatically `logic`
- Undo close tab `Ctrl+Shift+T` `logic`
- Maximize tab (double-click to fill workspace) `logic`
- Remember scroll position per file `logic`
- Tab history back/forward `logic`
- Drag tab out to create new split `logic`
- Dirty/modified dot indicator `css` `logic`
- Tab progress indicator (loading spinner while file fetches) `css` `logic`
- Colorized tab border by file type `css` `logic`
- Pinned tabs `css` `logic` `prop`
- Tab groups/colors per folder `css` `logic` `prop`
- Tab width min/max constraints `css` `prop`
- Tab icon-only mode (no label, just icon) `css` `prop`
- Tab strip position (top/bottom) `css` `prop`
- Wrap tabs to multiple rows when overflowing `css` `prop`
- Tab badge (notification count, error count) `css` `logic` `prop`
- Tab preview on hover (show file content thumbnail) `component` `logic`
- Tab close confirmation for dirty files `logic` `component`
- Right-click tab to change language mode `component` `logic`
- Tab tooltip showing full file path `css` `dep`
- Tab drag to external window (pop out) `logic`

## Tree

- Expand/collapse animation refinement `css`
- Symlink indicator `css`
- Tree horizontal scroll when names overflow `css`
- Tree icon animation on expand/collapse `css`
- Tree file count per folder `css` `logic`
- Tree search highlight (highlight matching chars in file names) `css` `logic`
- Keyboard navigation (arrow keys, enter) `logic`
- Tree drag to editor (open file) `logic`
- Drag-and-drop reorder files/folders `logic`
- Multi-select (shift+click, ctrl+click) `logic`
- Tree cut/copy/paste files `logic`
- Tree rename on slow double-click (like OS file rename) `logic`
- Tree drag to outside (export file path to other app) `logic`
- Tree color-coded by git status (green new, yellow modified, red deleted) `css` `logic` `prop`
- Tree item decorations (badges, status icons, git modified) `css` `logic` `prop`
- File nesting rules (group `*.test.ts` under `*.ts`) `logic` `prop`
- `.gitignore`-aware filtering `logic` `prop`
- File watchers (auto-update on change) `logic` `prop`
- Custom tree item renderers `prop`
- Compact folders toggle (consumer disables auto-merging) `prop`
- Tree reveal file (scroll to and highlight a given path) via ref `logic` `prop`
- Tree item lazy loading (expand fetches children on demand) `logic` `prop`
- Tree sort options (name, type, modified date) `logic` `prop`
- Tree item secondary text (file size, last modified, git status) `css` `prop`
- Collapse all folders button `component` `logic`
- Filter/search within tree (type to filter) `component` `logic`
- Inline file/folder creation (type name in tree) `component` `logic`
- Tree sticky parent headers (pinned folder name while scrolling deep) `css` `logic`
- Tree breadcrumb trail at top when scrolled deep `component` `logic`
- Tree item actions on hover (delete, rename buttons) `component` `css`
- Tree file preview panel (sidebar split showing selected file info) `component`
- Tree empty state (no files message) `component` `prop`
- Tree error/warning count badges per folder (aggregate) `css` `logic` `prop`
- Hover tooltip (full path) `dep`
- Virtualized tree for large repos `perf` `dep`
- Tree file size display `css` `logic`
- Tree last modified timestamp `css` `logic`

## Editor

- Cursor blinking style `monaco`
- Linked editing (HTML tags) `monaco`
- Find in file `Ctrl+F` `monaco`
- Find and replace `Ctrl+H` `monaco`
- Go to line `Ctrl+G` `monaco`
- Go to symbol `Ctrl+Shift+O` `monaco`
- Go to bracket `Ctrl+Shift+\` `monaco`
- Minimap highlights for search `monaco`
- Minimap highlights for errors `monaco`
- Column selection mode `Alt+Shift+drag` `monaco`
- Snippet support `monaco`
- Code folding controls in gutter `monaco`
- Inline color picker for CSS `monaco`
- Parameter hints (function signature popup) `monaco`
- Wrap long lines indicator `monaco`
- Smooth typing animation `monaco`
- Smart select (expand selection to enclosing scope) `monaco`
- Copy line up/down `Alt+Shift+Up/Down` `monaco`
- Move line up/down `Alt+Up/Down` `monaco`
- Select all occurrences `Ctrl+Shift+L` `monaco`
- Expand/shrink selection `Shift+Alt+Right/Left` `monaco`
- Toggle block comment `Ctrl+Shift+/` `monaco`
- Sticky scroll scope highlighting `monaco`
- Read-only badge overlay on editor `css`
- Render whitespace `monaco` `prop`
- Line numbers toggle `monaco` `prop`
- Minimap toggle `monaco` `prop`
- Minimap position toggle (left/right) `monaco` `prop`
- Viewport-aware line numbers (relative) `monaco` `prop`
- Auto-closing brackets/quotes toggle `monaco` `prop`
- Auto-indent toggle `monaco` `prop`
- Ruler lines at configurable columns (80, 120) `monaco` `prop`
- Indent size toggle (2/4 spaces, tabs) `monaco` `prop`
- Semantic token colors `monaco` `prop`
- Word wrap + `Alt+Z` toggle `monaco` `logic` `prop`
- Inlay hints (TypeScript type annotations inline) `monaco` `logic`
- Diff decorations in gutter `monaco` `logic`
- Peek references (inline list of usages) `monaco` `logic`
- Code lens (inline actionable annotations) `monaco` `logic` `prop`
- Ghost text (AI completions, grayed preview) `monaco` `logic` `prop`
- Line decorations API (consumer highlights lines) `logic` `prop`
- Gutter icons API (breakpoints, bookmarks) `logic` `prop`
- Hover info provider (types, docs) `logic` `prop`
- Split editor `Ctrl+\` `logic`
- Duplicate selection `logic`
- Transpose characters/words `logic`
- Remove duplicate lines `logic`
- Trim whitespace command `logic`
- Transform to uppercase/lowercase `logic`
- Sort lines ascending/descending `logic`
- Join lines `logic`
- Editor scroll sync between split views `logic`
- Editor group layout (2x1, 1x2, 2x2 presets) `logic` `prop`
- Encoding indicator + change encoding `component` `logic` `prop`
- End-of-line indicator (LF/CRLF) + toggle `component` `logic` `prop`
- Multiple cursors awareness in status bar `component` `logic`
- Selection count in status bar `component` `logic`
- Character count in status bar `component` `logic`
- Word count in status bar `component` `logic`
- File size in status bar `component` `logic`
- Tab size indicator in status bar `component` `logic`
- Language mode picker in status bar `component` `logic` `prop`
- Compare two files side by side `logic` `component`
- Emmet support `monaco` `dep`
- Error lens (inline error messages) `monaco` `logic`
- Code actions (quick fix lightbulb) `monaco` `logic`
- Rename symbol `F2` `monaco` `logic`

## Navigation

- Go back / go forward `Alt+Left` / `Alt+Right` `logic`
- Navigate to error `F8` / `Shift+F8` `logic`
- Command palette `Ctrl+Shift+P` `dep` `component` `logic`
- Breadcrumb dropdown (click segment shows siblings) `component` `logic`
- Outline view (symbols in file) `component` `logic`
- Recently opened files `Ctrl+R` `component` `logic`
- Go to file by path (type full path) `component` `logic`
- Symbol search across files `Ctrl+T` `component` `logic`
- Peek file on hover in quick open `component` `logic`
- Keyboard shortcut cheatsheet overlay `component`
- Bookmarks (mark lines, jump between) `logic` `component` `prop`
- Sticky file tabs (consumer marks certain files always visible) `logic` `prop`
- Multi-root workspaces (multiple root folders in one tree) `logic` `prop`
- Activity bar (leftmost icon strip) `component` `prop`

## Panels

- Zen mode (hide everything except editor) `logic` `prop`
- Focus mode (dim everything except current editor) `css` `logic`
- Panel maximize/minimize toggle `logic`
- Draggable panel borders (resize areas) `logic`
- Empty state (welcome when no files open) `component` `prop`
- Panel area below editor (terminal, output) `component` `prop`
- Secondary sidebar (right side) `component` `prop`
- Problems panel (errors/warnings list) `component` `logic` `prop`
- Output panel (consumer pushes log lines) `component` `prop`
- Notification toasts (save success, error) `component` `prop`
- Minimap panel (bird’s eye of all open files) `component`
- Sticky terminal (stays visible across tab switches) `logic` `prop`
- Title bar (workspace name, window controls) `component` `prop`
- Sidebar accordion sections (explorer, search, outline in one sidebar) `component` `logic`
- Panel toggle buttons in status bar `component` `logic`
- Sidebar badge counts `css` `logic`
- Welcome tab with recent files and shortcuts `component` `prop`
- Settings editor (visual settings UI) `component` `logic`
- Floating editor windows (detach tab to floating overlay) `component` `logic`
- Side-by-side preview (editor + live preview) `component` `logic`

## Search

- Regex search support `logic`
- Search history `logic`
- Search in selection `logic`
- Search result highlighting in minimap `monaco` `logic`
- Search match case / whole word toggles `logic` `component`
- Search scope (current file, open files, all files) `logic` `component`
- Search results count badge `css` `logic`
- Find across files (global search panel) `component` `logic`
- Search and replace across files `component` `logic`
- Search result grouping by file `component`
- Search result click to navigate `logic`
- Preserve search on panel close/reopen `logic`
- Search include/exclude file patterns `logic` `component`
- Replace preview (highlight what changes before confirming) `component` `logic`
- Search in tree (filter tree by search query) `component` `logic`
- Saved searches (bookmarked queries) `logic` `component`

## File operations

- Copy file path `logic`
- Copy relative path `logic`
- Copy file content `logic`
- Drag file from tree to editor to insert path `logic`
- Drag-and-drop files from OS into tree `logic`
- Paste image as file `logic`
- Auto-detect language from shebang `logic`
- Detect file encoding (UTF-8, UTF-16, Latin-1) `logic`
- Detect line endings (LF vs CRLF) `logic`
- Binary file detection (hex view or message) `logic` `component`
- File size warning before opening large files `logic` `component`
- File permissions indicator (read-only badge) `css` `logic`
- Syntax error indicator in tab icon `css` `logic`
- File association override (`.conf` as ini) `logic` `prop`
- Recently deleted files recovery `logic` `component`
- Paste special (as JSON string, as import statement) `logic`

---

# Features (multi-topic goals)

## Editor mode

- `readOnly` as consumer choice (default off) `prop`
- `onSaveFile` + `Ctrl+S` `logic` `prop`
- Save all `Ctrl+Shift+S` `logic`
- Revert file (discard unsaved changes) `logic`
- Dirty state tracking per file `logic` `css`
- Multi-cursor editing `monaco`
- Auto-save (debounced, configurable interval) `logic` `prop`
- Format on save (consumer provides formatter) `logic` `prop`
- Format on paste `logic` `prop`
- Trim trailing whitespace on save `logic` `prop`
- Insert final newline on save `logic` `prop`
- Encoding conversion on save `logic` `prop`
- `onCreateFile` / `onCreateFolder` `logic` `prop` `component`
- `onDeleteFile` with confirmation `logic` `prop` `component`
- `onRenameFile` with inline tree editing `logic` `prop` `component`
- Save confirmation on tab close / page leave `logic` `component`
- Conflict detection (file changed externally) `logic` `component`
- File template on create (default content per extension) `logic` `prop`
- File move (drag in tree to new folder) `logic`
- File duplicate `logic`
- Save diff (show changes before saving) `component` `logic`
- Compare with saved (diff edits vs disk) `component` `logic`
- Partial save (save selected lines only) `logic`
- Hot exit (restore unsaved after browser close) `logic`
- Autosave indicator in status bar `component` `css`
- Collaborative editing lock (lock file while editing) `logic` `prop`
- File history timeline (consumer provides version list) `component` `logic` `prop`

## Collaboration

- Follow mode (auto-scroll to another user’s view) `logic`
- Selection sharing `dep` `logic`
- Cursor presence `dep` `logic` `component`
- User avatar on cursor `css` `component`
- CRDT integration (yjs/automerge) `dep` `logic`
- Presence indicator in tree (who has file open) `css` `logic`
- Shared terminal session `dep` `logic`
- Comments/annotations on code lines `component` `logic` `prop`
- Live share URL (generate link, others join) `logic`
- Conflict resolution UI (accept theirs/mine/both) `component` `logic`
- Awareness sidebar (list of connected users) `component`
- Chat panel (text chat between collaborators) `component` `dep`
- Version history replay (playback edits) `component` `logic`
- Blame annotations (who wrote each line) `logic` `prop`
- Conflict-free merge editor (3-way merge UI) `component` `logic`

## Integration

- Diff editor (Monaco diff view) `component` `logic` `prop`
- Image/PDF preview in tabs `component` `logic`
- SVG preview `component`
- Font preview `component`
- Markdown preview pane `component` `dep`
- Terminal panel `component` `dep`
- Hex editor for binary files `component` `dep`
- Git diff gutter indicators `logic` `prop`
- Go to definition / peek definition (LSP) `logic` `prop`
- LSP client (language server over WebSocket) `dep` `logic` `prop`
- Copilot/AI inline completions `logic` `prop`
- Linting markers in editor + problems panel `logic` `prop`
- Source control panel (staged, unstaged, diff) `component` `logic`
- Embedded browser preview (HTML/web files) `component`
- JSON schema validation `monaco` `dep`
- YAML schema validation `monaco` `dep`
- Table editor for CSV/TSV `component` `dep`
- Mermaid diagram preview `component` `dep`
- PlantUML diagram preview `component` `dep`
- GraphQL schema explorer `component` `dep`
- OpenAPI/Swagger preview `component` `dep`
- Regex tester panel `component`
- JSON path navigator (click to copy `data.users[0].name`) `logic` `component`
- YAML/JSON toggle (convert between formats) `logic`
- Color palette from file (extract CSS colors) `logic` `component`
- Import map visualization (dependency graph) `component` `logic`
- File dependency graph (who imports this file) `component` `logic`
- Code review panel (inline comments, approve/reject) `component` `logic` `prop`
- Notebook/cell-based editor (Jupyter-like) `component` `logic`
- Database viewer panel `component`
- API client panel (REST/GraphQL tester) `component`
- Log viewer with filtering and search `component` `logic`
- Environment variables editor `component` `logic`
- Task runner panel (run/stop/restart tasks) `component` `logic` `prop`
- Build output panel (streaming logs) `component` `prop`
- Debug panel (breakpoints, call stack, variables) `component` `logic` `prop`
- Test runner panel (test tree, pass/fail) `component` `logic` `prop`
- Timeline panel (file history, git log) `component` `logic` `prop`
- Snippet marketplace (browse/install snippets) `component` `logic`
- Extension marketplace (browse/install plugins) `component` `logic`
- Code tour (guided walkthrough, step by step) `component` `logic` `prop`

## Extensibility

- Custom panel types `prop`
- Action contributions (toolbar/status bar buttons) `prop`
- Plugin API (custom sidebar views) `logic` `prop`
- Custom language support (TextMate grammars) `logic` `prop`
- Snippet registry (consumer registers per language) `logic` `prop`
- Status bar item API (consumer adds custom items) `prop`
- Panel serialization (consumer saves/restores panel state) `logic` `prop`
- Tree provider API (consumer provides data lazily) `logic` `prop`
- Decoration API (consumer adds markers, highlights anywhere) `logic` `prop`
- Command registration (consumer registers actions by ID) `logic` `prop`
- Keybinding customization (consumer remaps shortcuts) `logic` `prop`
- Webview panels (arbitrary HTML in tab) `component` `prop`
- Settings UI (auto-generated from prop schema) `component` `logic`
- Sandboxed execution (run code in iframe/worker) `logic`
- Content security policy support (nonce for styles) `logic` `prop`
- Shadow DOM support (embed inside shadow root) `logic`
- iframe embedding mode (postMessage API) `logic` `prop`

## State management

- Sidebar width persistence `logic` `fix`
- Editor view state persistence (cursor, folds, scroll per file) `logic`
- Last active tab persistence `logic`
- Pinned files persistence (survive page reload) `logic`
- Scroll position persistence per file across reloads `logic`
- Fold state persistence per file `logic`
- Layout persistence (open tabs, sidebar width, splits) `logic` `prop`
- Recently opened files list `logic` `component`
- Workspace sessions (save/restore) `logic` `prop`
- Workspace-scoped settings (per-project editor options) `logic` `prop`
- Working sets (named groups of open files) `logic` `component` `prop`

---

# Cross-cutting (applies everywhere)

## Theming

- CSS custom properties for all dimensions `css`
- High contrast theme `css`
- Custom scrollbar colors `css` `prop`
- Product icon theme (UI icons separate from file icons) `css` `prop`
- Transparent/frosted glass panels `css` `prop`
- Custom tab bar background `css` `prop`
- Custom activity bar colors `css` `prop`
- Color-blind friendly diff colors `css` `prop`
- Consumer-defined Monaco themes `prop`
- Custom icon packs `prop`
- Custom font loading `prop`
- Icon theme toggle (material, vs-seti) `logic` `prop`
- Theme preview (live preview before applying) `logic` `component`
- Export theme as JSON `logic`
- Import VS Code theme JSON `logic`
- Syntax color preview panel `component`

## Accessibility

- ARIA labels on tree, tabs, panels `css`
- Touch-friendly tree `css`
- Skip-to-content links `css`
- Screen reader announcements `logic`
- Focus trap in dialogs `logic`
- Keyboard-only usable `logic`
- Swipe to close tabs `logic`
- Virtual keyboard awareness `logic`
- Responsive layout (sidebar auto-hides) `css` `logic`
- Mobile context menus (bottom sheet) `component`
- Voice control integration `dep` `logic`
- Dyslexia-friendly font option `prop`
- Workspace trust (prompt before executing untrusted code) `logic` `component`
- i18n (localized UI labels) `logic` `prop`
- Right-to-left (RTL) language support `css` `logic`
- Deep linking (URL encodes file + line + column) `logic` `prop`
- Screenshot/export selection as image `logic` `component`
- Print file / export as PDF `logic`
- Presentation mode (large font, hidden UI) `css` `logic` `prop`
- Zen writing mode (centered single-column) `css` `logic`

## Consumer props

- `emptyState` — custom component when no files open `prop`
- `readOnly` — per-file or global `prop`
- `wordWrap` — default on/off `prop`
- `stickyScroll` — default on/off `prop`
- `zenMode` — start in zen mode `prop`
- `tabContextMenu` — custom menu items `prop`
- `onChange` per-file callback `prop`
- Controlled mode (consumer manages all file content) `prop`
- Programmatic theme switch `prop`
- File content transform before display `prop`
- Custom tab renderer `prop`
- Workspace event bus (subscribe to all events) `logic` `prop`
- Error boundary per panel `logic`
- Telemetry hooks (consumer tracks usage) `logic` `prop`
- Crash recovery (restore state after JS error) `logic`

---

# Engineering (how we build)

## Performance

- Lazy Monaco instantiation `perf`
- Debounce virtual file content updates `perf`
- Tree memo optimization `perf`
- Code splitting for shiki languages `perf`
- Icon manifest tree-shake `perf`
- Web worker for syntax highlighting `perf`
- Intersection observer for off-screen tree nodes `perf`
- Service worker for offline Monaco assets `perf`
- Bundle analyzer integration `perf`
- SharedArrayBuffer for Monaco workers `perf`
- IndexedDB cache for file content `perf`
- Incremental tree diffing `perf`
- Off-screen canvas for minimap `perf`
- Preload adjacent files (prefetch likely-to-open) `perf`
- WASM-based language parsers (tree-sitter) `perf` `dep`
- Compile-time CSS extraction `perf`
- Transferable objects for worker communication `perf`

## Testing

- Visual regression (Playwright) `test`
- Unit tests (tree utilities) `test`
- Integration tests (shortcuts) `test`
- A11y audit (axe-core) `test`
- Bundle size tracking `test`
- Cross-browser `test`
- Performance benchmarks (time to first file open) `test`
- Memory leak detection (open/close 100 tabs) `test`
- Keyboard shortcut conflict detection `test`
- Theme contrast ratio validation `test`
- SSR smoke test `test`
- Stress test (rapid open/close 1000 files) `test`
- Concurrent user simulation `test`
- Prop fuzzing (random prop combinations) `test`
- Snapshot tests for tree rendering `test`
- Accessibility tree audit `test`
- Latency measurement (input to render time) `test`
- Fuzz testing for file path parsing `test`
- Size budget CI check `test`

## DX

- TypeScript generic on file data `prop`
- Ref API expansion (open/close/focus/scroll) `prop`
- SSR-safe (no document/window at import time) `fix`
- Headless mode (logic only) `logic` `prop`
- Zero-config mode (sensible defaults) `logic`
- Framework adapters (Vue, Svelte, Solid) `logic`
- Web component wrapper `logic`
- CDN usage (single script tag) `logic`
- PWA support (offline-capable) `logic`
- Electron/Tauri wrapper (desktop app) `logic`
- Cloud sync (settings across devices) `logic` `prop`
- Auto-update notification `logic` `component`
- Offline mode (queue saves, sync on reconnect) `logic`
- Storybook or live playground `component`
- Cookbook/recipes `doc`
- API reference from types `doc`

## Existing fixes

- Tab close button hard to discover on touch `fix`
- Dockview panel remove crash during HMR `fix`
- Multiple Workspace instances state conflict `fix`
- Monaco editor not resizing on panel resize `fix`
- Sidebar keyboard focus escaping to editor `fix`
- Double-click to select word not working in tree `fix`
- Theme flicker on initial load (FOUC) `fix`
- Monaco not receiving focus after panel switch `fix`
- Tree scroll position lost after tree data update `fix`
- Tab title not updating when file is renamed `fix`
- Virtual file not removed from dockview when removed from `files` prop `fix`
- Sidebar collapse animation janky on slow devices `fix`
- Shiki highlighting not applied on first render (race condition) `fix`
- Dockview watermark panel showing when all tabs closed `fix`
- Context menu positioning overflow off-screen `fix`
- Tree not updating when prop reference changes but content same `fix`
- Memory leak from Monaco models not disposed on tab close `fix`
- Incorrect cursor position after virtual file content update `fix`
- Accessibility: tab order broken after drag-and-drop `fix`
- Editor font fallback chain not matching tree font `fix`
- Theme transition flash when switching light/dark `fix`
