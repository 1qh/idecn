/** biome-ignore-all lint/nursery/noInlineStyles: dynamic indent from depth */
/* oxlint-disable react-perf/jsx-no-new-object-as-prop */
'use client'
import { Collapsible } from '@base-ui/react/collapsible'
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
    'flex w-full items-center gap-[7px] py-[1px] pr-2 text-left text-[13px] leading-[22px] cursor-pointer whitespace-nowrap hover:bg-[var(--nicetree-hover,hsl(var(--accent)))]',
  PANEL =
    'overflow-hidden h-[var(--collapsible-panel-height)] transition-[height] duration-150 ease-out data-ending-style:h-0 data-starting-style:h-0',
  renderNodes = (nodes: TreeNode[], depth: number, ctx: TreeCtx): React.ReactNode[] => {
    const result: React.ReactNode[] = []
    for (const node of nodes) {
      const pl = `${String(depth * INDENT_PX + 8)}px`
      if (node.children) {
        const isOpen = ctx.expanded.has(node.path)
        result.push(
          <Collapsible.Root key={node.path} open={isOpen}>
            <button className={ROW} onClick={() => ctx.toggle(node.path)} style={{ paddingLeft: pl }} type='button'>
              <FolderIcon className='size-4 shrink-0 [&_svg]:size-4' name={node.name} open={isOpen} />
              <span className='truncate'>{node.name}</span>
            </button>
            <Collapsible.Panel className={PANEL}>{renderNodes(node.children, depth + 1, ctx)}</Collapsible.Panel>
          </Collapsible.Root>
        )
      } else
        result.push(
          <button
            className={cn(ROW, ctx.sel === node.path && 'bg-[var(--nicetree-selected,hsl(var(--accent)))]')}
            key={node.path}
            onClick={() => ctx.handleSelect(node.path)}
            style={{ paddingLeft: pl }}
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
    defaultExpanded = false,
    nodes,
    onSelect,
    selected
  }: {
    className?: string
    defaultExpanded?: boolean
    nodes: TreeNode[]
    onSelect?: (path: string) => void
    selected?: null | string
  }) => {
    const [expanded, setExpanded] = useState<Set<string>>(() => {
        if (!defaultExpanded) return new Set<string>()
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
