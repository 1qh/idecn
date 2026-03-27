import type { TreeDataItem } from 'idecn'
interface GitHubContent {
  content?: string
}
interface GitHubTreeItem {
  path: string
  type: 'blob' | 'tree'
}
const EMPTY_TREE: TreeDataItem[] = [],
  DEFAULT_REPO = '1qh/idecn',
  DEFAULT_FILES = ['README.md', 'src/idecn.tsx'],
  buildTree = (items: GitHubTreeItem[]): TreeDataItem[] => {
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
  },
  readHash = () => {
    if (!('location' in globalThis)) return { files: [] as string[], repo: DEFAULT_REPO }
    const hash = globalThis.location.hash.slice(1)
    if (!hash) return { files: DEFAULT_FILES, repo: DEFAULT_REPO }
    const [repo, ...files] = hash.split(',')
    return { files: files.filter(Boolean), repo: repo || DEFAULT_REPO }
  },
  writeHash = (repo: string, files: string[]) => {
    const hash = [repo, ...files].join(',')
    globalThis.history.replaceState(null, '', files.length > 0 ? `#${hash}` : globalThis.location.pathname)
  }
export type { GitHubContent, GitHubTreeItem }
export { buildTree, DEFAULT_REPO, EMPTY_TREE, readHash, writeHash }
