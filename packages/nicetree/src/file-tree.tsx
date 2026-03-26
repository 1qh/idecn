/** biome-ignore-all lint/nursery/noInlineStyles: dynamic indent from depth */
/* oxlint-disable react-perf/jsx-no-new-object-as-prop */
'use client'
import { useState } from 'react'
import { cn } from './cn'
import { FileIcon, FolderIcon } from './icon'
interface TreeCtx {
  expanded: Set<string>
  handleSelect: (path: string) => void
  sel: null | string
  toggle: (path: string) => void
}
interface TreeNode {
  children?: TreeNode[]
  name: string
  path: string
}
const INDENT_PX = 16,
  ROW =
    'flex w-full items-center gap-1.5 py-[1px] pr-2 text-left text-[13px] leading-[22px] cursor-pointer hover:bg-[var(--nicetree-hover,hsl(var(--accent)))]',
  renderNodes = (nodes: TreeNode[], depth: number, ctx: TreeCtx): React.ReactNode[] => {
    const result: React.ReactNode[] = []
    for (const node of nodes)
      if (node.children) {
        const isOpen = ctx.expanded.has(node.path),
          paddingLeft = `${String(depth * INDENT_PX + 8)}px`
        result.push(
          <div key={node.path}>
            <button className={ROW} onClick={() => ctx.toggle(node.path)} style={{ paddingLeft }} type='button'>
              <FolderIcon className='size-4 shrink-0 [&_svg]:size-4' name={node.name} open={isOpen} />
              <span className='truncate'>{node.name}</span>
            </button>
            <div
              className='grid transition-[grid-template-rows] duration-150 ease-out'
              style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}>
              <div className='overflow-hidden'>{renderNodes(node.children, depth + 1, ctx)}</div>
            </div>
          </div>
        )
      } else {
        const paddingLeft = `${String(depth * INDENT_PX + 8)}px`
        result.push(
          <button
            className={cn(ROW, ctx.sel === node.path && 'bg-[var(--nicetree-selected,hsl(var(--accent)))]')}
            key={node.path}
            onClick={() => ctx.handleSelect(node.path)}
            style={{ paddingLeft }}
            type='button'>
            <FileIcon className='size-4 shrink-0 [&_svg]:size-4' name={node.name} />
            <span className='truncate'>{node.name}</span>
          </button>
        )
      }
    return result
  },
  FileTree = ({
    className,
    nodes,
    onSelect,
    selected
  }: {
    className?: string
    nodes: TreeNode[]
    onSelect?: (path: string) => void
    selected?: null | string
  }) => {
    const [expanded, setExpanded] = useState<Set<string>>(() => {
        const set = new Set<string>(),
          walk = (items: TreeNode[]) => {
            for (const item of items)
              if (item.children) {
                set.add(item.path)
                walk(item.children)
              }
          }
        walk(nodes)
        return set
      }),
      toggle = (path: string) => {
        setExpanded(prev => {
          const next = new Set(prev)
          if (next.has(path)) next.delete(path)
          else next.add(path)
          return next
        })
      },
      ctx: TreeCtx = { expanded, handleSelect: onSelect ?? (() => undefined), sel: selected ?? null, toggle }
    return (
      <nav aria-label='File tree' className={cn('select-none overflow-auto text-[13px]', className)}>
        {renderNodes(nodes, 0, ctx)}
      </nav>
    )
  }
export type { TreeNode }
export { FileTree }
