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
  initialFiles?: string[]
  onFilesChange?: (files: string[]) => void
  onOpenFile?: (item: TreeDataItem) => null | Promise<null | string> | string
  ref?: React.Ref<WorkspaceRef>
  renderLoading?: (item: TreeDataItem) => ReactNode
}
interface WorkspaceRef {
  focusPanel: (id: string) => void
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
  state = {
    api: null as DockviewApi | null,
    fileIds: new Set<string>(),
    prevTabIds: new Set<string>(),
    ready: false,
    tabWidths: new Map<string, number>(),
    tabs: [] as TabProps[]
  },
  Workspace = ({ children, className, initialFiles, onFilesChange, onOpenFile, ref, renderLoading }: WorkspaceProps) => {
    const [mounted, setMounted] = useState(false)
    useEffect(() => {
      state.ready = false
      setMounted(true)
    }, [])
    const addTab = useCallback((tab: TabProps) => {
        const { api } = state
        if (!api) return
        const tabId = getTabId(tab)
        if (api.panels.some(p => p.id === tabId)) {
          api.panels.find(p => p.id === tabId)?.api.updateParameters({ content: tab.children })
          return
        }
        if (tab.initialWidth) state.tabWidths.set(tabId, tab.initialWidth)
        api.addPanel({
          component: 'custom',
          id: tabId,
          params: { closable: tab.closable, content: tab.children, headerClassName: tab.headerClassName, icon: tab.icon },
          position: api.panels.length > 0 ? POSITIONS[tab.position ?? ''] : undefined,
          tabComponent: 'default',
          title: tab.title
        })
      }, []),
      openFile = useCallback(
        (item: TreeDataItem) => {
          const { api } = state
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
            existingFile = api.panels.find(p => state.fileIds.has(p.id)),
            position = existingFile
              ? { direction: 'within' as const, referenceGroup: existingFile.group.id }
              : api.panels.length > 0
                ? { direction: 'right' as const }
                : undefined
          state.fileIds.add(item.path)
          api.addPanel({
            component: 'file',
            id: item.path,
            params: { content: '', language: langOf(item.path), loading: loadingNode },
            position,
            tabComponent: 'default',
            title: item.name
          })
          if (!existingFile)
            for (const [panelId, width] of state.tabWidths) {
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
      ),
      notifyFiles = () => {
        if (state.ready && onFilesChange) onFilesChange([...state.fileIds])
      }
    useImperativeHandle(
      ref,
      () => ({
        focusPanel: (id: string) => state.api?.panels.find(p => p.id === id)?.focus(),
        openFile,
        showPanel: (id: string) => state.api?.panels.find(p => p.id === id)?.focus()
      }),
      [openFile]
    )
    useEffect(() => {
      const { api } = state
      if (!api) return
      const currentTabs = extractTabs(children),
        currentIds = new Set(currentTabs.map(getTabId))
      for (const id of state.prevTabIds)
        if (!currentIds.has(id)) {
          const panel = api.panels.find(p => p.id === id)
          if (panel) api.removePanel(panel)
        }
      for (const tab of currentTabs) {
        const tabId = getTabId(tab)
        if (state.prevTabIds.has(tabId))
          api.panels.find(p => p.id === tabId)?.api.updateParameters({ content: tab.children })
        else addTab(tab)
      }
      state.prevTabIds = currentIds
      state.tabs = currentTabs
    })
    const handleReady = (event: DockviewReadyEvent) => {
      state.api = event.api
      const tabs = extractTabs(children)
      for (const tab of tabs) addTab(tab)
      state.prevTabIds = new Set(tabs.map(getTabId))
      state.tabs = tabs
      if (initialFiles)
        for (const path of initialFiles) {
          const name = path.split('/').at(-1) ?? path
          openFile({ id: path, name, path })
        }
      event.api.onDidRemovePanel(e => {
        state.fileIds.delete(e.id)
        const tab = state.tabs.find(t => getTabId(t) === e.id)
        tab?.onClose?.()
        notifyFiles()
      })
      event.api.onDidAddPanel(() => notifyFiles())
      requestAnimationFrame(() => {
        state.ready = true
      })
    }
    if (!mounted) return null
    return (
      <DockviewReact className={className} components={COMPONENTS} onReady={handleReady} tabComponents={TAB_COMPONENTS} />
    )
  }
export type { WorkspaceProps, WorkspaceRef }
export { Workspace }
