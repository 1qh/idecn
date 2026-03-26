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
  ITEM_CLASS =
    'group flex w-full items-center gap-[7px] py-[1px] pr-2 text-left text-sm leading-6 cursor-pointer whitespace-nowrap hover:bg-accent',
  ICON_CLASS = 'size-4 shrink-0 [&_svg]:size-4',
  useTreeItem = (id: string | undefined, name: string, path: string | undefined) => {
    const { indent, onSelect, selectedId, setSelectedId } = use(TreeContext),
      depth = use(DepthContext),
      itemId = id ?? path ?? name,
      isSelected = selectedId === itemId,
      pl = `${String(depth * indent + 8)}px`,
      select = () => {
        setSelectedId(itemId)
        onSelect?.({ id: itemId, name, path: path ?? name })
      }
    return { depth, iconClass: ICON_CLASS, isSelected, itemId, pl, select }
  },
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
    const { depth, iconClass, isSelected, itemId, pl, select } = useTreeItem(id, name, path),
      [open, setOpen] = useState(defaultOpen ? [itemId] : []),
      isOpen = open.includes(itemId)
    return (
      <Accordion.Root onValueChange={v => setOpen(v as string[])} value={open}>
        <Accordion.Item value={itemId}>
          <Accordion.Trigger
            className={cn(ITEM_CLASS, isSelected && 'bg-accent', disabled && 'pointer-events-none opacity-50', className)}
            onClick={select}
            style={{ paddingLeft: pl }}>
            <FolderIcon className={iconClass} name={name} open={isOpen} />
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
    const { iconClass, isSelected, pl, select } = useTreeItem(id, name, path)
    return (
      <button
        className={cn(ITEM_CLASS, isSelected && 'bg-accent', disabled && 'pointer-events-none opacity-50', className)}
        onClick={() => {
          if (!disabled) select()
        }}
        style={{ paddingLeft: pl }}
        type='button'
        {...props}>
        <FileIcon className={iconClass} name={name} />
        <span>{name}</span>
      </button>
    )
  }
export { DepthContext, ICON_CLASS, Tree, TreeContext, TreeFile, TreeFolder }
