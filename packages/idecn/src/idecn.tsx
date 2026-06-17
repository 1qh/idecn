/* eslint-disable @eslint-react/dom/no-dangerously-set-innerhtml, @eslint-react/hooks-extra/no-direct-set-state-in-use-effect, @eslint-react/no-children-for-each, @eslint-react/no-unused-props, @typescript-eslint/no-use-before-define, react/no-danger, complexity, @next/next/no-img-element */
/* oxlint-disable promise/prefer-await-to-then, promise/always-return, promise/prefer-await-to-callbacks, no-react-children, jsx-no-new-object-as-prop, unicorn/prefer-top-level-await */
'use client'
import 'dockview-core/dist/styles/dockview.css'
import type { EditorProps } from '@monaco-editor/react'
import type { DockviewApi, DockviewReadyEvent, IDockviewPanelHeaderProps, IDockviewPanelProps } from 'dockview-react'
import type { Schema, StoreType } from 'leva/dist/declarations/src/types'
import type { LucideIcon } from 'lucide-react'
import type { PageViewport, PDFDocumentProxy, RenderTask } from 'pdfjs-dist'
import type { ComponentProps, ComponentType, ReactElement, ReactNode, Ref } from 'react'
import { cn } from '@a/ui'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@a/ui/breadcrumb'
import { Button } from '@a/ui/button'
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '@a/ui/command'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger
} from '@a/ui/context-menu'
import { Dialog, DialogContent } from '@a/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@a/ui/popover'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@a/ui/resizable'
import { Skeleton } from '@a/ui/skeleton'
import { Toaster } from '@a/ui/sonner'
import { Spinner } from '@a/ui/spinner'
import { Tooltip, TooltipContent, TooltipTrigger } from '@a/ui/tooltip'
import { Accordion } from '@base-ui/react/accordion'
import { NumberField } from '@base-ui/react/number-field'
import { Editor, loader } from '@monaco-editor/react'
import { shikiToMonaco, textmateThemeToMonacoTheme } from '@shikijs/monaco'
import { useHotkeys } from '@tanstack/react-hotkeys'
import { DockviewReact } from 'dockview-react'
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { folder, LevaPanel, useControls, useCreateStore } from 'leva'
import {
  ArrowRightToLine,
  ChevronLeft,
  ChevronRight,
  ChevronsDownUp,
  ClipboardCopy,
  Download,
  Eye,
  EyeOff,
  FilePlus,
  FolderPlus,
  Images,
  Maximize,
  Minus,
  Pencil,
  Pin,
  PinOff,
  Plus,
  SlidersHorizontal,
  SplitSquareHorizontal,
  Trash,
  Trash2,
  X
} from 'lucide-react'
import {
  Children,
  createContext,
  createElement,
  isValidElement,
  use,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react'
import { createHighlighter } from 'shiki'
import { toast } from 'sonner'
import { z } from 'zod'

let pdfWorkerSet = false
const loadPdfjs = async () => {
  const pdfjs = await import('pdfjs-dist')
  if (!pdfWorkerSet) {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()
    pdfWorkerSet = true
  }
  return pdfjs
}
const ICON_CLASS = 'size-4 shrink-0 [&_svg]:size-4 transition-all duration-300'
const ICON_CLASS_HOVER = `${ICON_CLASS} group-hover:scale-125`
const ICON_CLASS_TAB_HOVER = `${ICON_CLASS} group-hover/tab:scale-125`
const ITEM_CLASS =
  'group flex w-full items-center gap-[7px] py-[1px] pr-2 text-left text-sm leading-6 cursor-pointer whitespace-nowrap hover:bg-accent'
const CENTER = 'flex h-full items-center justify-center'
const EDITOR_OPTIONS: NonNullable<EditorProps['options']> = {
  bracketPairColorization: { enabled: true },
  cursorSmoothCaretAnimation: 'on',
  cursorWidth: 5,
  fontLigatures: true,
  fontSize: 16,
  letterSpacing: -0.8,
  lineHeight: 1.1,
  minimap: {
    maxColumn: 69,
    renderCharacters: false,
    scale: 2,
    showSlider: 'always'
  },
  readOnly: true,
  scrollBeyondLastLine: false,
  scrollbar: {
    horizontal: 'hidden',
    horizontalScrollbarSize: 1,
    verticalScrollbarSize: 0
  },
  smoothScrolling: true,
  stickyScroll: { enabled: true }
}
const TAB_TYPE = Symbol('idecn-tab')
const EXT_TO_LANG: Record<string, string> = {
  cjs: 'javascript',
  css: 'css',
  go: 'go',
  html: 'html',
  js: 'javascript',
  json: 'json',
  jsx: 'javascriptreact',
  md: 'markdown',
  mjs: 'javascript',
  py: 'python',
  rs: 'rust',
  sh: 'shellscript',
  sql: 'sql',
  svelte: 'svelte',
  toml: 'toml',
  ts: 'typescript',
  tsx: 'typescriptreact',
  vue: 'vue',
  yaml: 'yaml',
  yml: 'yaml'
}
const LANG: Record<string, string> = {
  css: 'css',
  go: 'go',
  html: 'html',
  js: 'javascript',
  json: 'json',
  jsx: 'javascript',
  md: 'markdown',
  mjs: 'javascript',
  py: 'python',
  rs: 'rust',
  sh: 'shell',
  sql: 'sql',
  toml: 'toml',
  ts: 'typescript',
  tsx: 'typescript',
  yaml: 'yaml',
  yml: 'yaml'
}
const IMAGE_EXTS = new Set(['apng', 'avif', 'bmp', 'gif', 'ico', 'jpeg', 'jpg', 'png', 'svg', 'webp'])
const BINARY_EXTS = new Set([
  '7z',
  'bin',
  'bz2',
  'dat',
  'db',
  'dll',
  'dylib',
  'eot',
  'exe',
  'gz',
  'otf',
  'pdf',
  'rar',
  'so',
  'sqlite',
  'tar',
  'ttf',
  'wasm',
  'woff',
  'woff2',
  'xz',
  'zip'
])
const FILE_SIZE_WARN = 500_000
const extOf = (path: string) => path.split('.').at(-1)?.toLowerCase() ?? ''
const RESET_CSS = [
  '.dv-reset{',
  '--dv-activegroup-visiblepanel-tab-background-color:transparent;',
  '--dv-activegroup-visiblepanel-tab-color:inherit;',
  '--dv-activegroup-hiddenpanel-tab-background-color:transparent;',
  '--dv-activegroup-hiddenpanel-tab-color:inherit;',
  '--dv-inactivegroup-visiblepanel-tab-background-color:transparent;',
  '--dv-inactivegroup-visiblepanel-tab-color:inherit;',
  '--dv-inactivegroup-hiddenpanel-tab-background-color:transparent;',
  '--dv-inactivegroup-hiddenpanel-tab-color:inherit;',
  '--dv-tabs-and-actions-container-background-color:transparent;',
  '--dv-tabs-and-actions-container-height:auto;',
  '--dv-group-view-background-color:transparent;',
  '--dv-separator-border:color-mix(in oklch,var(--color-border,var(--border)) 60%,transparent);',
  '--dv-tab-divider-color:color-mix(in oklch,var(--color-border,var(--border)) 60%,transparent);',
  '--dv-drag-over-background-color:color-mix(in oklch,var(--color-accent,var(--accent)) 50%,transparent);',
  '--dv-drag-over-border-color:color-mix(in oklch,var(--color-ring,var(--ring)) 30%,transparent);',
  '--dv-tab-margin:0;',
  '--dv-border-radius:0;',
  '--dv-active-sash-color:transparent;',
  '--dv-sash-color:transparent;',
  '--dv-scrollbar-background-color:transparent;',
  '}',
  '.dv-reset .dv-tab{padding:0;background:transparent}',
  '.dv-reset .dv-tabs-container{gap:0}',
  '.dv-reset .dv-tabs-and-actions-container{font-size:inherit}',
  '.dv-reset .dv-tabs-container>.dv-tab.dv-active-tab{background:transparent!important}',
  '.dv-reset .dv-tabs-container>.dv-tab.dv-active-tab{border-bottom:2px solid var(--dv-active-tab-border-color,var(--color-primary,var(--primary)))}',
  '.dv-reset .dv-tabs-container>.dv-tab:not(.dv-active-tab){border-bottom:2px solid transparent}',
  '.dv-reset .dv-tabs-container>.dv-tab:not(.dv-active-tab):hover{background:color-mix(in oklch,var(--color-muted,var(--muted)) 55%,transparent)}',
  '.dv-reset .dv-tabs-container>.dv-tab+.dv-tab{border-left:1px solid color-mix(in oklch,var(--color-border,var(--border)) 50%,transparent)}',
  '.dv-reset .dv-tab:has([data-fill]){flex:1}',
  '.dv-reset .dv-tabs-container{overflow-x:auto;scrollbar-width:thin;scrollbar-color:color-mix(in oklch,var(--color-foreground,var(--foreground)) 15%,transparent) transparent}',
  '.dv-reset .monaco-editor,.dv-reset .monaco-editor .margin,.dv-reset .monaco-editor-background,.dv-reset .monaco-editor .overflow-guard{background-color:transparent}',
  '.dv-reset .monaco-editor .current-line,.dv-reset .monaco-editor .current-line-margin{border:none!important}',
  '.dv-reset .dv-watermark{background:transparent}',
  String.raw`.dv-reset .dv-tab:has([data-preview]) .group\/tab{font-style:italic}`,
  '@media(prefers-reduced-motion:reduce){.dv-reset *{transition-duration:0s!important;animation-duration:0s!important}}',
  '[data-slot=dialog-overlay]{background:transparent!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}'
].join('')
const cursorAtom = atom({ col: 1, line: 1 })
const activeFileInfoAtom = atom({ language: 'plaintext', path: '' })
const closedTabsAtom = atom<string[]>([])
const pinnedTabsAtom = atom<string[]>([])
const fontSizeAtom = atomWithStorage('idecn:fontSizeDelta', 0)
const wordWrapAtom = atomWithStorage('idecn:wordWrap', false)
const previewPanelAtom = atom<null | string>(null)
const quickOpenAtom = atom(false)
const treeAtom = atom<TreeDataItem[]>([])
const openFileAtom = atom<((item: TreeDataItem) => void) | null>(null)
let iconManifest: IconManifest | null = null
let iconSvgs: Record<string, string> = {}
let cachedMonoFont: string | undefined
const iconsReady =
  'location' in globalThis
    ? import('./_generated/icons').then((mod: { icons: { manifest: IconManifest; svgs: Record<string, string> } }) => {
        iconManifest = mod.icons.manifest
        iconSvgs = mod.icons.svgs
      })
    : Promise.resolve()
interface MonacoApi {
  editor: {
    defineTheme: (themeName: string, themeData: unknown) => void
    getModel: (uri: unknown) => null | { dispose: () => void }
  }
  Uri: { parse: (value: string) => unknown }
}
const initMonaco = async (): Promise<MonacoApi> => {
  const instance: unknown = await loader.init()
  return instance as MonacoApi
}
const CORE_LANGS = ['javascript', 'json', 'markdown', 'tsx', 'typescript'] as const
const ALL_LANGS = [
  'css',
  'go',
  'html',
  'javascript',
  'json',
  'jsx',
  'markdown',
  'python',
  'rust',
  'shell',
  'sql',
  'toml',
  'tsx',
  'typescript',
  'yaml'
] as const
const defineThemes = (
  highlighter: Awaited<ReturnType<typeof createHighlighter>>,
  m: { editor: { defineTheme: (name: string, data: unknown) => void } }
) => {
  for (const name of highlighter.getLoadedThemes()) {
    const resolved = highlighter.getTheme(name)
    const converted = textmateThemeToMonacoTheme(resolved) as { colors: Record<string, string> }
    const isDark = resolved.type === 'dark'
    if (isDark) {
      converted.colors['editor.background'] = '#00000077'
      converted.colors['editor.lineHighlightBackground'] = '#00000000'
      converted.colors['editorLineNumber.foreground'] = '#ffffff22'
      converted.colors['minimap.background'] = '#000000'
      converted.colors['minimapSlider.background'] = '#ffffff15'
      converted.colors['minimapSlider.hoverBackground'] = '#ffffff25'
      converted.colors['minimapSlider.activeBackground'] = '#ffffff35'
    } else converted.colors['minimap.background'] = '#ffffff'
    converted.colors['scrollbar.shadow'] = '#00000000'
    converted.colors['scrollbarSlider.background'] = isDark ? '#ffffff15' : '#00000015'
    converted.colors['scrollbarSlider.hoverBackground'] = isDark ? '#ffffff30' : '#00000030'
    converted.colors['scrollbarSlider.activeBackground'] = isDark ? '#ffffff50' : '#00000050'
    m.editor.defineTheme(name, converted)
  }
}
const shikiSetup =
  'location' in globalThis
    ? (async () => {
        const mod = await import('./monokai-lite')
        const theme = mod.monokaiLite
        const highlighter = await createHighlighter({
          langs: [...CORE_LANGS],
          themes: [theme as Parameters<typeof createHighlighter>[0]['themes'][0], 'github-light']
        })
        const monaco = await initMonaco()
        shikiToMonaco(highlighter, monaco)
        defineThemes(highlighter, monaco)
        const remaining = ALL_LANGS.filter(l => !CORE_LANGS.includes(l as (typeof CORE_LANGS)[number]))
        if (remaining.length > 0)
          highlighter
            .loadLanguage(...remaining)
            .then(() => {
              shikiToMonaco(highlighter, monaco)
              defineThemes(highlighter, monaco)
            })
            .catch(() => undefined)
      })()
    : null
const getSvg = (name: string): string => iconSvgs[name] ?? (iconManifest ? (iconSvgs[iconManifest.file] ?? '') : '')
const resolveFileIcon = (filename: string): string => {
  if (!iconManifest) return ''
  const lower = filename.toLowerCase()
  if (iconManifest.fileNames[lower]) return iconManifest.fileNames[lower]
  const ext = lower.includes('.') ? lower.slice(lower.indexOf('.') + 1) : ''
  if (ext && iconManifest.fileExtensions[ext]) return iconManifest.fileExtensions[ext]
  const lastExt = lower.split('.').at(-1) ?? ''
  if (lastExt && iconManifest.fileExtensions[lastExt]) return iconManifest.fileExtensions[lastExt]
  const lang = EXT_TO_LANG[lastExt]
  if (lang && iconManifest.languageIds[lang]) return iconManifest.languageIds[lang]
  return iconManifest.file
}
const resolveFolderIcon = (folderName: string, open: boolean): string => {
  if (!iconManifest) return ''
  const lower = folderName.toLowerCase()
  if (open) return iconManifest.folderNamesExpanded[lower] ?? iconManifest.folderExpanded
  return iconManifest.folderNames[lower] ?? iconManifest.folder
}
const getIconSvg = (filename: string): string => getSvg(resolveFileIcon(filename))
const langOf = (path: string): string => LANG[path.split('.').at(-1) ?? ''] ?? 'plaintext'
const monoFont = (): string => {
  if (cachedMonoFont !== undefined) return cachedMonoFont
  if (typeof document === 'undefined') return ''
  cachedMonoFont = getComputedStyle(document.documentElement).getPropertyValue('--font-mono').trim()
  return cachedMonoFont
}
const compactFolder = (item: TreeDataItem): { children: TreeDataItem[]; name: string } => {
  let current = item
  let merged = item.name
  for (;;) {
    const only = current.children?.[0]
    if (!only?.children || current.children?.length !== 1) break
    current = only
    merged += `/${current.name}`
  }
  return { children: current.children ?? [], name: merged }
}
const extractTabs = (children: ReactNode): TabProps[] => {
  const tabs: TabProps[] = []
  Children.forEach(children, child => {
    if (isValidElement(child) && (child.type as { _type?: symbol })._type === TAB_TYPE) tabs.push(child.props as TabProps)
  })
  return tabs
}
const getTabId = (tab: TabProps) => tab.id ?? tab.title
const useAltKeys = (bindings: Record<string, () => void>, enabled: boolean) => {
  const ref = useRef(bindings)
  useEffect(() => {
    ref.current = bindings
  })
  useEffect(() => {
    if (!enabled) return
    const handler = (e: KeyboardEvent) => {
      if (!e.altKey || e.metaKey || e.ctrlKey) return
      const fn = ref.current[e.code]
      if (fn) {
        e.preventDefault()
        fn()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [enabled])
}
const deduplicateTitle = (
  name: string,
  path: string,
  existingPanels: { id: string; title: string | undefined }[]
): string => {
  const hasDupe = existingPanels.some(p => p.title === name && p.id !== path)
  if (!hasDupe) return name
  const parts = path.split('/')
  return parts.length >= 2 ? `${parts.at(-2)}/${name}` : name
}
interface IconManifest {
  file: string
  fileExtensions: Record<string, string>
  fileNames: Record<string, string>
  folder: string
  folderExpanded: string
  folderNames: Record<string, string>
  folderNamesExpanded: Record<string, string>
  languageIds: Record<string, string>
}
interface PanelPosition {
  direction: 'above' | 'below' | 'left' | 'right' | 'within'
  referenceGroup: string
}
interface VirtualFile {
  content: string
  icon?: ComponentType<{ className?: string }>
  language?: string
  name: string
  open?: boolean
  pin?: 'bottom' | 'top'
}
const EMPTY_TREE: TreeDataItem[] = []
const VIRTUAL_PREFIX = '__virtual:'
const resolveLanguageIcon = (language: string): string => {
  if (!iconManifest) return ''
  if (iconManifest.languageIds[language]) return iconManifest.languageIds[language]
  for (const [ext, lang] of Object.entries(EXT_TO_LANG))
    if (lang === language && iconManifest.fileExtensions[ext]) return iconManifest.fileExtensions[ext]
  return iconManifest.file
}
const virtualFileId = (name: string) => `${VIRTUAL_PREFIX}${name}`
interface FileActions {
  contextActions?: (ctx: { isFolder: boolean; path: string; selectedPaths: string[] }) => TreeContextAction[]
  onCreateFile?: (parentPath: string, name: string) => Promise<void> | void
  onCreateFolder?: (parentPath: string, name: string) => Promise<void> | void
  onDelete?: (paths: string[]) => Promise<void> | void
  onDownload?: (path: string) => Promise<void> | void
  onMove?: (sourcePath: string, targetFolderPath: string) => Promise<void> | void
  onRename?: (path: string, newName: string) => Promise<void> | void
  onUpload?: (parentPath: string, files: FileList) => Promise<void> | void
}
interface TreeContextAction {
  destructive?: boolean
  icon?: ComponentType<{ className?: string }>
  label: string
  onSelect: (ctx: { isFolder: boolean; path: string; selectedPaths: string[] }) => void
}
const ContextActions = ({
  ctx,
  items
}: {
  ctx: { isFolder: boolean; path: string; selectedPaths: string[] }
  items: TreeContextAction[]
}): ReactNode =>
  items.length === 0 ? null : (
    <>
      <ContextMenuSeparator />
      {items.map(a => (
        <ContextMenuItem
          className={cn(a.destructive && 'text-destructive focus:text-destructive')}
          key={a.label}
          onClick={() => a.onSelect(ctx)}>
          {a.icon ? <a.icon /> : null} {a.label}
        </ContextMenuItem>
      ))}
    </>
  )
const MOVE_MIME = 'application/x-idecn-move'
const startMove = (dataTransfer: DataTransfer, path: string): void => {
  dataTransfer.setData(MOVE_MIME, path)
  dataTransfer.effectAllowed = 'move'
}
const allowMove = (dataTransfer: DataTransfer, preventDefault: () => void): void => {
  if (!dataTransfer.types.includes(MOVE_MIME)) return
  preventDefault()
  dataTransfer.dropEffect = 'move'
}
const dropMove = (
  dataTransfer: DataTransfer,
  targetFolderPath: string,
  onMove?: (sourcePath: string, targetFolderPath: string) => Promise<void> | void
): boolean => {
  const source = dataTransfer.getData(MOVE_MIME)
  if (!(onMove && source) || source === targetFolderPath || targetFolderPath.startsWith(`${source}/`)) return false
  const result = onMove(source, targetFolderPath)
  if (result instanceof Promise) result.catch(() => undefined)
  return true
}
interface TreeContextValue {
  creatingIn: null | { parentPath: string; type: 'file' | 'folder' }
  expandDepth: number
  expandExclude?: string[]
  fileActions?: FileActions
  indent: number
  log?: (msg: string) => void
  navRef: React.RefObject<HTMLDivElement | null>
  onSelect?: (item: { id: string; name: string; path: string }) => void
  renamingId: null | string
  selectedId: null | string
  selectedIds: Set<string>
  setCreatingIn: (state: null | { parentPath: string; type: 'file' | 'folder' }) => void
  setRenamingId: (id: null | string) => void
  setSelectedId: (id: string) => void
  setSelectedIds: (ids: Set<string>) => void
  triggerUpload?: (parentPath: string) => void
}
interface TreeDataItem {
  actions?: ReactNode
  children?: TreeDataItem[]
  className?: string
  disabled?: boolean
  icon?: ComponentType<{ className?: string }> | false | string
  id: string
  mutable?: boolean
  name: string
  onClick?: () => void
  path: string
}
interface WorkspaceRef {
  focusPanel: (id: string) => void
  hasPanel: (id: string) => boolean
  openFile: (item: TreeDataItem) => void
  panelIds: () => string[]
  reopenLast: () => void
  reset: () => void
  togglePanel: (id: string, focusOnly?: boolean) => void
  toggleSidebar: () => void
}
const EMPTY_SET = new Set<string>()
const TreeContext = createContext<TreeContextValue>({
  creatingIn: null,
  expandDepth: 0,
  indent: 16,
  navRef: { current: null },
  renamingId: null,
  selectedId: null,
  selectedIds: EMPTY_SET,
  setCreatingIn: () => undefined,
  setRenamingId: () => undefined,
  setSelectedId: () => undefined,
  setSelectedIds: () => undefined
})
const DockviewApiContext = createContext<DockviewApi | null>(null)
const TabContentContext = createContext<Map<string, ReactNode>>(new Map())
const DepthContext = createContext(0)
const useTreeItem = ({ id, name, path }: { id?: string; name: string; path?: string }) => {
  const {
    creatingIn,
    expandDepth,
    expandExclude,
    fileActions,
    indent,
    log: treeLog,
    onSelect,
    selectedId,
    navRef,
    selectedIds,
    renamingId,
    setCreatingIn,
    setRenamingId,
    setSelectedId,
    setSelectedIds,
    triggerUpload
  } = use(TreeContext)
  const depth = use(DepthContext)
  const itemId = id ?? path ?? name
  const isSelected = selectedIds.size > 0 ? selectedIds.has(itemId) : selectedId === itemId
  const isMultiSelected = selectedIds.has(itemId)
  const pl = `${String(depth * indent + 8)}px`
  const select = (e?: { metaKey?: boolean; shiftKey?: boolean }) => {
    if (e?.metaKey) {
      const next = new Set(selectedIds)
      if (next.size === 0 && selectedId) next.add(selectedId)
      if (next.has(itemId)) next.delete(itemId)
      else next.add(itemId)
      setSelectedIds(next)
    } else if (e?.shiftKey && selectedId && navRef.current) {
      const els = navRef.current.querySelectorAll<HTMLElement>('[data-item-id]')
      const ids = [...els].map(el => el.dataset.itemId ?? '')
      const fromIdx = ids.indexOf(selectedId)
      const toIdx = ids.indexOf(itemId)
      if (fromIdx !== -1 && toIdx !== -1) {
        const start = Math.min(fromIdx, toIdx)
        const end = Math.max(fromIdx, toIdx)
        setSelectedIds(new Set(ids.slice(start, end + 1)))
      }
    } else {
      setSelectedIds(EMPTY_SET)
      setSelectedId(itemId)
      onSelect?.({ id: itemId, name, path: path ?? name })
    }
  }
  return {
    creatingIn,
    depth,
    expandDepth,
    expandExclude,
    fileActions,
    iconClass: ICON_CLASS_HOVER,
    indent,
    isMultiSelected,
    isSelected,
    itemId,
    log: treeLog,
    pl,
    renamingId,
    select,
    selectedIds,
    setCreatingIn,
    setRenamingId,
    triggerUpload
  }
}
const useIconsReady = () => {
  const [loaded, setLoaded] = useState(Boolean(iconManifest))
  useEffect(() => {
    if (!loaded) iconsReady.then(() => setLoaded(true)).catch(() => undefined)
  }, [loaded])
}
const FileIcon = ({ name, ...props }: ComponentProps<'span'> & { name: string }) => {
  useIconsReady()
  // biome-ignore lint/security/noDangerouslySetInnerHtml: SVG from build-time bundled icon pack (./_generated/icons), not user input
  return <span dangerouslySetInnerHTML={{ __html: getSvg(resolveFileIcon(name)) }} {...props} />
}
const FolderIcon = ({ name, open, ...props }: ComponentProps<'span'> & { name: string; open?: boolean }) => {
  useIconsReady()
  return (
    <span
      // biome-ignore lint/security/noDangerouslySetInnerHtml: SVG from build-time bundled icon pack (./_generated/icons), not user input
      dangerouslySetInnerHTML={{
        __html: getSvg(resolveFolderIcon(name, open ?? false))
      }}
      {...props}
    />
  )
}
const Tree = ({
  children,
  expandDepth = 0,
  expandExclude,
  fileActions,
  indent = 16,
  log: treePropLog,
  onSelect,
  onSelectionChange,
  selectedId: controlledSelectedId,
  triggerUpload,
  ...props
}: ComponentProps<'div'> & {
  expandDepth?: number
  expandExclude?: string[]
  fileActions?: FileActions
  indent?: number
  log?: (msg: string) => void
  onSelect?: (item: { id: string; name: string; path: string }) => void
  onSelectionChange?: (ids: string[]) => void
  selectedId?: null | string
  triggerUpload?: (parentPath: string) => void
}) => {
  const [internalSelectedId, setInternalSelectedId] = useState<null | string>(null)
  const [creatingIn, setCreatingIn] = useState<null | { parentPath: string; type: 'file' | 'folder' }>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(EMPTY_SET)
  const [renamingId, setRenamingId] = useState<null | string>(null)
  const navRef = useRef<HTMLDivElement>(null)
  const selectedId = controlledSelectedId ?? internalSelectedId
  const changeRef = useRef(onSelectionChange)
  useEffect(() => {
    changeRef.current = onSelectionChange
  })
  useEffect(() => {
    changeRef.current?.([...selectedIds])
  }, [selectedIds])
  const ctx = useMemo(
    () => ({
      creatingIn,
      expandDepth,
      expandExclude,
      fileActions,
      indent,
      log: treePropLog,
      navRef,
      onSelect,
      renamingId,
      selectedId,
      selectedIds,
      setCreatingIn,
      setRenamingId,
      setSelectedId: setInternalSelectedId,
      setSelectedIds,
      triggerUpload
    }),
    [
      creatingIn,
      expandDepth,
      expandExclude,
      fileActions,
      indent,
      treePropLog,
      onSelect,
      renamingId,
      selectedId,
      selectedIds,
      triggerUpload
    ]
  )
  return (
    <TreeContext value={ctx}>
      <div
        aria-label='File tree'
        ref={navRef}
        role='tree'
        {...props}
        className={cn(
          'select-none overflow-auto text-sm [scrollbar-width:thin] [scrollbar-color:color-mix(in_oklch,var(--color-foreground,var(--foreground))_15%,transparent)_transparent]',
          props.className
        )}
        onKeyDownCapture={e => {
          if (![' ', 'ArrowDown', 'ArrowUp', 'Enter'].includes(e.key)) return
          const target = e.target as HTMLElement
          if (!target.closest('[role=treeitem]')) return
          e.preventDefault()
          e.stopPropagation()
          const items = e.currentTarget.querySelectorAll<HTMLElement>('[role=treeitem]')
          const treeItem = target.closest('[role=treeitem]')
          const idx = treeItem ? [...items].indexOf(treeItem as HTMLElement) : -1
          if (e.key === 'ArrowDown') items[Math.min(idx + 1, items.length - 1)]?.focus()
          else if (e.key === 'ArrowUp') items[Math.max(idx - 1, 0)]?.focus()
          else target.click()
        }}>
        {children}
      </div>
    </TreeContext>
  )
}
const InlineInput = ({
  depth,
  indent,
  onCancel,
  onSubmit,
  type
}: {
  depth: number
  indent: number
  onCancel: () => void
  onSubmit: (name: string) => void
  type: 'file' | 'folder'
}) => {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [])
  const submit = () => {
    const trimmed = value.trim()
    if (trimmed) onSubmit(trimmed)
    else onCancel()
  }
  return (
    <div className={cn(ITEM_CLASS, 'gap-1')} style={{ paddingLeft: `${String(depth * indent + 8)}px` }}>
      {type === 'folder' ? (
        <FolderIcon className={ICON_CLASS} name='new' />
      ) : (
        <FileIcon className={ICON_CLASS} name={value || 'untitled'} />
      )}
      <input
        aria-label='Rename'
        className='min-w-0 flex-1 bg-transparent text-sm outline-none border border-primary/50 px-1 rounded-sm'
        onBlur={submit}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') submit()
          if (e.key === 'Escape') onCancel()
        }}
        placeholder={type === 'file' ? 'filename' : 'folder name'}
        ref={inputRef}
        type='text'
        value={value}
      />
    </div>
  )
}
const RenameInput = ({
  currentName,
  depth,
  indent,
  isFolder,
  onCancel,
  onSubmit
}: {
  currentName: string
  depth: number
  indent: number
  isFolder: boolean
  onCancel: () => void
  onSubmit: (newName: string) => void
}) => {
  const [value, setValue] = useState(currentName)
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    requestAnimationFrame(() => {
      const el = inputRef.current
      if (!el) return
      el.focus()
      const dot = currentName.lastIndexOf('.')
      el.setSelectionRange(0, dot > 0 ? dot : currentName.length)
    })
  }, [currentName])
  const submit = () => {
    const trimmed = value.trim()
    if (trimmed && trimmed !== currentName) onSubmit(trimmed)
    else onCancel()
  }
  return (
    <div className={cn(ITEM_CLASS, 'gap-1')} style={{ paddingLeft: `${String(depth * indent + 8)}px` }}>
      {isFolder ? (
        <FolderIcon className={ICON_CLASS} name={value || currentName} />
      ) : (
        <FileIcon className={ICON_CLASS} name={value || currentName} />
      )}
      <input
        aria-label='Rename new'
        className='min-w-0 flex-1 bg-transparent text-sm outline-none border border-primary/50 px-1 rounded-sm'
        onBlur={submit}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') submit()
          if (e.key === 'Escape') onCancel()
        }}
        ref={inputRef}
        type='text'
        value={value}
      />
    </div>
  )
}
const TreeFolder = ({
  children,
  defaultOpen = false,
  disabled,
  id,
  mutable,
  name,
  onSelect,
  path,
  ...props
}: {
  children?: ReactNode
  className?: string
  defaultOpen?: boolean
  disabled?: boolean
  id?: string
  mutable?: boolean
  name: string
  onSelect?: () => void
  path?: string
}) => {
  const {
    creatingIn,
    depth,
    expandDepth,
    expandExclude,
    fileActions,
    iconClass,
    indent,
    log: treeLog,
    isMultiSelected,
    isSelected,
    itemId,
    pl,
    renamingId,
    select,
    selectedIds,
    setCreatingIn,
    setRenamingId,
    triggerUpload
  } = useTreeItem({
    id,
    name,
    path
  })
  const folderPath = path ?? name
  const isRenaming = renamingId === itemId
  const excluded = expandExclude?.some(ex => folderPath.startsWith(ex))
  const shouldOpen = !excluded && (defaultOpen || depth < expandDepth)
  const [open, setOpen] = useState(shouldOpen ? [itemId] : [])
  const isOpen = open.includes(itemId)
  const showingInput = creatingIn?.parentPath === folderPath
  const ensureOpen = () => {
    if (!isOpen) setOpen([itemId])
  }
  return (
    <Accordion.Root
      onValueChange={v => {
        setOpen(v)
        treeLog?.(v.length > 0 ? `Expand: ${name}` : `Collapse: ${name}`)
      }}
      value={open}>
      <Accordion.Item value={itemId}>
        {isRenaming ? (
          <RenameInput
            currentName={name.split('/').at(-1) ?? name}
            depth={depth}
            indent={indent}
            isFolder
            onCancel={() => setRenamingId(null)}
            onSubmit={newName => {
              fileActions?.onRename?.(folderPath, newName)
              setRenamingId(null)
            }}
          />
        ) : (
          <ContextMenu>
            <ContextMenuTrigger>
              <Accordion.Trigger
                className={cn(
                  ITEM_CLASS,
                  (isSelected || isMultiSelected) && 'bg-accent',
                  disabled && 'pointer-events-none opacity-50',
                  props.className
                )}
                data-item-id={itemId}
                draggable={Boolean(mutable && fileActions?.onMove)}
                onClick={e => {
                  select(e)
                  onSelect?.()
                }}
                onDragOver={e => allowMove(e.dataTransfer, () => e.preventDefault())}
                onDragStart={e => startMove(e.dataTransfer, folderPath)}
                onDrop={e => {
                  if (dropMove(e.dataTransfer, folderPath, fileActions?.onMove)) {
                    e.preventDefault()
                    e.stopPropagation()
                  }
                }}
                role='treeitem'
                style={{ paddingLeft: pl }}
                tabIndex={0}>
                <FolderIcon className={iconClass} name={name} open={isOpen} />
                {name}
              </Accordion.Trigger>
            </ContextMenuTrigger>
            <ContextMenuContent>
              {mutable && fileActions?.onCreateFile ? (
                <ContextMenuItem
                  onClick={() => {
                    ensureOpen()
                    setCreatingIn({ parentPath: folderPath, type: 'file' })
                  }}>
                  <FilePlus /> New File
                </ContextMenuItem>
              ) : null}
              {mutable && fileActions?.onCreateFolder ? (
                <ContextMenuItem
                  onClick={() => {
                    ensureOpen()
                    setCreatingIn({ parentPath: folderPath, type: 'folder' })
                  }}>
                  <FolderPlus /> New Folder
                </ContextMenuItem>
              ) : null}
              {mutable && fileActions?.onUpload && triggerUpload ? (
                <ContextMenuItem onClick={() => triggerUpload(folderPath)}>
                  <Download className='rotate-180' /> Upload
                </ContextMenuItem>
              ) : null}
              {mutable &&
              (fileActions?.onCreateFile || fileActions?.onCreateFolder || (fileActions?.onUpload && triggerUpload)) ? (
                <ContextMenuSeparator />
              ) : null}
              {mutable && fileActions?.onRename ? (
                <ContextMenuItem onClick={() => setRenamingId(itemId)}>
                  <Pencil /> Rename
                </ContextMenuItem>
              ) : null}
              {mutable && fileActions?.onDelete ? (
                <ContextMenuItem
                  className='text-destructive focus:text-destructive'
                  onClick={() => {
                    const paths: string[] =
                      selectedIds.size > 1 && selectedIds.has(itemId) ? [...selectedIds] : [folderPath]
                    fileActions.onDelete?.(paths)
                  }}>
                  <Trash2 /> Delete
                  {selectedIds.size > 1 && selectedIds.has(itemId) ? ` (${String(selectedIds.size)})` : ''}
                </ContextMenuItem>
              ) : null}
              {fileActions?.onDownload ? (
                <ContextMenuItem
                  onClick={() => {
                    fileActions.onDownload?.(folderPath)
                  }}>
                  <Download /> Download
                </ContextMenuItem>
              ) : null}
              {(mutable && (fileActions?.onRename || fileActions?.onDelete)) || fileActions?.onDownload ? (
                <ContextMenuSeparator />
              ) : null}
              <ContextMenuItem
                onClick={() => {
                  navigator.clipboard
                    .writeText(folderPath)
                    .then(() => toast('Copied to clipboard'))
                    .catch(() => undefined)
                }}>
                <ClipboardCopy /> Copy Path
              </ContextMenuItem>
              {fileActions?.contextActions ? (
                <ContextActions
                  ctx={{ isFolder: true, path: folderPath, selectedPaths: [...selectedIds] }}
                  items={fileActions.contextActions({ isFolder: true, path: folderPath, selectedPaths: [...selectedIds] })}
                />
              ) : null}
            </ContextMenuContent>
          </ContextMenu>
        )}
        <Accordion.Panel className='relative overflow-hidden h-(--accordion-panel-height) transition-[height] duration-150 ease-out data-ending-style:h-0 data-starting-style:h-0'>
          <span className='absolute top-0 bottom-0 w-px bg-accent' style={{ left: `${String(depth * indent + 16)}px` }} />
          <DepthContext value={depth + 1}>
            {showingInput ? (
              <InlineInput
                depth={depth + 1}
                indent={indent}
                onCancel={() => setCreatingIn(null)}
                onSubmit={n => {
                  const cb = creatingIn.type === 'file' ? fileActions?.onCreateFile : fileActions?.onCreateFolder
                  cb?.(folderPath, n)
                  setCreatingIn(null)
                }}
                type={creatingIn.type}
              />
            ) : null}
            {children}
          </DepthContext>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion.Root>
  )
}
const TreeFile = ({
  actions,
  disabled,
  icon,
  id,
  mutable,
  name,
  path,
  ...props
}: Omit<ComponentProps<'button'>, 'id'> & {
  actions?: ReactNode
  disabled?: boolean
  icon?: ComponentType<{ className?: string }> | false | string
  id?: string
  mutable?: boolean
  name: string
  path?: string
}) => {
  const {
    depth,
    fileActions,
    iconClass,
    indent,
    isMultiSelected,
    isSelected,
    itemId,
    pl,
    renamingId,
    select,
    selectedIds,
    setRenamingId
  } = useTreeItem({
    id,
    name,
    path
  })
  const CustomIcon = typeof icon === 'function' ? icon : undefined
  const isRenaming = renamingId === itemId
  useIconsReady()
  if (isRenaming)
    return (
      <RenameInput
        currentName={name}
        depth={depth}
        indent={indent}
        isFolder={false}
        onCancel={() => setRenamingId(null)}
        onSubmit={newName => {
          fileActions?.onRename?.(path ?? name, newName)
          setRenamingId(null)
        }}
      />
    )
  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div className='relative'>
          <button
            data-item-id={itemId}
            role='treeitem'
            type='button'
            {...props}
            className={cn(
              ITEM_CLASS,
              (isSelected || isMultiSelected) && 'bg-accent',
              disabled && 'pointer-events-none opacity-50',
              props.className
            )}
            draggable={Boolean(mutable && fileActions?.onMove)}
            onClick={e => {
              if (!disabled) select(e)
              props.onClick?.(e)
            }}
            onDragStart={e => startMove(e.dataTransfer, path ?? name)}
            style={{ paddingLeft: pl, ...props.style }}>
            {icon === false ? null : CustomIcon ? (
              <CustomIcon className={iconClass} />
            ) : typeof icon === 'string' ? (
              // biome-ignore lint/security/noDangerouslySetInnerHtml: SVG from build-time bundled icon pack (getSvg → ./_generated/icons), not user input
              <span className={iconClass} dangerouslySetInnerHTML={{ __html: getSvg(icon) }} />
            ) : (
              <FileIcon className={iconClass} name={name} />
            )}
            {name}
          </button>
          {actions ? <span className='absolute inset-y-0 right-1 flex items-center gap-1'>{actions}</span> : null}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        {mutable && fileActions?.onRename ? (
          <ContextMenuItem onClick={() => setRenamingId(itemId)}>
            <Pencil /> Rename
          </ContextMenuItem>
        ) : null}
        {fileActions?.onDownload ? (
          <ContextMenuItem
            onClick={() => {
              fileActions.onDownload?.(path ?? name)
            }}>
            <Download /> Download
          </ContextMenuItem>
        ) : null}
        {mutable && fileActions?.onDelete ? (
          <ContextMenuItem
            className='text-destructive focus:text-destructive'
            onClick={() => {
              const deletePaths: string[] =
                selectedIds.size > 1 && selectedIds.has(itemId) ? [...selectedIds] : [path ?? name]
              fileActions.onDelete?.(deletePaths)
            }}>
            <Trash2 /> Delete{selectedIds.size > 1 && selectedIds.has(itemId) ? ` (${String(selectedIds.size)})` : ''}
          </ContextMenuItem>
        ) : null}
        {(mutable && (fileActions?.onRename || fileActions?.onDelete)) || fileActions?.onDownload ? (
          <ContextMenuSeparator />
        ) : null}
        <ContextMenuItem
          onClick={() => {
            navigator.clipboard
              .writeText(path ?? name)
              .then(() => toast('Copied to clipboard'))
              .catch(() => undefined)
          }}>
          <ClipboardCopy /> Copy Path
        </ContextMenuItem>
        {fileActions?.contextActions ? (
          <ContextActions
            ctx={{ isFolder: false, path: path ?? name, selectedPaths: [...selectedIds] }}
            items={fileActions.contextActions({ isFolder: false, path: path ?? name, selectedPaths: [...selectedIds] })}
          />
        ) : null}
      </ContextMenuContent>
    </ContextMenu>
  )
}
const renderItems = ({
  items,
  onItemClick,
  onItemDoubleClick,
  selectableFolders
}: {
  items: TreeDataItem[]
  onItemClick?: (item: TreeDataItem) => void
  onItemDoubleClick?: (item: TreeDataItem) => void
  selectableFolders?: boolean
}): ReactNode[] => {
  const nodes: ReactNode[] = []
  for (const item of items)
    if (item.children) {
      const { children, name } = compactFolder(item)
      nodes.push(
        <TreeFolder
          disabled={item.disabled}
          id={item.id}
          key={item.id}
          mutable={item.mutable}
          name={name}
          onSelect={selectableFolders ? () => onItemClick?.(item) : undefined}
          path={item.path}>
          {renderItems({ items: children, onItemClick, onItemDoubleClick, selectableFolders })}
        </TreeFolder>
      )
    } else
      nodes.push(
        <TreeFile
          actions={item.actions}
          disabled={item.disabled}
          icon={item.icon}
          id={item.id}
          key={item.id}
          mutable={item.mutable}
          name={item.name}
          onClick={() => {
            item.onClick?.()
            onItemClick?.(item)
          }}
          onDoubleClick={() => onItemDoubleClick?.(item)}
          path={item.path}
        />
      )
  return nodes
}
const FileTree = ({
  className,
  data,
  expandDepth = 0,
  expandExclude,
  fileActions,
  initialSelectedItemId,
  log: fileTreeLog,
  onDoubleClick: onDoubleClickProp,
  onSelectChange,
  onSelectionChange,
  selectableFolders,
  selectedId: controlledId,
  triggerUpload
}: {
  className?: string
  data: TreeDataItem | TreeDataItem[]
  expandDepth?: number
  expandExclude?: string[]
  fileActions?: FileActions
  initialSelectedItemId?: string
  log?: (msg: string) => void
  onDoubleClick?: (item: TreeDataItem) => void
  onSelectChange?: (item: TreeDataItem | undefined) => void
  onSelectionChange?: (ids: string[]) => void
  selectableFolders?: boolean
  selectedId?: null | string
  triggerUpload?: (parentPath: string) => void
}) => {
  const items = Array.isArray(data) ? data : [data]
  return (
    <Tree
      className={className}
      expandDepth={expandDepth}
      expandExclude={expandExclude}
      fileActions={fileActions}
      log={fileTreeLog}
      onSelectionChange={onSelectionChange}
      selectedId={controlledId ?? initialSelectedItemId}
      triggerUpload={triggerUpload}>
      <div className='min-w-max'>
        {renderItems({ items, onItemClick: onSelectChange, onItemDoubleClick: onDoubleClickProp, selectableFolders })}
      </div>
    </Tree>
  )
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Tab = (_props: {
  activeClassName?: string
  children: ReactNode
  closable?: boolean
  defaultOpen?: boolean
  headerClassName?: string
  icon?: boolean | ComponentType<{ className?: string }>
  id?: string
  inactive?: boolean
  inactiveClassName?: string
  initialWidth?: number
  onClose?: () => void
  position?: { direction: 'above' | 'below' | 'left' | 'right' | 'within'; referenceTab?: string }
  title: string
}): null => null
Tab._type = TAB_TYPE
const ContentPanel = ({ api, params }: IDockviewPanelProps<{ content: ReactNode }>) => {
  const registry = use(TabContentContext)
  const [content, setContent] = useState(params.content)
  useEffect(() => {
    const d = api.onDidParametersChange(e => {
      const p = e as { content?: ReactNode }
      if (p.content !== undefined) setContent(p.content)
    })
    return () => {
      d.dispose()
    }
  }, [api])
  const registered = registry.get(api.id)
  return <div className='h-full overflow-auto'>{registered ?? content}</div>
}
const ImagePanel = ({ api, params }: IDockviewPanelProps<{ src: string }>) => {
  const [src, setSrc] = useState(params.src)
  useEffect(() => {
    const d = api.onDidParametersChange(e => {
      const p = e as { src?: string }
      if (p.src !== undefined) setSrc(p.src)
    })
    return () => {
      d.dispose()
    }
  }, [api])
  if (!src) return <div className={cn(CENTER, 'text-sm text-muted-foreground')}>Loading...</div>
  return (
    <div className={cn(CENTER, 'h-full overflow-auto p-4')}>
      {/* biome-ignore lint/performance/noImgElement: framework-agnostic library component, next/image unavailable */}
      {/* biome-ignore lint/correctness/useImageSize: runtime preview of arbitrary image, dimensions unknown; sized via object-contain */}
      <img alt={api.title ?? ''} className='max-h-full max-w-full object-contain' src={src} />
    </div>
  )
}
const FilePanel = ({
  api,
  params
}: IDockviewPanelProps<{
  content: string
  editorOptions?: Record<string, unknown>
  language: string
  loading?: ReactNode
  theme?: string | { dark: string; light: string }
}>) => {
  const editorRef = useRef<null | { revealLine: (line: number) => void }>(null)
  const isVirtual = api.id.startsWith(VIRTUAL_PREFIX)
  const [content, setContent] = useState(params.content)
  const [language, setLanguage] = useState(params.language)
  const [loadingState, setLoadingState] = useState(params.loading)
  const [editorOpts, setEditorOpts] = useState(params.editorOptions)
  const [ready, setReady] = useState(!shikiSetup)
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  useEffect(() => {
    if (shikiSetup) shikiSetup.then(() => setReady(true)).catch(() => setReady(true))
    const observer = new MutationObserver(() => setDark(document.documentElement.classList.contains('dark')))
    observer.observe(document.documentElement, {
      attributeFilter: ['class'],
      attributes: true
    })
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    const d = api.onDidParametersChange(e => {
      const p = e as {
        content?: string
        editorOptions?: Record<string, unknown>
        language?: string
        loading?: ReactNode
      }
      if (p.content !== undefined) {
        setContent(p.content)
        setLoadingState(undefined)
        if (isVirtual)
          requestAnimationFrame(() => {
            const lineCount = (p.content ?? '').split('\n').length
            editorRef.current?.revealLine(lineCount)
          })
      }
      if (p.language !== undefined) setLanguage(p.language)
      if (p.loading !== undefined) setLoadingState(p.loading)
      if (p.editorOptions !== undefined) setEditorOpts(p.editorOptions)
    })
    return () => {
      d.dispose()
    }
  }, [api, isVirtual])
  const setCursor = useSetAtom(cursorAtom)
  const setFileInfo = useSetAtom(activeFileInfoAtom)
  useEffect(() => {
    if (api.isActive) setFileInfo({ language, path: api.id })
    const d = api.onDidActiveChange(e => {
      if (e.isActive) setFileInfo({ language, path: api.id })
    })
    return () => {
      d.dispose()
    }
  }, [api, language, setFileInfo])
  if (loadingState || !ready)
    return (
      <div className='flex h-full flex-col gap-2 p-4'>
        <Skeleton className='h-4 w-3/4' />
        <Skeleton className='h-4 w-1/2' />
        <Skeleton className='h-4 w-2/3' />
      </div>
    )
  if (!content) return <div className={cn(CENTER, 'text-sm text-muted-foreground')}>Empty file</div>
  const pathParts = api.id.split('/')
  return (
    <div className='flex h-full flex-col'>
      <Breadcrumb className='border-b border-border px-3 py-1'>
        <BreadcrumbList className='flex-nowrap gap-1 text-xs sm:gap-1'>
          {pathParts.flatMap((part, i) => {
            const items: ReactNode[] = []
            if (i > 0) items.push(<BreadcrumbSeparator key={`sep-${part}`} />)
            items.push(
              <BreadcrumbSegment
                depth={i}
                isLast={i === pathParts.length - 1}
                key={part}
                name={part}
                pathParts={pathParts}
              />
            )
            return items
          })}
        </BreadcrumbList>
      </Breadcrumb>
      <Editor
        className='flex-1'
        language={language}
        onMount={editor => {
          editorRef.current = editor
          const update = () => {
            const pos = editor.getPosition()
            if (pos) setCursor({ col: pos.column, line: pos.lineNumber })
          }
          update()
          editor.onDidChangeCursorPosition(update)
          api.onDidDimensionsChange(() => editor.layout())
        }}
        options={{
          ...EDITOR_OPTIONS,
          fontFamily: monoFont() || undefined,
          ...editorOpts
        }}
        path={api.id}
        theme={
          typeof params.theme === 'string'
            ? params.theme
            : dark
              ? (params.theme?.dark ?? 'monokai-lite')
              : (params.theme?.light ?? 'github-light')
        }
        value={content}
      />
    </div>
  )
}
const TabHeader = ({ api, params }: IDockviewPanelHeaderProps) => {
  const p = params as
    | undefined
    | {
        activeClassName?: string
        closable?: boolean
        headerClassName?: string
        icon?: boolean | ComponentType<{ className?: string }>
        iconName?: string
        inactiveClassName?: string
        preview?: boolean
      }
  const dv = use(DockviewApiContext)
  const previewId = useAtomValue(previewPanelAtom)
  const [pinnedTabs, setPinnedTabs] = useAtom(pinnedTabsAtom)
  const isPreview = previewId === api.id
  const isPinned = pinnedTabs.includes(api.id)
  const TabIcon = p?.icon && typeof p.icon !== 'boolean' ? p.icon : undefined
  const showIcon = p?.icon !== false
  const closable = p?.closable !== false && !isPinned
  const [active, setActive] = useState(api.isActive)
  useEffect(() => {
    const d = api.onDidActiveChange(e => setActive(e.isActive))
    return () => {
      d.dispose()
    }
  }, [api])
  return (
    <ContextMenu>
      <ContextMenuTrigger
        className={cn(
          'group/tab flex h-full items-center gap-[5px] py-[3px] pr-px pl-[5px] text-sm',
          p?.headerClassName,
          active ? ['font-medium text-foreground', p?.activeClassName] : ['text-muted-foreground', p?.inactiveClassName]
        )}
        data-fill={p?.headerClassName ? '' : undefined}
        data-preview={isPreview ? '' : undefined}
        onMouseDown={e => {
          if (e.button === 1 && closable) {
            e.preventDefault()
            api.close()
          }
        }}>
        {TabIcon ? (
          <TabIcon className={ICON_CLASS_TAB_HOVER} />
        ) : showIcon ? (
          <FileIcon className={ICON_CLASS_TAB_HOVER} name={p?.iconName ?? api.title ?? ''} />
        ) : null}
        {api.title}
        {isPinned ? (
          <Pin
            className='-ml-1 size-4 rotate-45 p-0.5 opacity-50 hover:p-0 hover:cursor-pointer hover:opacity-100 transition-all'
            onClick={e => {
              e.stopPropagation()
              setPinnedTabs(prev => prev.filter(id => id !== api.id))
            }}
          />
        ) : closable ? (
          <X
            className='-ml-[3px] size-4 text-destructive opacity-0 p-0.5 hover:p-0 hover:cursor-pointer transition-all hover:opacity-100 group-hover/tab:opacity-50'
            onClick={e => {
              e.stopPropagation()
              api.close()
            }}
          />
        ) : null}
      </ContextMenuTrigger>
      {dv ? (
        <ContextMenuContent>
          <ContextMenuItem onClick={() => api.close()}>
            <X /> Close <ContextMenuShortcut>⌥W</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => {
              for (const pnl of dv.panels)
                if (pnl.id !== api.id && !pinnedTabs.includes(pnl.id))
                  try {
                    pnl.api.close()
                  } catch {
                    /* Removed */
                  }
            }}>
            <Trash /> Close Others
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => {
              const idx = dv.panels.findIndex(pnl => pnl.id === api.id)
              for (let i = dv.panels.length - 1; i > idx; i -= 1)
                if (!pinnedTabs.includes(dv.panels[i].id))
                  try {
                    dv.panels[i].api.close()
                  } catch {
                    /* Removed */
                  }
            }}>
            <ArrowRightToLine /> Close to the Right
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => {
              for (let i = dv.panels.length - 1; i >= 0; i -= 1)
                if (!pinnedTabs.includes(dv.panels[i].id))
                  try {
                    dv.panels[i].api.close()
                  } catch {
                    /* Removed */
                  }
            }}>
            <Trash2 /> Close All
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={() => {
              navigator.clipboard
                .writeText(api.id)
                .then(() => toast('Copied to clipboard'))
                .catch(() => undefined)
            }}>
            <ClipboardCopy /> Copy Path
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => setPinnedTabs(prev => (isPinned ? prev.filter(id => id !== api.id) : [...prev, api.id]))}>
            {isPinned ? <PinOff /> : <Pin />} {isPinned ? 'Unpin' : 'Pin'}
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={() => {
              const found = dv.panels.find(pnl => pnl.id === api.id)
              if (found)
                dv.addPanel({
                  component: found.view.contentComponent,
                  id: `${found.id}-split-${Date.now()}`,
                  params: found.params,
                  position: { direction: 'right', referencePanel: found },
                  tabComponent: 'default',
                  title: found.title ?? ''
                })
            }}>
            <SplitSquareHorizontal /> Split Right
          </ContextMenuItem>
        </ContextMenuContent>
      ) : null}
    </ContextMenu>
  )
}
const WatermarkPanel = () => <div className={cn(CENTER, 'text-sm text-muted-foreground/30')}>Open a file</div>
const COMPONENTS = { custom: ContentPanel, file: FilePanel, image: ImagePanel }
const TAB_COMPONENTS = { default: TabHeader }
const StatusBar = () => {
  const cursor = useAtomValue(cursorAtom)
  const fileInfo = useAtomValue(activeFileInfoAtom)
  return (
    <div className='flex h-6 items-center justify-between border-t border-border px-3 text-xs text-muted-foreground'>
      <span className='truncate'>{fileInfo.path}</span>
      <div className='flex items-center gap-3'>
        <span className='font-mono'>
          Ln {cursor.line}, Col {cursor.col}
        </span>
        <span className='capitalize'>{fileInfo.language}</span>
      </div>
    </div>
  )
}
const flattenTree = (items: TreeDataItem[]): TreeDataItem[] => {
  const result: TreeDataItem[] = []
  for (const item of items)
    if (item.children) for (const child of flattenTree(item.children)) result.push(child)
    else result.push(item)
  return result
}
const findSiblings = (tree: TreeDataItem[], pathParts: string[], depth: number): TreeDataItem[] => {
  let nodes = tree
  for (let i = 0; i < depth; i += 1) {
    const match = nodes.find(n => n.name === pathParts[i])
    if (!match?.children) return []
    nodes = match.children
  }
  return nodes
}
const BreadcrumbPickerItem = ({
  close,
  indent,
  item,
  openFileFn
}: {
  close: () => void
  indent: number
  item: TreeDataItem
  openFileFn: ((i: TreeDataItem) => void) | null
}) => {
  const [expanded, setExpanded] = useState(false)
  return (
    <>
      <button
        className='flex w-full items-center gap-1 text-left text-xs hover:bg-accent [&>:first-child]:mr-[-4px]'
        onClick={() => {
          if (item.children) setExpanded(e => !e)
          else if (openFileFn) {
            openFileFn(item)
            close()
          }
        }}
        style={{ height: 22, paddingLeft: indent * 8 + 2 }}
        type='button'>
        {item.children ? (
          <ChevronRight className={cn('size-3 shrink-0 transition-transform', expanded && 'rotate-90')} />
        ) : (
          <span className='size-3 shrink-0' />
        )}
        {item.children ? (
          <FolderIcon className={ICON_CLASS} name={item.name} />
        ) : (
          <FileIcon className={ICON_CLASS} name={item.name} />
        )}
        <span className='truncate'>{item.name}</span>
      </button>
      {expanded && item.children
        ? item.children.map(c => (
            <BreadcrumbPickerItem close={close} indent={indent + 1} item={c} key={c.id} openFileFn={openFileFn} />
          ))
        : null}
    </>
  )
}
const BreadcrumbSegment = ({
  depth,
  isLast,
  name,
  pathParts
}: {
  depth: number
  isLast: boolean
  name: string
  pathParts: string[]
}) => {
  const tree = useAtomValue(treeAtom)
  const openFileFn = useAtomValue(openFileAtom)
  const [open, setOpen] = useState(false)
  const siblings = useMemo(() => findSiblings(tree, pathParts, depth), [tree, pathParts, depth])
  if (siblings.length === 0)
    return (
      <BreadcrumbItem>
        {isLast ? (
          <BreadcrumbPage>{name}</BreadcrumbPage>
        ) : (
          <BreadcrumbLink className='cursor-default'>{name}</BreadcrumbLink>
        )}
      </BreadcrumbItem>
    )
  return (
    <BreadcrumbItem>
      <Popover onOpenChange={setOpen} open={open}>
        <PopoverTrigger className='cursor-pointer text-xs hover:text-foreground'>{name}</PopoverTrigger>
        <PopoverContent align='start' className='max-h-64 w-52 gap-0 overflow-y-auto p-0'>
          {siblings.map(s => (
            <BreadcrumbPickerItem close={() => setOpen(false)} indent={0} item={s} key={s.id} openFileFn={openFileFn} />
          ))}
        </PopoverContent>
      </Popover>
    </BreadcrumbItem>
  )
}
const QuickOpenDialog = ({
  log: logFn,
  onOpenFile,
  open,
  tree
}: {
  log: (msg: string) => void
  onOpenFile: (item: TreeDataItem) => void
  open: boolean
  tree: TreeDataItem[]
}) => {
  const setOpen = useSetAtom(quickOpenAtom)
  const flatFiles = useMemo(() => flattenTree(tree), [tree])
  const onChange = (v: boolean) => {
    setOpen(v)
    if (!v) logFn('Quick open closed')
  }
  return (
    <Dialog onOpenChange={onChange} open={open}>
      <DialogContent className='overflow-hidden p-0' showCloseButton={false}>
        <Command>
          <CommandInput placeholder='Search files...' />
          <CommandList>
            <CommandEmpty>No files found</CommandEmpty>
            {flatFiles.map(f => {
              const parent = f.path.includes('/') ? f.path.slice(0, f.path.lastIndexOf('/')) : ''
              return (
                <CommandItem
                  key={f.id}
                  onSelect={() => {
                    logFn(`Quick open: ${f.name}`)
                    onOpenFile(f)
                    setOpen(false)
                  }}
                  value={`${f.name} ${f.path}`}>
                  <FileIcon className={ICON_CLASS} name={f.name} />
                  <span className='shrink-0 truncate'>{f.name}</span>
                  {parent ? <span className='min-w-0 truncate text-xs text-muted-foreground'>{parent}</span> : null}
                </CommandItem>
              )
            })}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
const persistLayout = (api: DockviewApi, key: string) => {
  try {
    const json = api.toJSON()
    const panels: Record<string, unknown> = {}
    for (const [id, panel] of Object.entries(json.panels)) panels[id] = { ...panel, params: {} }
    globalThis.localStorage.setItem(key, JSON.stringify({ ...json, panels }))
  } catch {
    /* layout snapshot not serializable this tick */
  }
}
const restoreLayout = (api: DockviewApi, key: string, tabs: TabProps[]): boolean => {
  let raw: null | string
  try {
    raw = globalThis.localStorage.getItem(key)
  } catch {
    return false
  }
  if (raw === null || raw === '') return false
  try {
    api.fromJSON(JSON.parse(raw) as Parameters<typeof api.fromJSON>[0])
  } catch {
    return false
  }
  const tabIds = new Set(tabs.map(getTabId))
  const stale = api.panels.filter(panel => !tabIds.has(panel.id))
  for (const panel of stale)
    try {
      api.removePanel(panel)
    } catch {
      /* already gone */
    }
  for (const tab of tabs) {
    const panel = api.panels.find(p => p.id === getTabId(tab))
    if (panel)
      panel.api.updateParameters({
        activeClassName: tab.activeClassName,
        closable: tab.closable,
        content: tab.children,
        headerClassName: tab.headerClassName,
        icon: tab.icon,
        inactiveClassName: tab.inactiveClassName
      })
  }
  return api.panels.length > 0
}
const Workspace = ({
  activityLog,
  children,
  defaultSidebar = true,
  editorOptions,
  expandDepth = 0,
  expandExclude,
  fileActions,
  files,
  initialFiles,
  layoutKey,
  onFilesChange,
  onOpenFile,
  onPanelsChange,
  onSidebarChange,
  onTabChange,
  ref,
  renderLoading,
  shortcuts = true,
  sidebar: controlledSidebar,
  sidebarPosition = 'left',
  sidebarSize = '16%',
  statusBar = true,
  theme,
  tree,
  ...props
}: Omit<ComponentProps<'div'>, 'ref'> & {
  activityLog?: (line: string) => void
  defaultSidebar?: boolean
  editorOptions?: Record<string, unknown>
  expandDepth?: number
  expandExclude?: string[]
  fileActions?: FileActions
  files?: VirtualFile[]
  initialFiles?: string[]
  layoutKey?: string
  onFilesChange?: (files: string[]) => void
  onOpenFile?: (item: TreeDataItem) => null | Promise<null | string> | string
  onPanelsChange?: (ids: string[]) => void
  onSidebarChange?: (visible: boolean) => void
  onTabChange?: (id: string) => void
  ref?: Ref<WorkspaceRef>
  renderLoading?: (item: TreeDataItem) => ReactNode
  shortcuts?: boolean
  sidebar?: boolean
  sidebarPosition?: 'left' | 'right'
  sidebarSize?: number | string
  statusBar?: boolean
  theme?: string | { dark: string; light: string }
  tree?: TreeDataItem[]
}) => {
  const [mounted, setMounted] = useState(false)
  const [activeFileId, setActiveFileId] = useState<null | string>(null)
  const [treeCollapsed, setTreeCollapsed] = useState(false)
  const [treeKey, setTreeKey] = useState(0)
  const [internalWordWrap, setInternalWordWrap] = useAtom(wordWrapAtom)
  const [dockviewApi, setDockviewApi] = useState<DockviewApi | null>(null)
  const [currentPreviewId, setPreviewId] = useAtom(previewPanelAtom)
  const previewIdRef = useRef(currentPreviewId)
  const [closedTabs, setClosedTabs] = useAtom(closedTabsAtom)
  const pinnedTabsValue = useAtomValue(pinnedTabsAtom)
  const pinnedTabsRef = useRef(pinnedTabsValue)
  const historyRef = useRef<{ entries: string[]; index: number; navigating: boolean }>({
    entries: [],
    index: -1,
    navigating: false
  })
  const quickOpenVisible = useAtomValue(quickOpenAtom)
  const setQuickOpen = useSetAtom(quickOpenAtom)
  const setTreeData = useSetAtom(treeAtom)
  const setOpenFileFn = useSetAtom(openFileAtom)
  const [fontSizeDelta, setFontSizeDelta] = useAtom(fontSizeAtom)
  const log = useCallback(
    (msg: string) => {
      activityLog?.(msg)
    },
    [activityLog]
  )
  const [internalSidebar, setInternalSidebar] = useState(defaultSidebar)
  const sidebarVisible = controlledSidebar ?? internalSidebar
  const toggleSidebar = useCallback(() => {
    const next = !sidebarVisible
    setInternalSidebar(next)
    onSidebarChange?.(next)
    log(next ? 'Sidebar opened' : 'Sidebar closed')
  }, [log, onSidebarChange, sidebarVisible])
  const stateRef = useRef({
    api: null as DockviewApi | null,
    disposables: [] as { dispose: () => void }[],
    fileIds: new Set<string>(),
    onCloseMap: new Map<string, () => void>(),
    prevTabIds: new Set<string>(),
    ready: false
  })
  const onFilesChangeRef = useRef(onFilesChange)
  const onOpenFileRef = useRef(onOpenFile)
  const renderLoadingRef = useRef(renderLoading)
  const editorOptionsRef = useRef(editorOptions)
  const themeRef = useRef(theme)
  const filesRef = useRef(files)
  const onTabChangeRef = useRef(onTabChange)
  const onPanelsChangeRef = useRef(onPanelsChange)
  const mergedEditorOptions = useMemo(
    () => ({
      ...editorOptions,
      fontSize: (EDITOR_OPTIONS.fontSize ?? 16) + fontSizeDelta,
      wordWrap: (internalWordWrap ? 'on' : 'off') satisfies NonNullable<EditorProps['options']>['wordWrap']
    }),
    [editorOptions, fontSizeDelta, internalWordWrap]
  )
  useEffect(() => {
    onFilesChangeRef.current = onFilesChange
    onOpenFileRef.current = onOpenFile
    renderLoadingRef.current = renderLoading
    editorOptionsRef.current = mergedEditorOptions
    themeRef.current = theme
    filesRef.current = files
    previewIdRef.current = currentPreviewId
    pinnedTabsRef.current = pinnedTabsValue
    onTabChangeRef.current = onTabChange
    onPanelsChangeRef.current = onPanelsChange
  })
  useEffect(() => {
    const { api } = stateRef.current
    if (!api) return
    for (const panel of api.panels)
      if (stateRef.current.fileIds.has(panel.id)) panel.api.updateParameters({ editorOptions: mergedEditorOptions })
  }, [mergedEditorOptions])
  useEffect(() => {
    setMounted(true)
    const observer = new MutationObserver(() => {
      log(`Theme: ${document.documentElement.classList.contains('dark') ? 'dark' : 'light'}`)
    })
    observer.observe(document.documentElement, { attributeFilter: ['class'], attributes: true })
    return () => {
      observer.disconnect()
      for (const d of stateRef.current.disposables) d.dispose()
      stateRef.current = {
        ...stateRef.current,
        disposables: [],
        fileIds: new Set(),
        onCloseMap: new Map(),
        prevTabIds: new Set(),
        ready: false
      }
    }
  }, [log])
  useHotkeys(
    [
      { callback: () => toggleSidebar(), hotkey: 'Mod+B' },
      {
        callback: () => {
          setQuickOpen(v => !v)
          log('Quick open toggled')
        },
        hotkey: 'Mod+P'
      },
      {
        callback: () => {
          const panel = stateRef.current.api?.activePanel
          if (panel) {
            stateRef.current.api?.addPanel({
              component: panel.view.contentComponent,
              id: `${panel.id}-split-${Date.now()}`,
              params: panel.params,
              position: { direction: 'right', referencePanel: panel },
              tabComponent: 'default',
              title: panel.title ?? ''
            })
            log(`Split: ${panel.title ?? panel.id}`)
          }
        },
        hotkey: 'Mod+\\'
      },
      {
        callback: () => {
          setFontSizeDelta(d => d + 2)
          log('Zoom in')
        },
        hotkey: 'Mod+='
      },
      {
        callback: () => {
          setFontSizeDelta(d => d - 2)
          log('Zoom out')
        },
        hotkey: 'Mod+-'
      },
      {
        callback: () => {
          setFontSizeDelta(0)
          log('Zoom reset')
        },
        hotkey: 'Mod+0'
      },
      {
        callback: () => {
          const { api } = stateRef.current
          if (!api) return
          let closed = 0
          for (let panelIdx = api.panels.length - 1; panelIdx >= 0; panelIdx -= 1)
            if (!pinnedTabsRef.current.includes(api.panels[panelIdx].id))
              try {
                api.panels[panelIdx].api.close()
                closed += 1
              } catch {
                /* Already removed */
              }
          log(`Closed ${String(closed)} tabs (${String(pinnedTabsRef.current.length)} pinned kept)`)
        },
        hotkey: 'Mod+Shift+W'
      },
      {
        callback: () => {
          const lastPath = closedTabs.at(-1)
          if (!lastPath) return
          setClosedTabs(prev => prev.slice(0, -1))
          const name = lastPath.split('/').pop() ?? lastPath
          pinFile({ id: lastPath, name, path: lastPath })
          log(`Reopened: ${lastPath}`)
        },
        hotkey: 'Mod+Shift+T'
      }
    ],
    { enabled: shortcuts, preventDefault: true }
  )
  useAltKeys(
    {
      // biome-ignore lint/correctness/noNestedComponentDefinitions: KeyboardEvent.code handler map for useAltKeys, not a component
      // biome-ignore lint/nursery/noComponentHookFactories: KeyboardEvent.code handler map for useAltKeys, not a hook factory
      ArrowLeft: () => {
        const h = historyRef.current
        if (h.index <= 0) return
        h.index -= 1
        h.navigating = true
        const panelId = h.entries[h.index]
        const panel = panelId ? stateRef.current.api?.panels.find(p => p.id === panelId) : undefined
        if (panel) {
          panel.focus()
          log(`Back: ${panel.title ?? panel.id}`)
        }
        h.navigating = false
      },
      // biome-ignore lint/correctness/noNestedComponentDefinitions: KeyboardEvent.code handler map for useAltKeys, not a component
      // biome-ignore lint/nursery/noComponentHookFactories: KeyboardEvent.code handler map for useAltKeys, not a hook factory
      ArrowRight: () => {
        const h = historyRef.current
        if (h.index >= h.entries.length - 1) return
        h.index += 1
        h.navigating = true
        const panelId = h.entries[h.index]
        const panel = panelId ? stateRef.current.api?.panels.find(p => p.id === panelId) : undefined
        if (panel) {
          panel.focus()
          log(`Forward: ${panel.title ?? panel.id}`)
        }
        h.navigating = false
      },
      // biome-ignore lint/correctness/noNestedComponentDefinitions: KeyboardEvent.code handler map for useAltKeys, not a component
      // biome-ignore lint/nursery/noComponentHookFactories: KeyboardEvent.code handler map for useAltKeys, not a hook factory
      KeyE: () => {
        const { api } = stateRef.current
        if (!api) return
        const { panels } = api
        if (panels.length < 2) return
        const active = api.activePanel
        const idx = active ? panels.indexOf(active) : -1
        const next = panels[(idx + 1) % panels.length]
        next.focus()
        log(`Cycle tab: ${next.title ?? next.id}`)
      },
      // biome-ignore lint/correctness/noNestedComponentDefinitions: KeyboardEvent.code handler map for useAltKeys, not a component
      // biome-ignore lint/nursery/noComponentHookFactories: KeyboardEvent.code handler map for useAltKeys, not a hook factory
      KeyT: () => {
        const lastPath = closedTabs.at(-1)
        if (!lastPath) return
        setClosedTabs(prev => prev.slice(0, -1))
        const name = lastPath.split('/').pop() ?? lastPath
        pinFile({ id: lastPath, name, path: lastPath })
        log(`Reopened: ${lastPath}`)
      },
      // biome-ignore lint/correctness/noNestedComponentDefinitions: KeyboardEvent.code handler map for useAltKeys, not a component
      // biome-ignore lint/nursery/noComponentHookFactories: KeyboardEvent.code handler map for useAltKeys, not a hook factory
      KeyW: () => {
        const panel = stateRef.current.api?.activePanel
        if (panel) {
          log(`Close tab: ${panel.title ?? panel.id}`)
          panel.api.close()
        }
      },
      // biome-ignore lint/correctness/noNestedComponentDefinitions: KeyboardEvent.code handler map for useAltKeys, not a component
      // biome-ignore lint/nursery/noComponentHookFactories: KeyboardEvent.code handler map for useAltKeys, not a hook factory
      KeyZ: () => {
        setInternalWordWrap(w => !w)
        log('Word wrap toggled')
      }
    },
    shortcuts
  )
  const tabs = useMemo(() => extractTabs(children), [children])
  const tabContent = useMemo(() => new Map(tabs.map(t => [getTabId(t), t.children])), [tabs])
  const sidebarChildren = useMemo(() => {
    const items: ReactNode[] = []
    Children.forEach(children, child => {
      if (!(isValidElement(child) && (child.type as { _type?: symbol })._type === TAB_TYPE)) items.push(child)
    })
    return items
  }, [children])
  const addTab = useCallback((tab: TabProps) => {
    const { api } = stateRef.current
    if (!api) return
    const tabId = getTabId(tab)
    const existing = api.panels.find(p => p.id === tabId)
    if (existing) {
      existing.api.updateParameters({ content: tab.children })
      if (existing.title !== tab.title) existing.api.setTitle(tab.title)
      return
    }
    const refId = tab.position?.referenceTab
    const refPanel = refId === undefined ? undefined : api.panels.find(p => p.id === refId)
    const position = tab.position
      ? { direction: tab.position.direction, ...(refPanel ? { referencePanel: refPanel.id } : {}) }
      : undefined
    api.addPanel({
      component: 'custom',
      id: tabId,
      ...(tab.inactive ? { inactive: true } : {}),
      ...(tab.initialWidth === undefined ? {} : { initialWidth: tab.initialWidth }),
      params: {
        activeClassName: tab.activeClassName,
        closable: tab.closable,
        content: tab.children,
        headerClassName: tab.headerClassName,
        icon: tab.icon,
        inactiveClassName: tab.inactiveClassName
      },
      ...(position ? { position } : {}),
      tabComponent: 'default',
      title: tab.title
    })
  }, [])
  const openVirtualFile = useCallback((file: VirtualFile) => {
    const { api } = stateRef.current
    if (!api) return
    const id = virtualFileId(file.name)
    const existing = api.panels.find(p => p.id === id)
    if (existing) {
      existing.focus()
      return
    }
    const existingFile = api.panels.find(p => stateRef.current.fileIds.has(p.id))
    const position: PanelPosition | undefined = existingFile
      ? {
          direction: 'within',
          referenceGroup: existingFile.group.id
        }
      : undefined
    stateRef.current.fileIds.add(id)
    const lang = file.language ?? langOf(file.name)
    const iconName = file.language ? `file.${file.language}` : file.name
    api.addPanel({
      component: 'file',
      id,
      params: {
        content: file.content,
        editorOptions: editorOptionsRef.current,
        iconName,
        language: lang,
        theme: themeRef.current
      },
      position,
      tabComponent: 'default',
      title: file.name
    })
  }, [])
  const openFileInPanel = useCallback(
    (item: TreeDataItem, preview: boolean) => {
      const { api } = stateRef.current
      const onOpen = onOpenFileRef.current
      if (!api) {
        log('openFileInPanel: no api')
        return
      }
      if (!onOpen) {
        log('openFileInPanel: no onOpenFile callback')
        return
      }
      const existing = api.panels.find(p => p.id === item.path)
      if (existing) {
        existing.focus()
        if (!preview) {
          setPreviewId(prev => (prev === item.path ? null : prev))
          log(`Pinned: ${item.name}`)
        }
        return
      }
      log(`${preview ? 'Preview' : 'Open'}: ${item.path}`)
      if (preview && previewIdRef.current) {
        const prev = api.panels.find(p => p.id === previewIdRef.current)
        if (prev) {
          stateRef.current.fileIds.delete(prev.id)
          try {
            api.removePanel(prev)
          } catch {
            /* Removed */
          }
        }
      }
      const loading = renderLoadingRef.current
      const loadingNode = loading ? (
        loading(item)
      ) : (
        <div className={cn(CENTER, 'text-sm text-muted-foreground')}>Loading...</div>
      )
      const existingFile = api.panels.find(p => stateRef.current.fileIds.has(p.id))
      const position: PanelPosition | undefined = existingFile
        ? {
            direction: 'within',
            referenceGroup: existingFile.group.id
          }
        : undefined
      stateRef.current.fileIds.add(item.path)
      setPreviewId(preview ? item.path : null)
      previewIdRef.current = preview ? item.path : null
      const ext = extOf(item.path)
      const isImage = IMAGE_EXTS.has(ext)
      const isBinary = BINARY_EXTS.has(ext)
      const title = deduplicateTitle(item.name, item.path, api.panels)
      if (isBinary) {
        api.addPanel({
          component: 'custom',
          id: item.path,
          params: {
            content: createElement(
              'div',
              { className: cn(CENTER, 'h-full text-sm text-muted-foreground') },
              'Binary file — cannot display'
            ),
            iconName: item.name
          },
          position,
          tabComponent: 'default',
          title
        })
        log(`Binary: ${item.path}`)
        return
      }
      if (isImage) {
        const result = onOpen(item)
        const addImagePanel = (src: string) => {
          api.addPanel({
            component: 'image',
            id: item.path,
            params: { iconName: item.name, src },
            position,
            tabComponent: 'default',
            title
          })
          log(`Image: ${item.path}`)
        }
        if (result === null) return
        if (typeof result === 'string') addImagePanel(result)
        else
          result
            .then(r => {
              if (r) addImagePanel(r)
            })
            .catch(() => undefined)
        return
      }
      const added = api.addPanel({
        component: 'file',
        id: item.path,
        params: {
          content: '',
          editorOptions: editorOptionsRef.current,
          iconName: item.name,
          language: langOf(item.path),
          loading: loadingNode,
          theme: themeRef.current
        },
        position,
        tabComponent: 'default',
        title
      })
      const result = onOpen(item)
      if (result === null) {
        log(`Load returned null: ${item.path}`)
        return
      }
      if (typeof result === 'string') {
        if (result.length > FILE_SIZE_WARN)
          log(`Large file: ${item.path} (${String(Math.round(result.length / 1024))} KB)`)
        added.api.updateParameters({ content: result, loading: undefined })
        log(`Loaded: ${item.path} (${String(result.length)} chars)`)
      } else {
        const panelPath = item.path
        result
          .then(fileContent => {
            try {
              const p = api.panels.find(x => x.id === panelPath)
              if (!p) return
              if (fileContent === null) {
                api.removePanel(p)
                log(`Load failed: ${panelPath}`)
              } else {
                if (fileContent.length > FILE_SIZE_WARN)
                  log(`Large file: ${panelPath} (${String(Math.round(fileContent.length / 1024))} KB)`)
                p.api.updateParameters({
                  content: fileContent,
                  loading: undefined
                })
                log(`Loaded: ${panelPath} (${String(fileContent.length)} chars)`)
              }
            } catch {
              /* Panel already removed */
            }
          })
          .catch(() => {
            try {
              const p = api.panels.find(x => x.id === panelPath)
              if (p) api.removePanel(p)
              log(`Load error: ${panelPath}`)
            } catch {
              /* Panel already removed */
            }
          })
      }
    },
    [log, setPreviewId]
  )
  const openFile = useCallback((item: TreeDataItem) => openFileInPanel(item, true), [openFileInPanel])
  const pinFile = useCallback((item: TreeDataItem) => openFileInPanel(item, false), [openFileInPanel])
  useEffect(() => {
    setTreeData(tree ?? EMPTY_TREE)
  }, [tree, setTreeData])
  useEffect(() => {
    setOpenFileFn(() => pinFile)
  }, [pinFile, setOpenFileFn])
  useImperativeHandle(ref, () => {
    const reopenById = (id: string): boolean => {
      const spec = tabs.find(t => getTabId(t) === id)
      if (!spec) return false
      addTab(spec)
      stateRef.current.api?.panels.find(p => p.id === id)?.focus()
      return true
    }
    return {
      focusPanel: (id: string) => stateRef.current.api?.panels.find(p => p.id === id)?.focus(),
      hasPanel: (id: string) => Boolean(stateRef.current.api?.panels.some(p => p.id === id)),
      openFile: pinFile,
      panelIds: () => stateRef.current.api?.panels.map(p => p.id) ?? [],
      reopenLast: () =>
        setClosedTabs(prev => {
          for (let i = prev.length - 1; i >= 0; i -= 1) {
            const id = prev[i]
            if (id !== undefined && reopenById(id)) return [...prev.slice(0, i), ...prev.slice(i + 1)]
          }
          return prev
        }),
      reset: () => {
        const { api } = stateRef.current
        if (!api) return
        if (layoutKey !== undefined)
          try {
            globalThis.localStorage.removeItem(layoutKey)
          } catch {
            /* storage unavailable */
          }
        for (const id of api.panels.map(p => p.id)) {
          const panel = api.panels.find(p => p.id === id)
          if (panel) api.removePanel(panel)
        }
        for (const tab of tabs) if (tab.defaultOpen !== false) addTab(tab)
      },
      togglePanel: (id: string, focusOnly?: boolean) => {
        const { api } = stateRef.current
        if (!api) return
        const existing = api.panels.find(p => p.id === id)
        if (existing) {
          if (focusOnly) existing.focus()
          else api.removePanel(existing)
          return
        }
        reopenById(id)
      },
      toggleSidebar
    }
  }, [addTab, layoutKey, pinFile, setClosedTabs, tabs, toggleSidebar])
  useEffect(() => {
    const { api } = stateRef.current
    if (!api) return
    const currentIds = new Set(tabs.map(getTabId))
    for (const id of stateRef.current.prevTabIds)
      if (!currentIds.has(id)) {
        const panel = api.panels.find(p => p.id === id)
        if (panel) api.removePanel(panel)
      }
    for (const tab of tabs) {
      const tabId = getTabId(tab)
      if (stateRef.current.prevTabIds.has(tabId))
        api.panels.find(p => p.id === tabId)?.api.updateParameters({ content: tab.children })
      else if (tab.defaultOpen !== false) addTab(tab)
    }
    stateRef.current.prevTabIds = currentIds
    stateRef.current.onCloseMap.clear()
    for (const tab of tabs) if (tab.onClose) stateRef.current.onCloseMap.set(getTabId(tab), tab.onClose)
  }, [addTab, tabs])
  useEffect(() => {
    const { api } = stateRef.current
    if (!(api && files)) return
    const tid = setTimeout(() => {
      const activeIds = new Set(files.map(f => virtualFileId(f.name)))
      for (const panel of api.panels)
        if (panel.id.startsWith(VIRTUAL_PREFIX) && !activeIds.has(panel.id))
          try {
            api.removePanel(panel)
          } catch {
            /* Already removed */
          }
      for (const file of files) {
        const id = virtualFileId(file.name)
        const panel = api.panels.find(p => p.id === id)
        if (panel) panel.api.updateParameters({ content: file.content })
      }
    }, 100)
    return () => clearTimeout(tid)
  }, [files])
  const handleReady = (event: DockviewReadyEvent) => {
    stateRef.current.api = event.api
    setDockviewApi(event.api)
    const restored = layoutKey === undefined ? false : restoreLayout(event.api, layoutKey, tabs)
    if (!restored) for (const tab of tabs) if (tab.defaultOpen !== false) addTab(tab)
    if (layoutKey !== undefined)
      stateRef.current.disposables.push(event.api.onDidLayoutChange(() => persistLayout(event.api, layoutKey)))
    stateRef.current.prevTabIds = new Set(tabs.map(getTabId))
    for (const tab of tabs) if (tab.onClose) stateRef.current.onCloseMap.set(getTabId(tab), tab.onClose)
    if (filesRef.current)
      for (const f of filesRef.current)
        if (f.open) {
          openVirtualFile(f)
          log(`Virtual file: ${f.name}`)
        }
    requestAnimationFrame(() => {
      const filesToOpen = initialFiles
      if (filesToOpen) {
        log(`Opening files: ${filesToOpen.join(', ')}`)
        for (const fpath of filesToOpen) pinFile({ id: fpath, name: fpath.split('/').pop() ?? fpath, path: fpath })
        requestAnimationFrame(() => {
          const first = event.api.panels.find(p => p.id === filesToOpen[0])
          if (first) first.focus()
        })
      }
    })
    log('Workspace ready')
    const notifyFiles = () => {
      if (!stateRef.current.ready) return
      const fileList = [...stateRef.current.fileIds]
      onFilesChangeRef.current?.(fileList)
    }
    const notifyPanels = () => onPanelsChangeRef.current?.(event.api.panels.map(p => p.id))
    stateRef.current.disposables.push(
      event.api.onDidRemovePanel(e => {
        stateRef.current.fileIds.delete(e.id)
        stateRef.current.onCloseMap.get(e.id)?.()
        stateRef.current.onCloseMap.delete(e.id)
        initMonaco()
          .then(monaco => {
            const model = monaco.editor.getModel(monaco.Uri.parse(e.id))
            if (model) model.dispose()
          })
          .catch(() => undefined)
        if (previewIdRef.current === e.id) {
          setPreviewId(null)
          previewIdRef.current = null
        }
        if (!e.id.startsWith(VIRTUAL_PREFIX)) setClosedTabs(prev => [...prev.slice(-19), e.id])
        log(`Closed: ${e.title ?? e.id}`)
        notifyFiles()
        notifyPanels()
      }),
      event.api.onDidAddPanel(e => {
        log(`Opened tab: ${e.title ?? e.id}`)
        notifyFiles()
        notifyPanels()
      }),
      event.api.onDidActivePanelChange(e => {
        if (e?.id) {
          setActiveFileId(e.id)
          onTabChangeRef.current?.(e.id)
          if (!historyRef.current.navigating) {
            const h = historyRef.current
            if (h.entries[h.index] !== e.id) {
              h.entries = [...h.entries.slice(0, h.index + 1), e.id].slice(-50)
              h.index = h.entries.length - 1
            }
          }
          log(`Focused: ${e.title ?? e.id}`)
        }
      })
    )
    stateRef.current.ready = true
    notifyPanels()
  }
  const mergedTree = useMemo(() => {
    if (!(tree || (files && files.length > 0))) return tree
    const toItem = (f: VirtualFile): TreeDataItem => ({
      icon: f.icon ?? (f.language ? resolveLanguageIcon(f.language) : undefined),
      id: virtualFileId(f.name),
      name: f.name,
      path: virtualFileId(f.name)
    })
    const top = files?.filter(f => f.pin === 'top').map(toItem) ?? []
    const mid = files?.filter(f => !f.pin).map(toItem) ?? []
    const bottom = files?.filter(f => f.pin === 'bottom').map(toItem) ?? []
    return [...top, ...mid, ...(tree ?? []), ...bottom]
  }, [files, tree])
  const uploadInputRef = useRef<HTMLInputElement>(null)
  const [uploadTarget, setUploadTarget] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [rootCreating, setRootCreating] = useState<null | { type: 'file' | 'folder' }>(null)
  if (!mounted) return null
  const handleUploadInput = (fileList: FileList | null) => {
    if (fileList && fileActions?.onUpload) fileActions.onUpload(uploadTarget, fileList)
  }
  const handleDrop = (e: React.DragEvent, parentPath: string) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length > 0 && fileActions?.onUpload) fileActions.onUpload(parentPath, e.dataTransfer.files)
  }
  const sidebarContent = mergedTree ? (
    <div className='flex h-full flex-col'>
      <div className='flex items-center justify-between px-3 py-1.5'>
        <span className='text-sm uppercase text-xs text-muted-foreground'>explorer</span>
        <div className='flex items-center gap-0.5'>
          {fileActions?.onCreateFile ? (
            <button
              className='text-muted-foreground hover:text-foreground transition-colors p-0.5'
              onClick={() => setRootCreating({ type: 'file' })}
              title='New File'
              type='button'>
              <FilePlus className='stroke-1 size-4' />
            </button>
          ) : null}
          {fileActions?.onCreateFolder ? (
            <button
              className='text-muted-foreground hover:text-foreground transition-colors p-0.5'
              onClick={() => setRootCreating({ type: 'folder' })}
              title='New Folder'
              type='button'>
              <FolderPlus className='stroke-1 size-4' />
            </button>
          ) : null}
          {fileActions?.onUpload ? (
            <button
              className='text-muted-foreground hover:text-foreground transition-colors p-0.5'
              onClick={() => {
                setUploadTarget('')
                uploadInputRef.current?.click()
              }}
              title='Upload'
              type='button'>
              <Download className='stroke-1 size-4 rotate-180' />
            </button>
          ) : null}
          <button
            className='text-muted-foreground hover:text-foreground transition-colors p-0.5'
            onClick={() => {
              log(treeCollapsed ? 'Tree expanded all' : 'Tree collapsed all')
              setTreeCollapsed(c => !c)
              setTreeKey(k => k + 1)
            }}
            title={treeCollapsed ? 'Expand All' : 'Collapse All'}
            type='button'>
            {treeCollapsed ? <ChevronRight className='stroke-1 size-4' /> : <ChevronsDownUp className='stroke-1 size-4' />}
          </button>
        </div>
      </div>
      <input
        aria-label='Upload files'
        className='hidden'
        multiple
        onChange={e => {
          handleUploadInput(e.target.files)
          e.target.value = ''
        }}
        ref={uploadInputRef}
        type='file'
      />
      <ContextMenu>
        <ContextMenuTrigger
          className={cn('min-h-0 flex-1 overflow-auto block', dragOver && 'ring-2 ring-inset ring-primary/30')}
          onDragLeave={() => setDragOver(false)}
          onDragOver={e => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDrop={e => handleDrop(e, '')}>
          {rootCreating ? (
            <InlineInput
              depth={0}
              indent={16}
              onCancel={() => setRootCreating(null)}
              onSubmit={n => {
                const cb = rootCreating.type === 'file' ? fileActions?.onCreateFile : fileActions?.onCreateFolder
                cb?.('', n)
                setRootCreating(null)
              }}
              type={rootCreating.type}
            />
          ) : null}
          <FileTree
            data={mergedTree}
            expandDepth={treeCollapsed ? 0 : expandDepth}
            expandExclude={expandExclude}
            fileActions={fileActions}
            key={treeKey}
            log={log}
            onDoubleClick={item => {
              if (item.children) return
              if (!item.id.startsWith(VIRTUAL_PREFIX)) {
                pinFile(item)
                log(`Double-click pinned: ${item.name}`)
              }
            }}
            onSelectChange={item => {
              if (!item) return
              if (item.children) {
                log(`Folder: ${item.name}`)
                return
              }
              if (item.id.startsWith(VIRTUAL_PREFIX)) {
                const vf = files?.find(f => virtualFileId(f.name) === item.id)
                if (vf) openVirtualFile(vf)
              } else openFile(item)
            }}
            selectedId={activeFileId}
            triggerUpload={
              fileActions?.onUpload
                ? (parentPath: string) => {
                    setUploadTarget(parentPath)
                    uploadInputRef.current?.click()
                  }
                : undefined
            }
          />
        </ContextMenuTrigger>
        <ContextMenuContent>
          {fileActions?.onCreateFile ? (
            <ContextMenuItem onClick={() => setRootCreating({ type: 'file' })}>
              <FilePlus /> New File
            </ContextMenuItem>
          ) : null}
          {fileActions?.onCreateFolder ? (
            <ContextMenuItem onClick={() => setRootCreating({ type: 'folder' })}>
              <FolderPlus /> New Folder
            </ContextMenuItem>
          ) : null}
          {fileActions?.onUpload ? (
            <ContextMenuItem
              onClick={() => {
                setUploadTarget('')
                uploadInputRef.current?.click()
              }}>
              <Download className='rotate-180' /> Upload
            </ContextMenuItem>
          ) : null}
        </ContextMenuContent>
      </ContextMenu>
    </div>
  ) : (
    sidebarChildren
  )
  const dockview = (
    <ResizablePanel minSize={20}>
      <div className='flex h-full flex-col'>
        <DockviewApiContext value={dockviewApi}>
          <TabContentContext value={tabContent}>
            <DockviewReact
              className='dv-reset flex-1'
              components={COMPONENTS}
              onReady={handleReady}
              tabComponents={TAB_COMPONENTS}
              watermarkComponent={WatermarkPanel}
            />
          </TabContentContext>
        </DockviewApiContext>
        {statusBar ? <StatusBar /> : null}
      </div>
    </ResizablePanel>
  )
  const sidePanel = sidebarVisible ? (
    <>
      {sidebarPosition === 'right' ? <ResizableHandle className='opacity-0' /> : null}
      <ResizablePanel defaultSize={sidebarSize} minSize={5}>
        {sidebarContent}
      </ResizablePanel>
      {sidebarPosition === 'left' ? <ResizableHandle className='opacity-0' /> : null}
    </>
  ) : null
  return (
    <ResizablePanelGroup orientation='horizontal' {...props}>
      <style>{RESET_CSS}</style>
      {sidebarPosition === 'left' ? sidePanel : null}
      {dockview}
      {sidebarPosition === 'right' ? sidePanel : null}
      <QuickOpenDialog
        log={log}
        onOpenFile={item => {
          if (item.id.startsWith(VIRTUAL_PREFIX)) {
            const vf = files?.find(f => virtualFileId(f.name) === item.id)
            if (vf) openVirtualFile(vf)
          } else openFile(item)
        }}
        open={quickOpenVisible}
        tree={mergedTree ?? EMPTY_TREE}
      />
      <Toaster />
    </ResizablePanelGroup>
  )
}
interface ConfigFieldMeta {
  enum?: string[]
  folder?: string
  hint?: string
  icon?: string
  showWhen?: ConfigShowWhen | ConfigShowWhen[]
  unit?: string
}
interface ConfigJsonNode extends ConfigFieldMeta {
  default?: unknown
  enum?: string[]
  maximum?: number
  minimum?: number
  properties?: Record<string, ConfigJsonNode>
  step?: number
  type?: string
}
type ConfigLevaTheme = NonNullable<ComponentProps<typeof LevaPanel>['theme']>
interface ConfigShowWhen {
  equals: boolean | number | string
  field: string
}
type ConfigSide = 'bottom' | 'left' | 'right' | 'top'
const swallow = () => undefined
const configTitleCase = (key: string, acronyms?: ReadonlySet<string>): string =>
  key
    .replaceAll(/(?<lower>[a-z])(?<upper>[A-Z])/gu, '$<lower> $<upper>')
    .replaceAll(/[_-]+/gu, ' ')
    .split(' ')
    .filter(Boolean)
    .map(w => (acronyms?.has(w.toLowerCase()) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ')
const configShowWhenSchema = z.object({
  equals: z.union([z.boolean(), z.number(), z.string()]),
  field: z.string()
})
const configJsonNodeSchema: z.ZodType<ConfigJsonNode> = z.looseObject({
  default: z.unknown().optional(),
  enum: z.array(z.string()).optional(),
  folder: z.string().optional(),
  hint: z.string().optional(),
  icon: z.string().optional(),
  maximum: z.number().optional(),
  minimum: z.number().optional(),
  properties: z
    .record(
      z.string(),
      z.lazy(() => configJsonNodeSchema)
    )
    .optional(),
  showWhen: z.union([configShowWhenSchema, z.array(configShowWhenSchema)]).optional(),
  step: z.number().optional(),
  type: z.string().optional(),
  unit: z.string().optional()
})
const configLabel = (
  key: string,
  node: ConfigJsonNode,
  ctx?: { acronyms?: ReadonlySet<string>; icons?: Record<string, LucideIcon> }
): ReactElement | string => {
  const cased = configTitleCase(key, ctx?.acronyms)
  const text = node.unit ? `${cased} (${node.unit})` : cased
  const Icon = node.icon ? ctx?.icons?.[node.icon] : undefined
  return Icon ? (
    <span className='inline-flex items-center gap-1.5'>
      <Icon className='size-3 shrink-0 text-muted-foreground' />
      {text}
    </span>
  ) : (
    text
  )
}
const configRender = (showWhen: ConfigJsonNode['showWhen']): ((get: (key: string) => unknown) => boolean) | undefined => {
  if (!showWhen) return
  const conds = Array.isArray(showWhen) ? showWhen : [showWhen]
  return (get: (key: string) => unknown) => conds.every(c => get(c.field) === c.equals)
}
const configLeaf = (
  key: string,
  node: ConfigJsonNode,
  ctx?: { acronyms?: ReadonlySet<string>; icons?: Record<string, LucideIcon>; saved?: unknown }
): null | Record<string, unknown> => {
  const saved = ctx?.saved
  const base = {
    hint: node.hint,
    label: configLabel(key, node, { acronyms: ctx?.acronyms, icons: ctx?.icons }),
    render: configRender(node.showWhen)
  }
  if (node.enum) return { ...base, options: node.enum, value: saved ?? node.default ?? node.enum[0] }
  if (node.type === 'boolean') return { ...base, value: saved ?? node.default ?? false }
  if (node.type === 'integer' || node.type === 'number') {
    const min = node.minimum
    const max = node.maximum
    const step =
      node.step ?? (node.type === 'integer' ? 1 : min !== undefined && max !== undefined ? (max - min) / 100 : undefined)
    return { ...base, max, min, step, value: saved ?? node.default ?? min ?? 0 }
  }
  if (node.type === 'string') return { ...base, value: saved ?? node.default ?? '' }
  return null
}
const toLevaSchema = (
  config: z.ZodObject,
  opts?: {
    acronyms?: ReadonlySet<string>
    icons?: Record<string, LucideIcon>
    overlay?: Record<string, ConfigFieldMeta>
    values?: Record<string, unknown>
  }
): Schema => {
  const json = configJsonNodeSchema.parse(z.toJSONSchema(config))
  const top: Record<string, unknown> = {}
  const folders: Record<string, Record<string, unknown>> = {}
  for (const [key, raw] of Object.entries(json.properties ?? {})) {
    const node = opts?.overlay?.[key] ? { ...raw, ...opts.overlay[key] } : raw
    const control = raw.properties
      ? null
      : configLeaf(key, node, { acronyms: opts?.acronyms, icons: opts?.icons, saved: opts?.values?.[key] })
    if (control)
      if (node.folder) {
        const group = folders[node.folder] ?? {}
        group[key] = control
        folders[node.folder] = group
      } else top[key] = control
  }
  const out: Record<string, unknown> = { ...top }
  for (const [name, controls] of Object.entries(folders)) out[name] = folder(controls as Schema, { collapsed: true })
  return out as Schema
}
const configTheme: ConfigLevaTheme = {
  colors: {
    accent2: 'var(--primary)',
    accent3: 'var(--primary)',
    elevation1: 'var(--popover)',
    elevation2: 'var(--card)',
    elevation3: 'var(--muted)',
    folderTextColor: 'var(--foreground)',
    folderWidgetColor: 'var(--muted-foreground)',
    highlight1: 'var(--muted-foreground)',
    highlight2: 'var(--foreground)',
    highlight3: 'var(--foreground)'
  },
  fontSizes: { root: '12px' },
  radii: { lg: 'var(--radius)' },
  sizes: { rootWidth: '100%' }
}
const ConfigPanel = ({ store }: { store: StoreType }) => (
  <LevaPanel fill flat hideCopyButton store={store} theme={configTheme} titleBar={false} />
)
const persistConfig = (key: string): { load: () => unknown; save: (values: unknown) => void } => ({
  load: () => {
    try {
      const raw = globalThis.localStorage.getItem(key)
      return raw === null ? null : (JSON.parse(raw) as unknown)
    } catch {
      return null
    }
  },
  save: values => {
    try {
      globalThis.localStorage.setItem(key, JSON.stringify(values))
    } catch {
      swallow()
    }
  }
})
const useConfig = <T extends z.ZodObject>(
  schema: T,
  options?: {
    acronyms?: ReadonlySet<string>
    icons?: Record<string, LucideIcon>
    load?: () => unknown
    overlay?: Record<string, ConfigFieldMeta>
    save?: (values: z.infer<T>) => void
  }
): { store: StoreType; values: z.infer<T> } => {
  const store = useCreateStore()
  const overlayDep = JSON.stringify(Object.entries(options?.overlay ?? {}).map(([key, meta]) => [key, meta.enum ?? null]))
  const [values] = useControls(
    () => {
      const loaded = options?.load
        ? (schema.partial().safeParse(options.load()).data as Record<string, unknown> | undefined)
        : undefined
      return toLevaSchema(schema, {
        acronyms: options?.acronyms,
        icons: options?.icons,
        overlay: options?.overlay,
        values: loaded
      })
    },
    { store },
    [overlayDep]
  ) as unknown as [z.infer<T>, unknown]
  const saveRef = useRef(options?.save)
  useEffect(() => {
    saveRef.current = options?.save
  })
  useEffect(() => {
    saveRef.current?.(values)
  }, [values])
  return { store, values }
}
const ConfigPopover = ({
  icon: Icon = SlidersHorizontal,
  label,
  side = 'top',
  store
}: {
  icon?: LucideIcon
  label: string
  side?: ConfigSide
  store: StoreType
}) => (
  <Popover>
    <Tooltip>
      <TooltipTrigger
        render={tooltipProps => (
          <PopoverTrigger
            {...tooltipProps}
            render={popoverProps => (
              <Button
                {...popoverProps}
                aria-label={label}
                className='shrink-0 text-muted-foreground'
                size='icon-sm'
                variant='ghost'>
                <Icon className='size-4' />
              </Button>
            )}
          />
        )}
      />
      <TooltipContent side={side}>{label}</TooltipContent>
    </Tooltip>
    <PopoverContent align='start' className='w-fit min-w-72 max-w-[min(34rem,92vw)] p-0' side={side} sideOffset={6}>
      <ConfigPanel store={store} />
    </PopoverContent>
  </Popover>
)
const InfoButton = ({
  children,
  icon: Icon,
  label,
  side = 'top'
}: {
  children: ReactNode
  icon: LucideIcon
  label: string
  side?: ConfigSide
}) => (
  <Popover>
    <Tooltip>
      <TooltipTrigger
        render={tooltipProps => (
          <PopoverTrigger
            {...tooltipProps}
            render={popoverProps => (
              <Button
                {...popoverProps}
                aria-label={label}
                className='shrink-0 text-muted-foreground'
                size='icon-sm'
                variant='ghost'>
                <Icon className='size-4' />
              </Button>
            )}
          />
        )}
      />
      <TooltipContent side={side}>{label}</TooltipContent>
    </Tooltip>
    <PopoverContent align='start' className='w-fit max-w-[min(28rem,92vw)] p-2 text-xs' side={side} sideOffset={6}>
      {children}
    </PopoverContent>
  </Popover>
)
const IconButton = ({
  busy = false,
  children,
  className,
  disabled = false,
  icon: Icon,
  kbd,
  label,
  onClick,
  reason,
  side,
  ...props
}: Omit<ComponentProps<typeof Button>, 'size' | 'variant'> & {
  busy?: boolean
  icon: LucideIcon
  kbd?: string
  label: string
  reason?: string
  side?: 'bottom' | 'left' | 'right' | 'top'
}) => {
  const blocked = disabled && !busy
  return (
    <Tooltip>
      <TooltipTrigger
        render={triggerProps => (
          <Button
            aria-label={label}
            size='icon-sm'
            variant='ghost'
            {...triggerProps}
            {...props}
            aria-disabled={blocked || undefined}
            className={cn(blocked && 'cursor-not-allowed opacity-50', className)}
            disabled={busy}
            onClick={blocked ? undefined : onClick}>
            {busy ? <Spinner className='size-4' /> : (children ?? <Icon className='size-4' />)}
          </Button>
        )}
      />
      <TooltipContent side={side}>
        {blocked && reason !== undefined ? reason : label}
        {kbd === undefined ? null : <kbd className='ml-1 rounded bg-background/20 px-1 font-mono text-[10px]'>{kbd}</kbd>}
      </TooltipContent>
    </Tooltip>
  )
}
interface PdfRegion {
  box: readonly [number, number, number, number]
  color?: string
  id: string
  label?: string
  page: number
}
interface PdfViewerProps {
  className?: string
  onRegionClick?: (id: string) => void
  regions?: readonly PdfRegion[]
  scale?: number
  selectedRegionId?: null | string
  src: string
}
const pdfBoxStyle = (vp: PageViewport, box: readonly [number, number, number, number]) => {
  const [x1, y1, x2, y2] = vp.convertToViewportRectangle([box[0], box[1], box[2], box[3]]) as [
    number,
    number,
    number,
    number
  ]
  return { height: Math.abs(y2 - y1), left: Math.min(x1, x2), top: Math.min(y1, y2), width: Math.abs(x2 - x1) }
}
const PdfPage = ({
  onRegionClick,
  pageNo,
  pdf,
  regions,
  scale,
  selectedRegionId
}: {
  onRegionClick?: (id: string) => void
  pageNo: number
  pdf: PDFDocumentProxy
  regions: readonly PdfRegion[]
  scale: number
  selectedRegionId: null | string
}) => {
  const ref = useRef<HTMLCanvasElement>(null)
  const taskRef = useRef<null | RenderTask>(null)
  const selectedRef = useRef<HTMLButtonElement>(null)
  const [vp, setVp] = useState<PageViewport>()
  const pageRegions = regions.filter(r => r.page === pageNo)
  const selectedOnPage = selectedRegionId !== null && pageRegions.some(r => r.id === selectedRegionId)
  useEffect(() => {
    if (selectedOnPage && vp) selectedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [selectedOnPage, vp])
  useEffect(() => {
    const controller = new AbortController()
    const draw = async () => {
      const page = await pdf.getPage(pageNo)
      const viewport = page.getViewport({ scale })
      const canvas = ref.current
      const ctx = canvas?.getContext('2d')
      if (!(canvas && ctx)) return
      const prev = taskRef.current
      prev?.cancel()
      await prev?.promise.catch(() => undefined)
      const dpr = Math.max(1, globalThis.devicePixelRatio)
      canvas.width = Math.ceil(viewport.width * dpr)
      canvas.height = Math.ceil(viewport.height * dpr)
      canvas.style.width = `${viewport.width}px`
      canvas.style.height = `${viewport.height}px`
      const task = page.render({
        canvas,
        canvasContext: ctx,
        transform: dpr === 1 ? undefined : [dpr, 0, 0, dpr, 0, 0],
        viewport
      })
      taskRef.current = task
      try {
        await task.promise
      } catch {
        return
      }
      if (!controller.signal.aborted) setVp(viewport)
    }
    draw().catch(() => undefined)
    return () => {
      controller.abort()
      taskRef.current?.cancel()
    }
  }, [pdf, pageNo, scale])
  return (
    <div className='relative w-fit scroll-mt-12 border-b border-border/40 pb-2 last:border-b-0' id={`pdf-page-${pageNo}`}>
      <canvas aria-label={`Page ${pageNo}`} className='block' ref={ref} />
      {vp
        ? pageRegions.map((r, i) => {
            const color = r.color ?? 'var(--primary)'
            const isSelected = r.id === selectedRegionId
            return (
              <button
                aria-label={r.label ?? `region ${r.id}`}
                className={cn(
                  'absolute rounded-sm border-2 transition-[filter] hover:brightness-125',
                  isSelected && 'ring-2 ring-offset-1'
                )}
                key={`${r.id}-${String(i)}`}
                onClick={() => onRegionClick?.(r.id)}
                ref={isSelected ? selectedRef : undefined}
                style={{
                  ...pdfBoxStyle(vp, r.box),
                  backgroundColor: `color-mix(in oklch, ${color} 15%, transparent)`,
                  borderColor: color
                }}
                title={r.label}
                type='button'
              />
            )
          })
        : null}
    </div>
  )
}
const NO_REGIONS: readonly PdfRegion[] = []
const PdfThumb = ({
  active,
  onClick,
  pageNo,
  pdf
}: {
  active: boolean
  onClick: () => void
  pageNo: number
  pdf: PDFDocumentProxy
}) => {
  const ref = useRef<HTMLCanvasElement>(null)
  const taskRef = useRef<null | RenderTask>(null)
  useEffect(() => {
    let cancelled = false
    const draw = async () => {
      const page = await pdf.getPage(pageNo)
      const viewport = page.getViewport({ scale: 0.18 })
      const canvas = ref.current
      const ctx = canvas?.getContext('2d')
      if (!(canvas && ctx) || cancelled) return
      canvas.width = Math.ceil(viewport.width)
      canvas.height = Math.ceil(viewport.height)
      taskRef.current?.cancel()
      const task = page.render({ canvas, canvasContext: ctx, viewport })
      taskRef.current = task
      await task.promise.catch(() => undefined)
    }
    draw().catch(() => undefined)
    return () => {
      cancelled = true
      taskRef.current?.cancel()
    }
  }, [pdf, pageNo])
  return (
    <button
      aria-label={`Go to page ${String(pageNo)}`}
      className={cn(
        'flex shrink-0 flex-col items-center gap-0.5 rounded border p-1 hover:bg-accent',
        active && 'border-primary bg-accent'
      )}
      onClick={onClick}
      type='button'>
      <canvas aria-hidden className='block' ref={ref} />
      <span className='text-[10px] tabular-nums text-muted-foreground'>{pageNo}</span>
    </button>
  )
}
const TBTN = 'rounded p-1 hover:bg-accent'
const PdfViewer = ({
  className,
  onRegionClick,
  regions = NO_REGIONS,
  scale,
  selectedRegionId = null,
  src
}: PdfViewerProps) => {
  const [doc, setDoc] = useState<PDFDocumentProxy>()
  const [zoom, setZoom] = useState(scale ?? 1.4)
  const [fit, setFit] = useState<'none' | 'page' | 'width'>('width')
  const [base, setBase] = useState<null | { h: number; w: number }>(null)
  const [box, setBox] = useState({ h: 0, w: 0 })
  const [page, setPage] = useState(1)
  const [showThumbs, setShowThumbs] = useState(false)
  const [showRegions, setShowRegions] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let active = true
    let loaded: PDFDocumentProxy | undefined
    const run = async () => {
      const pdfjs = await loadPdfjs()
      const d = await pdfjs.getDocument({ url: src }).promise.catch(() => undefined)
      if (!d) return
      loaded = d
      const v = (await d.getPage(1)).getViewport({ scale: 1 })
      if (active) {
        setDoc(d)
        setBase({ h: v.height, w: v.width })
      }
    }
    run().catch(() => undefined)
    return () => {
      active = false
      loaded?.cleanup().catch(() => undefined)
    }
  }, [src])
  useEffect(() => {
    const root = scrollRef.current
    if (!(root && doc)) return
    const ro = new ResizeObserver(entries => {
      const r = entries[0]?.contentRect
      if (r) setBox({ h: r.height, w: r.width })
    })
    ro.observe(root)
    return () => ro.disconnect()
  }, [doc])
  useEffect(() => {
    const root = scrollRef.current
    if (!(root && doc)) return
    const observer = new IntersectionObserver(
      entries => {
        const top = entries.filter(e => e.isIntersecting).toSorted((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (top) setPage(Number(top.target.id.replace('pdf-page-', '')))
      },
      { root, threshold: [0.1, 0.5, 0.9] }
    )
    for (let n = 1; n <= doc.numPages; n += 1) {
      const el = root.querySelector(`#pdf-page-${String(n)}`)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [doc])
  const jump = (n: number): void => {
    scrollRef.current?.querySelector(`#pdf-page-${String(n)}`)?.scrollIntoView({ behavior: 'smooth' })
  }
  if (!doc) return <div className={cn(CENTER, 'text-sm text-muted-foreground', className)}>Loading…</div>
  const pages = Array.from({ length: doc.numPages }, (_, i) => i + 1)
  const effZoom =
    fit === 'none' || !base || box.w === 0
      ? zoom
      : fit === 'width'
        ? Math.max(0.2, (box.w - 24) / base.w)
        : Math.max(0.2, Math.min((box.w - 24) / base.w, (box.h - 24) / base.h))
  const setManualZoom = (next: number): void => {
    setFit('none')
    setZoom(next)
  }
  return (
    <div className={cn('relative flex h-full overflow-hidden', className)}>
      {showThumbs ? (
        <div className='flex w-28 shrink-0 flex-col gap-1 overflow-auto border-r p-1'>
          {pages.map(n => (
            <PdfThumb active={n === page} key={n} onClick={() => jump(n)} pageNo={n} pdf={doc} />
          ))}
        </div>
      ) : null}
      <div className='relative min-w-0 flex-1 overflow-hidden'>
        <div className='flex h-full flex-col items-center gap-0 overflow-auto bg-muted/20 p-2' ref={scrollRef}>
          {pages.map(n => (
            <PdfPage
              key={n}
              onRegionClick={onRegionClick}
              pageNo={n}
              pdf={doc}
              regions={showRegions ? regions : NO_REGIONS}
              scale={effZoom}
              selectedRegionId={selectedRegionId}
            />
          ))}
        </div>
        <div className='absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border bg-background/90 px-2 py-1 text-xs shadow-md backdrop-blur'>
          <button
            aria-label='Thumbnails'
            aria-pressed={showThumbs}
            className={TBTN}
            onClick={() => setShowThumbs(t => !t)}
            type='button'>
            <Images className='size-3.5' />
          </button>
          <button aria-label='Previous page' className={TBTN} onClick={() => jump(Math.max(1, page - 1))} type='button'>
            <ChevronLeft className='size-3.5' />
          </button>
          <span className='tabular-nums'>
            {page}/{doc.numPages}
          </span>
          <button
            aria-label='Next page'
            className={TBTN}
            onClick={() => jump(Math.min(doc.numPages, page + 1))}
            type='button'>
            <ChevronRight className='size-3.5' />
          </button>
          <button
            aria-label='Zoom out'
            className={TBTN}
            onClick={() => setManualZoom(Math.max(0.4, Math.round((effZoom - 0.2) * 10) / 10))}
            type='button'>
            <Minus className='size-3.5' />
          </button>
          <span className='tabular-nums'>{Math.round(effZoom * 100)}%</span>
          <button
            aria-label='Zoom in'
            className={TBTN}
            onClick={() => setManualZoom(Math.min(4, Math.round((effZoom + 0.2) * 10) / 10))}
            type='button'>
            <Plus className='size-3.5' />
          </button>
          <button
            aria-label='Fit'
            aria-pressed={fit !== 'none'}
            className={TBTN}
            onClick={() => setFit(f => (f === 'width' ? 'page' : f === 'page' ? 'none' : 'width'))}
            title={fit === 'width' ? 'Fit width' : fit === 'page' ? 'Fit page' : 'Manual zoom'}
            type='button'>
            <Maximize className='size-3.5' />
          </button>
          {regions.length > 0 ? (
            <button
              aria-label='Toggle regions'
              aria-pressed={showRegions}
              className={TBTN}
              onClick={() => setShowRegions(s => !s)}
              type='button'>
              {showRegions ? <Eye className='size-3.5' /> : <EyeOff className='size-3.5' />}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
interface ScrubInputProps {
  ariaLabel?: string
  className?: string
  label?: string
  max?: number
  min?: number
  onChange: (value: number) => void
  placeholder?: string
  step?: number
  title?: string
  value: null | number
}
const ScrubInput = ({
  ariaLabel,
  className,
  label,
  max,
  min,
  onChange,
  placeholder,
  step,
  title,
  value
}: ScrubInputProps) => {
  const chars = Math.max(2, String(value ?? placeholder ?? '').length)
  const style = useMemo(() => ({ width: `calc(${chars}ch + 1.25rem)` }), [chars])
  const tip = label === undefined ? title : title === undefined ? label : `${label} · ${title}`
  return (
    <NumberField.Root
      className='inline-flex text-xs'
      max={max}
      min={min}
      onValueChange={v => {
        if (v !== null) onChange(v)
      }}
      step={step}
      value={value}>
      <NumberField.ScrubArea className='cursor-ew-resize select-none' title={tip}>
        <NumberField.ScrubAreaCursor className='drop-shadow-sm' />
        <NumberField.Input
          aria-label={ariaLabel ?? label}
          className={cn(
            'h-7 cursor-ew-resize rounded-md border bg-transparent px-2 text-center tabular-nums outline-none focus:ring-1 focus:ring-ring',
            className
          )}
          placeholder={placeholder}
          style={style}
          title={tip}
        />
      </NumberField.ScrubArea>
    </NumberField.Root>
  )
}
type FileTreeProps = ComponentProps<typeof FileTree>
type TabProps = ComponentProps<typeof Tab>
type WorkspaceProps = ComponentProps<typeof Workspace>
export type {
  ConfigFieldMeta,
  ConfigShowWhen,
  FileActions,
  FileTreeProps,
  PdfRegion,
  PdfViewerProps,
  ScrubInputProps,
  TabProps,
  TreeContextAction,
  TreeDataItem,
  VirtualFile,
  WorkspaceProps,
  WorkspaceRef
}
export {
  ConfigPanel,
  ConfigPopover,
  FileIcon,
  FileTree,
  FolderIcon,
  getIconSvg,
  IconButton,
  InfoButton,
  PdfViewer,
  persistConfig,
  ScrubInput,
  Tab,
  toLevaSchema,
  Tree,
  TreeFile,
  TreeFolder,
  useConfig,
  Workspace
}
