/** biome-ignore-all lint/correctness/useUniqueElementIds: dockview panel ids are stable layout keys, not DOM element ids */
'use client'
import type { ReactNode } from 'react'
import { cn } from '@a/ui'
import { Badge } from '@a/ui/components/badge'
import { Button } from '@a/ui/components/button'
import { Dialog, DialogContent, DialogTitle } from '@a/ui/components/dialog'
import { Input } from '@a/ui/components/input'
import { Popover, PopoverContent, PopoverTrigger } from '@a/ui/components/popover'
import { Textarea } from '@a/ui/components/textarea'
import { Toggle } from '@a/ui/components/toggle'
import { Tooltip, TooltipContent, TooltipTrigger } from '@a/ui/components/tooltip'
import { createCapture } from 'headrace/repro'
import {
  Check,
  Combine,
  Eye,
  EyeOff,
  FilePlus,
  FileText,
  List,
  Moon,
  Pencil,
  Replace,
  Rows2,
  Rows3,
  SquareSplitHorizontal,
  Sun,
  Trash2,
  X,
  ZoomIn,
  ZoomOut
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { mergeChunkTexts, splitChunkText,findReplaceChunks } from 'ragworks/chunk-edit'
import { chunkKey, pollUntilChanged, pollUntilKey } from 'ragworks/chunk-poll'
import { chunkPreviews } from 'ragworks/synthetic'
import { createContext, use, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import type { ChunkListEntry, PdfRegion, WorkspaceRef } from './idecn'
import {
  chunkColor,
  ChunkEditorPanel,
  ChunkListPanel,
  chunkSpansToAnnotations,
  IconButton,
  PdfViewer,
  Tab,
  TextAnnotationHost,
  Workspace
} from './idecn'
type Box = readonly [number, number, number, number]
type ChunksView = SpatialView | TextView
type InitResult = 'error' | 'no-token' | 'ok'
type Mutation =
  | { action: 'batch-edit'; edits: { chunkId: string; content: string }[] }
  | { action: 'create-region'; box: Box; page: number }
  | { action: 'create-text'; content: string }
  | { action: 'delete'; chunkId: string }
  | { action: 'edit'; chunkId: string; content: string }
  | { action: 'merge'; content: string; dropIds: string[]; keepId: string }
  | { action: 'resize'; box: Box; chunkId: string; page: number }
  | { action: 'set-available'; available: boolean; items: { chunkId: string; content: string }[] }
  | { action: 'set-keywords'; chunkId: string; content: string; keywords: string[]; questions: string[] }
  | { action: 'split'; chunkId: string; first: string; second: string }
interface MutationResult {
  error?: string
  ok: boolean
  status: number
}
/** ChunkStudio — a source-agnostic chunk editor, the assembled editor over idecn's panels.
 *
 * It renders a foreign RAG's document, its chunks located on the page (or as text spans), and a full
 * editing surface — edit, split, merge, create by drawing a box or selecting text, resize a region,
 * disable, keywords, find-and-replace across chunks — entirely over a `StudioSource` the consumer
 * supplies. The source is the ONLY product-specific piece: it fetches the chunks and document, applies a
 * mutation, and reports progress; everything else (the state machine, the eventual-consistency poll, the
 * provenance hover-sync, the size and coverage signals, the undo guards) lives here and is shared. The
 * logic is ragworks (poll, merge/split, find-replace, previews) and the plumbing is leat (repro capture);
 * this file is the UI that binds them to the panels.
 *
 * A single-document consumer renders `<ChunkStudio source={…} />` for the three-pane shell; a multi-document
 * host composes the pieces (`useStudio`, `StudioProvider`, the three views) inside its own shell. */
interface Region {
  box: readonly [number, number, number, number]
  page: number
}
interface SpatialChunk {
  available: boolean
  coverage: number
  id: string
  keywords: string[]
  located: boolean
  questions: string[]
  regions: Region[]
  text: string
}
interface SpatialView {
  boxRate: number
  chunks: SpatialChunk[]
  meanCoverage: number
  modality: 'spatial'
  pageCount: number
  total: number
  unlocated: number
}
interface StudioCopy {
  error: string
  noToken: string
  opening: string
}
interface StudioSource {
  documentSrc: () => string
  fetchChunks: (onProgress?: (label: string) => void) => Promise<ChunksView>
  init: () => Promise<InitResult>
  mutate: (mutation: Mutation) => Promise<MutationResult>
}
interface StudioValue {
  busy: boolean
  colorOf: (id: string) => string
  creating: boolean
  data: ChunksView
  density: 'comfortable' | 'compact'
  documentSrc: string
  draft: string
  editorFont: number
  filter: string
  hoveredId: null | string
  keywordsDraft: string
  onCancelCreate: () => void
  onClearSelection: () => void
  onCreateText: () => void
  onDelete: () => void
  onDraftChange: (value: string) => void
  onEditorFont: (value: number) => void
  onFilterChange: (value: string) => void
  onHover: (id: null | string) => void
  onKeywordsDraftChange: (value: string) => void
  onMerge: () => void
  onPickedChange: (next: ReadonlySet<string>) => void
  onQuestionsDraftChange: (value: string) => void
  onSave: () => void
  onSaveKeywords: () => void
  onSplit: (caret: number) => void
  onToggleAvailable: (ids: string[]) => void
  onToggleDensity: () => void
  onZoom: (delta: number) => void
  orderOf: (id: string) => number
  picked: ReadonlySet<string>
  previewOf: (id: string) => string
  questionsDraft: string
  runMutation: (mutation: Mutation) => Promise<boolean>
  scale: number
  select: (chunkId: string) => void
  selectedId: null | string
  setScale: (updater: (value: number) => number) => void
  shownChunks: (SpatialChunk | TextChunk)[]
}
interface TextChunk {
  available: boolean
  charspan: null | readonly [number, number]
  id: string
  keywords: string[]
  located: boolean
  questions: string[]
  text: string
}
interface TextView {
  chunks: TextChunk[]
  matchRate: number
  modality: 'text'
  text: string
  total: number
  unlocated: number
}
const DEFAULT_COPY: StudioCopy = {
  error: 'Could not open this document.',
  noToken: 'Open this tool with a launch link.',
  opening: 'Opening document…'
}
type Phase = 'authing' | 'error' | 'init' | 'no-token' | 'ready'
const MAX_FONT = 48
const StudioContext = createContext<null | StudioValue>(null)
const
StudioContext.displayName = "StudioContext"; useSt = (): StudioValue => {
  const value = use(StudioContext)
  if (!value) throw new Error('useSt must be used within a ChunkStudio')
  return value
}
const parseLines = (value: string): string[] =>
  value
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
const metaZoomDelta = (event: KeyboardEvent): null | number => {
  if (!(event.metaKey || event.ctrlKey)) return null
  if (event.key === '=' || event.key === '+') return 1
  if (event.key === '-') return -1
  if (event.key === '0') return 0
  return null
}
const withAvailability = (current: ChunksView, ids: ReadonlySet<string>, available: boolean): ChunksView => {
  const next = structuredClone(current)
  for (const chunk of next.chunks) if (ids.has(chunk.id)) chunk.available = available
  return next
}
const nextChunkId = (list: readonly { id: string }[], selectedId: null | string, key: string): string | undefined => {
  const at = list.findIndex(chunk => chunk.id === selectedId)
  const idx = key === 'j' ? Math.min(list.length - 1, at + 1) : Math.max(0, at - 1)
  return list[at === -1 ? 0 : idx]?.id
}
const useStudio = (
  source: StudioSource,
  reproGlobal?: string
): { phase: Phase; progress: string; studio: null | StudioValue } => {
  const [phase, setPhase] = useState<Phase>('init')
  const [data, setData] = useState<ChunksView | null>(null)
  const [selectedId, setSelectedId] = useState<null | string>(null)
  const [draft, setDraft] = useState('')
  const [keywordsDraft, setKeywordsDraft] = useState('')
  const [questionsDraft, setQuestionsDraft] = useState('')
  const [creating, setCreating] = useState(false)
  const [picked, setPicked] = useState<ReadonlySet<string>>(() => new Set())
  const [busy, setBusy] = useState(false)
  const [scale, setScale] = useState(1.4)
  const [filter, setFilter] = useState('')
  const [editorFont, setEditorFont] = useState(12)
  const [hoveredId, setHoveredId] = useState<null | string>(null)
  const [density, setDensity] = useState<'comfortable' | 'compact'>('compact')
  const onToggleDensity = useCallback(() => setDensity(current => (current === 'compact' ? 'comfortable' : 'compact')), [])
  const [progress, setProgress] = useState('')
  const capture = useMemo(() => createCapture('document'), [])
  useEffect(() => {
    if (reproGlobal) Reflect.set(globalThis, reproGlobal, () => capture.export())
  }, [capture, reproGlobal])
  const { resolvedTheme } = useTheme()
  const dark = resolvedTheme === 'dark'
  const startedRef = useRef(false)
  const dataRef = useRef<ChunksView | null>(null)
  useEffect(() => {
    dataRef.current = data
  }, [data])
  const keyOf = useCallback((value: ChunksView): string => chunkKey(value.chunks), [])
  const refresh = useCallback(async () => {
    try {
      setData(await source.fetchChunks(setProgress))
    } finally {
      setProgress('')
    }
  }, [source])
  const refreshUntilChanged = useCallback(
    async (beforeKey: string): Promise<void> => {
      try {
        setData(await pollUntilChanged({ beforeKey, fetch: async () => source.fetchChunks(setProgress), keyOf }))
      } finally {
        setProgress('')
      }
    },
    [keyOf, source]
  )
  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    ;(async () => {
      setPhase('authing')
      const result = await source.init()
      if (result === 'no-token') {
        setPhase('no-token')
        return
      }
      if (result === 'error') {
        setPhase('error')
        return
      }
      await refresh()
      setPhase('ready')
    })().catch(() => setPhase('error'))
  }, [refresh, source])
  useEffect(() => {
    if (busy && progress !== '') toast.loading(progress, { id: 'render-progress' })
    else toast.dismiss('render-progress')
  }, [busy, progress])
  const indexById = useMemo(() => new Map((data?.chunks ?? []).map((chunk, index) => [chunk.id, index] as const)), [data])
  const colorOf = useCallback((id: string) => chunkColor(indexById.get(id) ?? 0, dark), [indexById, dark])
  const orderOf = useCallback((id: string) => (indexById.get(id) ?? 0) + 1, [indexById])
  const previewById = useMemo(() => {
    const chunks = data?.chunks ?? []
    const previews = chunkPreviews(chunks.map(chunk => chunk.text))
    return new Map(chunks.map((chunk, index) => [chunk.id, previews[index] ?? chunk.text] as const))
  }, [data])
  const previewOf = useCallback((id: string) => previewById.get(id) ?? '', [previewById])
  const runMutation = useCallback(
    async (mutation: Mutation): Promise<boolean> => {
      capture.record(mutation.action)
      setBusy(true)
      const beforeKey = chunkKey(dataRef.current?.chunks ?? [])
      try {
        const result = await source.mutate(mutation)
        if (result.ok) {
          const { current } = dataRef
          if (mutation.action === 'set-available' && current) {
            const ids = new Set(mutation.items.map(item => item.chunkId))
            const expected = withAvailability(current, ids, mutation.available)
            setData(expected)
            try {
              setData(await pollUntilKey({ expected, fetch: async () => source.fetchChunks(setProgress), keyOf }))
            } finally {
              setProgress('')
            }
          } else await refreshUntilChanged(beforeKey)
          return true
        }
        toast.error(result.error ?? `failed (${result.status})`)
        return false
      } catch {
        toast.error('request failed')
        return false
      } finally {
        setBusy(false)
      }
    },
    [capture, keyOf, refreshUntilChanged, source]
  )
  const select = useCallback(
    (chunkId: string) => {
      const prevId = selectedId
      const prevDraft = draft
      const prevKw = keywordsDraft
      const prevQ = questionsDraft
      const prevChunk = prevId === null ? undefined : data?.chunks.find(entry => entry.id === prevId)
      if (!creating && prevId !== null && prevId !== chunkId && prevChunk && prevChunk.text !== prevDraft)
        toast('unsaved edit set aside', {
          action: {
            label: 'resume',
            onClick: () => {
              setCreating(false)
              setSelectedId(prevId)
              setDraft(prevDraft)
              setKeywordsDraft(prevKw)
              setQuestionsDraft(prevQ)
            }
          }
        })
      setCreating(false)
      setSelectedId(chunkId)
      const chunk = data?.chunks.find(entry => entry.id === chunkId)
      setDraft(chunk?.text ?? '')
      setKeywordsDraft((chunk?.keywords ?? []).join('\n'))
      setQuestionsDraft((chunk?.questions ?? []).join('\n'))
    },
    [creating, data, draft, keywordsDraft, questionsDraft, selectedId]
  )
  const onSaveKeywords = useCallback(() => {
    if (selectedId === null) return
    runMutation({
      action: 'set-keywords',
      chunkId: selectedId,
      content: draft,
      keywords: parseLines(keywordsDraft),
      questions: parseLines(questionsDraft)
    }).catch(() => undefined)
  }, [draft, keywordsDraft, questionsDraft, runMutation, selectedId])
  const resyncEdit = useCallback(
    (chunkId: string, content: string) => {
      runMutation({ action: 'edit', chunkId, content }).catch(() => undefined)
    },
    [runMutation]
  )
  const saveEdit = useCallback(
    (chunkId: string, previous: string, next: string) => {
      runMutation({ action: 'edit', chunkId, content: next })
        .then(
          ok => ok && toast('chunk edited', { action: { label: 'undo', onClick: () => resyncEdit(chunkId, previous) } })
        )
        .catch(() => undefined)
    },
    [resyncEdit, runMutation]
  )
  const onSave = useCallback(() => {
    if (draft.trim().length === 0) {
      toast.error('chunk text is empty')
      return
    }
    if (creating) {
      runMutation({ action: 'create-text', content: draft })
        .then(ok => ok && setCreating(false))
        .catch(() => undefined)
      return
    }
    const chunkId = selectedId ?? ''
    const previous = data?.chunks.find(chunk => chunk.id === chunkId)?.text ?? ''
    if (previous !== draft) saveEdit(chunkId, previous, draft)
  }, [creating, data, draft, runMutation, saveEdit, selectedId])
  const onSplit = useCallback(
    (caret: number) => {
      const { first, second } = splitChunkText(draft, caret, { keepHeading: true })
      if (first.trim().length === 0 || second.trim().length === 0) {
        toast.error('place the cursor between two non-empty parts')
        return
      }
      runMutation({ action: 'split', chunkId: selectedId ?? '', first, second }).catch(() => undefined)
    },
    [draft, runMutation, selectedId]
  )
  const onMerge = useCallback(() => {
    const ordered = (data?.chunks ?? []).filter(chunk => picked.has(chunk.id))
    if (ordered.length < 2) return
    const content = mergeChunkTexts(
      ordered.map(chunk => chunk.text),
      { dedupeHeading: true }
    )
    const ids = ordered.map(chunk => chunk.id)
    runMutation({ action: 'merge', content, dropIds: ids.slice(1), keepId: ids[0] ?? '' })
      .then(ok => {
        if (ok) setPicked(new Set())
      })
      .catch(() => undefined)
  }, [data, picked, runMutation])
  const onPickedChange = useCallback((next: ReadonlySet<string>) => setPicked(next), [])
  const onEditorFont = useCallback((value: number) => {
    setEditorFont(Math.max(9, Math.min(MAX_FONT, Math.round(value))))
  }, [])
  const shownChunks = useMemo(() => {
    const chunks = data?.chunks ?? []
    const needle = filter.trim().toLowerCase()
    return needle.length === 0 ? chunks : chunks.filter(chunk => chunk.text.toLowerCase().includes(needle))
  }, [data, filter])
  const onClearSelection = useCallback(() => {
    setSelectedId(null)
    setCreating(false)
    setPicked(new Set())
  }, [])
  const onZoom = useCallback((delta: number) => {
    setEditorFont(prev => (delta === 0 ? 12 : Math.min(MAX_FONT, Math.max(9, prev + delta))))
  }, [])
  const onHover = useCallback((id: null | string) => setHoveredId(id), [])
  const onDelete = useCallback(() => {
    runMutation({ action: 'delete', chunkId: selectedId ?? '' })
      .then(ok => {
        if (ok) setSelectedId(null)
      })
      .catch(() => undefined)
  }, [runMutation, selectedId])
  const onToggleAvailable = useCallback(
    (ids: string[]) => {
      const targets = (data?.chunks ?? []).filter(chunk => ids.includes(chunk.id))
      if (targets.length === 0) return
      const available = !targets.every(chunk => chunk.available)
      const items = targets.map(chunk => ({ chunkId: chunk.id, content: chunk.text }))
      runMutation({ action: 'set-available', available, items })
        .then(ok => {
          if (ok) setPicked(new Set())
        })
        .catch(() => undefined)
    },
    [data, runMutation]
  )
  const onCreateText = useCallback(() => {
    setCreating(true)
    setSelectedId(null)
    setDraft('')
    setKeywordsDraft('')
    setQuestionsDraft('')
  }, [])
  const onCancelCreate = useCallback(() => {
    setCreating(false)
    setDraft('')
    setKeywordsDraft('')
    setQuestionsDraft('')
  }, [])
  const studio = useMemo<null | StudioValue>(
    () =>
      data
        ? {
            busy,
            colorOf,
            creating,
            data,
            density,
            documentSrc: source.documentSrc(),
            draft,
            editorFont,
            filter,
            hoveredId,
            keywordsDraft,
            onCancelCreate,
            onClearSelection,
            onCreateText,
            onDelete,
            onDraftChange: setDraft,
            onEditorFont,
            onFilterChange: setFilter,
            onHover,
            onKeywordsDraftChange: setKeywordsDraft,
            onMerge,
            onPickedChange,
            onQuestionsDraftChange: setQuestionsDraft,
            onSave,
            onSaveKeywords,
            onSplit,
            onToggleAvailable,
            onToggleDensity,
            onZoom,
            orderOf,
            picked,
            previewOf,
            questionsDraft,
            runMutation,
            scale,
            select,
            selectedId,
            setScale,
            shownChunks
          }
        : null,
    [
      busy,
      colorOf,
      creating,
      data,
      density,
      draft,
      editorFont,
      filter,
      hoveredId,
      keywordsDraft,
      onCancelCreate,
      onClearSelection,
      onCreateText,
      onDelete,
      onEditorFont,
      onHover,
      onMerge,
      onPickedChange,
      onSave,
      onSaveKeywords,
      onSplit,
      onToggleAvailable,
      onToggleDensity,
      onZoom,
      orderOf,
      picked,
      previewOf,
      questionsDraft,
      runMutation,
      scale,
      select,
      selectedId,
      shownChunks,
      source
    ]
  )
  return { phase, progress, studio }
}
type ShownChunk = SpatialChunk | TextChunk
const PARTIAL_COVERAGE = 0.5
const isPartial = (chunk: ShownChunk): boolean => 'coverage' in chunk && chunk.located && chunk.coverage < PARTIAL_COVERAGE
const partialCount = (chunks: readonly ShownChunk[]): number => chunks.filter(isPartial).length
const rateOf = (data: ChunksView): { label: string; rate: number } =>
  data.modality === 'spatial' ? { label: 'boxed', rate: data.boxRate } : { label: 'located', rate: data.matchRate }
const sizeSummary = (chunks: ShownChunk[]): { huge: number; median: number; tiny: number } => {
  if (chunks.length === 0) return { huge: 0, median: 0, tiny: 0 }
  const lengths = chunks.map(chunk => chunk.text.length).toSorted((a, b) => a - b)
  const mid = Math.floor(lengths.length / 2)
  const median =
    lengths.length % 2 === 0 ? Math.round(((lengths[mid - 1] ?? 0) + (lengths[mid] ?? 0)) / 2) : (lengths[mid] ?? 0)
  return {
    huge: lengths.filter(length => length > 1800).length,
    median,
    tiny: lengths.filter(length => length < 200).length
  }
}
const pageOf = (chunk: ShownChunk): number | undefined => ('regions' in chunk ? chunk.regions[0]?.page : undefined)
const findReplacePlan = (
  chunks: readonly ShownChunk[],
  spec: { caseSensitive: boolean; find: string; regex: boolean; replace: string; wholeWord: boolean }
): { after: string; id: string; matchCount: number }[] => {
  if (spec.find === '') return []
  try {
    return findReplaceChunks(
      chunks.map(chunk => ({ id: chunk.id, text: chunk.text })),
      spec
    )
  } catch {
    return []
  }
}
const FindReplace = () => {
  const { busy, data, runMutation } = useSt()
  const [find, setFind] = useState('')
  const [replace, setReplace] = useState('')
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [wholeWord, setWholeWord] = useState(false)
  const [regex, setRegex] = useState(false)
  const changes = findReplacePlan(data.chunks, { caseSensitive, find, regex, replace, wholeWord })
  const matches = changes.reduce((total, change) => total + change.matchCount, 0)
  const apply = () => {
    if (changes.length === 0) return
    runMutation({ action: 'batch-edit', edits: changes.map(change => ({ chunkId: change.id, content: change.after })) })
      .then(ok => {
        if (ok) {
          setFind('')
          setReplace('')
        }
      })
      .catch(() => undefined)
  }
  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger
          render={
            <PopoverTrigger
              render={
                <Button aria-label='Find & replace across chunks' size='icon-sm' variant='ghost'>
                  <Replace className='size-4' />
                </Button>
              }
            />
          }
        />
        <TooltipContent>Find & replace across chunks</TooltipContent>
      </Tooltip>
      <PopoverContent align='end' className='flex w-80 flex-col gap-2'>
        <Input onChange={event => setFind(event.target.value)} placeholder='Find' value={find} />
        <Input onChange={event => setReplace(event.target.value)} placeholder='Replace with' value={replace} />
        <span className='flex items-center justify-between gap-2'>
          <span className='flex items-center gap-1'>
            <Toggle
              onPressedChange={setCaseSensitive}
              pressed={caseSensitive}
              size='sm'
              title='Case sensitive'
              variant='outline'>
              Aa
            </Toggle>
            <Toggle onPressedChange={setWholeWord} pressed={wholeWord} size='sm' title='Whole word' variant='outline'>
              W
            </Toggle>
            <Toggle onPressedChange={setRegex} pressed={regex} size='sm' title='Regular expression' variant='outline'>
              .*
            </Toggle>
          </span>
          <span className='text-muted-foreground text-xs tabular-nums'>
            {find === '' ? '' : `${String(matches)} in ${String(changes.length)}`}
          </span>
        </span>
        <Button disabled={busy || changes.length === 0} onClick={apply} size='sm'>
          Replace all
        </Button>
      </PopoverContent>
    </Popover>
  )
}
const ListHeader = () => {
  const { busy, data, density, onCreateText, onToggleDensity } = useSt()
  const { label, rate } = rateOf(data)
  const size = sizeSummary(data.chunks)
  return (
    <div className='flex flex-wrap items-center gap-2'>
      <Badge variant='secondary'>
        {Math.round(rate * 100)}% {label}
      </Badge>
      <span
        className='text-muted-foreground text-xs tabular-nums'
        title='A partial box covers under half its chunk — the reader found the header but not the body text; review it before trusting the region'>
        {data.total - data.unlocated}/{data.total} located · {data.unlocated} absent
        {partialCount(data.chunks) > 0 ? ` · ${partialCount(data.chunks)} partial` : ''}
      </span>
      <span
        className='text-muted-foreground text-xs tabular-nums'
        title='Chunk size drives retrieval quality — amber under 200 chars, rose over 1800'>
        ~{size.median} median{size.tiny > 0 ? ` · ${size.tiny} tiny` : ''}
        {size.huge > 0 ? ` · ${size.huge} huge` : ''}
      </span>
      <span className='ml-auto flex items-center'>
        <FindReplace />
        <IconButton
          icon={density === 'compact' ? Rows3 : Rows2}
          label={density === 'compact' ? 'Comfortable rows' : 'Compact rows'}
          onClick={onToggleDensity}
        />
        <IconButton disabled={busy} icon={FilePlus} label='Author text chunk' onClick={onCreateText} />
      </span>
    </div>
  )
}
const BulkActions = ({ picked }: { picked: readonly string[] }) => {
  const { busy, data, onMerge, onToggleAvailable } = useSt()
  const chunkById = useMemo(() => new Map(data.chunks.map(chunk => [chunk.id, chunk])), [data])
  const allAvailable = picked.every(id => chunkById.get(id)?.available ?? true)
  return (
    <span className='flex items-center'>
      <IconButton
        disabled={busy || picked.length < 2}
        icon={Combine}
        label={`Merge ${String(picked.length)} chunks`}
        onClick={onMerge}
        reason='Pick at least two chunks to merge'
      />
      <IconButton
        disabled={busy}
        icon={allAvailable ? EyeOff : Eye}
        label={`${allAvailable ? 'Disable' : 'Enable'} ${String(picked.length)} chunks`}
        onClick={() => onToggleAvailable([...picked])}
      />
    </span>
  )
}
const renderBulkActions = (picked: readonly string[]) => <BulkActions picked={picked} />
const editorSubject = (creating: boolean, selectedId: null | string, orderOf: (id: string) => number): string => {
  if (creating) return 'new chunk'
  if (selectedId === null) return ''
  return `chunk #${String(orderOf(selectedId))}`
}
const KeywordFields = () => {
  const { busy, keywordsDraft, onKeywordsDraftChange, onQuestionsDraftChange, onSaveKeywords, questionsDraft } = useSt()
  return (
    <>
      <p className='text-muted-foreground text-xs'>Keywords · one per line (boosts retrieval)</p>
      <Textarea
        className='max-h-40 min-h-16 resize-none overflow-auto font-mono text-xs'
        disabled={busy}
        onChange={event => onKeywordsDraftChange(event.target.value)}
        placeholder='surge pricing'
        value={keywordsDraft}
      />
      <p className='text-muted-foreground text-xs'>Questions · one per line (this chunk answers)</p>
      <Textarea
        className='max-h-40 min-h-16 resize-none overflow-auto font-mono text-xs'
        disabled={busy}
        onChange={event => onQuestionsDraftChange(event.target.value)}
        placeholder='What is the surge rate?'
        value={questionsDraft}
      />
      <Button className='self-start' disabled={busy} onClick={onSaveKeywords} size='sm' variant='outline'>
        Save keywords
      </Button>
    </>
  )
}
const EditorToolbar = ({ cursor, dirty }: { cursor: number; dirty: boolean }) => {
  const { busy, creating, data, onCancelCreate, onDelete, onSave, onSplit, onToggleAvailable, selectedId } = useSt()
  const selectedChunk = selectedId === null ? undefined : data.chunks.find(chunk => chunk.id === selectedId)
  if (creating)
    return (
      <>
        <IconButton disabled={busy} icon={Check} label='Save chunk' onClick={onSave} />
        <IconButton icon={X} label='Cancel' onClick={onCancelCreate} />
      </>
    )
  return (
    <>
      <IconButton disabled={busy || !dirty} icon={Check} label='Save text' onClick={onSave} reason='No changes to save' />
      <IconButton
        disabled={busy || dirty}
        icon={SquareSplitHorizontal}
        label='Split at cursor'
        onClick={() => onSplit(cursor)}
        reason='Save your edit before splitting'
      />
      <IconButton
        disabled={busy}
        icon={selectedChunk?.available === false ? Eye : EyeOff}
        label={selectedChunk?.available === false ? 'Enable' : 'Disable'}
        onClick={() => onToggleAvailable(selectedId === null ? [] : [selectedId])}
      />
      <IconButton disabled={busy} icon={Trash2} label='Delete chunk' onClick={onDelete} />
    </>
  )
}
const listEntry = (
  chunk: ShownChunk,
  ctx: { colorOf: (id: string) => string; dirtyId: null | string; orderOf: (id: string) => number; preview: string }
): ChunkListEntry => ({
  color: ctx.colorOf(chunk.id),
  dirty: chunk.id === ctx.dirtyId,
  disabled: !chunk.available,
  id: chunk.id,
  located: chunk.located,
  order: ctx.orderOf(chunk.id),
  page: pageOf(chunk),
  statusClass: isPartial(chunk) ? 'bg-destructive' : undefined,
  text: ctx.preview
})
const ChunkListView = () => {
  const {
    colorOf,
    creating,
    data,
    density,
    draft,
    filter,
    hoveredId,
    onFilterChange,
    onHover,
    onPickedChange,
    orderOf,
    picked,
    previewOf,
    select,
    selectedId,
    shownChunks
  } = useSt()
  const selectedText = selectedId === null ? undefined : data.chunks.find(chunk => chunk.id === selectedId)?.text
  const dirtyId = !creating && selectedText !== undefined && draft !== selectedText ? selectedId : null
  const entries = useMemo(
    () => shownChunks.map(chunk => listEntry(chunk, { colorOf, dirtyId, orderOf, preview: previewOf(chunk.id) })),
    [shownChunks, colorOf, dirtyId, orderOf, previewOf]
  )
  const listHeader = useMemo(() => <ListHeader />, [])
  return (
    <ChunkListPanel
      bulkActions={renderBulkActions}
      chunks={entries}
      density={density}
      emptyLabel={`No chunks match “${filter}”.`}
      filter={filter}
      header={listHeader}
      hoveredId={hoveredId}
      onFilterChange={onFilterChange}
      onHover={onHover}
      onPickedChange={onPickedChange}
      onSelect={select}
      picked={picked}
      selectedId={selectedId}
    />
  )
}
const ChunkEditorView = () => {
  const { creating, data, draft, editorFont, onDraftChange, onEditorFont, orderOf, selectedId } = useSt()
  const [cursor, setCursor] = useState(0)
  const selectedText = selectedId === null ? undefined : data.chunks.find(chunk => chunk.id === selectedId)?.text
  const dirty = !creating && selectedText !== undefined && draft !== selectedText
  const editorExtra = useMemo(() => (creating ? null : <KeywordFields />), [creating])
  const toolbar = useMemo(() => <EditorToolbar cursor={cursor} dirty={dirty} />, [cursor, dirty])
  return (
    <ChunkEditorPanel
      emptyLabel='Select a chunk, or draw a box on the page to author one.'
      extra={editorExtra}
      extraInPopover
      fontSize={editorFont}
      onChange={onDraftChange}
      onCursor={setCursor}
      onFontSize={onEditorFont}
      placeholder='Chunk text…'
      show={creating || selectedId !== null}
      subject={editorSubject(creating, selectedId, orderOf)}
      toolbar={toolbar}
      value={draft}
    />
  )
}
const clamp = (text: string): string => (text.length > 90 ? `${text.slice(0, 90)}…` : text)
const regionsOf = (data: ChunksView, colorOf: (id: string) => string, previewOf: (id: string) => string): PdfRegion[] => {
  if (data.modality !== 'spatial') return []
  const out: PdfRegion[] = []
  for (const chunk of data.chunks)
    if (chunk.located) {
      const color = colorOf(chunk.id)
      const label = clamp(previewOf(chunk.id))
      for (let i = 0; i < chunk.regions.length; i += 1) {
        const region = chunk.regions[i]
        if (region) out.push({ box: region.box, color, id: `${chunk.id}::${i}`, label, page: region.page })
      }
    }
  return out
}
const idsForChunk = (regions: PdfRegion[], chunkId: null | string): string[] =>
  chunkId === null ? [] : regions.filter(region => region.id.startsWith(`${chunkId}::`)).map(region => region.id)
const ThemeToggle = () => {
  const { resolvedTheme, setTheme } = useTheme()
  const dark = resolvedTheme === 'dark'
  return (
    <IconButton
      icon={dark ? Sun : Moon}
      label={dark ? 'Light mode' : 'Dark mode'}
      onClick={() => setTheme(dark ? 'light' : 'dark')}
    />
  )
}
const themeControls = <ThemeToggle />
const DocumentView = () => {
  const { colorOf, data, documentSrc, hoveredId, onHover, previewOf, runMutation, scale, select, selectedId, setScale } =
    useSt()
  const regions = useMemo(() => regionsOf(data, colorOf, previewOf), [data, colorOf, previewOf])
  const selectedRegionIds = useMemo(() => idsForChunk(regions, selectedId), [regions, selectedId])
  const hoveredRegionIds = useMemo(() => idsForChunk(regions, hoveredId), [regions, hoveredId])
  const onRegionDraw = useCallback(
    (box: readonly [number, number, number, number], page: number) => {
      runMutation({ action: 'create-region', box: [box[0], box[1], box[2], box[3]], page }).catch(() => undefined)
    },
    [runMutation]
  )
  const onRegionResize = useCallback(
    (id: string, box: readonly [number, number, number, number], page: number) => {
      runMutation({
        action: 'resize',
        box: [box[0], box[1], box[2], box[3]],
        chunkId: id.split('::')[0] ?? '',
        page
      }).catch(() => undefined)
    },
    [runMutation]
  )
  const onCreateSelection = useCallback(
    (span: { end: number; start: number }) => {
      if (data.modality !== 'text') return
      const content = data.text.slice(span.start, span.end).trim()
      if (content.length === 0) return
      runMutation({ action: 'create-text', content }).catch(() => undefined)
    },
    [data, runMutation]
  )
  if (data.modality === 'spatial')
    return (
      <div className='relative h-full min-h-0'>
        <PdfViewer
          className='h-full'
          controls={themeControls}
          hoveredRegionIds={hoveredRegionIds}
          onRegionClick={id => select(id.split('::')[0] ?? '')}
          onRegionDraw={onRegionDraw}
          onRegionHover={id => onHover(id === null ? null : (id.split('::')[0] ?? null))}
          onRegionResize={onRegionResize}
          regions={regions}
          scale={scale}
          selectedRegionId={selectedId ? `${selectedId}::0` : null}
          selectedRegionIds={selectedRegionIds}
          src={documentSrc}
        />
        <div className='bg-secondary/70 absolute top-3 right-3 flex items-center rounded-md backdrop-blur'>
          <IconButton icon={ZoomOut} label='Zoom out' onClick={() => setScale(value => Math.max(0.5, value - 0.2))} />
          <IconButton icon={ZoomIn} label='Zoom in' onClick={() => setScale(value => Math.min(4, value + 0.2))} />
        </div>
      </div>
    )
  return (
    <div className='relative h-full min-h-0'>
      <TextAnnotationHost
        annotations={chunkSpansToAnnotations(data.chunks)}
        className='h-full overflow-auto p-4'
        onCreateSelection={onCreateSelection}
        onSelect={ids => select(ids[0] ?? '')}
        text={data.text}
      />
      <div className='bg-secondary/70 absolute top-3 right-3 flex items-center rounded-md backdrop-blur'>
        <ThemeToggle />
      </div>
    </div>
  )
}
const StudioProvider = ({ children, value }: { children: ReactNode; value: StudioValue }) => (
  <StudioContext value={value}>{children}</StudioContext>
)
const CHUNKS_POSITION = { direction: 'right', referenceTab: 'document' } as const
const EDITOR_POSITION = { direction: 'right', referenceTab: 'chunks' } as const
const NO_TAB_MENU: never[] = []
const gate = (message: string, tone: 'error' | 'muted') => (
  <div
    className={cn(
      'flex h-svh items-center justify-center',
      tone === 'error' ? 'text-destructive' : 'text-muted-foreground'
    )}>
    {message}
  </div>
)
const SHORTCUT_ROWS: readonly (readonly [string, string])[] = [
  ['j / k', 'Previous / next chunk'],
  ['esc', 'Clear selection'],
  ['[ / ] / \\', 'Toggle document / chunks / editor pane'],
  ['⌘+ / ⌘- / ⌘0', 'Editor font size'],
  ['?', 'This overlay']
]
const ShortcutsOverlay = ({ onOpenChange, open }: { onOpenChange: (o: boolean) => void; open: boolean }) => (
  <Dialog onOpenChange={onOpenChange} open={open}>
    <DialogContent className='max-w-md'>
      <DialogTitle className='text-sm'>Keyboard shortcuts</DialogTitle>
      <div className='flex flex-col gap-1.5'>
        {SHORTCUT_ROWS.map(([keys, description]) => (
          <div className='flex items-center justify-between gap-3 text-xs' key={keys}>
            <span>{description}</span>
            <kbd className='bg-muted shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px]'>{keys}</kbd>
          </div>
        ))}
      </div>
    </DialogContent>
  </Dialog>
)
const handlePlainKey = ({
  event,
  studio,
  toggleShortcuts,
  workspace
}: {
  event: KeyboardEvent
  studio: StudioValue
  toggleShortcuts: () => void
  workspace: null | WorkspaceRef
}): void => {
  if (event.key === 'j' || event.key === 'k') {
    const id = nextChunkId(studio.shownChunks, studio.selectedId, event.key)
    if (id !== undefined) studio.select(id)
  } else if (event.key === 'Escape') studio.onClearSelection()
  else if (event.key === '?') toggleShortcuts()
  else if (event.key === '[') workspace?.togglePanel('document')
  else if (event.key === ']') workspace?.togglePanel('chunks')
  else if (event.key === '\\') workspace?.togglePanel('editor')
}
const ChunkStudio = ({
  copy = DEFAULT_COPY,
  layoutKey = 'chunk-studio.layout',
  reproGlobal,
  source
}: {
  copy?: StudioCopy
  layoutKey?: string
  reproGlobal?: string
  source: StudioSource
}) => {
  const { phase, progress, studio } = useStudio(source, reproGlobal)
  const workspaceRef = useRef<WorkspaceRef>(null)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const toggleShortcuts = useCallback(() => setShortcutsOpen(open => !open), [])
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target instanceof HTMLElement ? event.target : null
      const typing = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable
      const delta = metaZoomDelta(event)
      if (delta !== null) {
        event.preventDefault()
        studio?.onZoom(delta)
        return
      }
      if (typing || !studio) return
      handlePlainKey({ event, studio, toggleShortcuts, workspace: workspaceRef.current })
    }
    globalThis.addEventListener('keydown', onKey)
    return () => globalThis.removeEventListener('keydown', onKey)
  }, [studio, toggleShortcuts])
  if (phase === 'init' || phase === 'authing') return gate(progress === '' ? copy.opening : progress, 'muted')
  if (phase === 'no-token') return gate(copy.noToken, 'muted')
  if (phase === 'error' || !studio) return gate(copy.error, 'error')
  return (
    <StudioProvider value={studio}>
      <div className='flex h-svh w-full overflow-hidden [--dv-active-tab-border-color:transparent]'>
        <div className='min-w-0 flex-1'>
          <Workspace
            className='h-full'
            layoutKey={layoutKey}
            ref={workspaceRef}
            shortcuts={false}
            sidebar={false}
            statusBar={false}>
            <Tab closable={false} contextMenu={NO_TAB_MENU} defaultOpen icon={FileText} id='document' title='Document'>
              <DocumentView />
            </Tab>
            <Tab
              closable={false}
              contextMenu={NO_TAB_MENU}
              defaultOpen
              icon={List}
              id='chunks'
              position={CHUNKS_POSITION}
              title='Chunks'>
              <ChunkListView />
            </Tab>
            <Tab
              closable={false}
              contextMenu={NO_TAB_MENU}
              defaultOpen
              icon={Pencil}
              id='editor'
              position={EDITOR_POSITION}
              title='Editor'>
              <ChunkEditorView />
            </Tab>
          </Workspace>
        </div>
      </div>
      <ShortcutsOverlay onOpenChange={setShortcutsOpen} open={shortcutsOpen} />
    </StudioProvider>
  )
}
export type {
  Box,
  ChunksView,
  InitResult,
  Mutation,
  MutationResult,
  SpatialChunk,
  SpatialView,
  StudioCopy,
  StudioSource,
  StudioValue,
  TextChunk,
  TextView
}
export { ChunkEditorView, ChunkListView, ChunkStudio, DocumentView, StudioContext, StudioProvider, type useSt, useStudio }
