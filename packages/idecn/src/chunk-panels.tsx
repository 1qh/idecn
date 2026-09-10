/* oxlint-disable react-perf/jsx-no-jsx-as-prop, react-perf/jsx-no-new-object-as-prop -- the nested base-ui render-prop triggers and inline style objects are the established idecn panel pattern */
'use client'
import type { ReactNode } from 'react'
import { cn } from '@a/ui'
import { Badge } from '@a/ui/badge'
import { Checkbox } from '@a/ui/checkbox'
import { Input } from '@a/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@a/ui/popover'
import { Textarea } from '@a/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@a/ui/tooltip'
import { useVirtualizer } from '@tanstack/react-virtual'
import { ChevronRight, Eye, Pencil, SlidersHorizontal } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Streamdown } from 'streamdown'
import { ScrubInput, TipButton } from './base'
import { rowStyle, textColor } from './chunk-color'

interface ChunkListEntry {
  color: string
  dirty?: boolean
  disabled?: boolean
  id: string
  located?: boolean
  order: number
  page?: number
  statusClass?: string
  text: string
}
interface ChunkListPanelProps {
  bulkActions?: (picked: readonly string[]) => ReactNode
  chunks: readonly ChunkListEntry[]
  density?: 'comfortable' | 'compact'
  emptyLabel?: ReactNode
  error?: boolean
  filter: string
  header?: ReactNode
  hoveredId?: null | string
  loading?: boolean
  onFilterChange: (value: string) => void
  onHover?: (id: null | string) => void
  onLoadMore?: () => void
  onPickedChange: (picked: ReadonlySet<string>) => void
  onRetry?: () => void
  onSelect: (id: string) => void
  picked: ReadonlySet<string>
  selectedId: null | string
}
const sizeToneColor = (length: number): string => {
  if (length < 200) return 'oklch(0.75 0.15 85)'
  if (length > 1800) return 'oklch(0.63 0.22 25)'
  return 'oklch(0.68 0.16 150)'
}
const ChunkListPanel = ({
  bulkActions,
  chunks,
  density = 'compact',
  emptyLabel,
  error,
  filter,
  header,
  hoveredId,
  loading,
  onFilterChange,
  onHover,
  onLoadMore,
  onPickedChange,
  onRetry,
  onSelect,
  picked,
  selectedId
}: ChunkListPanelProps) => {
  const [anchor, setAnchor] = useState<null | number>(null)
  const [expandedChunks, setExpandedChunks] = useState<ReadonlySet<string>>(() => new Set())
  const listRef = useRef<HTMLDivElement>(null)
  const maxLength = useMemo(() => {
    let max = 1
    for (const chunk of chunks) if (chunk.text.length > max) max = chunk.text.length
    return max
  }, [chunks])
  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: chunks.length,
    estimateSize: () => 68,
    getScrollElement: () => listRef.current,
    overscan: 12
  })
  const selectedIndex = chunks.findIndex(chunk => chunk.id === selectedId)
  useEffect(() => {
    if (selectedIndex !== -1) rowVirtualizer.scrollToIndex(selectedIndex, { align: 'auto' })
  }, [selectedIndex, rowVirtualizer])
  const togglePick = (index: number, id: string, shiftKey: boolean) => {
    const next = new Set(picked)
    if (shiftKey && anchor !== null) {
      const lo = Math.min(anchor, index)
      const hi = Math.max(anchor, index)
      for (let i = lo; i <= hi; i += 1) {
        const row = chunks[i]
        if (row) next.add(row.id)
      }
    } else if (next.has(id)) next.delete(id)
    else next.add(id)
    if (!shiftKey) setAnchor(index)
    onPickedChange(next)
  }
  const allPicked = chunks.length > 0 && chunks.every(chunk => picked.has(chunk.id))
  const somePicked = picked.size > 0 && !allPicked
  const toggleAll = () => onPickedChange(allPicked ? new Set() : new Set(chunks.map(chunk => chunk.id)))
  const pickedIds = useMemo(() => [...picked], [picked])
  return (
    <div className='@container flex h-full min-h-0 min-w-0 flex-col overflow-auto'>
      <div className='flex shrink-0 flex-col gap-2 p-2'>
        {header}
        <div className='flex items-center gap-1.5'>
          <Checkbox
            aria-label='Select all shown chunks'
            checked={allPicked}
            className='shrink-0'
            indeterminate={somePicked}
            onClick={toggleAll}
          />
          <Input
            className='h-6 flex-1 text-xs'
            onChange={event => onFilterChange(event.target.value)}
            placeholder='filter chunks…'
            value={filter}
          />
          <span className='shrink-0 px-1 text-[11px] text-muted-foreground tabular-nums'>{chunks.length}</span>
        </div>
        {picked.size > 0 ? (
          <div className='flex items-center px-1 text-[11px] text-muted-foreground'>
            <span className='flex-1 tabular-nums'>{picked.size} selected</span>
            {bulkActions?.(pickedIds)}
          </div>
        ) : null}
      </div>
      <div
        className='min-h-0 flex-1 overflow-auto'
        onScroll={event => {
          if (!onLoadMore) return
          const el = event.currentTarget
          if (el.scrollHeight - el.scrollTop - el.clientHeight < el.clientHeight * 1.5) onLoadMore()
        }}
        ref={listRef}>
        {loading && chunks.length === 0 ? (
          <div className='flex flex-col gap-1 p-2'>
            {['a', 'b', 'c', 'd'].map(key => (
              <div className='h-8 animate-pulse rounded bg-muted' key={key} />
            ))}
          </div>
        ) : null}
        {error && chunks.length === 0 ? (
          <button
            className='flex w-full items-center justify-center gap-1.5 p-4 text-xs text-destructive hover:underline'
            onClick={() => onRetry?.()}
            type='button'>
            couldn’t load chunks · retry
          </button>
        ) : null}
        {!(loading || error) && chunks.length === 0 ? (
          <div className='p-4 text-center text-xs text-muted-foreground'>{emptyLabel ?? 'No chunks.'}</div>
        ) : null}
        <div className='relative w-full' style={{ height: `${String(rowVirtualizer.getTotalSize())}px` }}>
          {rowVirtualizer.getVirtualItems().map(virtualRow => {
            const entry = chunks[virtualRow.index]
            if (!entry) return null
            const selected = entry.id === selectedId
            const inPicked = picked.has(entry.id)
            const hovered = entry.id === hoveredId
            const expanded = expandedChunks.has(entry.id)
            const { length } = entry.text
            return (
              <div
                className='absolute top-0 left-0 w-full px-2'
                data-index={virtualRow.index}
                key={entry.id}
                ref={rowVirtualizer.measureElement}
                style={{ transform: `translateY(${String(virtualRow.start)}px)` }}>
                <div
                  className={cn(
                    'group flex w-full items-start gap-2 rounded-md px-2 py-1.5 transition-[filter] hover:brightness-110',
                    selected && 'ring-1 ring-inset',
                    hovered && !selected && 'brightness-110 ring-1 ring-inset',
                    entry.disabled && 'opacity-50'
                  )}
                  style={rowStyle(entry.color, selected)}>
                  <Checkbox
                    aria-label={inPicked ? `Deselect chunk ${String(entry.order)}` : `Select chunk ${String(entry.order)}`}
                    checked={inPicked}
                    className='mt-1 shrink-0'
                    onClick={event => togglePick(virtualRow.index, entry.id, event.shiftKey)}
                  />
                  <button
                    aria-label={`Open chunk ${String(entry.order)}`}
                    className={cn('flex min-w-0 flex-1 flex-col gap-1 text-left', selected && 'font-medium')}
                    onClick={() => onSelect(entry.id)}
                    onPointerEnter={() => onHover?.(entry.id)}
                    onPointerLeave={() => onHover?.(null)}
                    type='button'>
                    <span className='flex items-center gap-1 text-[11px] tabular-nums' style={textColor(entry.color)}>
                      <span
                        className={cn(
                          'size-2 shrink-0 rounded-full',
                          entry.statusClass ?? (entry.disabled ? 'bg-muted-foreground' : 'bg-current')
                        )}
                      />
                      #{entry.order}
                      {entry.page === undefined ? null : <span className='opacity-70'> · p{entry.page}</span>}
                      {entry.dirty ? (
                        <span className='size-1.5 shrink-0 rounded-full bg-primary' title='Unsaved edit' />
                      ) : null}
                      {entry.located === false ? (
                        <Badge className='shrink-0' variant='destructive'>
                          absent
                        </Badge>
                      ) : null}
                      {entry.disabled ? (
                        <Badge className='shrink-0' variant='outline'>
                          disabled
                        </Badge>
                      ) : null}
                    </span>
                    <span
                      className={cn(
                        density === 'comfortable' ? 'line-clamp-4' : 'line-clamp-2',
                        expanded && 'line-clamp-none'
                      )}
                      title={entry.text}>
                      {entry.text}
                    </span>
                    <span className='flex items-center gap-1.5' title={`${String(length)} characters`}>
                      <span className='h-1 flex-1 overflow-hidden rounded-full bg-muted'>
                        <span
                          className='block h-full rounded-full'
                          style={{
                            backgroundColor: sizeToneColor(length),
                            width: `${String(Math.max(4, Math.round((length / maxLength) * 100)))}%`
                          }}
                        />
                      </span>
                      <span className='shrink-0 font-mono text-[10px] text-muted-foreground tabular-nums'>{length}</span>
                    </span>
                  </button>
                  <TipButton
                    className='mt-0.5 shrink-0 rounded p-0.5 text-muted-foreground opacity-0 hover:bg-accent hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100'
                    label={expanded ? `Collapse chunk ${String(entry.order)}` : `Expand chunk ${String(entry.order)}`}
                    onClick={() =>
                      setExpandedChunks(previous => {
                        const next = new Set(previous)
                        if (next.has(entry.id)) next.delete(entry.id)
                        else next.add(entry.id)
                        return next
                      })
                    }>
                    <ChevronRight className={cn('size-3 transition-transform', expanded && 'rotate-90')} />
                  </TipButton>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
interface ChunkEditorPanelProps {
  editor?: (props: {
    fontSize: number
    onChange: (value: string) => void
    onCursor?: (position: number) => void
    value: string
  }) => ReactNode
  emptyLabel?: ReactNode
  extra?: ReactNode
  extraInPopover?: boolean
  fontSize?: number
  heading?: ReactNode
  onChange: (value: string) => void
  onCursor?: (position: number) => void
  onFontSize?: (value: number) => void
  placeholder?: string
  show: boolean
  subject?: ReactNode
  toolbar: ReactNode
  value: string
}
const ChunkEditorPanel = ({
  editor,
  emptyLabel,
  extra,
  extraInPopover = false,
  fontSize = 13,
  heading,
  onChange,
  onCursor,
  onFontSize,
  placeholder,
  show,
  subject,
  toolbar,
  value
}: ChunkEditorPanelProps) => {
  const style = useMemo(() => ({ fontSize: `${String(fontSize)}px` }), [fontSize])
  const [preview, setPreview] = useState(false)
  const modeLabel = preview ? 'Previewing' : 'Editing'
  const headerNode: ReactNode =
    subject === undefined ? (
      heading
    ) : (
      <>
        {modeLabel} {subject}
      </>
    )
  const editorBody = (): ReactNode => {
    if (editor)
      return <div className='flex min-h-0 flex-1 flex-col'>{editor({ fontSize, onChange, onCursor, value })}</div>
    if (preview)
      return (
        <div className='min-h-0 flex-1 overflow-auto px-3 py-1' style={style}>
          <Streamdown>{value}</Streamdown>
        </div>
      )
    return (
      <Textarea
        className='min-h-0 flex-1 resize-none rounded-none border-0 px-3 font-mono focus-visible:border-0 focus-visible:ring-0'
        onChange={event => onChange(event.target.value)}
        onSelect={event => onCursor?.(event.currentTarget.selectionStart)}
        placeholder={placeholder}
        style={style}
        value={value}
      />
    )
  }
  if (!show)
    return (
      <div className='@container flex h-full min-h-0 min-w-0 flex-col items-center justify-center overflow-auto p-4 text-center text-sm text-muted-foreground'>
        {emptyLabel ?? 'Select a chunk to edit it.'}
      </div>
    )
  return (
    <div className='@container flex h-full min-h-0 min-w-0 flex-col overflow-auto'>
      <div className='flex shrink-0 flex-wrap items-center justify-between gap-1 px-2'>
        <div className='min-w-0 truncate text-xs text-muted-foreground'>{headerNode}</div>
        <div className='flex shrink-0 flex-wrap items-center gap-1 [&_button]:inline-flex [&_button]:size-8 [&_button]:items-center [&_button]:justify-center [&_button]:rounded-md [&_button]:hover:bg-accent [&_svg]:size-4'>
          {toolbar}
          {extra && extraInPopover ? (
            <Popover>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <PopoverTrigger aria-label='Keywords and questions'>
                      <SlidersHorizontal />
                    </PopoverTrigger>
                  }
                />
                <TooltipContent>Keywords and questions</TooltipContent>
              </Tooltip>
              <PopoverContent align='end' className='flex w-80 max-w-[92vw] flex-col gap-1.5 p-2'>
                {extra}
              </PopoverContent>
            </Popover>
          ) : null}
          {editor ? null : (
            <TipButton
              label={preview ? 'Edit markdown' : 'Preview markdown'}
              onClick={() => setPreview(shown => !shown)}
              title={preview ? 'Edit' : 'Preview'}>
              {preview ? <Pencil /> : <Eye />}
            </TipButton>
          )}
          {onFontSize ? (
            <ScrubInput
              ariaLabel='Editor font size'
              label='Font'
              max={48}
              min={9}
              onChange={onFontSize}
              title='px'
              value={fontSize}
            />
          ) : null}
        </div>
      </div>
      {editorBody()}
      {extra && !extraInPopover ? <div className='flex shrink-0 flex-col gap-1.5 p-2 pt-0'>{extra}</div> : null}
    </div>
  )
}
export { ChunkEditorPanel, ChunkListPanel }
export type { ChunkEditorPanelProps, ChunkListEntry, ChunkListPanelProps }
