'use client'
import type { ReactNode } from 'react'
import { Tree, TreeFile, TreeFolder } from './tree'
interface TreeDataItem {
  actions?: ReactNode
  children?: TreeDataItem[]
  className?: string
  disabled?: boolean
  id: string
  name: string
  onClick?: () => void
  path: string
}
const renderItems = (items: TreeDataItem[], onItemClick?: (item: TreeDataItem) => void): ReactNode[] => {
    const nodes: ReactNode[] = []
    for (const item of items)
      nodes.push(
        item.children ? (
          <TreeFolder
            className={item.className}
            disabled={item.disabled}
            id={item.id}
            key={item.id}
            name={item.name}
            path={item.path}>
            {renderItems(item.children, onItemClick)}
          </TreeFolder>
        ) : (
          <TreeFile
            className={item.className}
            disabled={item.disabled}
            id={item.id}
            key={item.id}
            name={item.name}
            onClick={() => {
              item.onClick?.()
              onItemClick?.(item)
            }}
            path={item.path}
          />
        )
      )
    return nodes
  },
  findPath = (list: TreeDataItem[], targetId: string): string[] => {
    for (const item of list) {
      if (item.id === targetId) return [item.id]
      if (item.children) {
        const sub = findPath(item.children, targetId)
        if (sub.length > 0) return [item.id, ...sub]
      }
    }
    return []
  }
interface FileTreeProps {
  className?: string
  data: TreeDataItem | TreeDataItem[]
  initialSelectedItemId?: string
  onSelectChange?: (item: TreeDataItem | undefined) => void
}
const FileTree = ({ className, data, initialSelectedItemId, onSelectChange }: FileTreeProps) => {
  const items = Array.isArray(data) ? data : [data]
  return (
    <Tree className={className} selectedId={initialSelectedItemId}>
      <div className='min-w-max'>{renderItems(items, onSelectChange)}</div>
    </Tree>
  )
}
export type { FileTreeProps, TreeDataItem }
export { FileTree, findPath }
