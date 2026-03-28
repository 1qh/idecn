/** biome-ignore-all lint/security/noDangerouslySetInnerHtml: trusted SVG from material-icon-theme */
/** biome-ignore-all lint/nursery/noInlineStyles: dynamic indent from depth */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: dockview manages tab interactions */
/** biome-ignore-all lint/a11y/noNoninteractiveElementInteractions: dockview manages tab interactions */
/** biome-ignore-all lint/correctness/noNestedComponentDefinitions: event.code keys (KeyZ, KeyW) are not components */
/** biome-ignore-all lint/a11y/useKeyWithClickEvents: quick open backdrop dismiss */
/* eslint-disable @eslint-react/dom/no-dangerously-set-innerhtml, @eslint-react/hooks-extra/no-direct-set-state-in-use-effect, @eslint-react/no-children-for-each, @eslint-react/no-unused-props, react/no-danger */
/* oxlint-disable promise/prefer-await-to-then, promise/always-return, no-react-children, react-perf/jsx-no-new-object-as-prop, unicorn/prefer-top-level-await, import/no-unassigned-import, jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */
'use client'
import 'dockview-core/dist/styles/dockview.css'
import type { EditorProps } from '@monaco-editor/react'
import type { DockviewApi, DockviewReadyEvent, IDockviewPanelHeaderProps, IDockviewPanelProps } from 'dockview-react'
import type { ComponentProps, ComponentType, ReactNode, Ref } from 'react'
import { Accordion } from '@base-ui/react/accordion'
import { Editor, loader } from '@monaco-editor/react'
import { shikiToMonaco, textmateThemeToMonacoTheme } from '@shikijs/monaco'
import { useHotkeys } from '@tanstack/react-hotkeys'
import { DockviewReact } from 'dockview-react'
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai'
import {
  ArrowRightToLine,
  ChevronRight,
  ChevronsDownUp,
  ClipboardCopy,
  SplitSquareHorizontal,
  Trash,
  Trash2,
  X
} from 'lucide-react'
import {
  Children,
  createContext,
  isValidElement,
  use,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react'
import { Group, Panel, Separator } from 'react-resizable-panels'
import { createHighlighter } from 'shiki'
import { cn } from './lib/utils'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from './ui/breadcrumb'
import { CommandDialog, CommandEmpty, CommandInput, CommandItem, CommandList } from './ui/command'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger
} from './ui/context-menu'
import { Skeleton } from './ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
const ICON_CLASS = 'size-4 shrink-0 [&_svg]:size-4 transition-all duration-300',
  ICON_CLASS_HOVER = `${ICON_CLASS} group-hover:scale-125`,
  ICON_CLASS_TAB_HOVER = `${ICON_CLASS} group-hover/tab:scale-125`,
  ITEM_CLASS =
    'group flex w-full items-center gap-[7px] py-[1px] pr-2 text-left text-sm leading-6 cursor-pointer whitespace-nowrap hover:bg-accent',
  CENTER = 'flex h-full items-center justify-center',
  EDITOR_OPTIONS: NonNullable<EditorProps['options']> = {
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
  },
  TAB_TYPE = Symbol('idecn-tab'),
  EXT_TO_LANG: Record<string, string> = {
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
  },
  LANG: Record<string, string> = {
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
  },
  RESET_CSS = [
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
    '--dv-separator-border:transparent;',
    '--dv-tab-divider-color:transparent;',
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
    '.dv-reset .dv-tabs-container>.dv-tab.dv-active-tab{background:var(--color-muted,var(--muted))!important}',
    '.dv-reset .dv-tabs-container>.dv-tab.dv-active-tab{border-bottom:1px solid var(--color-primary,var(--primary))}',
    '.dv-reset .dv-tabs-container>.dv-tab:not(.dv-active-tab){border-bottom:1px solid transparent}',
    '.dv-reset .dv-tabs-container>.dv-tab+.dv-tab{border-left:1px solid color-mix(in oklch,var(--color-border,var(--border)) 50%,transparent)}',
    '.dv-reset .dv-tab:has([data-fill]){flex:1}',
    '.dv-reset .dv-tabs-container{overflow-x:auto;scrollbar-width:thin;scrollbar-color:color-mix(in oklch,var(--color-foreground,var(--foreground)) 15%,transparent) transparent}',
    '.dv-reset .monaco-editor,.dv-reset .monaco-editor .margin,.dv-reset .monaco-editor-background,.dv-reset .monaco-editor .overflow-guard{background-color:transparent}',
    '.dv-reset .monaco-editor .current-line,.dv-reset .monaco-editor .current-line-margin{border:none!important}',
    '.dv-reset .dv-watermark{background:transparent}',
    String.raw`.dv-reset .dv-tab:has([data-preview]) .group\/tab{font-style:italic}`,
    '@media(prefers-reduced-motion:reduce){.dv-reset *{transition-duration:0s!important;animation-duration:0s!important}}',
    '[data-slot=dialog-overlay]{background:transparent!important}'
  ].join(''),
  cursorAtom = atom({ col: 1, line: 1 }),
  activeFileInfoAtom = atom({ language: 'plaintext', path: '' }),
  previewPanelAtom = atom<null | string>(null),
  quickOpenAtom = atom(false)
let iconManifest: IconManifest | null = null,
  iconSvgs: Record<string, string> = {},
  cachedMonoFont: string | undefined
const iconsReady =
    'location' in globalThis
      ? import('./_generated/icons').then((mod: { icons: { manifest: IconManifest; svgs: Record<string, string> } }) => {
          iconManifest = mod.icons.manifest
          iconSvgs = mod.icons.svgs
        })
      : Promise.resolve(),
  shikiSetup =
    'location' in globalThis
      ? (async () => {
          const mod = await import('./monokai-lite'),
            theme = mod.monokaiLite,
            highlighter = await createHighlighter({
              langs: [
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
              ],
              themes: [theme as Parameters<typeof createHighlighter>[0]['themes'][0], 'github-light']
            }),
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            monaco = await loader.init()
          shikiToMonaco(highlighter, monaco)
          const m = monaco as {
            editor: { defineTheme: (name: string, data: unknown) => void }
          }
          for (const name of highlighter.getLoadedThemes()) {
            const resolved = highlighter.getTheme(name),
              converted = textmateThemeToMonacoTheme(resolved) as {
                colors: Record<string, string>
              },
              isDark = resolved.type === 'dark'
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
        })()
      : null,
  getSvg = (name: string): string => iconSvgs[name] ?? (iconManifest ? (iconSvgs[iconManifest.file] ?? '') : ''),
  resolveFileIcon = (filename: string): string => {
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
  },
  resolveFolderIcon = (folderName: string, open: boolean): string => {
    if (!iconManifest) return ''
    const lower = folderName.toLowerCase()
    if (open) return iconManifest.folderNamesExpanded[lower] ?? iconManifest.folderExpanded
    return iconManifest.folderNames[lower] ?? iconManifest.folder
  },
  getIconSvg = (filename: string): string => getSvg(resolveFileIcon(filename)),
  langOf = (path: string): string => LANG[path.split('.').at(-1) ?? ''] ?? 'plaintext',
  monoFont = (): string => {
    if (cachedMonoFont !== undefined) return cachedMonoFont
    if (typeof document === 'undefined') return ''
    cachedMonoFont = getComputedStyle(document.documentElement).getPropertyValue('--font-mono').trim()
    return cachedMonoFont
  },
  compactFolder = (item: TreeDataItem): { children: TreeDataItem[]; name: string } => {
    let current = item,
      merged = item.name
    while (current.children?.length === 1 && current.children[0].children) {
      current = current.children[0]
      merged += `/${current.name}`
    }
    return { children: current.children ?? [], name: merged }
  },
  extractTabs = (children: ReactNode): TabProps[] => {
    const tabs: TabProps[] = []
    Children.forEach(children, child => {
      if (isValidElement(child) && (child.type as { _type?: symbol })._type === TAB_TYPE)
        tabs.push(child.props as TabProps)
    })
    return tabs
  },
  getTabId = (tab: TabProps) => tab.id ?? tab.title,
  useAltKeys = (bindings: Record<string, () => void>, enabled: boolean) => {
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
  },
  deduplicateTitle = (name: string, path: string, existingPanels: { id: string; title: string | undefined }[]): string => {
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
const EMPTY_TREE: TreeDataItem[] = [],
  VIRTUAL_PREFIX = '__virtual:',
  resolveLanguageIcon = (language: string): string => {
    if (!iconManifest) return ''
    if (iconManifest.languageIds[language]) return iconManifest.languageIds[language]
    for (const [ext, lang] of Object.entries(EXT_TO_LANG))
      if (lang === language && iconManifest.fileExtensions[ext]) return iconManifest.fileExtensions[ext]
    return iconManifest.file
  },
  virtualFileId = (name: string) => `${VIRTUAL_PREFIX}${name}`
interface TreeContextValue {
  expandDepth: number
  expandExclude?: string[]
  indent: number
  log?: (msg: string) => void
  onSelect?: (item: { id: string; name: string; path: string }) => void
  selectedId: null | string
  setSelectedId: (id: string) => void
}
interface TreeDataItem {
  actions?: ReactNode
  children?: TreeDataItem[]
  className?: string
  disabled?: boolean
  icon?: ComponentType<{ className?: string }> | string
  id: string
  name: string
  onClick?: () => void
  path: string
}
interface WorkspaceRef {
  focusPanel: (id: string) => void
  openFile: (item: TreeDataItem) => void
  toggleSidebar: () => void
}
const TreeContext = createContext<TreeContextValue>({
    expandDepth: 0,
    indent: 16,
    selectedId: null,
    setSelectedId: () => undefined
  }),
  DockviewApiContext = createContext<DockviewApi | null>(null),
  DepthContext = createContext(0),
  useTreeItem = ({ id, name, path }: { id?: string; name: string; path?: string }) => {
    const { expandDepth, expandExclude, indent, log: treeLog, onSelect, selectedId, setSelectedId } = use(TreeContext),
      depth = use(DepthContext),
      itemId = id ?? path ?? name,
      isSelected = selectedId === itemId,
      pl = `${String(depth * indent + 8)}px`,
      select = () => {
        setSelectedId(itemId)
        onSelect?.({ id: itemId, name, path: path ?? name })
      }
    return {
      depth,
      expandDepth,
      expandExclude,
      iconClass: ICON_CLASS_HOVER,
      indent,
      isSelected,
      itemId,
      log: treeLog,
      pl,
      select
    }
  },
  useIconsReady = () => {
    const [loaded, setLoaded] = useState(Boolean(iconManifest))
    useEffect(() => {
      if (!loaded) iconsReady.then(() => setLoaded(true)).catch(() => undefined)
    }, [loaded])
  },
  FileIcon = ({ name, ...props }: ComponentProps<'span'> & { name: string }) => {
    useIconsReady()
    return <span dangerouslySetInnerHTML={{ __html: getSvg(resolveFileIcon(name)) }} {...props} />
  },
  FolderIcon = ({ name, open, ...props }: ComponentProps<'span'> & { name: string; open?: boolean }) => {
    useIconsReady()
    return (
      <span
        dangerouslySetInnerHTML={{
          __html: getSvg(resolveFolderIcon(name, open ?? false))
        }}
        {...props}
      />
    )
  },
  Tree = ({
    children,
    expandDepth = 0,
    expandExclude,
    indent = 16,
    log: treePropLog,
    onSelect,
    selectedId: controlledSelectedId,
    ...props
  }: ComponentProps<'nav'> & {
    expandDepth?: number
    expandExclude?: string[]
    indent?: number
    log?: (msg: string) => void
    onSelect?: (item: { id: string; name: string; path: string }) => void
    selectedId?: null | string
  }) => {
    const [internalSelectedId, setInternalSelectedId] = useState<null | string>(null),
      selectedId = controlledSelectedId ?? internalSelectedId,
      ctx = useMemo(
        () => ({
          expandDepth,
          expandExclude,
          indent,
          log: treePropLog,
          onSelect,
          selectedId,
          setSelectedId: setInternalSelectedId
        }),
        [expandDepth, expandExclude, indent, treePropLog, onSelect, selectedId]
      )
    return (
      <TreeContext value={ctx}>
        <nav
          aria-label='File tree'
          {...props}
          className={cn(
            'select-none overflow-auto text-sm [scrollbar-width:thin] [scrollbar-color:color-mix(in_oklch,var(--color-foreground,var(--foreground))_15%,transparent)_transparent]',
            props.className
          )}>
          {children}
        </nav>
      </TreeContext>
    )
  },
  TreeFolder = ({
    children,
    defaultOpen = false,
    disabled,
    id,
    name,
    path,
    ...props
  }: {
    children?: ReactNode
    className?: string
    defaultOpen?: boolean
    disabled?: boolean
    id?: string
    name: string
    path?: string
  }) => {
    const {
        depth,
        expandDepth,
        expandExclude,
        iconClass,
        indent,
        log: treeLog,
        isSelected,
        itemId,
        pl,
        select
      } = useTreeItem({
        id,
        name,
        path
      }),
      excluded = expandExclude?.some(ex => (path ?? name).startsWith(ex)),
      shouldOpen = !excluded && (defaultOpen || depth < expandDepth),
      [open, setOpen] = useState(shouldOpen ? [itemId] : []),
      isOpen = open.includes(itemId)
    return (
      <Accordion.Root
        onValueChange={v => {
          setOpen(v as string[])
          treeLog?.(v.length > 0 ? `Expand: ${name}` : `Collapse: ${name}`)
        }}
        value={open}>
        <Accordion.Item value={itemId}>
          <ContextMenu>
            <ContextMenuTrigger>
              <Accordion.Trigger
                className={cn(
                  ITEM_CLASS,
                  isSelected && 'bg-accent',
                  disabled && 'pointer-events-none opacity-50',
                  props.className
                )}
                onClick={select}
                style={{ paddingLeft: pl }}>
                <FolderIcon className={iconClass} name={name} open={isOpen} />
                {name}
              </Accordion.Trigger>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem
                onClick={() => {
                  navigator.clipboard.writeText(path ?? name).catch(() => undefined)
                }}>
                <ClipboardCopy /> Copy Path
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
          <Accordion.Panel className='relative overflow-hidden h-(--accordion-panel-height) transition-[height] duration-150 ease-out data-ending-style:h-0 data-starting-style:h-0'>
            <span
              className='absolute top-0 bottom-0 w-px bg-accent'
              style={{ left: `${String(depth * indent + 16)}px` }}
            />
            <DepthContext value={depth + 1}>{children}</DepthContext>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>
    )
  },
  TreeFile = ({
    disabled,
    icon,
    id,
    name,
    path,
    ...props
  }: Omit<ComponentProps<'button'>, 'id'> & {
    disabled?: boolean
    icon?: ComponentType<{ className?: string }> | string
    id?: string
    name: string
    path?: string
  }) => {
    const { iconClass, isSelected, pl, select } = useTreeItem({
        id,
        name,
        path
      }),
      CustomIcon = typeof icon === 'function' ? icon : undefined
    useIconsReady()
    return (
      <ContextMenu>
        <ContextMenuTrigger>
          <button
            type='button'
            {...props}
            className={cn(
              ITEM_CLASS,
              isSelected && 'bg-accent',
              disabled && 'pointer-events-none opacity-50',
              props.className
            )}
            onClick={e => {
              if (!disabled) select()
              props.onClick?.(e)
            }}
            style={{ paddingLeft: pl, ...props.style }}>
            {CustomIcon ? (
              <CustomIcon className={iconClass} />
            ) : typeof icon === 'string' ? (
              <span className={iconClass} dangerouslySetInnerHTML={{ __html: getSvg(icon) }} />
            ) : (
              <FileIcon className={iconClass} name={name} />
            )}
            {name}
          </button>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem
            onClick={() => {
              navigator.clipboard.writeText(path ?? name).catch(() => undefined)
            }}>
            <ClipboardCopy /> Copy Path
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    )
  },
  renderItems = ({
    items,
    onItemClick,
    onItemDoubleClick
  }: {
    items: TreeDataItem[]
    onItemClick?: (item: TreeDataItem) => void
    onItemDoubleClick?: (item: TreeDataItem) => void
  }): ReactNode[] => {
    const nodes: ReactNode[] = []
    for (const item of items)
      if (item.children) {
        const { children, name } = compactFolder(item)
        nodes.push(
          <TreeFolder disabled={item.disabled} id={item.id} key={item.id} name={name} path={item.path}>
            {renderItems({ items: children, onItemClick, onItemDoubleClick })}
          </TreeFolder>
        )
      } else
        nodes.push(
          <TreeFile
            disabled={item.disabled}
            icon={item.icon}
            id={item.id}
            key={item.id}
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
  },
  FileTree = ({
    className,
    data,
    expandDepth = 0,
    expandExclude,
    initialSelectedItemId,
    log: fileTreeLog,
    onDoubleClick: onDoubleClickProp,
    onSelectChange,
    selectedId: controlledId
  }: {
    className?: string
    data: TreeDataItem | TreeDataItem[]
    expandDepth?: number
    expandExclude?: string[]
    initialSelectedItemId?: string
    log?: (msg: string) => void
    onDoubleClick?: (item: TreeDataItem) => void
    onSelectChange?: (item: TreeDataItem | undefined) => void
    selectedId?: null | string
  }) => {
    const items = Array.isArray(data) ? data : [data]
    return (
      <Tree
        className={className}
        expandDepth={expandDepth}
        expandExclude={expandExclude}
        log={fileTreeLog}
        selectedId={controlledId ?? initialSelectedItemId}>
        <div className='min-w-max'>
          {renderItems({ items, onItemClick: onSelectChange, onItemDoubleClick: onDoubleClickProp })}
        </div>
      </Tree>
    )
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Tab = (_props: {
    activeClassName?: string
    children: ReactNode
    closable?: boolean
    headerClassName?: string
    icon?: boolean
    id?: string
    inactiveClassName?: string
    onClose?: () => void
    title: string
  }): null => null
Tab._type = TAB_TYPE
const ContentPanel = ({ api, params }: IDockviewPanelProps<{ content: ReactNode }>) => {
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
    return <div className='h-full overflow-auto'>{content}</div>
  },
  FilePanel = ({
    api,
    params
  }: IDockviewPanelProps<{
    content: string
    editorOptions?: Record<string, unknown>
    language: string
    loading?: ReactNode
    theme?: string | { dark: string; light: string }
  }>) => {
    const editorRef = useRef<null | { revealLine: (line: number) => void }>(null),
      isVirtual = api.id.startsWith(VIRTUAL_PREFIX),
      [content, setContent] = useState(params.content),
      [language, setLanguage] = useState(params.language),
      [loadingState, setLoadingState] = useState(params.loading),
      [editorOpts, setEditorOpts] = useState(params.editorOptions),
      [ready, setReady] = useState(!shikiSetup),
      [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
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
    const setCursor = useSetAtom(cursorAtom),
      setFileInfo = useSetAtom(activeFileInfoAtom)
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
                <BreadcrumbItem key={part}>
                  {i === pathParts.length - 1 ? (
                    <BreadcrumbPage>{part}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink className='cursor-default'>{part}</BreadcrumbLink>
                  )}
                </BreadcrumbItem>
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
          }}
          options={{
            ...EDITOR_OPTIONS,
            fontFamily: monoFont() || undefined,
            ...editorOpts
          }}
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
  },
  TabHeader = ({ api, params }: IDockviewPanelHeaderProps) => {
    const p = params as
        | undefined
        | {
            activeClassName?: string
            closable?: boolean
            headerClassName?: string
            icon?: boolean
            iconName?: string
            inactiveClassName?: string
            preview?: boolean
          },
      dv = use(DockviewApiContext),
      previewId = useAtomValue(previewPanelAtom),
      isPreview = previewId === api.id,
      showIcon = p?.icon !== false,
      closable = p?.closable !== false,
      [active, setActive] = useState(api.isActive)
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
            'group/tab flex h-full items-center gap-[3px] pl-1 py-[3px] text-sm',
            p?.headerClassName,
            active ? p?.activeClassName : ['text-muted-foreground', p?.inactiveClassName]
          )}
          data-fill={p?.headerClassName ? '' : undefined}
          data-preview={isPreview ? '' : undefined}
          onMouseDown={e => {
            if (e.button === 1 && closable) {
              e.preventDefault()
              api.close()
            }
          }}>
          {showIcon ? <FileIcon className={ICON_CLASS_TAB_HOVER} name={p?.iconName ?? api.title ?? ''} /> : null}
          {api.title}
          {closable ? (
            <X
              className='-ml-1 size-4 opacity-0 p-0.5 hover:p-0 hover:cursor-pointer hover:text-red-500 transition-all hover:opacity-100 group-hover/tab:opacity-50'
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
                  if (pnl.id !== api.id)
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
                navigator.clipboard.writeText(api.id).catch(() => undefined)
              }}>
              <ClipboardCopy /> Copy Path
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
  },
  WatermarkPanel = () => <div className={cn(CENTER, 'text-sm text-muted-foreground/30')}>Open a file</div>,
  COMPONENTS = { custom: ContentPanel, file: FilePanel },
  TAB_COMPONENTS = { default: TabHeader },
  StatusBar = () => {
    const cursor = useAtomValue(cursorAtom),
      fileInfo = useAtomValue(activeFileInfoAtom)
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
  },
  flattenTree = (items: TreeDataItem[], prefix = ''): TreeDataItem[] => {
    const result: TreeDataItem[] = []
    for (const item of items)
      if (item.children) for (const child of flattenTree(item.children, `${prefix}${item.name}/`)) result.push(child)
      else result.push({ ...item, name: `${prefix}${item.name}` })
    return result
  },
  QuickOpenDialog = ({
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
    const setOpen = useSetAtom(quickOpenAtom),
      flatFiles = useMemo(() => flattenTree(tree), [tree])
    return (
      <CommandDialog
        onOpenChange={v => {
          setOpen(v)
          if (!v) logFn('Quick open closed')
        }}
        open={open}>
        <CommandInput placeholder='Search files...' />
        <CommandList>
          <CommandEmpty>No files found</CommandEmpty>
          {flatFiles.map(f => (
            <CommandItem
              key={f.id}
              onSelect={() => {
                logFn(`Quick open: ${f.name}`)
                onOpenFile(f)
                setOpen(false)
              }}
              value={f.name}>
              <FileIcon className={ICON_CLASS} name={f.path.split('/').at(-1) ?? f.name} />
              <span className='truncate'>{f.name}</span>
            </CommandItem>
          ))}
        </CommandList>
      </CommandDialog>
    )
  },
  Workspace = ({
    activityLog,
    children,
    defaultSidebar = true,
    editorOptions,
    expandDepth = 0,
    expandExclude,
    files,
    initialFiles,
    onFilesChange,
    onOpenFile,
    onSidebarChange,
    onTabChange,
    ref,
    renderLoading,
    shortcuts = true,
    sidebar: controlledSidebar,
    sidebarPosition = 'left',
    sidebarSize = '16%',
    theme,
    tree,
    ...props
  }: Omit<ComponentProps<'div'>, 'ref'> & {
    activityLog?: (line: string) => void
    defaultSidebar?: boolean
    editorOptions?: Record<string, unknown>
    expandDepth?: number
    expandExclude?: string[]
    files?: VirtualFile[]
    initialFiles?: string[]
    onFilesChange?: (files: string[]) => void
    onOpenFile?: (item: TreeDataItem) => null | Promise<null | string> | string
    onSidebarChange?: (visible: boolean) => void
    onTabChange?: (id: string) => void
    ref?: Ref<WorkspaceRef>
    renderLoading?: (item: TreeDataItem) => ReactNode
    shortcuts?: boolean
    sidebar?: boolean
    sidebarPosition?: 'left' | 'right'
    sidebarSize?: number | string
    theme?: string | { dark: string; light: string }
    tree?: TreeDataItem[]
  }) => {
    const [mounted, setMounted] = useState(false),
      [activeFileId, setActiveFileId] = useState<null | string>(null),
      [treeCollapsed, setTreeCollapsed] = useState(false),
      [treeKey, setTreeKey] = useState(0),
      [internalWordWrap, setInternalWordWrap] = useState(false),
      [dockviewApi, setDockviewApi] = useState<DockviewApi | null>(null),
      [currentPreviewId, setPreviewId] = useAtom(previewPanelAtom),
      previewIdRef = useRef(currentPreviewId),
      quickOpenVisible = useAtomValue(quickOpenAtom),
      setQuickOpen = useSetAtom(quickOpenAtom),
      [fontSizeDelta, setFontSizeDelta] = useState(0),
      log = useCallback(
        (msg: string) => {
          activityLog?.(msg)
        },
        [activityLog]
      ),
      [internalSidebar, setInternalSidebar] = useState(defaultSidebar),
      sidebarVisible = controlledSidebar ?? internalSidebar,
      toggleSidebar = useCallback(() => {
        const next = !sidebarVisible
        setInternalSidebar(next)
        onSidebarChange?.(next)
        log(next ? 'Sidebar opened' : 'Sidebar closed')
      }, [log, onSidebarChange, sidebarVisible]),
      stateRef = useRef({
        api: null as DockviewApi | null,
        disposables: [] as { dispose: () => void }[],
        fileIds: new Set<string>(),
        onCloseMap: new Map<string, () => void>(),
        prevTabIds: new Set<string>(),
        ready: false
      }),
      onFilesChangeRef = useRef(onFilesChange),
      onOpenFileRef = useRef(onOpenFile),
      renderLoadingRef = useRef(renderLoading),
      editorOptionsRef = useRef(editorOptions),
      themeRef = useRef(theme),
      filesRef = useRef(files),
      onTabChangeRef = useRef(onTabChange),
      mergedEditorOptions = useMemo(
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
      onTabChangeRef.current = onTabChange
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
          api: null,
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
            const count = api.panels.length
            for (let panelIdx = count - 1; panelIdx >= 0; panelIdx -= 1)
              try {
                api.panels[panelIdx].api.close()
              } catch {
                /* Already removed */
              }
            log(`Closed all ${String(count)} tabs`)
          },
          hotkey: 'Mod+Shift+W'
        }
      ],
      { enabled: shortcuts, preventDefault: true }
    )
    useAltKeys(
      {
        KeyE: () => {
          const { api } = stateRef.current
          if (!api) return
          const { panels } = api
          if (panels.length < 2) return
          const active = api.activePanel,
            idx = active ? panels.indexOf(active) : -1,
            next = panels[(idx + 1) % panels.length]
          next.focus()
          log(`Cycle tab: ${next.title ?? next.id}`)
        },
        KeyW: () => {
          const panel = stateRef.current.api?.activePanel
          if (panel) {
            log(`Close tab: ${panel.title ?? panel.id}`)
            panel.api.close()
          }
        },
        KeyZ: () => {
          setInternalWordWrap(w => !w)
          log('Word wrap toggled')
        }
      },
      shortcuts
    )
    const tabs = useMemo(() => extractTabs(children), [children]),
      sidebarChildren = useMemo(() => {
        const items: ReactNode[] = []
        Children.forEach(children, child => {
          if (!(isValidElement(child) && (child.type as { _type?: symbol })._type === TAB_TYPE)) items.push(child)
        })
        return items
      }, [children]),
      addTab = useCallback((tab: TabProps) => {
        const { api } = stateRef.current
        if (!api) return
        const tabId = getTabId(tab),
          existing = api.panels.find(p => p.id === tabId)
        if (existing) {
          existing.api.updateParameters({ content: tab.children })
          return
        }
        api.addPanel({
          component: 'custom',
          id: tabId,
          params: {
            activeClassName: tab.activeClassName,
            closable: tab.closable,
            content: tab.children,
            headerClassName: tab.headerClassName,
            icon: tab.icon,
            inactiveClassName: tab.inactiveClassName
          },
          tabComponent: 'default',
          title: tab.title
        })
      }, []),
      openVirtualFile = useCallback((file: VirtualFile) => {
        const { api } = stateRef.current
        if (!api) return
        const id = virtualFileId(file.name),
          existing = api.panels.find(p => p.id === id)
        if (existing) {
          existing.focus()
          return
        }
        const existingFile = api.panels.find(p => stateRef.current.fileIds.has(p.id)),
          position: PanelPosition | undefined = existingFile
            ? {
                direction: 'within',
                referenceGroup: existingFile.group.id
              }
            : undefined
        stateRef.current.fileIds.add(id)
        const lang = file.language ?? langOf(file.name),
          iconName = file.language ? `file.${file.language}` : file.name
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
      }, []),
      openFileInPanel = useCallback(
        (item: TreeDataItem, preview: boolean) => {
          const { api } = stateRef.current,
            onOpen = onOpenFileRef.current
          if (!(api && onOpen)) return
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
          const loading = renderLoadingRef.current,
            loadingNode = loading ? (
              loading(item)
            ) : (
              <div className={cn(CENTER, 'text-sm text-muted-foreground')}>Loading...</div>
            ),
            existingFile = api.panels.find(p => stateRef.current.fileIds.has(p.id)),
            position: PanelPosition | undefined = existingFile
              ? {
                  direction: 'within',
                  referenceGroup: existingFile.group.id
                }
              : undefined
          stateRef.current.fileIds.add(item.path)
          setPreviewId(preview ? item.path : null)
          previewIdRef.current = preview ? item.path : null
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
              title: deduplicateTitle(item.name, item.path, api.panels)
            }),
            result = onOpen(item)
          if (result === null) {
            log(`Load returned null: ${item.path}`)
            return
          }
          if (typeof result === 'string') {
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
      ),
      openFile = useCallback((item: TreeDataItem) => openFileInPanel(item, true), [openFileInPanel]),
      pinFile = useCallback((item: TreeDataItem) => openFileInPanel(item, false), [openFileInPanel])
    useImperativeHandle(
      ref,
      () => ({
        focusPanel: (id: string) => stateRef.current.api?.panels.find(p => p.id === id)?.focus(),
        openFile: pinFile,
        toggleSidebar
      }),
      [pinFile, toggleSidebar]
    )
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
        else addTab(tab)
      }
      stateRef.current.prevTabIds = currentIds
      stateRef.current.onCloseMap.clear()
      for (const tab of tabs) if (tab.onClose) stateRef.current.onCloseMap.set(getTabId(tab), tab.onClose)
    }, [addTab, tabs])
    useEffect(() => {
      const { api } = stateRef.current
      if (!(api && files)) return
      for (const file of files) {
        const id = virtualFileId(file.name),
          panel = api.panels.find(p => p.id === id)
        if (panel) panel.api.updateParameters({ content: file.content })
      }
    }, [files])
    const handleReady = (event: DockviewReadyEvent) => {
        stateRef.current.api = event.api
        setDockviewApi(event.api)
        for (const tab of tabs) addTab(tab)
        stateRef.current.prevTabIds = new Set(tabs.map(getTabId))
        for (const tab of tabs) if (tab.onClose) stateRef.current.onCloseMap.set(getTabId(tab), tab.onClose)
        if (filesRef.current)
          for (const f of filesRef.current)
            if (f.open) {
              openVirtualFile(f)
              log(`Virtual file: ${f.name}`)
            }
        if (initialFiles) {
          log(`Initial files: ${initialFiles.join(', ')}`)
          for (const path of initialFiles) openFile({ id: path, name: path.split('/').at(-1) ?? path, path })
          const first = event.api.panels.find(p => p.id === initialFiles[0])
          if (first) first.focus()
        }
        log('Workspace ready')
        const notifyFiles = () => {
          if (stateRef.current.ready && onFilesChangeRef.current) onFilesChangeRef.current([...stateRef.current.fileIds])
        }
        stateRef.current.disposables.push(
          event.api.onDidRemovePanel(e => {
            stateRef.current.fileIds.delete(e.id)
            stateRef.current.onCloseMap.get(e.id)?.()
            stateRef.current.onCloseMap.delete(e.id)
            if (previewIdRef.current === e.id) {
              setPreviewId(null)
              previewIdRef.current = null
            }
            log(`Closed: ${e.title ?? e.id}`)
            notifyFiles()
          }),
          event.api.onDidAddPanel(e => {
            log(`Opened tab: ${e.title ?? e.id}`)
            notifyFiles()
          }),
          event.api.onDidActivePanelChange(e => {
            if (e?.id) {
              setActiveFileId(e.id)
              onTabChangeRef.current?.(e.id)
              log(`Focused: ${e.title ?? e.id}`)
            }
          })
        )
        requestAnimationFrame(() => {
          stateRef.current.ready = true
        })
      },
      mergedTree = useMemo(() => {
        if (!(tree || (files && files.length > 0))) return tree
        const toItem = (f: VirtualFile): TreeDataItem => ({
            icon: f.icon ?? (f.language ? resolveLanguageIcon(f.language) : undefined),
            id: virtualFileId(f.name),
            name: f.name,
            path: virtualFileId(f.name)
          }),
          top = files?.filter(f => f.pin === 'top').map(toItem) ?? [],
          mid = files?.filter(f => !f.pin).map(toItem) ?? [],
          bottom = files?.filter(f => f.pin === 'bottom').map(toItem) ?? []
        return [...top, ...mid, ...(tree ?? []), ...bottom]
      }, [files, tree])
    if (!mounted) return null
    const sidebarContent = mergedTree ? (
        <div className='flex h-full flex-col'>
          <div className='flex items-center justify-between px-3 py-1.5'>
            <span className='text-sm uppercase text-xs text-muted-foreground'>explorer</span>
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className='text-muted-foreground hover:text-foreground transition-colors'
                    onClick={() => {
                      setTreeCollapsed(c => {
                        log(c ? 'Tree expanded all' : 'Tree collapsed all')
                        return !c
                      })
                      setTreeKey(k => k + 1)
                    }}
                    type='button'>
                    {treeCollapsed ? (
                      <ChevronRight className='stroke-1 size-4' />
                    ) : (
                      <ChevronsDownUp className='stroke-1 size-4' />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>{treeCollapsed ? 'Expand All' : 'Collapse All'}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <FileTree
            className='min-h-0 flex-1 overflow-auto'
            data={mergedTree}
            expandDepth={treeCollapsed ? 0 : expandDepth}
            expandExclude={expandExclude}
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
          />
        </div>
      ) : (
        sidebarChildren
      ),
      dockview = (
        <Panel minSize={20}>
          <div className='flex h-full flex-col'>
            <DockviewApiContext value={dockviewApi}>
              <DockviewReact
                className='dv-reset flex-1'
                components={COMPONENTS}
                onReady={handleReady}
                tabComponents={TAB_COMPONENTS}
                watermarkComponent={WatermarkPanel}
              />
            </DockviewApiContext>
            <StatusBar />
          </div>
        </Panel>
      ),
      sidePanel = sidebarVisible ? (
        <>
          {sidebarPosition === 'right' ? <Separator className='opacity-0' /> : null}
          <Panel defaultSize={sidebarSize} minSize={5}>
            {sidebarContent}
          </Panel>
          {sidebarPosition === 'left' ? <Separator className='opacity-0' /> : null}
        </>
      ) : null
    return (
      <Group orientation='horizontal' {...props}>
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
      </Group>
    )
  }
type FileTreeProps = ComponentProps<typeof FileTree>
type TabProps = ComponentProps<typeof Tab>
type WorkspaceProps = ComponentProps<typeof Workspace>
export type { FileTreeProps, TabProps, TreeDataItem, VirtualFile, WorkspaceProps, WorkspaceRef }
export { FileIcon, FileTree, FolderIcon, getIconSvg, Tab, Tree, TreeFile, TreeFolder, Workspace }
