/** biome-ignore-all lint/nursery/noInlineStyles: dynamic indent from depth */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* oxlint-disable react-perf/jsx-no-new-object-as-prop */
'use client'
import type { ReactNode } from 'react'
import { Accordion } from '@base-ui/react/accordion'
import { useMemo, useState } from 'react'
import { cn } from './cn'
import { FileIcon, FolderIcon } from './icon'
interface TreeCtx {
  expanded: string[]
  handleSelect: (item: TreeDataItem) => void
  selectedId: null | string
}
interface TreeDataItem {
  actions?: ReactNode
  children?: TreeDataItem[]
  className?: string
  disabled?: boolean
  icon?: React.ComponentType<{ className?: string }>
  id: string
  name: string
  onClick?: () => void
  openIcon?: React.ComponentType<{ className?: string }>
  path: string
  selectedIcon?: React.ComponentType<{ className?: string }>
}
const INDENT_PX = 16,
  ROW =
    'flex w-full items-center gap-[7px] py-[1px] pr-2 text-left text-[13px] leading-[22px] cursor-pointer whitespace-nowrap hover:bg-[var(--nicetree-hover,hsl(var(--accent)))]',
  PANEL =
    'overflow-hidden h-(--accordion-panel-height) transition-[height] duration-150 ease-out data-ending-style:h-0 data-starting-style:h-0',
  TreeLeaf = ({ ctx, depth, item }: { ctx: TreeCtx; depth: number; item: TreeDataItem }) => {
    const pl = `${String(depth * INDENT_PX + 8)}px`,
      isSelected = ctx.selectedId === item.id
    return (
      <button
        className={cn(
          ROW,
          isSelected && 'bg-[var(--nicetree-selected,hsl(var(--accent)))]',
          item.disabled && 'pointer-events-none opacity-50',
          item.className
        )}
        onClick={() => {
          if (!item.disabled) {
            ctx.handleSelect(item)
            item.onClick?.()
          }
        }}
        style={{ paddingLeft: pl }}
        type='button'>
        <FileIcon className='size-4 shrink-0 [&_svg]:size-4' name={item.name} />
        <span className='truncate'>{item.name}</span>
        {item.actions ? (
          <span className={cn('ml-auto hidden group-hover:block', isSelected && 'block')}>{item.actions}</span>
        ) : null}
      </button>
    )
  },
  TreeFolder = ({ ctx, depth, item }: { ctx: TreeCtx; depth: number; item: TreeDataItem }) => {
    const pl = `${String(depth * INDENT_PX + 8)}px`,
      isOpen = ctx.expanded.includes(item.id),
      isSelected = ctx.selectedId === item.id
    return (
      <Accordion.Item className={item.className} value={item.id}>
        <Accordion.Trigger
          className={cn(ROW, isSelected && 'bg-[var(--nicetree-selected,hsl(var(--accent)))]')}
          onClick={() => {
            ctx.handleSelect(item)
            item.onClick?.()
          }}
          style={{ paddingLeft: pl }}>
          <FolderIcon className='size-4 shrink-0 [&_svg]:size-4' name={item.name} open={isOpen} />
          <span className='truncate'>{item.name}</span>
          {item.actions ? (
            <span className={cn('ml-auto hidden group-hover:block', isSelected && 'block')}>{item.actions}</span>
          ) : null}
        </Accordion.Trigger>
        <Accordion.Panel className={PANEL}>
          {item.children ? <TreeItems ctx={ctx} depth={depth + 1} items={item.children} /> : null}
        </Accordion.Panel>
      </Accordion.Item>
    )
  },
  TreeItems = ({ ctx, depth, items }: { ctx: TreeCtx; depth: number; items: TreeDataItem[] }) => {
    const nodes: ReactNode[] = []
    for (const item of items)
      nodes.push(
        item.children ? (
          <TreeFolder ctx={ctx} depth={depth} item={item} key={item.id} />
        ) : (
          <TreeLeaf ctx={ctx} depth={depth} item={item} key={item.id} />
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
interface TreeProps {
  className?: string
  data: TreeDataItem | TreeDataItem[]
  expandAll?: boolean
  initialSelectedItemId?: string
  onSelectChange?: (item: TreeDataItem | undefined) => void
}
const FileTree = ({ className, data, expandAll, initialSelectedItemId, onSelectChange }: TreeProps) => {
  const items = useMemo(() => (Array.isArray(data) ? data : [data]), [data]),
    allPaths = (): string[] => {
      const paths: string[] = [],
        walk = (list: TreeDataItem[]) => {
          for (const item of list)
            if (item.children) {
              paths.push(item.id)
              walk(item.children)
            }
        }
      walk(items)
      return paths
    },
    initialExpanded = (): string[] => {
      if (expandAll) return allPaths()
      if (initialSelectedItemId) return findPath(items, initialSelectedItemId)
      return []
    },
    [expanded, setExpanded] = useState<string[]>(initialExpanded),
    [selectedId, setSelectedId] = useState(initialSelectedItemId ?? null),
    handleSelect = (item: TreeDataItem) => {
      setSelectedId(item.id)
      onSelectChange?.(item)
    },
    ctx: TreeCtx = { expanded, handleSelect, selectedId }
  return (
    <Accordion.Root
      className={cn('select-none overflow-auto text-[13px]', className)}
      onValueChange={v => setExpanded(v as string[])}
      value={expanded}>
      <TreeItems ctx={ctx} depth={0} items={items} />
    </Accordion.Root>
  )
}
export type { TreeDataItem, TreeProps }
export { FileTree }
