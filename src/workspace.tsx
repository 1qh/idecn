/* eslint-disable @eslint-react/hooks-extra/no-direct-set-state-in-use-effect, @eslint-react/no-children-for-each */
/* oxlint-disable promise/prefer-await-to-then, promise/always-return, no-react-children */
'use client'
import type { DockviewApi, DockviewReadyEvent } from 'dockview-react'
import type { ReactNode } from 'react'
import { DockviewReact } from 'dockview-react'
import { Children, isValidElement, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import type { TreeDataItem } from './file-tree'
import type { TabProps } from './tab'
import { cn } from './cn'
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
    '.dv-reset .monaco-editor,.dv-reset .monaco-editor .margin,.dv-reset .monaco-editor-background,.dv-reset .monaco-editor .overflow-guard{background-color:transparent}'
  ].join(''),
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
  Workspace = ({ children, className, initialFiles, onFilesChange, onOpenFile, ref, renderLoading }: WorkspaceProps) => {
    const [mounted, setMounted] = useState(false),
      stateRef = useRef({
        api: null as DockviewApi | null,
        disposables: [] as { dispose: () => void }[],
        fileIds: new Set<string>(),
        prevTabIds: new Set<string>(),
        ready: false,
        tabWidths: new Map<string, number>(),
        tabs: [] as TabProps[]
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
          prevTabIds: new Set(),
          ready: false,
          tabWidths: new Map(),
          tabs: []
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
        if (tab.initialWidth) stateRef.current.tabWidths.set(tabId, tab.initialWidth)
        api.addPanel({
          component: 'custom',
          id: tabId,
          params: { closable: tab.closable, content: tab.children, headerClassName: tab.headerClassName, icon: tab.icon },
          position: api.panels.length > 0 ? POSITIONS[tab.position ?? ''] : undefined,
          tabComponent: 'default',
          title: tab.title
        })
        if (tab.initialWidth) {
          const panel = api.panels.find(p => p.id === tabId)
          if (panel) panel.group.api.setConstraints({ minimumWidth: tab.initialWidth })
        }
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
          position = existingFile
            ? { direction: 'within' as const, referenceGroup: existingFile.group.id }
            : api.panels.length > 0
              ? { direction: 'right' as const }
              : undefined
        stateRef.current.fileIds.add(item.path)
        api.addPanel({
          component: 'file',
          id: item.path,
          params: { content: '', language: langOf(item.path), loading: loadingNode },
          position,
          tabComponent: 'default',
          title: item.name
        })
        if (!existingFile)
          for (const [panelId, width] of stateRef.current.tabWidths) {
            const panel = api.panels.find(p => p.id === panelId)
            if (panel) panel.group.api.setSize({ width })
          }
        const result = onOpen(item)
        if (result === null) return
        if (typeof result === 'string')
          api.panels.find(p => p.id === item.path)?.api.updateParameters({ content: result, loading: undefined })
        else {
          const panelPath = item.path
          result
            .then(content => {
              const p = api.panels.find(x => x.id === panelPath)
              if (!p) return
              if (content === null) api.removePanel(p)
              else p.api.updateParameters({ content, loading: undefined })
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
      stateRef.current.tabs = tabs
    }, [addTab, tabs])
    const handleReady = (event: DockviewReadyEvent) => {
      stateRef.current.api = event.api
      for (const tab of tabs) addTab(tab)
      stateRef.current.prevTabIds = new Set(tabs.map(getTabId))
      stateRef.current.tabs = tabs
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
          const tab = stateRef.current.tabs.find(t => getTabId(t) === e.id)
          tab?.onClose?.()
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
      <>
        <style>{RESET_CSS}</style>
        <DockviewReact
          className={cn('dv-reset', className)}
          components={COMPONENTS}
          onReady={handleReady}
          tabComponents={TAB_COMPONENTS}
        />
      </>
    )
  }
export type { WorkspaceProps, WorkspaceRef }
export { Workspace }
