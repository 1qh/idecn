import type { TreeDataItem } from 'idecn'
interface GitHubTreeItem {
  path: string
  type: 'blob' | 'tree'
}
const buildTree = (items: GitHubTreeItem[]): TreeDataItem[] => {
  const root: TreeDataItem[] = [],
    dirs = new Map<string, TreeDataItem>(),
    sorted = [...items].toSorted((a, b) => {
      if (a.type !== b.type) return a.type === 'tree' ? -1 : 1
      return a.path.localeCompare(b.path)
    })
  for (const item of sorted) {
    const parts = item.path.split('/'),
      name = parts.at(-1) ?? item.path,
      node: TreeDataItem = { id: item.path, name, path: item.path }
    if (item.type === 'tree') {
      node.children = []
      dirs.set(item.path, node)
    }
    if (parts.length === 1) root.push(node)
    else dirs.get(parts.slice(0, -1).join('/'))?.children?.push(node)
  }
  return root
}
export type { GitHubTreeItem }
export { buildTree }
