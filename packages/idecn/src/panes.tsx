/* eslint-disable @eslint-react/no-children-for-each, @eslint-react/no-unused-props */
/* oxlint-disable no-react-children */
'use client'
import type { DockviewApi, DockviewReadyEvent, IDockviewPanelHeaderProps, IDockviewPanelProps } from 'dockview-react'
import type { ComponentProps, ComponentType, ReactNode, Ref } from 'react'
import { cn } from '@a/ui'
import { DockviewReact } from 'dockview-react'
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
import 'dockview-react/dist/styles/dockview.css'
import { parseJson } from './parse-json'

const TAB_TYPE = Symbol('idecn-tab')
type IconComponent = ComponentType<{ className?: string }>
interface PaneHostRef {
  focusPanel: (id: string) => void
  hasPanel: (id: string) => boolean
  panelIds: () => string[]
  reset: () => void
  togglePanel: (id: string, focusOnly?: boolean) => void
}
type TabMenuKey = 'close' | 'closeAll' | 'closeOthers' | 'closeRight' | 'copyPath' | 'pin' | 'split'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Tab = (_props: {
  activeClassName?: string
  children: ReactNode
  closable?: boolean
  contextMenu?: TabMenuKey[]
  defaultOpen?: boolean
  headerClassName?: string
  icon?: boolean | IconComponent
  id?: string
  inactive?: boolean
  inactiveClassName?: string
  initialWidth?: number
  onClose?: () => void
  position?: { direction: 'above' | 'below' | 'left' | 'right' | 'within'; referenceTab?: string }
  title: string
}): null => null
Tab._type = TAB_TYPE
type TabProps = ComponentProps<typeof Tab>
const extractTabs = (children: ReactNode): TabProps[] => {
  const tabs: TabProps[] = []
  Children.forEach(children, child => {
    if (
      isValidElement(child) &&
      /** biome-ignore lint/nursery/noUnsafeTypeAssertion: React element type metadata is an untyped external boundary */
      (child.type as { _type?: symbol })._type === TAB_TYPE
    )
      /** biome-ignore lint/nursery/noUnsafeTypeAssertion: React element props cross the untyped tab component boundary */
      tabs.push(child.props as TabProps)
  })
  return tabs
}
const getTabId = (tab: TabProps) => tab.id ?? tab.title
const layoutVersionSuffix = /v\d+$/u
const pruneStaleLayoutKeys = (key: string) => {
  const prefix = key.replace(layoutVersionSuffix, '')
  if (prefix === key) return
  try {
    const store = globalThis.localStorage
    const drop: string[] = []
    for (let i = 0; i < store.length; i += 1) {
      const k = store.key(i)
      if (k !== null && k !== key && k.startsWith(prefix) && layoutVersionSuffix.test(k)) drop.push(k)
    }
    for (const k of drop) store.removeItem(k)
  } catch {
    /* localStorage unavailable */
  }
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
    api.fromJSON(parseJson<Parameters<typeof api.fromJSON>[0]>(raw))
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
        contextMenu: tab.contextMenu,
        headerClassName: tab.headerClassName,
        icon: tab.icon,
        inactiveClassName: tab.inactiveClassName
      })
  }
  return api.panels.length > 0
}
const TabContentContext = createContext<Map<string, ReactNode>>(new Map())
TabContentContext.displayName = 'PaneTabContentContext'
const ContentPanel = ({ api, params }: IDockviewPanelProps<{ content: ReactNode }>) => {
  const registry = use(TabContentContext)
  const [content, setContent] = useState(params.content)
  useEffect(() => {
    const d = api.onDidParametersChange(e => {
      /** biome-ignore lint/nursery/noUnsafeTypeAssertion: Dockview parameter event crosses the external panel payload boundary */
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
const TabHeader = ({ api, params }: IDockviewPanelHeaderProps) => {
  /** biome-ignore lint/nursery/noUnsafeTypeAssertion: dockview panel params cross the untyped external payload boundary */
  const { icon: Icon } = params as { icon?: boolean | IconComponent }
  const [title, setTitle] = useState(api.title ?? '')
  useEffect(() => {
    const d = api.onDidTitleChange(e => setTitle(e.title))
    return () => {
      d.dispose()
    }
  }, [api])
  return (
    <div className='flex h-full items-center gap-1.5 px-3 text-sm'>
      {Icon && typeof Icon !== 'boolean' ? <Icon className='size-4 shrink-0' /> : null}
      <span className='truncate'>{title}</span>
    </div>
  )
}
const COMPONENTS = { custom: ContentPanel }
const TAB_COMPONENTS = { default: TabHeader }
const PaneHost = ({
  children,
  className,
  layoutKey,
  ref,
  ...props
}: Omit<ComponentProps<'div'>, 'ref'> & {
  layoutKey?: string
  ref?: Ref<PaneHostRef>
}) => {
  const dvHostRef = useRef<HTMLDivElement>(null)
  const stateRef = useRef<{
    api: DockviewApi | null
    disposables: { dispose: () => void }[]
    geom: Map<string, { height: number; width: number }>
    prevTabIds: Set<string>
  }>({ api: null, disposables: [], geom: new Map(), prevTabIds: new Set() })
  const tabs = useMemo(() => extractTabs(children), [children])
  const tabContent = useMemo(() => new Map(tabs.map(t => [getTabId(t), t.children] as const)), [tabs])
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
    let refTarget: { referenceGroup?: string; referencePanel?: string } = {}
    if (refPanel)
      refTarget =
        tab.position?.direction === 'within' ? { referenceGroup: refPanel.group.id } : { referencePanel: refPanel.id }
    const position = tab.position ? { direction: tab.position.direction, ...refTarget } : undefined
    api.addPanel({
      component: 'custom',
      id: tabId,
      ...(tab.initialWidth === undefined ? {} : { initialWidth: tab.initialWidth }),
      params: { closable: tab.closable, content: tab.children, icon: tab.icon },
      ...(position ? { position } : {}),
      tabComponent: 'default',
      title: tab.title
    })
  }, [])
  useImperativeHandle(
    ref,
    () => ({
      focusPanel: (id: string) => stateRef.current.api?.panels.find(p => p.id === id)?.focus(),
      hasPanel: (id: string) => Boolean(stateRef.current.api?.panels.some(p => p.id === id)),
      panelIds: () => stateRef.current.api?.panels.map(p => p.id) ?? [],
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
        const { api, geom } = stateRef.current
        if (!api) return
        const existing = api.panels.find(p => p.id === id)
        if (existing) {
          if (focusOnly) {
            existing.focus()
            return
          }
          api.removePanel(existing)
          for (const p of api.panels) {
            const g = geom.get(p.id)
            if (g)
              try {
                p.api.setSize({ height: g.height, width: g.width })
              } catch {
                /* size not settable this tick */
              }
          }
          return
        }
        for (const p of api.panels) geom.set(p.id, { height: p.api.height, width: p.api.width })
        const spec = tabs.find(t => getTabId(t) === id)
        if (spec) {
          addTab(spec)
          api.panels.find(p => p.id === id)?.focus()
        }
      }
    }),
    [addTab, layoutKey, tabs]
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
      else if (tab.defaultOpen !== false) addTab(tab)
    }
    stateRef.current.prevTabIds = currentIds
  }, [addTab, tabs])
  const handleReady = (event: DockviewReadyEvent) => {
    stateRef.current.api = event.api
    if (layoutKey !== undefined) pruneStaleLayoutKeys(layoutKey)
    const restored = layoutKey === undefined ? false : restoreLayout(event.api, layoutKey, tabs)
    if (!restored) for (const tab of tabs) if (tab.defaultOpen !== false) addTab(tab)
    if (layoutKey !== undefined)
      stateRef.current.disposables.push(event.api.onDidLayoutChange(() => persistLayout(event.api, layoutKey)))
    stateRef.current.prevTabIds = new Set(tabs.map(getTabId))
    const forceLayout = (): void => {
      const el = dvHostRef.current?.querySelector<HTMLElement>('.dv-reset')
      if (el && el.clientWidth > 0 && el.clientHeight > 0) event.api.layout(el.clientWidth, el.clientHeight, true)
    }
    requestAnimationFrame(() => {
      forceLayout()
      requestAnimationFrame(forceLayout)
    })
    setTimeout(forceLayout, 150)
  }
  useEffect(
    () => () => {
      for (const d of stateRef.current.disposables) d.dispose()
      stateRef.current.disposables = []
    },
    []
  )
  return (
    <div className={cn('flex h-full flex-col', className)} ref={dvHostRef} {...props}>
      <TabContentContext value={tabContent}>
        <DockviewReact
          className='dv-reset flex-1'
          components={COMPONENTS}
          onReady={handleReady}
          tabComponents={TAB_COMPONENTS}
        />
      </TabContentContext>
    </div>
  )
}
export { extractTabs, getTabId, PaneHost, persistLayout, pruneStaleLayoutKeys, restoreLayout, Tab, TAB_TYPE }
export type { IconComponent, PaneHostRef, TabMenuKey, TabProps }
