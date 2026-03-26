<h3 align="center"><a href="https://idecn.vercel.app">Try the live demo →</a></h3>

```sh
bunx shadcn@latest add https://idecn.vercel.app/r/idecn.json
```

```sh
bun add idecn
```

## Workspace

IDE layout with built-in file tree sidebar, tabbed editor panels, and async file loading.

```tsx
<Workspace
  tree={tree}
  onOpenFile={item => fetch(`/api/files/${item.path}`).then(r => r.text())}
/>
```

Full customization:

```tsx
<Workspace
  tree={tree}
  sidebarSize="300px"
  initialFiles={['src/index.ts']}
  onFilesChange={files => saveToUrl(files)}
  onOpenFile={async item => {
    const res = await fetch(`/api/files/${item.path}`)
    return res.ok ? res.text() : null
  }}
  renderLoading={item => <Spinner label={item.name} />}
  ref={ref}
>
  <Tab title="Settings">
    <SettingsPanel />
  </Tab>
</Workspace>
```

### Workspace props

| Prop            | Type                                                                | Description                           |
| --------------- | ------------------------------------------------------------------- | ------------------------------------- |
| `tree`          | `TreeDataItem[]`                                                    | File tree data                        |
| `onOpenFile`    | `(item: TreeDataItem) => string \| null \| Promise<string \| null>` | Fetch file content                    |
| `sidebarSize`   | `string \| number`                                                  | Sidebar default size (e.g. `'250px'`) |
| `initialFiles`  | `string[]`                                                          | File paths to open on mount           |
| `onFilesChange` | `(files: string[]) => void`                                         | Called when open files change         |
| `renderLoading` | `(item: TreeDataItem) => ReactNode`                                 | Custom loading state per file         |
| `ref`           | `Ref<WorkspaceRef>`                                                 | Imperative handle                     |
| `className`     | `string`                                                            | CSS class for the container           |

### WorkspaceRef

| Method           | Description               |
| ---------------- | ------------------------- |
| `openFile(item)` | Open a file in the editor |
| `focusPanel(id)` | Focus a panel by ID       |

### Tab props

Extra tabs inside dockview (non-positioned). File tree sidebar is built in.

| Prop              | Type         | Default  | Description               |
| ----------------- | ------------ | -------- | ------------------------- |
| `title`           | `string`     | required | Tab title                 |
| `closable`        | `boolean`    | `true`   | Show close button         |
| `icon`            | `boolean`    | `true`   | Show file icon            |
| `headerClassName` | `string`     | —        | CSS class for tab header  |
| `onClose`         | `() => void` | —        | Called when tab is closed |

## FileTree

Standalone file tree (also built into Workspace).

```tsx
import { FileTree } from 'idecn'

;<FileTree data={tree} onSelectChange={item => console.log(item?.path)} />
```

```ts
interface TreeDataItem {
  id: string
  name: string
  path: string
  children?: TreeDataItem[]
}
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
