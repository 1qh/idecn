/** biome-ignore-all lint/suspicious/useAwait: fetch chains */
/* eslint-disable @eslint-react/hooks-extra/no-direct-set-state-in-use-effect */
/* oxlint-disable promise/prefer-await-to-then, promise/always-return */
'use client'
import type { TreeDataItem } from 'idecn'
import { Workspace } from 'idecn'
import { AlertTriangle, Moon, Search, Sun, X } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useCallback, useEffect, useState } from 'react'
import type { GitHubTreeItem } from './github'
import { DEMO_TREE } from './demo-tree'
import { buildTree } from './github'
// oxlint-disable-next-line import/no-unassigned-import
import 'dockview-core/dist/styles/dockview.css'
const EMPTY_TREE: TreeDataItem[] = [],
  DEFAULT_REPO = '1qh/idecn',
  readHash = (): { files: string[]; repo: string } => {
    if (!('location' in globalThis)) return { files: [], repo: DEFAULT_REPO }
    const hash = globalThis.location.hash.slice(1)
    if (!hash) return { files: ['README.md', 'src/idecn.tsx'], repo: DEFAULT_REPO }
    const [repo, ...files] = hash.split(',')
    return { files: files.filter(Boolean), repo: repo || DEFAULT_REPO }
  },
  initial = readHash(),
  RateLimitBanner = ({ onDismiss }: { onDismiss: () => void }) => (
    <div className='flex items-center gap-2 border-b border-border bg-amber-500/10 px-3 py-2 text-sm text-amber-500'>
      <AlertTriangle className='size-4 shrink-0' />
      <span>GitHub API rate limit reached. Unauthenticated requests are limited to 60/hour.</span>
      <button className='ml-auto shrink-0 opacity-60 hover:opacity-100' onClick={onDismiss} type='button'>
        <X className='size-3' />
      </button>
    </div>
  ),
  Explorer = () => {
    const [repo, setRepo] = useState(initial.repo),
      [tree, setTree] = useState<TreeDataItem[]>([]),
      [treeLoading, setTreeLoading] = useState(true),
      [rateLimited, setRateLimited] = useState(false),
      [repoInput, setRepoInput] = useState(initial.repo === DEFAULT_REPO ? '' : initial.repo),
      [mounted, setMounted] = useState(false),
      { resolvedTheme, setTheme } = useTheme(),
      isDark = mounted && resolvedTheme === 'dark'
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
    const handleOpenFile = useCallback(
        async (item: TreeDataItem): Promise<null | string> =>
          fetch(`https://api.github.com/repos/${repo}/contents/${item.path}`)
            .then(async res => {
              if (res.status === 403 || res.status === 429) {
                setRateLimited(true)
                return null
              }
              return res.json() as Promise<{ content?: string }>
            })
            .then(data => (data?.content ? atob(data.content) : null))
            .catch(() => null),
        [repo]
      ),
      handleFilesChange = useCallback(
        (files: string[]) => {
          const hash = [repo, ...files].join(',')
          globalThis.history.replaceState(null, '', files.length > 0 ? `#${hash}` : globalThis.location.pathname)
        },
        [repo]
      ),
      handleSubmit = () => {
        const trimmed = repoInput.trim()
        if (trimmed && trimmed !== repo) setRepo(trimmed)
      }
    return (
      <div className='flex h-screen flex-col'>
        <div className='flex items-center'>
          <Search className='stroke-1 size-8 p-2 hover:cursor-pointer hover:bg-accent' onClick={handleSubmit} />
          <input
            autoComplete='off'
            className='flex-1 bg-transparent text-sm outline-none'
            data-1p-ignore
            data-bwignore
            data-lpignore='true'
            onChange={e => setRepoInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSubmit()
            }}
            placeholder={`${DEFAULT_REPO} · Enter github username/repo`}
            type='search'
            value={repoInput}
          />
          <button
            className='p-1 hover:bg-accent [&_svg]:stroke-1'
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            type='button'>
            {isDark ? <Sun /> : <Moon />}
          </button>
        </div>
        {rateLimited ? <RateLimitBanner onDismiss={() => setRateLimited(false)} /> : null}
        <Workspace
          className='flex-1'
          initialFiles={initial.files}
          onFilesChange={handleFilesChange}
          onOpenFile={handleOpenFile}
          renderLoading={() => <div className='text-sm text-muted-foreground'>Loading file...</div>}
          tree={treeLoading ? EMPTY_TREE : tree}
        />
      </div>
    )
  }
export default Explorer
