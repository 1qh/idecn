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
  handleSelect: (item: TreeDataItem) => void
  selectedId: null | string
}
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
const INDENT_PX = 16,
  ROW =
    'group flex w-full items-center gap-[7px] py-[1px] pr-2 text-left text-sm leading-6 cursor-pointer whitespace-nowrap hover:bg-[var(--nicetree-hover,hsl(var(--accent)))]',
  PANEL =
    'overflow-hidden h-(--accordion-panel-height) transition-[height] duration-150 ease-out data-ending-style:h-0 data-starting-style:h-0',
  TreeFolder = ({ ctx, depth, item }: { ctx: TreeCtx; depth: number; item: TreeDataItem }) => {
    const pl = `${String(depth * INDENT_PX + 8)}px`,
      isSelected = ctx.selectedId === item.id,
      [open, setOpen] = useState<string[]>([])
    return (
      <Accordion.Root onValueChange={v => setOpen(v as string[])} value={open}>
        <Accordion.Item value={item.id}>
          <Accordion.Trigger
            className={cn(ROW, isSelected && 'bg-[var(--nicetree-selected,hsl(var(--accent)))]', item.className)}
            onClick={() => {
              ctx.handleSelect(item)
              item.onClick?.()
            }}
            style={{ paddingLeft: pl }}>
            <FolderIcon className='size-4 shrink-0 [&_svg]:size-4' name={item.name} open={open.includes(item.id)} />
            <span>{item.name}</span>
            {item.actions ? (
              <span className={cn('ml-auto hidden group-hover:block', isSelected && 'block')}>{item.actions}</span>
            ) : null}
          </Accordion.Trigger>
          <Accordion.Panel className={PANEL}>
            {item.children ? <TreeItems ctx={ctx} depth={depth + 1} items={item.children} /> : null}
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>
    )
  },
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
        <span>{item.name}</span>
        {item.actions ? (
          <span className={cn('ml-auto hidden group-hover:block', isSelected && 'block')}>{item.actions}</span>
        ) : null}
      </button>
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
  initialSelectedItemId?: string
  onSelectChange?: (item: TreeDataItem | undefined) => void
}
const FileTree = ({ className, data, initialSelectedItemId, onSelectChange }: TreeProps) => {
  const items = useMemo(() => (Array.isArray(data) ? data : [data]), [data]),
    [selectedId, setSelectedId] = useState(initialSelectedItemId ?? null),
    handleSelect = (item: TreeDataItem) => {
      setSelectedId(item.id)
      onSelectChange?.(item)
    },
    ctx: TreeCtx = { handleSelect, selectedId }
  return (
    <nav aria-label='File tree' className={cn('select-none overflow-auto text-sm', className)}>
      <div className='min-w-max'>
        <TreeItems ctx={ctx} depth={0} items={items} />
      </div>
    </nav>
  )
}
export type { TreeDataItem, TreeProps }
export { FileTree, findPath }
