# nicetree

VS Code-style file tree component for React, published to npm as `nicetree`.

## Credit

Rebuilt from [shadcn-tree-view](https://github.com/MrLightful/shadcn-tree-view) by MrLightful. Reference commit: `41624def7189c141553e7a164c117b44178d5b3a`.

## Architecture

Monorepo with bun workspaces:

```
packages/nicetree/     - component library, published to npm
apps/demo/             - Next.js demo app, deployed to Vercel
```

## Component Library

- VS Code explorer look: material-icon-theme icons, no arrows (hidesExplorerArrows: true)
- Icons via `material-icon-theme` npm package or SVGs from the VS Code extension
- Built on shadcn patterns (tailwind, cn utility, CSS variables for theming)
- Dark mode ready (follows host theme via CSS variables)
- Exports: FileTree component, TreeNode types
- No Radix Accordion dependency (simpler expand/collapse via state)

## Demo App

- Next.js App Router with shadcn theme setup
- VS Code-like layout: sidebar with file tree, main area with Monaco editor
- Theme switch button via next-themes
- User inputs GitHub repo URL to browse repo files
- GitHub REST API for fetching:
  - GET /repos/owner/repo/git/trees/main?recursive=1 (full tree, one call)
  - GET /repos/owner/repo/contents/path (file content, base64)
  - CORS supported, 60 req/hr unauthenticated, 5000 with token
- Default repo: openclaw/openclaw
- URL state via nuqs for shareable links: ?repo=openclaw/openclaw&path=src/index.ts
- Optional GitHub token input for higher rate limits

## Implementation Steps

### Phase 1: Project Setup

1. Init monorepo with bun workspaces
2. Set up lintmax, typescript, tailwind
3. Create package structures
4. Verify bun fix passes

### Phase 2: Component Library

1. Define TreeNode types
2. Build FileTree with recursive rendering
3. Material icon theme integration (file extension to icon mapping)
4. VS Code-like styling (indent, selection, hover, no arrows)
5. Configure npm publish (exports, types, peer deps)

### Phase 3: Demo App

1. Next.js with shadcn theme, next-themes, nuqs
2. VS Code layout (resizable sidebar + editor)
3. GitHub API integration (tree fetch + file content)
4. Wire file tree selection to Monaco editor
5. Repo URL input with nuqs persistence
6. Default to openclaw/openclaw

### Phase 4: Polish

1. Loading skeletons, error states
2. README with usage docs
3. npm publish config
4. Vercel deploy
