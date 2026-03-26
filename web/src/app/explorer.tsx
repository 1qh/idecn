/** biome-ignore-all lint/suspicious/useAwait: fetch chains */
/* eslint-disable @eslint-react/hooks-extra/no-direct-set-state-in-use-effect */
/* oxlint-disable promise/prefer-await-to-then, promise/always-return */
'use client'
import type { TreeDataItem, WorkspaceRef } from 'idecn'
import { FileTree, Tab, Workspace } from 'idecn'
import { AlertTriangleIcon, MoonIcon, SearchIcon, SunIcon, XIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { GitHubTreeItem } from './github'
import { DEMO_TREE } from './demo-tree'
import { buildTree } from './github'
// oxlint-disable-next-line import/no-unassigned-import
import 'dockview-core/dist/styles/dockview.css'
const DEFAULT_REPO = '1qh/idecn',
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
    const [repo, setRepo] = useState(DEFAULT_REPO),
      [tree, setTree] = useState<TreeDataItem[]>([]),
      [treeLoading, setTreeLoading] = useState(true),
      [rateLimited, setRateLimited] = useState(false),
      [repoInput, setRepoInput] = useState(''),
      [mounted, setMounted] = useState(false),
      { resolvedTheme, setTheme } = useTheme(),
      isDark = mounted && resolvedTheme === 'dark',
      workspaceRef = useRef<WorkspaceRef>(null)
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
      handleSubmit = () => {
        const trimmed = repoInput.trim()
        if (trimmed && trimmed !== repo) setRepo(trimmed)
      }
    return (
      <div className='flex h-screen flex-col'>
        <div className='flex items-center'>
          <SearchIcon className='stroke-1 size-8 p-2 hover:cursor-pointer hover:bg-accent' onClick={handleSubmit} />
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
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
        {rateLimited ? <RateLimitBanner onDismiss={() => setRateLimited(false)} /> : null}
        <Workspace
          className='flex-1'
          onOpenFile={handleOpenFile}
          ref={workspaceRef}
          renderLoading={() => <div className='text-sm text-muted-foreground'>Loading file...</div>}>
          <Tab position='left' title='Explorer'>
            <div className='h-full overflow-x-auto overflow-y-auto'>
              {treeLoading ? (
                <div className='p-4 text-sm text-muted-foreground'>Loading...</div>
              ) : (
                <FileTree
                  data={tree}
                  onSelectChange={item => {
                    if (item && !item.children) workspaceRef.current?.openFile(item)
                  }}
                />
              )}
            </div>
          </Tab>
        </Workspace>
      </div>
    )
  }
export default Explorer
