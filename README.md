# idecn

IDE-like UI components for React with material-icon-theme icons.

## Install

```sh
bun add idecn
```

Or via shadcn CLI:

```sh
bunx shadcn@latest add https://idecn.vercel.app/r/file-tree.json
```

## Quick Start

```tsx
import { FileTree } from 'idecn'
import type { TreeDataItem } from 'idecn'

const tree: TreeDataItem[] = [
  {
    id: 'src',
    name: 'src',
    path: 'src',
    children: [
      { id: 'src/index.ts', name: 'index.ts', path: 'src/index.ts' },
      { id: 'src/utils.ts', name: 'utils.ts', path: 'src/utils.ts' }
    ]
  },
  { id: 'package.json', name: 'package.json', path: 'package.json' }
]

<FileTree
  data={tree}
  onSelectChange={item => console.log(item?.path)}
/>
```

## Primitives

Full control over rendering:

```tsx
import { Tree, TreeFolder, TreeFile } from 'idecn'
;<Tree>
  <TreeFolder name="src" defaultOpen>
    <TreeFile name="index.ts" path="src/index.ts" />
    <TreeFolder name="components">
      <TreeFile name="button.tsx" path="src/components/button.tsx" />
    </TreeFolder>
  </TreeFolder>
  <TreeFile name="package.json" path="package.json" />
</Tree>
```

## FileTree Props

| Prop                    | Type                                        | Description                   |
| ----------------------- | ------------------------------------------- | ----------------------------- |
| `data`                  | `TreeDataItem \| TreeDataItem[]`            | Tree data                     |
| `onSelectChange`        | `(item: TreeDataItem \| undefined) => void` | Called when a file is clicked |
| `initialSelectedItemId` | `string`                                    | Pre-selected item ID          |
| `className`             | `string`                                    | Additional CSS classes        |

## TreeDataItem

```ts
interface TreeDataItem {
  id: string
  name: string
  path: string
  children?: TreeDataItem[]
  disabled?: boolean
  className?: string
  actions?: ReactNode
  onClick?: () => void
}
```

## Demo

[idecn.vercel.app](https://idecn.vercel.app)

## Credit

Built on top of [shadcn-tree-view](https://github.com/MrLightful/shadcn-tree-view) by [@MrLightful](https://github.com/MrLightful) (ref: [`41624de`](https://github.com/MrLightful/shadcn-tree-view/commit/41624def7189c141553e7a164c117b44178d5b3a)).

## License

MIT
