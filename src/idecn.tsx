/** biome-ignore-all lint/security/noDangerouslySetInnerHtml: trusted SVG from material-icon-theme */
/** biome-ignore-all lint/nursery/noInlineStyles: dynamic indent from depth */
/* eslint-disable @eslint-react/dom/no-dangerously-set-innerhtml, @eslint-react/hooks-extra/no-direct-set-state-in-use-effect, @eslint-react/no-children-for-each, @eslint-react/no-unused-props, react/no-danger */
/* oxlint-disable promise/prefer-await-to-then, promise/always-return, no-react-children, react-perf/jsx-no-new-object-as-prop, unicorn/prefer-top-level-await, import/no-unassigned-import */
'use client'
import 'dockview-core/dist/styles/dockview.css'
import type { ClassValue } from 'clsx'
import type { DockviewApi, DockviewReadyEvent, IDockviewPanelHeaderProps, IDockviewPanelProps } from 'dockview-react'
import type { ComponentProps, ReactNode, Ref } from 'react'
import { Accordion } from '@base-ui/react/accordion'
import { Editor, loader } from '@monaco-editor/react'
import { shikiToMonaco } from '@shikijs/monaco'
import { clsx } from 'clsx'
import { DockviewReact } from 'dockview-react'
import { X } from 'lucide-react'
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
import { twMerge } from 'tailwind-merge'
const ICON_CLASS = 'size-4 shrink-0 [&_svg]:size-4 transition-all duration-300',
  ICON_CLASS_HOVER = `${ICON_CLASS} group-hover:scale-125`,
  ICON_CLASS_TAB_HOVER = `${ICON_CLASS} group-hover/tab:scale-125`,
  ITEM_CLASS =
    'group flex w-full items-center gap-[7px] py-[1px] pr-2 text-left text-sm leading-6 cursor-pointer whitespace-nowrap hover:bg-accent',
  CENTER = 'flex h-full items-center justify-center',
  EDITOR_OPTIONS = { readOnly: true, scrollBeyondLastLine: false } as const,
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
    '--dv-drag-over-background-color:hsl(var(--accent,240 4.8% 95.9%)/0.5);',
    '--dv-drag-over-border-color:hsl(var(--ring,240 5.9% 10%)/0.3);',
    '--dv-tab-margin:0;',
    '--dv-border-radius:0;',
    '--dv-active-sash-color:transparent;',
    '--dv-sash-color:transparent;',
    '--dv-scrollbar-background-color:transparent;',
    '}',
    '.dv-reset .dv-tab{padding:0;background:transparent}',
    '.dv-reset .dv-tabs-container{gap:0}',
    '.dv-reset .dv-tabs-and-actions-container{font-size:inherit}',
    '.dv-reset .dv-tabs-container>.dv-tab.dv-active-tab{background:hsl(var(--muted,240 4.8% 95.9%))!important}',
    '.dv-reset .dv-tab:has([data-fill]){flex:1}',
    '.dv-reset .monaco-editor,.dv-reset .monaco-editor .margin,.dv-reset .monaco-editor-background,.dv-reset .monaco-editor .overflow-guard{background-color:transparent}',
    '.dv-reset .monaco-editor .current-line,.dv-reset .monaco-editor .current-line-margin{background-color:hsl(var(--accent,240 4.8% 95.9%)/0.5)!important;border:none!important}',
    '.dv-reset .monaco-editor .minimap,.dv-reset .monaco-editor .minimap-decorations-layer{background:hsl(var(--background,0 0% 100%))!important}'
  ].join('')
let iconManifest: IconManifest | null = null,
  iconSvgs: Record<string, string> = {},
  cachedMonoFont: string | undefined
const iconsReady =
    'location' in globalThis
      ? import('./_generated/icons').then(mod => {
          iconManifest = mod.icons.manifest as IconManifest
          iconSvgs = mod.icons.svgs as Record<string, string>
        })
      : Promise.resolve(),
  shikiSetup =
    'location' in globalThis
      ? (async () => {
          const mod = await import('./monokai-lite'),
            theme = {
              ...mod.monokaiLite,
              colors: { ...mod.monokaiLite.colors, 'editor.background': '#00000000', 'minimap.background': '#00000000' }
            },
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
        })()
      : null,
  cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs)),
  getSvg = (name: string): string => iconSvgs[name] || (iconManifest ? iconSvgs[iconManifest.file] || '' : ''),
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
  getTabId = (tab: TabProps) => tab.id ?? tab.title
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
interface TreeContextValue {
  expandDepth: number
  indent: number
  onSelect?: (item: { id: string; name: string; path: string }) => void
  selectedId: null | string
  setSelectedId: (id: string) => void
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
  DepthContext = createContext(0),
  useTreeItem = ({ id, name, path }: { id?: string; name: string; path?: string }) => {
    const { expandDepth, indent, onSelect, selectedId, setSelectedId } = use(TreeContext),
      depth = use(DepthContext),
      itemId = id ?? path ?? name,
      isSelected = selectedId === itemId,
      pl = `${String(depth * indent + 8)}px`,
      select = () => {
        setSelectedId(itemId)
        onSelect?.({ id: itemId, name, path: path ?? name })
      }
    return { depth, expandDepth, iconClass: ICON_CLASS_HOVER, isSelected, itemId, pl, select }
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
    return <span dangerouslySetInnerHTML={{ __html: getSvg(resolveFolderIcon(name, open ?? false)) }} {...props} />
  },
  Tree = ({
    children,
    expandDepth = 0,
    indent = 16,
    onSelect,
    selectedId: controlledSelectedId,
    ...props
  }: ComponentProps<'nav'> & {
    expandDepth?: number
    indent?: number
    onSelect?: (item: { id: string; name: string; path: string }) => void
    selectedId?: null | string
  }) => {
    const [internalSelectedId, setInternalSelectedId] = useState<null | string>(null),
      selectedId = controlledSelectedId ?? internalSelectedId,
      ctx = useMemo(
        () => ({ expandDepth, indent, onSelect, selectedId, setSelectedId: setInternalSelectedId }),
        [expandDepth, indent, onSelect, selectedId]
      )
    return (
      <TreeContext value={ctx}>
        <nav aria-label='File tree' {...props} className={cn('select-none overflow-auto text-sm', props.className)}>
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
    const { depth, expandDepth, iconClass, isSelected, itemId, pl, select } = useTreeItem({ id, name, path }),
      shouldOpen = defaultOpen || depth < expandDepth,
      [open, setOpen] = useState(shouldOpen ? [itemId] : []),
      isOpen = open.includes(itemId)
    return (
      <Accordion.Root onValueChange={v => setOpen(v as string[])} value={open}>
        <Accordion.Item value={itemId}>
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
          <Accordion.Panel className='overflow-hidden h-(--accordion-panel-height) transition-[height] duration-150 ease-out data-ending-style:h-0 data-starting-style:h-0'>
            <DepthContext value={depth + 1}>{children}</DepthContext>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>
    )
  },
  TreeFile = ({
    disabled,
    id,
    name,
    path,
    ...props
  }: Omit<ComponentProps<'button'>, 'id'> & { disabled?: boolean; id?: string; name: string; path?: string }) => {
    const { iconClass, isSelected, pl, select } = useTreeItem({ id, name, path })
    return (
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
        <FileIcon className={iconClass} name={name} />
        {name}
      </button>
    )
  },
  renderItems = ({
    items,
    onItemClick
  }: {
    items: TreeDataItem[]
    onItemClick?: (item: TreeDataItem) => void
  }): ReactNode[] => {
    const nodes: ReactNode[] = []
    for (const item of items)
      if (item.children) {
        const { children, name } = compactFolder(item)
        nodes.push(
          <TreeFolder disabled={item.disabled} id={item.id} key={item.id} name={name} path={item.path}>
            {renderItems({ items: children, onItemClick })}
          </TreeFolder>
        )
      } else
        nodes.push(
          <TreeFile
            disabled={item.disabled}
            id={item.id}
            key={item.id}
            name={item.name}
            onClick={() => {
              item.onClick?.()
              onItemClick?.(item)
            }}
            path={item.path}
          />
        )
    return nodes
  },
  FileTree = ({
    className,
    data,
    expandDepth = 0,
    initialSelectedItemId,
    onSelectChange
  }: {
    className?: string
    data: TreeDataItem | TreeDataItem[]
    expandDepth?: number
    initialSelectedItemId?: string
    onSelectChange?: (item: TreeDataItem | undefined) => void
  }) => {
    const items = Array.isArray(data) ? data : [data]
    return (
      <Tree className={className} expandDepth={expandDepth} selectedId={initialSelectedItemId}>
        <div className='min-w-max'>{renderItems({ items, onItemClick: onSelectChange })}</div>
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
    const [content, setContent] = useState(params.content),
      [language, setLanguage] = useState(params.language),
      [loadingState, setLoadingState] = useState(params.loading),
      [ready, setReady] = useState(!shikiSetup),
      [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
    useEffect(() => {
      if (shikiSetup) shikiSetup.then(() => setReady(true)).catch(() => setReady(true))
      const observer = new MutationObserver(() => setDark(document.documentElement.classList.contains('dark')))
      observer.observe(document.documentElement, { attributeFilter: ['class'], attributes: true })
      return () => observer.disconnect()
    }, [])
    useEffect(() => {
      const d = api.onDidParametersChange(e => {
        const p = e as { content?: string; language?: string; loading?: ReactNode }
        if (p.content !== undefined) {
          setContent(p.content)
          setLoadingState(undefined)
        }
        if (p.language !== undefined) setLanguage(p.language)
        if (p.loading !== undefined) setLoadingState(p.loading)
      })
      return () => {
        d.dispose()
      }
    }, [api])
    if (loadingState || !ready) return <div className={CENTER}>{loadingState}</div>
    if (!content) return <div className={cn(CENTER, 'text-sm text-muted-foreground')}>Empty file</div>
    return (
      <Editor
        language={language}
        options={{ ...EDITOR_OPTIONS, fontFamily: monoFont() || undefined, ...params.editorOptions }}
        theme={
          typeof params.theme === 'string'
            ? params.theme
            : dark
              ? (params.theme?.dark ?? 'monokai-lite')
              : (params.theme?.light ?? 'github-light')
        }
        value={content}
      />
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
            inactiveClassName?: string
          },
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
      <div
        className={cn(
          'group/tab flex h-full items-center gap-[3px] pl-1 py-0.5 text-sm',
          p?.headerClassName,
          active ? p?.activeClassName : ['text-muted-foreground', p?.inactiveClassName]
        )}
        data-fill={p?.headerClassName ? '' : undefined}>
        {showIcon ? <FileIcon className={ICON_CLASS_TAB_HOVER} name={api.title ?? ''} /> : null}
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
      </div>
    )
  },
  COMPONENTS = { custom: ContentPanel, file: FilePanel },
  TAB_COMPONENTS = { default: TabHeader },
  Workspace = ({
    children,
    defaultSidebar = true,
    editorOptions,
    expandDepth = 0,
    initialFiles,
    onFilesChange,
    onOpenFile,
    onSidebarChange,
    ref,
    renderLoading,
    sidebar: controlledSidebar,
    sidebarPosition = 'left',
    sidebarSize = '250px',
    theme,
    tree,
    ...props
  }: Omit<ComponentProps<'div'>, 'ref'> & {
    defaultSidebar?: boolean
    editorOptions?: Record<string, unknown>
    expandDepth?: number
    initialFiles?: string[]
    onFilesChange?: (files: string[]) => void
    onOpenFile?: (item: TreeDataItem) => null | Promise<null | string> | string
    onSidebarChange?: (visible: boolean) => void
    ref?: Ref<WorkspaceRef>
    renderLoading?: (item: TreeDataItem) => ReactNode
    sidebar?: boolean
    sidebarPosition?: 'left' | 'right'
    sidebarSize?: number | string
    theme?: string | { dark: string; light: string }
    tree?: TreeDataItem[]
  }) => {
    const [mounted, setMounted] = useState(false),
      [internalSidebar, setInternalSidebar] = useState(defaultSidebar),
      sidebarVisible = controlledSidebar ?? internalSidebar,
      toggleSidebar = useCallback(() => {
        const next = !sidebarVisible
        setInternalSidebar(next)
        onSidebarChange?.(next)
      }, [onSidebarChange, sidebarVisible]),
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
      themeRef = useRef(theme)
    useEffect(() => {
      onFilesChangeRef.current = onFilesChange
      onOpenFileRef.current = onOpenFile
      renderLoadingRef.current = renderLoading
      editorOptionsRef.current = editorOptions
      themeRef.current = theme
    })
    useEffect(() => {
      setMounted(true)
      return () => {
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
    }, [])
    useEffect(() => {
      const handler = (e: KeyboardEvent) => {
        if (e.key === 'b' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault()
          toggleSidebar()
        }
      }
      document.addEventListener('keydown', handler)
      return () => document.removeEventListener('keydown', handler)
    }, [toggleSidebar])
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
      openFile = useCallback((item: TreeDataItem) => {
        const { api } = stateRef.current,
          onOpen = onOpenFileRef.current
        if (!(api && onOpen)) return
        const existing = api.panels.find(p => p.id === item.path)
        if (existing) {
          existing.focus()
          return
        }
        const loading = renderLoadingRef.current,
          loadingNode = loading ? (
            loading(item)
          ) : (
            <div className={cn(CENTER, 'text-sm text-muted-foreground')}>Loading...</div>
          ),
          existingFile = api.panels.find(p => stateRef.current.fileIds.has(p.id)),
          position = existingFile ? { direction: 'within' as const, referenceGroup: existingFile.group.id } : undefined
        stateRef.current.fileIds.add(item.path)
        const added = api.addPanel({
            component: 'file',
            id: item.path,
            params: {
              content: '',
              editorOptions: editorOptionsRef.current,
              language: langOf(item.path),
              loading: loadingNode,
              theme: themeRef.current
            },
            position,
            tabComponent: 'default',
            title: item.name
          }),
          result = onOpen(item)
        if (result === null) return
        if (typeof result === 'string') added.api.updateParameters({ content: result, loading: undefined })
        else {
          const panelPath = item.path
          result
            .then(fileContent => {
              const p = api.panels.find(x => x.id === panelPath)
              if (!p) return
              if (fileContent === null) api.removePanel(p)
              else p.api.updateParameters({ content: fileContent, loading: undefined })
            })
            .catch(() => {
              const p = api.panels.find(x => x.id === panelPath)
              if (p) api.removePanel(p)
            })
        }
      }, [])
    useImperativeHandle(
      ref,
      () => ({
        focusPanel: (id: string) => stateRef.current.api?.panels.find(p => p.id === id)?.focus(),
        openFile,
        toggleSidebar
      }),
      [openFile, toggleSidebar]
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
    const handleReady = (event: DockviewReadyEvent) => {
      stateRef.current.api = event.api
      for (const tab of tabs) addTab(tab)
      stateRef.current.prevTabIds = new Set(tabs.map(getTabId))
      for (const tab of tabs) if (tab.onClose) stateRef.current.onCloseMap.set(getTabId(tab), tab.onClose)
      if (initialFiles) {
        for (const path of initialFiles) openFile({ id: path, name: path.split('/').at(-1) ?? path, path })
        const first = event.api.panels.find(p => p.id === initialFiles[0])
        if (first) first.focus()
      }
      const notifyFiles = () => {
        if (stateRef.current.ready && onFilesChangeRef.current) onFilesChangeRef.current([...stateRef.current.fileIds])
      }
      stateRef.current.disposables.push(
        event.api.onDidRemovePanel(e => {
          stateRef.current.fileIds.delete(e.id)
          stateRef.current.onCloseMap.get(e.id)?.()
          stateRef.current.onCloseMap.delete(e.id)
          notifyFiles()
        }),
        event.api.onDidAddPanel(() => notifyFiles())
      )
      requestAnimationFrame(() => {
        stateRef.current.ready = true
      })
    }
    if (!mounted) return null
    const sidebarContent = tree ? (
        <FileTree
          className='h-full overflow-auto'
          data={tree}
          expandDepth={expandDepth}
          onSelectChange={item => {
            if (item && !item.children) openFile(item)
          }}
        />
      ) : (
        sidebarChildren
      ),
      dockview = (
        <Panel minSize={20}>
          <DockviewReact
            className='dv-reset'
            components={COMPONENTS}
            onReady={handleReady}
            tabComponents={TAB_COMPONENTS}
          />
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
      </Group>
    )
  }
type FileTreeProps = ComponentProps<typeof FileTree>
type TabProps = ComponentProps<typeof Tab>
type WorkspaceProps = ComponentProps<typeof Workspace>
export type { FileTreeProps, TabProps, TreeDataItem, WorkspaceProps, WorkspaceRef }
export { FileIcon, FileTree, FolderIcon, getIconSvg, Tab, Tree, TreeFile, TreeFolder, Workspace }
