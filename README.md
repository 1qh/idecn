# idecn

VS Code-style file tree component for React with [material-icon-theme](https://github.com/material-extensions/vscode-material-icon-theme) icons.

Built on top of [shadcn-tree-view](https://github.com/MrLightful/shadcn-tree-view) by [@MrLightful](https://github.com/MrLightful) (ref: [`41624de`](https://github.com/MrLightful/shadcn-tree-view/commit/41624def7189c141553e7a164c117b44178d5b3a)).

## Install

```sh
bun add idecn
```

## Usage

```tsx
import { FileTree } from 'idecn'
import type { TreeNode } from 'idecn'

const tree: TreeNode[] = [
  {
    name: 'src',
    path: 'src',
    children: [
      { name: 'index.ts', path: 'src/index.ts' },
      { name: 'utils.ts', path: 'src/utils.ts' }
    ]
  },
  { name: 'package.json', path: 'package.json' }
]

const App = () => {
  const [selected, setSelected] = useState<string | null>(null)
  return <FileTree nodes={tree} onSelect={setSelected} selected={selected} />
}
```

## Props

| Prop        | Type                     | Description                   |
| ----------- | ------------------------ | ----------------------------- |
| `nodes`     | `TreeNode[]`             | Tree data                     |
| `onSelect`  | `(path: string) => void` | Called when a file is clicked |
| `selected`  | `string \| null`         | Currently selected file path  |
| `className` | `string`                 | Additional CSS classes        |

## TreeNode

```ts
interface TreeNode {
  name: string
  path: string
  children?: TreeNode[]
}
```

Presence of `children` makes a node a folder. Icons are determined automatically from the file name via `material-file-icons`.

## Theming

The component uses CSS variables with shadcn defaults:

- `--idecn-hover` (default: `hsl(var(--accent))`)
- `--idecn-selected` (default: `hsl(var(--accent))`)

Works with `next-themes` dark mode out of the box.

## Demo

[Live demo](https://idecn.vercel.app) — browse any GitHub repo with a VS Code-like interface.

## License

MIT
