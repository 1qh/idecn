/** biome-ignore-all lint/suspicious/useAwait: fetch chains */
/* eslint-disable @eslint-react/hooks-extra/no-direct-set-state-in-use-effect */
/* oxlint-disable promise/prefer-await-to-then, promise/always-return */
'use client'
import type { TreeDataItem } from 'nicetree'
import { Editor } from '@monaco-editor/react'
import { MoonIcon, SunIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { FileTree } from 'nicetree'
import { parseAsString, useQueryState } from 'nuqs'
import { useEffect, useMemo, useState } from 'react'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '~/components/resizable'
interface GitHubTreeItem {
  mode: string
  path: string
  sha: string
  size?: number
  type: 'blob' | 'tree'
  url: string
}
const DEFAULT_REPO = 'openclaw/openclaw',
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
  langOf = (p: string): string => {
    const ext = p.split('.').at(-1) ?? '',
      map: Record<string, string> = {
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
    return map[ext] ?? 'plaintext'
  },
  EDITOR_OPTIONS = { minimap: { enabled: false }, readOnly: true, scrollBeyondLastLine: false } as const,
  Explorer = () => {
    const [repo, setRepo] = useQueryState('repo', parseAsString.withDefault(DEFAULT_REPO)),
      [path, setPath] = useQueryState('path', parseAsString.withDefault('')),
      [tree, setTree] = useState<TreeDataItem[]>([]),
      [content, setContent] = useState(''),
      [loading, setLoading] = useState(false),
      [treeLoading, setTreeLoading] = useState(false),
      [repoInput, setRepoInput] = useState(repo),
      [mounted, setMounted] = useState(false),
      { resolvedTheme, setTheme } = useTheme(),
      editorTheme = useMemo(() => (resolvedTheme === 'dark' ? 'vs-dark' : 'light'), [resolvedTheme]),
      isDark = mounted && resolvedTheme === 'dark'
    useEffect(() => {
      setMounted(true)
    }, [])
    useEffect(() => {
      setTreeLoading(true)
      fetch(`https://api.github.com/repos/${repo}/git/trees/main?recursive=1`)
        .then(async res => res.json() as Promise<{ tree?: GitHubTreeItem[] }>)
        .then(data => {
          setTree(data.tree ? buildTree(data.tree) : [])
          setTreeLoading(false)
        })
        .catch(() => {
          setTree([])
          setTreeLoading(false)
        })
    }, [repo])
    useEffect(() => {
      if (!path) return
      setLoading(true)
      fetch(`https://api.github.com/repos/${repo}/contents/${path}`)
        .then(async res => res.json() as Promise<{ content?: string }>)
        .then(data => {
          setContent(data.content ? atob(data.content) : '')
          setLoading(false)
        })
        .catch(() => {
          setContent('')
          setLoading(false)
        })
    }, [path, repo])
    const handleSubmit = () => {
      const trimmed = repoInput.trim()
      if (trimmed && trimmed !== repo) {
        setRepo(trimmed)
        setPath('')
        setContent('')
      }
    }
    return (
      <div className='flex h-screen flex-col'>
        <div className='flex items-center gap-2 border-b border-border px-3 py-1.5'>
          <input
            className='flex-1 bg-transparent px-2 py-1 text-sm outline-none'
            onChange={e => setRepoInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSubmit()
            }}
            placeholder='owner/repo'
            type='text'
            value={repoInput}
          />
          <button className='rounded bg-accent px-3 py-1 text-sm hover:bg-accent/80' onClick={handleSubmit} type='button'>
            Go
          </button>
          <button
            className='rounded p-1 hover:bg-accent'
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            type='button'>
            {isDark ? <SunIcon className='size-4' /> : <MoonIcon className='size-4' />}
          </button>
        </div>
        <ResizablePanelGroup orientation='horizontal'>
          <ResizablePanel defaultSize={20} minSize={10}>
            <div className='h-full overflow-x-auto overflow-y-auto border-r border-border'>
              {treeLoading ? (
                <div className='p-4 text-sm text-muted-foreground'>Loading...</div>
              ) : (
                <FileTree
                  data={tree}
                  initialSelectedItemId={path || undefined}
                  onSelectChange={item => {
                    if (item && !item.children) setPath(item.path)
                  }}
                />
              )}
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel>
            {loading ? (
              <div className='flex h-full items-center justify-center text-muted-foreground'>Loading file...</div>
            ) : path ? (
              <Editor language={langOf(path)} options={EDITOR_OPTIONS} theme={editorTheme} value={content} />
            ) : (
              <div className='flex h-full items-center justify-center text-muted-foreground'>Select a file to view</div>
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    )
  }
export default Explorer
