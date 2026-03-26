/* eslint-disable @eslint-react/hooks-extra/no-direct-set-state-in-use-effect, @eslint-react/no-children-for-each, @eslint-react/no-unnecessary-use-callback */
/* oxlint-disable promise/prefer-await-to-then, promise/always-return, no-react-children */
'use client'
import type { DockviewApi, DockviewReadyEvent } from 'dockview-react'
import type { ReactNode } from 'react'
import { DockviewReact } from 'dockview-react'
import { Children, isValidElement, useCallback, useEffect, useImperativeHandle, useState } from 'react'
import type { TreeDataItem } from './file-tree'
import type { TabProps } from './tab'
import { CustomPanelInner, FilePanelInner, TabHeaderInner } from './panels'
import { TAB_TYPE } from './tab'
interface WorkspaceProps {
  children?: ReactNode
  className?: string
  onLayoutChange?: (layout: unknown) => void
  onOpenFile?: (item: TreeDataItem) => null | Promise<null | string> | string
  ref?: React.Ref<WorkspaceRef>
  renderLoading?: (item: TreeDataItem) => ReactNode
}
interface WorkspaceRef {
  focusPanel: (id: string) => void
  getLayout: () => unknown
  loadLayout: (layout: unknown) => void
  openFile: (item: TreeDataItem) => void
  showPanel: (id: string) => void
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
  POSITIONS: Record<string, { direction: 'above' | 'below' | 'left' | 'right' }> = {
    bottom: { direction: 'below' },
    left: { direction: 'left' },
    right: { direction: 'right' }
  },
  COMPONENTS = { custom: CustomPanelInner, file: FilePanelInner },
  TAB_COMPONENTS = { default: TabHeaderInner },
  extractTabs = (children: ReactNode): TabProps[] => {
    const tabs: TabProps[] = []
    Children.forEach(children, child => {
      if (isValidElement(child) && (child.type as { _type?: symbol })._type === TAB_TYPE)
        tabs.push(child.props as TabProps)
    })
    return tabs
  },
  getTabId = (tab: TabProps) => tab.id ?? tab.title,
  mutableState = {
    api: null as DockviewApi | null,
    filePanelIds: new Set<string>(),
    initialWidths: new Map<string, number>(),
    prevIds: new Set<string>(),
    savedGroups: new Map<string, string>(),
    tabsCache: [] as TabProps[]
  },
  Workspace = ({ children, className, onLayoutChange, onOpenFile, ref, renderLoading }: WorkspaceProps) => {
    const [mounted, setMounted] = useState(false)
    useEffect(() => {
      setMounted(true)
    }, [])
    const addTab = useCallback((tab: TabProps) => {
        const { api } = mutableState
        if (!api) return
        const tabId = getTabId(tab)
        if (api.panels.some(p => p.id === tabId)) {
          api.panels.find(p => p.id === tabId)?.api.updateParameters({ content: tab.children })
          return
        }
        const savedGroup = mutableState.savedGroups.get(tabId),
          position = savedGroup
            ? { direction: 'within' as const, referenceGroup: savedGroup }
            : POSITIONS[tab.position ?? '']
        if (tab.initialWidth) mutableState.initialWidths.set(tabId, tab.initialWidth)
        api.addPanel({
          component: 'custom',
          id: tabId,
          params: { closable: tab.closable, content: tab.children, headerClassName: tab.headerClassName, icon: tab.icon },
          position: api.panels.length > 0 ? position : undefined,
          tabComponent: 'default',
          title: tab.title
        })
      }, []),
      openFile = useCallback(
        (item: TreeDataItem) => {
          const { api } = mutableState
          if (!(api && onOpenFile)) return
          const existing = api.panels.find(p => p.id === item.path)
          if (existing) {
            existing.focus()
            return
          }
          const loadingNode = renderLoading ? (
              renderLoading(item)
            ) : (
              <div className='flex h-full items-center justify-center text-sm text-muted-foreground'>Loading...</div>
            ),
            existingFile = api.panels.find(p => mutableState.filePanelIds.has(p.id)),
            position = existingFile
              ? { direction: 'within' as const, referenceGroup: existingFile.group.id }
              : api.panels.length > 0
                ? { direction: 'right' as const }
                : undefined
          mutableState.filePanelIds.add(item.path)
          api.addPanel({
            component: 'file',
            id: item.path,
            params: { content: '', language: langOf(item.path), loading: loadingNode },
            position,
            tabComponent: 'default',
            title: item.name
          })
          if (!existingFile)
            for (const [panelId, width] of mutableState.initialWidths) {
              const panel = api.panels.find(p => p.id === panelId)
              if (panel) panel.group.api.setSize({ width })
            }
          const result = onOpenFile(item)
          if (result === null) return
          if (typeof result === 'string')
            api.panels.find(p => p.id === item.path)?.api.updateParameters({ content: result, loading: undefined })
          else
            result
              .then(content => {
                if (content === null) {
                  const p = api.panels.find(x => x.id === item.path)
                  if (p) api.removePanel(p)
                  return
                }
                api.panels.find(p => p.id === item.path)?.api.updateParameters({ content, loading: undefined })
              })
              .catch(() => {
                const p = api.panels.find(x => x.id === item.path)
                if (p) api.removePanel(p)
              })
        },
        [onOpenFile, renderLoading]
      )
    useImperativeHandle(
      ref,
      () => ({
        focusPanel: (id: string) => mutableState.api?.panels.find(p => p.id === id)?.focus(),
        getLayout: () => mutableState.api?.toJSON(),
        loadLayout: (layout: unknown) => {
          const { api } = mutableState
          if (!api) return
          api.fromJSON(layout as Parameters<DockviewApi['fromJSON']>[0])
        },
        openFile,
        showPanel: (id: string) => mutableState.api?.panels.find(p => p.id === id)?.focus()
      }),
      [openFile]
    )
    useEffect(() => {
      const { api } = mutableState
      if (!api) return
      const currentTabs = extractTabs(children),
        currentIds = new Set(currentTabs.map(getTabId))
      for (const id of mutableState.prevIds)
        if (!currentIds.has(id)) {
          const panel = api.panels.find(p => p.id === id)
          if (panel) {
            mutableState.savedGroups.set(id, panel.group.id)
            api.removePanel(panel)
          }
        }
      for (const tab of currentTabs) {
        const tabId = getTabId(tab)
        if (mutableState.prevIds.has(tabId))
          api.panels.find(p => p.id === tabId)?.api.updateParameters({ content: tab.children })
        else addTab(tab)
      }
      mutableState.prevIds = currentIds
      mutableState.tabsCache = currentTabs
    })
    const handleReady = (event: DockviewReadyEvent) => {
      mutableState.api = event.api
      const tabs = extractTabs(children)
      for (const tab of tabs) addTab(tab)
      mutableState.prevIds = new Set(tabs.map(getTabId))
      mutableState.tabsCache = tabs
      event.api.onDidRemovePanel(e => {
        mutableState.filePanelIds.delete(e.id)
        const tab = mutableState.tabsCache.find(t => getTabId(t) === e.id)
        tab?.onClose?.()
      })
      if (onLayoutChange) event.api.onDidLayoutChange(() => onLayoutChange(event.api.toJSON()))
    }
    if (!mounted) return null
    return (
      <DockviewReact className={className} components={COMPONENTS} onReady={handleReady} tabComponents={TAB_COMPONENTS} />
    )
  }
export type { WorkspaceProps, WorkspaceRef }
export { Workspace }
