# Ideas

Effort: `css` `monaco` `dep` `component` `logic` `prop` `fix` `perf` `test` `doc`

**Architecture constraint:** Dockview recreates panel components on tab switch. Monaco editor state (scroll position, cursor, folds) does not persist across tab switches. Features requiring persistent editor state per file need a single-editor-multiple-models refactor.

---

# Topics (what the user sees)

## Tabs

- Dirty/modified dot indicator `css` `logic`
- Tab progress indicator (loading spinner while file fetches) `css` `logic`
- Tab close confirmation for dirty files `logic` `component`
- Tab tooltip showing full file path `css` `dep`

## Tree

- Tree item lazy loading (expand fetches children on demand) `logic` `prop`
- Tree color-coded by git status (green new, yellow modified, red deleted) `css` `logic` `prop`
- Tree item decorations (badges, status icons) `css` `logic` `prop`
- File nesting rules (group `*.test.ts` under `*.ts`) `logic` `prop`
- Virtualized tree for large repos `perf` `dep`
- Tree reveal file (scroll to and highlight a given path) via ref `logic` `prop`
- Tree sort options (name, type, modified date) `logic` `prop`
- Inline file/folder creation (type name in tree) `component` `logic`
- Tree empty state (no files message) `component` `prop`

## Navigation

- Breadcrumb dropdown (click segment shows siblings) `component` `logic`
- Command palette `Ctrl+Shift+P` (all actions searchable) `dep` `component` `logic`
- Outline view (symbols in file) `component` `logic`
- Multi-root workspaces (multiple root folders in one tree) `logic` `prop`

## Panels

- Panel area below editor (terminal, output) `component` `prop`
- Problems panel (errors/warnings list) `component` `logic` `prop`
- Output panel (consumer pushes log lines) `component` `prop`
- Zen mode (hide everything except editor) `logic` `prop`

## Search

- Find across files (global search panel) `component` `logic`
- Search and replace across files `component` `logic`
- Search result click to navigate `logic`

## File operations

- Auto-detect language from shebang `logic`
- Binary file detection (hex view or message) `logic` `component`
- File size warning before opening large files `logic` `component`

---

# Features (multi-topic goals)

## Editor mode

- `readOnly` as consumer choice (default off) `prop`
- `onSaveFile` + `Ctrl+S` `logic` `prop`
- Dirty state tracking per file `logic` `css`
- `onCreateFile` / `onCreateFolder` `logic` `prop` `component`
- `onDeleteFile` with confirmation `logic` `prop` `component`
- `onRenameFile` with inline tree editing `logic` `prop` `component`
- Auto-save (debounced, configurable interval) `logic` `prop`

## Integration

- Diff editor (Monaco diff view) `component` `logic` `prop`
- Image/PDF preview in tabs `component` `logic`
- Markdown preview pane `component` `dep`
- Terminal panel `component` `dep`
- Git diff gutter indicators `logic` `prop`
- LSP client (language server over WebSocket) `dep` `logic` `prop`

## Extensibility

- Custom panel types `prop`
- Status bar item API (consumer adds custom items) `prop`
- Keybinding customization (consumer remaps shortcuts) `logic` `prop`
- Command registration (consumer registers actions by ID) `logic` `prop`

## State management

- Layout persistence (open tabs, sidebar width, splits) `logic` `prop`
- Workspace sessions (save/restore) `logic` `prop`

---

# Cross-cutting (applies everywhere)

## Consumer props

- `emptyState` — custom component when no files open `prop`
- `readOnly` — per-file or global `prop`
- `onChange` per-file callback `prop`
- Custom tab renderer `prop`
- Error boundary per panel `logic`

## Performance

- Lazy Monaco instantiation `perf`
- Virtualized tree `perf` `dep`
- Web worker for syntax highlighting `perf`
- Preload adjacent files (prefetch likely-to-open) `perf`

## Testing

- Visual regression (Playwright) `test`
- Unit tests (tree utilities) `test`
- A11y audit (axe-core) `test`
- Bundle size tracking `test`
- Memory leak detection (open/close 100 tabs) `test`

## Existing fixes

- Monaco editor not resizing on panel resize `fix`
- Virtual file not removed from dockview when removed from `files` prop `fix`
- Memory leak from Monaco models not disposed on tab close `fix`
- Theme transition flash when switching light/dark `fix`
