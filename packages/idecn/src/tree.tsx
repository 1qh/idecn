/** biome-ignore-all lint/nursery/noInlineStyles: dynamic indent from depth */
/* oxlint-disable react-perf/jsx-no-new-object-as-prop */
'use client'
import { Accordion } from '@base-ui/react/accordion'
import { createContext, use, useMemo, useState } from 'react'
import { cn } from './cn'
import { FileIcon, FolderIcon } from './icon'
interface TreeContextValue {
  indent: number
  onSelect?: (item: { id: string; name: string; path: string }) => void
  selectedId: null | string
  setSelectedId: (id: string) => void
}
const TreeContext = createContext<TreeContextValue>({
    indent: 16,
    selectedId: null,
    setSelectedId: () => undefined
  }),
  DepthContext = createContext(0),
  Tree = ({
    children,
    className,
    indent = 16,
    onSelect,
    selectedId: controlledSelectedId,
    ...props
  }: React.ComponentProps<'nav'> & {
    indent?: number
    onSelect?: (item: { id: string; name: string; path: string }) => void
    selectedId?: null | string
  }) => {
    const [internalSelectedId, setInternalSelectedId] = useState<null | string>(null),
      selectedId = controlledSelectedId ?? internalSelectedId,
      ctx = useMemo(
        () => ({ indent, onSelect, selectedId, setSelectedId: setInternalSelectedId }),
        [indent, onSelect, selectedId]
      )
    return (
      <TreeContext value={ctx}>
        <nav aria-label='File tree' className={cn('select-none overflow-auto text-sm', className)} {...props}>
          {children}
        </nav>
      </TreeContext>
    )
  },
  TreeFolder = ({
    children,
    className,
    defaultOpen = false,
    disabled,
    id,
    name,
    path
  }: {
    children?: React.ReactNode
    className?: string
    defaultOpen?: boolean
    disabled?: boolean
    id?: string
    name: string
    path?: string
  }) => {
    const { indent, onSelect, selectedId, setSelectedId } = use(TreeContext),
      depth = use(DepthContext),
      itemId = id ?? path ?? name,
      isSelected = selectedId === itemId,
      [open, setOpen] = useState(defaultOpen ? [itemId] : []),
      isOpen = open.includes(itemId),
      pl = `${String(depth * indent + 8)}px`
    return (
      <Accordion.Root onValueChange={v => setOpen(v as string[])} value={open}>
        <Accordion.Item value={itemId}>
          <Accordion.Trigger
            className={cn(
              'group flex w-full items-center gap-[7px] py-[1px] pr-2 text-left text-sm leading-6 cursor-pointer whitespace-nowrap hover:bg-[var(--idecn-hover,hsl(var(--accent)))]',
              isSelected && 'bg-[var(--idecn-selected,hsl(var(--accent)))]',
              disabled && 'pointer-events-none opacity-50',
              className
            )}
            onClick={() => {
              setSelectedId(itemId)
              onSelect?.({ id: itemId, name, path: path ?? name })
            }}
            style={{ paddingLeft: pl }}>
            <FolderIcon className='size-4 shrink-0 [&_svg]:size-4' name={name} open={isOpen} />
            <span>{name}</span>
          </Accordion.Trigger>
          <Accordion.Panel className='overflow-hidden h-(--accordion-panel-height) transition-[height] duration-150 ease-out data-ending-style:h-0 data-starting-style:h-0'>
            <DepthContext value={depth + 1}>{children}</DepthContext>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>
    )
  },
  TreeFile = ({
    className,
    disabled,
    id,
    name,
    path,
    ...props
  }: Omit<React.ComponentProps<'button'>, 'id'> & {
    disabled?: boolean
    id?: string
    name: string
    path?: string
  }) => {
    const { indent, onSelect, selectedId, setSelectedId } = use(TreeContext),
      depth = use(DepthContext),
      itemId = id ?? path ?? name,
      isSelected = selectedId === itemId,
      pl = `${String(depth * indent + 8)}px`
    return (
      <button
        className={cn(
          'group flex w-full items-center gap-[7px] py-[1px] pr-2 text-left text-sm leading-6 cursor-pointer whitespace-nowrap hover:bg-[var(--idecn-hover,hsl(var(--accent)))]',
          isSelected && 'bg-[var(--idecn-selected,hsl(var(--accent)))]',
          disabled && 'pointer-events-none opacity-50',
          className
        )}
        onClick={() => {
          if (!disabled) {
            setSelectedId(itemId)
            onSelect?.({ id: itemId, name, path: path ?? name })
          }
        }}
        style={{ paddingLeft: pl }}
        type='button'
        {...props}>
        <FileIcon className='size-4 shrink-0 [&_svg]:size-4' name={name} />
        <span>{name}</span>
      </button>
    )
  }
export { DepthContext, Tree, TreeContext, TreeFile, TreeFolder }
