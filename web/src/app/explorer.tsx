/** biome-ignore-all lint/suspicious/useAwait: fetch chains */
/* eslint-disable @eslint-react/hooks-extra/no-direct-set-state-in-use-effect */
/* oxlint-disable promise/prefer-await-to-then, promise/always-return */
'use client'
import type { DockviewReadyEvent, IDockviewPanelHeaderProps, IDockviewPanelProps } from 'dockview-react'
import type { TreeDataItem } from 'idecn'
import { Editor } from '@monaco-editor/react'
import { DockviewReact } from 'dockview-react'
import { FileIcon, FileTree } from 'idecn'
import { AlertTriangleIcon, MoonIcon, SearchIcon, SunIcon, XIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { parseAsString, useQueryState } from 'nuqs'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '~/components/resizable'
import { DEMO_TREE } from './demo-tree'
// oxlint-disable-next-line import/no-unassigned-import
import 'dockview-core/dist/styles/dockview.css'
interface GitHubTreeItem {
  path: string
  type: 'blob' | 'tree'
}
const DEFAULT_REPO = '1qh/idecn',
  buildTree = (items: GitHubTreeItem[]): TreeDataItem[] => {
    const root: TreeDataItem[] = [],
      dirs = new Map<string, TreeDataItem>(),
      sorted = [...items].toSorted((a, b) => {
        if (a.type !== b.type) return a.type === 'tree' ? -1 : 1
        return a.path.localeCompare(b.path)
      })
    for (const item of sorted) {
      const parts = item.path.split('/'),
        name = parts.at(-1) ?? item.path,
        node: TreeDataItem = { id: item.path, name, path: item.path }
      if (item.type === 'tree') {
        node.children = []
        dirs.set(item.path, node)
      }
      if (parts.length === 1) root.push(node)
      else dirs.get(parts.slice(0, -1).join('/'))?.children?.push(node)
    }
    return root
  },
  LANG_MAP: Record<string, string> = {
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
  langOf = (p: string): string => LANG_MAP[p.split('.').at(-1) ?? ''] ?? 'plaintext',
  EDITOR_OPTIONS = { minimap: { enabled: false }, readOnly: true, scrollBeyondLastLine: false } as const,
  FilePanel = ({ params }: IDockviewPanelProps<{ content: string; language: string; theme: string }>) => (
    <Editor language={params.language} options={EDITOR_OPTIONS} theme={params.theme} value={params.content} />
  ),
  FileTab = ({ api }: IDockviewPanelHeaderProps) => (
    <div className='group/tab flex h-full items-center'>
      <FileIcon className='size-4 shrink-0 [&_svg]:size-4' name={api.title ?? ''} />
      <span className='mb-px ml-0.5'>{api.title}</span>
      <button
        className='opacity-0 hover:cursor-pointer group-hover/tab:opacity-70'
        onClick={e => {
          e.stopPropagation()
          api.close()
        }}
        type='button'>
        <XIcon className='stroke-1 size-4' />
      </button>
    </div>
  ),
  COMPONENTS = { file: FilePanel },
  TAB_COMPONENTS = { file: FileTab },
  RateLimitBanner = ({ onDismiss }: { onDismiss: () => void }) => (
    <div className='flex items-center gap-2 border-b border-border bg-amber-500/10 px-3 py-2 text-sm text-amber-500'>
      <AlertTriangleIcon className='size-4 shrink-0' />
      <span>GitHub API rate limit reached. Unauthenticated requests are limited to 60/hour.</span>
      <button className='ml-auto shrink-0 opacity-60 hover:opacity-100' onClick={onDismiss} type='button'>
        <XIcon className='size-3' />
      </button>
    </div>
  ),
  Explorer = () => {
    const [repo, setRepo] = useQueryState('repo', parseAsString.withDefault(DEFAULT_REPO)),
      [path, setPath] = useQueryState('path', parseAsString.withDefault('')),
      [tree, setTree] = useState<TreeDataItem[]>([]),
      [treeLoading, setTreeLoading] = useState(true),
      [rateLimited, setRateLimited] = useState(false),
      [repoInput, setRepoInput] = useState(repo),
      [mounted, setMounted] = useState(false),
      { resolvedTheme, setTheme } = useTheme(),
      editorTheme = useMemo(() => (resolvedTheme === 'dark' ? 'vs-dark' : 'light'), [resolvedTheme]),
      isDark = mounted && resolvedTheme === 'dark',
      dockviewRef = useRef<DockviewReadyEvent | null>(null),
      components = COMPONENTS,
      tabComponents = TAB_COMPONENTS
    useEffect(() => {
      setMounted(true)
    }, [])
    useEffect(() => {
      setTreeLoading(true)
      setRateLimited(false)
      if (repo === DEFAULT_REPO) {
        setTree(buildTree(DEMO_TREE))
        setTreeLoading(false)
        return
      }
      fetch(`https://api.github.com/repos/${repo}/git/trees/main?recursive=1`)
        .then(async res => {
          if (res.status === 403 || res.status === 429) {
            setRateLimited(true)
            setTree([])
            setTreeLoading(false)
            return null
          }
          return res.json() as Promise<{ tree?: GitHubTreeItem[] }>
        })
        .then(data => {
          if (data) {
            setTree(data.tree ? buildTree(data.tree) : [])
            setTreeLoading(false)
          }
        })
        .catch(() => {
          setTree([])
          setTreeLoading(false)
        })
    }, [repo])
    const openFile = useCallback(
      (filePath: string) => {
        setPath(filePath)
        const api = dockviewRef.current?.api
        if (!api) return
        const existing = api.panels.find(p => p.id === filePath)
        if (existing) {
          existing.focus()
          return
        }
        fetch(`https://api.github.com/repos/${repo}/contents/${filePath}`)
          .then(async res => {
            if (res.status === 403 || res.status === 429) {
              setRateLimited(true)
              return null
            }
            return res.json() as Promise<{ content?: string }>
          })
          .then(data => {
            if (!data) return
            const content = data.content ? atob(data.content) : ''
            api.addPanel({
              component: 'file',
              id: filePath,
              params: { content, language: langOf(filePath), theme: editorTheme },
              tabComponent: 'file',
              title: filePath.split('/').at(-1) ?? filePath
            })
          })
          .catch(() => undefined)
      },
      [repo, editorTheme, setPath]
    )
    useEffect(() => {
      if (path && dockviewRef.current) openFile(path)
    }, [path, openFile])
    const handleReady = (event: DockviewReadyEvent) => {
        dockviewRef.current = event
        if (path) openFile(path)
      },
      handleSubmit = () => {
        const trimmed = repoInput.trim()
        if (trimmed && trimmed !== repo) {
          setRepo(trimmed)
          setPath('')
          dockviewRef.current?.api.clear()
        }
      }
    return (
      <div className='flex h-screen flex-col'>
        <div className='flex items-center'>
          <SearchIcon className='stroke-1 size-8 p-2 hover:cursor-pointer hover:bg-accent' onClick={handleSubmit} />
          <input
            className='flex-1 bg-transparent text-sm outline-none'
            onChange={e => setRepoInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSubmit()
            }}
            placeholder='owner/repo'
            type='text'
            value={repoInput}
          />
          <button
            className='p-1 hover:bg-accent [&_svg]:stroke-1'
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            type='button'>
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
        {rateLimited ? <RateLimitBanner onDismiss={() => setRateLimited(false)} /> : null}
        <ResizablePanelGroup orientation='horizontal'>
          <ResizablePanel defaultSize='320px' minSize='200px'>
            <div className='h-full overflow-x-auto overflow-y-auto'>
              {treeLoading ? (
                <div className='p-4 text-sm text-muted-foreground'>Loading...</div>
              ) : (
                <FileTree
                  data={tree}
                  onSelectChange={item => {
                    if (item && !item.children) openFile(item.path)
                  }}
                />
              )}
            </div>
          </ResizablePanel>
          <ResizableHandle className='opacity-0' />
          <ResizablePanel>
            <DockviewReact
              className='h-full'
              components={components}
              onReady={handleReady}
              tabComponents={tabComponents}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    )
  }
export default Explorer
