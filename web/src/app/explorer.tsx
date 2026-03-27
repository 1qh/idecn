/** biome-ignore-all lint/suspicious/useAwait: fetch chains */
/* eslint-disable @eslint-react/hooks-extra/no-direct-set-state-in-use-effect */
/* oxlint-disable promise/prefer-await-to-then, promise/always-return */
'use client'
import type { TreeDataItem, WorkspaceRef } from 'idecn'
import { Workspace } from 'idecn'
import { Moon, PanelLeft, Search, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useRef, useState } from 'react'
import type { GitHubTreeItem } from './github'
import { DEMO_TREE } from './demo-tree'
import { buildTree } from './github'
const EMPTY: TreeDataItem[] = [],
  REPO = '1qh/idecn',
  readHash = () => {
    if (!('location' in globalThis)) return { files: [] as string[], repo: REPO }
    const hash = globalThis.location.hash.slice(1)
    if (!hash) return { files: ['README.md', 'src/idecn.tsx'], repo: REPO }
    const [repo, ...files] = hash.split(',')
    return { files: files.filter(Boolean), repo: repo || REPO }
  },
  init = readHash(),
  Explorer = () => {
    const [repo, setRepo] = useState(init.repo),
      [tree, setTree] = useState<TreeDataItem[]>([]),
      [loading, setLoading] = useState(true),
      [input, setInput] = useState(init.repo === REPO ? '' : init.repo),
      [mounted, setMounted] = useState(false),
      { resolvedTheme, setTheme } = useTheme(),
      ref = useRef<WorkspaceRef>(null)
    useEffect(() => setMounted(true), [])
    useEffect(() => {
      setLoading(true)
      if (repo === REPO) {
        setTree(buildTree(DEMO_TREE))
        setLoading(false)
        return
      }
      fetch(`https://api.github.com/repos/${repo}/git/trees/main?recursive=1`)
        .then(async r => r.json() as Promise<{ tree?: GitHubTreeItem[] }>)
        .then(d => {
          setTree(d.tree ? buildTree(d.tree) : [])
          setLoading(false)
        })
        .catch(() => {
          setTree([])
          setLoading(false)
        })
    }, [repo])
    const submit = () => {
      const v = input.trim()
      if (v && v !== repo) setRepo(v)
    }
    return (
      <div className='flex h-screen flex-col'>
        <div className='flex items-center'>
          <PanelLeft
            className='stroke-1 size-8 shrink-0 p-2 hover:cursor-pointer hover:bg-accent'
            onClick={() => ref.current?.toggleSidebar()}
          />
          <Search className='stroke-1 size-8 shrink-0 p-2 hover:cursor-pointer hover:bg-accent' onClick={submit} />
          <input
            autoComplete='off'
            className='min-w-0 flex-1 bg-transparent text-sm outline-none'
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') submit()
            }}
            placeholder={`${REPO} · github username/repo`}
            type='search'
            value={input}
          />
          <button
            className='shrink-0 p-1 hover:bg-accent [&_svg]:stroke-1'
            onClick={() => setTheme(mounted && resolvedTheme === 'dark' ? 'light' : 'dark')}
            type='button'>
            {mounted && resolvedTheme === 'dark' ? <Sun /> : <Moon />}
          </button>
        </div>
        <Workspace
          className='flex-1'
          initialFiles={init.files}
          onFilesChange={f => {
            const h = [repo, ...f].join(',')
            globalThis.history.replaceState(null, '', f.length > 0 ? `#${h}` : globalThis.location.pathname)
          }}
          onOpenFile={async item =>
            fetch(`https://api.github.com/repos/${repo}/contents/${item.path}`)
              .then(async r => r.json() as Promise<{ content?: string }>)
              .then(d => (d.content ? atob(d.content) : null))
              .catch(() => null)
          }
          ref={ref}
          tree={loading ? EMPTY : tree}
        />
      </div>
    )
  }
export default Explorer
