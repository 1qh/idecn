<h3 align="center"><a href="https://idecn.vercel.app">Try the live demo</a></h3> <p align="center"><a href="https://idecn.vercel.app"><img src="screenshot.png" alt="idecn demo" width="100%" /></a></p>

## Install

```sh
bunx shadcn@latest add https://idecn.vercel.app/r/idecn.json
```

<p align="center">or</p>

```sh
bun add idecn
```

## FileTree

```tsx
<FileTree
  data={tree}
  expandDepth={2}
  onSelectChange={item => console.log(item?.path)}
/>
```

| Prop                    | Type                             | Default |
| ----------------------- | -------------------------------- | ------- |
| `data`                  | `TreeDataItem \| TreeDataItem[]` | -       |
| `expandDepth`           | `number`                         | `0`     |
| `onSelectChange`        | `(item \| undefined) => void`    | -       |
| `initialSelectedItemId` | `string`                         | -       |
| `className`             | `string`                         | -       |

```ts
interface TreeDataItem {
  id: string
  name: string
  path: string
  children?: TreeDataItem[]
}
```

## Workspace

```tsx
<Workspace
  tree={tree}
  onOpenFile={item => fetch(`/api/files/${item.path}`).then(r => r.text())}
/>
```

```tsx
<Workspace onOpenFile={...} ref={ref}>
  <MyNavigation onSelect={item => ref.current?.openFile(item)} />
</Workspace>
```

| Prop              | Type                                       | Default                     |
| ----------------- | ------------------------------------------ | --------------------------- |
| `tree`            | `TreeDataItem[]`                           | -                           |
| `onOpenFile`      | `(item) => string \| null \| Promise<...>` | -                           |
| `expandDepth`     | `number`                                   | `0`                         |
| `sidebarSize`     | `string \| number`                         | `'250px'`                   |
| `sidebarPosition` | `'left' \| 'right'`                        | `'left'`                    |
| `sidebar`         | `boolean`                                  | -                           |
| `defaultSidebar`  | `boolean`                                  | `true`                      |
| `onSidebarChange` | `(visible: boolean) => void`               | -                           |
| `editorOptions`   | `Record<string, unknown>`                  | -                           |
| `theme`           | `string \| { dark, light }`                | monokai-lite / github-light |
| `initialFiles`    | `string[]`                                 | -                           |
| `onFilesChange`   | `(files: string[]) => void`                | -                           |
| `renderLoading`   | `(item) => ReactNode`                      | -                           |
| `ref`             | `Ref<WorkspaceRef>`                        | -                           |

<details> <summary>Notes on sizing</summary>

- `'250px'` - pixels (string)
- `'20%'` or `'20'` - percentage (string)
- `250` - pixels (number)

</details>

### WorkspaceRef

`openFile(item)` `focusPanel(id)` `toggleSidebar()` (`Cmd+B` / `Ctrl+B`)

### Tab

| Prop                | Type         | Default  |
| ------------------- | ------------ | -------- |
| `title`             | `string`     | required |
| `closable`          | `boolean`    | `true`   |
| `icon`              | `boolean`    | `true`   |
| `headerClassName`   | `string`     | -        |
| `activeClassName`   | `string`     | -        |
| `inactiveClassName` | `string`     | -        |
| `onClose`           | `() => void` | -        |

## Icons

```tsx
<FileIcon name="index.ts" className="size-4" />
<FolderIcon name="src" className="size-4" />
```

## Credit

- [shadcn-tree-view](https://github.com/MrLightful/shadcn-tree-view/tree/41624def)
- [dockview](https://dockview.dev)
- [material-icon-theme](https://github.com/material-extensions/vscode-material-icon-theme)
- [Monokai Lite](https://github.com/xthz/Monokai-Lite)
- [shiki](https://shiki.style)
