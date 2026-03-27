interface GitHubContent {
  content?: string
}
interface GitHubTreeItem {
  path: string
  type: 'blob' | 'tree'
}
export type { GitHubContent, GitHubTreeItem }
