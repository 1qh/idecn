<h3 align="center"><a href="https://idecn.vercel.app">Try the live demo →</a></h3>

```sh
bun add idecn
```

Or via shadcn CLI:

```sh
bunx shadcn@latest add https://idecn.vercel.app/r/file-tree.json
```

## Quick Start

```ts
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
```

```tsx
<FileTree data={tree} onSelectChange={item => console.log(item?.path)} />
```

## Primitives

```ts
import { Tree, TreeFolder, TreeFile } from 'idecn'
```

```tsx
<Tree>
  <TreeFolder name="src" defaultOpen>
    <TreeFile name="index.ts" path="src/index.ts" />
    <TreeFolder name="components">
      <TreeFile name="button.tsx" path="src/components/button.tsx" />
    </TreeFolder>
  </TreeFolder>
  <TreeFile name="package.json" path="package.json" />
</Tree>
```

| Prop                    | Type                                        | Description                   |
| ----------------------- | ------------------------------------------- | ----------------------------- |
| `data`                  | `TreeDataItem \| TreeDataItem[]`            | Tree data                     |
| `onSelectChange`        | `(item: TreeDataItem \| undefined) => void` | Called when a file is clicked |
| `initialSelectedItemId` | `string`                                    | Pre-selected item ID          |
| `className`             | `string`                                    | Additional CSS classes        |

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

## Credit

- [shadcn-tree-view](https://github.com/MrLightful/shadcn-tree-view/tree/41624def)
- [dockview](https://dockview.dev)
