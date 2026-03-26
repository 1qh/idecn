/** biome-ignore-all lint/security/noDangerouslySetInnerHtml: trusted SVG from material-icon-theme */
/** biome-ignore-all lint/nursery/noInlineStyles: dynamic indent from depth */
/* eslint-disable @eslint-react/dom/no-dangerously-set-innerhtml, @eslint-react/hooks-extra/no-direct-set-state-in-use-effect, @eslint-react/no-children-for-each, @eslint-react/no-unused-props, react/no-danger */
/* oxlint-disable promise/prefer-await-to-then, promise/always-return, no-react-children, react-perf/jsx-no-new-object-as-prop */
'use client'
import type { ClassValue } from 'clsx'
import type { DockviewApi, DockviewReadyEvent, IDockviewPanelHeaderProps, IDockviewPanelProps } from 'dockview-react'
import type { ReactNode } from 'react'
import { Accordion } from '@base-ui/react/accordion'
import { Editor } from '@monaco-editor/react'
import { clsx } from 'clsx'
import { DockviewReact } from 'dockview-react'
import { X } from 'lucide-react'
import { useTheme } from 'next-themes'
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
import { twMerge } from 'tailwind-merge'
import iconsData from './_generated/icons.json' with { type: 'json' }
const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs)),
  { manifest: manifestData, svgs: svgData } = iconsData,
  manifest = manifestData as {
    file: string
    fileExtensions: Record<string, string>
    fileNames: Record<string, string>
    folder: string
    folderExpanded: string
    folderNames: Record<string, string>
    folderNamesExpanded: Record<string, string>
    languageIds: Record<string, string>
  },
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
  svgs = svgData as Record<string, string>,
  fallback = svgs[manifest.file] ?? '',
  getSvg = (name: string): string => svgs[name] ?? fallback,
  resolveFileIcon = (filename: string): string => {
    const lower = filename.toLowerCase()
    if (manifest.fileNames[lower]) return manifest.fileNames[lower]
    const ext = lower.includes('.') ? lower.slice(lower.indexOf('.') + 1) : ''
    if (ext && manifest.fileExtensions[ext]) return manifest.fileExtensions[ext]
    const lastExt = lower.split('.').at(-1) ?? ''
    if (lastExt && manifest.fileExtensions[lastExt]) return manifest.fileExtensions[lastExt]
    const lang = EXT_TO_LANG[lastExt]
    if (lang && manifest.languageIds[lang]) return manifest.languageIds[lang]
    return manifest.file
  },
  resolveFolderIcon = (folderName: string, open: boolean): string => {
    const lower = folderName.toLowerCase()
    if (open) return manifest.folderNamesExpanded[lower] ?? manifest.folderExpanded
    return manifest.folderNames[lower] ?? manifest.folder
  },
  FileIcon = ({ name, className }: { className?: string; name: string }) => (
    <span className={className} dangerouslySetInnerHTML={{ __html: getSvg(resolveFileIcon(name)) }} />
  ),
  FolderIcon = ({ className, name, open }: { className?: string; name: string; open?: boolean }) => (
    <span className={className} dangerouslySetInnerHTML={{ __html: getSvg(resolveFolderIcon(name, open ?? false)) }} />
  ),
  getIconSvg = (filename: string): string => getSvg(resolveFileIcon(filename)),
  ICON_CLASS = 'size-4 shrink-0 [&_svg]:size-4'
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
const renderItems = (items: TreeDataItem[], onItemClick?: (item: TreeDataItem) => void): ReactNode[] => {
    const nodes: ReactNode[] = []
    for (const item of items)
      nodes.push(
        item.children ? (
          <TreeFolder
            className={item.className}
            disabled={item.disabled}
            id={item.id}
            key={item.id}
            name={item.name}
            path={item.path}>
            {renderItems(item.children, onItemClick)}
          </TreeFolder>
        ) : (
          <TreeFile
            className={item.className}
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
interface FileTreeProps {
  className?: string
  data: TreeDataItem | TreeDataItem[]
  initialSelectedItemId?: string
  onSelectChange?: (item: TreeDataItem | undefined) => void
}
const FileTree = ({ className, data, initialSelectedItemId, onSelectChange }: FileTreeProps) => {
  const items = Array.isArray(data) ? data : [data]
  return (
    <Tree className={className} selectedId={initialSelectedItemId}>
      <div className='min-w-max'>{renderItems(items, onSelectChange)}</div>
    </Tree>
  )
}
interface TabProps {
  children: ReactNode
  closable?: boolean
  headerClassName?: string
  icon?: boolean
  id?: string
  onClose?: () => void
  title: string
}
const TAB_TYPE = Symbol('idecn-tab'),
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Tab = (_props: TabProps): null => null
Tab._type = TAB_TYPE
const EDITOR_OPTIONS = { minimap: { enabled: false }, readOnly: true, scrollBeyondLastLine: false } as const,
  ContentPanel = ({ api, params }: IDockviewPanelProps<{ content: ReactNode }>) => {
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
  FilePanel = ({ api, params }: IDockviewPanelProps<{ content: string; language: string; loading?: ReactNode }>) => {
    const { resolvedTheme } = useTheme(),
      [content, setContent] = useState(params.content),
      [language, setLanguage] = useState(params.language),
      [loadingState, setLoadingState] = useState(params.loading)
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
    if (loadingState) return <div className='flex h-full items-center justify-center'>{loadingState}</div>
    if (!content)
      return <div className='flex h-full items-center justify-center text-sm text-muted-foreground'>Empty file</div>
    return (
      <Editor
        language={language}
        options={EDITOR_OPTIONS}
        theme={resolvedTheme === 'dark' ? 'vs-dark' : 'light'}
        value={content}
      />
    )
  },
  TabHeader = ({ api, params }: IDockviewPanelHeaderProps) => {
    const p = params as undefined | { closable?: boolean; headerClassName?: string; icon?: boolean },
      showIcon = p?.icon !== false,
      closable = p?.closable !== false
    return (
      <div
        className={cn('group/tab flex h-full items-center', p?.headerClassName)}
        data-fill={p?.headerClassName ? '' : undefined}>
        {showIcon ? <FileIcon className={ICON_CLASS} name={api.title ?? ''} /> : null}
        <span className={showIcon ? 'mb-px ml-0.5' : 'mb-px'}>{api.title}</span>
        {closable ? (
          <X
            className='size-3.5 stroke-[1.5] opacity-0 hover:cursor-pointer group-hover/tab:opacity-70'
            onClick={e => {
              e.stopPropagation()
              api.close()
            }}
          />
        ) : null}
      </div>
    )
  }
interface WorkspaceProps {
  children?: ReactNode
  className?: string
  initialFiles?: string[]
  onFilesChange?: (files: string[]) => void
  onOpenFile?: (item: TreeDataItem) => null | Promise<null | string> | string
  ref?: React.Ref<WorkspaceRef>
  renderLoading?: (item: TreeDataItem) => ReactNode
  sidebarSize?: number | string
  tree: TreeDataItem[]
}
interface WorkspaceRef {
  focusPanel: (id: string) => void
  openFile: (item: TreeDataItem) => void
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
  },
  langOf = (path: string): string => LANG[path.split('.').at(-1) ?? ''] ?? 'plaintext',
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
    '.dv-reset .monaco-editor,.dv-reset .monaco-editor .margin,.dv-reset .monaco-editor-background,.dv-reset .monaco-editor .overflow-guard{background-color:transparent}'
  ].join(''),
  COMPONENTS = { custom: ContentPanel, file: FilePanel },
  TAB_COMPONENTS = { default: TabHeader },
  extractTabs = (children: ReactNode): TabProps[] => {
    const tabs: TabProps[] = []
    Children.forEach(children, child => {
      if (isValidElement(child) && (child.type as { _type?: symbol })._type === TAB_TYPE)
        tabs.push(child.props as TabProps)
    })
    return tabs
  },
  getTabId = (tab: TabProps) => tab.id ?? tab.title,
  Workspace = ({
    children,
    className,
    initialFiles,
    onFilesChange,
    onOpenFile,
    ref,
    renderLoading,
    sidebarSize = '250px',
    tree
  }: WorkspaceProps) => {
    const [mounted, setMounted] = useState(false),
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
      renderLoadingRef = useRef(renderLoading)
    useEffect(() => {
      onFilesChangeRef.current = onFilesChange
      onOpenFileRef.current = onOpenFile
      renderLoadingRef.current = renderLoading
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
    const tabs = useMemo(() => extractTabs(children), [children]),
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
          params: { closable: tab.closable, content: tab.children, headerClassName: tab.headerClassName, icon: tab.icon },
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
            <div className='flex h-full items-center justify-center text-sm text-muted-foreground'>Loading...</div>
          ),
          existingFile = api.panels.find(p => stateRef.current.fileIds.has(p.id)),
          position = existingFile ? { direction: 'within' as const, referenceGroup: existingFile.group.id } : undefined
        stateRef.current.fileIds.add(item.path)
        api.addPanel({
          component: 'file',
          id: item.path,
          params: { content: '', language: langOf(item.path), loading: loadingNode },
          position,
          tabComponent: 'default',
          title: item.name
        })
        const result = onOpen(item)
        if (result === null) return
        if (typeof result === 'string')
          api.panels.find(p => p.id === item.path)?.api.updateParameters({ content: result, loading: undefined })
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
        openFile
      }),
      [openFile]
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
      if (initialFiles)
        for (const path of initialFiles) {
          const name = path.split('/').at(-1) ?? path
          openFile({ id: path, name, path })
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
    return (
      <div className={className}>
        <style>{RESET_CSS}</style>
        <Group className='h-full' orientation='horizontal'>
          <Panel defaultSize={sidebarSize} minSize={5}>
            <div className='h-full overflow-auto'>
              <FileTree
                data={tree}
                onSelectChange={item => {
                  if (item && !item.children) openFile(item)
                }}
              />
            </div>
            <Separator className='opacity-0' />
          </Panel>
          <Panel minSize={20}>
            <DockviewReact
              className='dv-reset'
              components={COMPONENTS}
              onReady={handleReady}
              tabComponents={TAB_COMPONENTS}
            />
          </Panel>
        </Group>
      </div>
    )
  }
export type { FileTreeProps, TabProps, TreeDataItem, WorkspaceProps, WorkspaceRef }
export { FileIcon, FileTree, findPath, FolderIcon, getIconSvg, Tab, Tree, TreeFile, TreeFolder, Workspace }
