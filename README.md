<h3 align="center"><a href="https://idecn.vercel.app">Try the live demo →</a></h3>

```sh
bunx shadcn@latest add https://idecn.vercel.app/r/idecn.json
```

Or just the file tree:

```sh
bunx shadcn@latest add https://idecn.vercel.app/r/file-tree.json
```

Or as an npm package:

```sh
bun add idecn
```

## Workspace

Full IDE layout with file tree sidebar, tabbed editor panels, and async file loading.

```tsx
import { FileTree, Tab, Workspace } from 'idecn'
import type { WorkspaceRef } from 'idecn'

const ref = useRef<WorkspaceRef>(null)

<Workspace
  onOpenFile={(item) => fetch(`/api/files/${item.path}`).then(r => r.text())}
  ref={ref}>
  <Tab closable={false} icon={false} initialWidth={250} position="left" title="Explorer">
    <FileTree
      data={tree}
      onSelectChange={item => {
        if (item && !item.children) ref.current?.openFile(item)
      }}
    />
  </Tab>
</Workspace>
```

### Workspace props

| Prop            | Type                                                                | Description                   |
| --------------- | ------------------------------------------------------------------- | ----------------------------- |
| `onOpenFile`    | `(item: TreeDataItem) => string \| null \| Promise<string \| null>` | Fetch file content            |
| `initialFiles`  | `string[]`                                                          | File paths to open on mount   |
| `onFilesChange` | `(files: string[]) => void`                                         | Called when open files change |
| `renderLoading` | `(item: TreeDataItem) => ReactNode`                                 | Custom loading state per file |
| `ref`           | `Ref<WorkspaceRef>`                                                 | Imperative handle             |
| `className`     | `string`                                                            | CSS class for the container   |

### WorkspaceRef

| Method           | Description               |
| ---------------- | ------------------------- |
| `openFile(item)` | Open a file in the editor |
| `focusPanel(id)` | Focus a panel by ID       |

### Tab props

| Prop              | Type                            | Default  | Description               |
| ----------------- | ------------------------------- | -------- | ------------------------- |
| `title`           | `string`                        | required | Tab title                 |
| `position`        | `'left' \| 'right' \| 'bottom'` | —        | Initial panel position    |
| `closable`        | `boolean`                       | `true`   | Show close button         |
| `icon`            | `boolean`                       | `true`   | Show file icon            |
| `headerClassName` | `string`                        | —        | CSS class for tab header  |
| `initialWidth`    | `number`                        | —        | Initial panel width in px |
| `onClose`         | `() => void`                    | —        | Called when tab is closed |

## FileTree

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

<FileTree data={tree} onSelectChange={item => console.log(item?.path)} />
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

## Primitives

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

## Icons

```tsx
import { FileIcon, FolderIcon } from 'idecn'

<FileIcon name="index.ts" className="size-4" />
<FolderIcon name="src" className="size-4" />
```

## Credit

- [shadcn-tree-view](https://github.com/MrLightful/shadcn-tree-view/tree/41624def)
- [dockview](https://dockview.dev)
- [material-icon-theme](https://github.com/material-extensions/vscode-material-icon-theme)
