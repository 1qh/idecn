/** biome-ignore-all lint/nursery/noNestedPromises: server action fallback to client fetch */
/* eslint-disable @eslint-react/hooks-extra/no-direct-set-state-in-use-effect */
/* oxlint-disable promise/prefer-await-to-then, promise/always-return, promise/catch-or-return, promise/no-nesting */
'use client'
import type { TreeDataItem, WorkspaceRef } from 'idecn'
import { Workspace } from 'idecn'
import { AlertTriangle, Moon, PanelLeft, Search, Sun, X } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useRef, useState } from 'react'
import { fetchFile, fetchTree } from './actions'
import { DEFAULT_FILES, DEFAULT_REPO } from './constants'
const readHash = () => {
    if (!('location' in globalThis)) return { files: [] as string[], repo: DEFAULT_REPO }
    const hash = globalThis.location.hash.slice(1)
    if (!hash) return { files: DEFAULT_FILES, repo: DEFAULT_REPO }
    const [repo, ...files] = hash.split(',')
    return { files: files.filter(Boolean), repo: repo || DEFAULT_REPO }
  },
  writeHash = (repo: string, files: string[]) => {
    const hash = [repo, ...files].join(',')
    globalThis.history.replaceState(null, '', files.length > 0 ? `#${hash}` : globalThis.location.pathname)
  },
  init = readHash(),
  Explorer = ({ tree: initialTree }: { tree: TreeDataItem[] }) => {
    const [repo, setRepo] = useState(init.repo),
      [tree, setTree] = useState(initialTree),
      [error, setError] = useState<null | string>(null),
      [input, setInput] = useState(init.repo === DEFAULT_REPO ? '' : init.repo),
      [mounted, setMounted] = useState(false),
      { resolvedTheme, setTheme } = useTheme(),
      ref = useRef<WorkspaceRef>(null)
    useEffect(() => setMounted(true), [])
    useEffect(() => {
      setError(null)
      if (repo === DEFAULT_REPO) {
        setTree(initialTree)
        return
      }
      fetchTree(repo)
        .then(setTree)
        .catch(async () =>
          fetch(`https://data.jsdelivr.com/v1/packages/gh/${repo}@main`)
            .then(async r => r.json() as Promise<{ files?: unknown[] }>)
            .then(d => setTree(d.files ? (d.files as TreeDataItem[]) : []))
            .catch(() => {
              setTree([])
              setError('Failed to load repo tree from both server and jsdelivr')
            })
        )
    }, [initialTree, repo])
    const submit = () => {
      const v = input.trim()
      if (v && v !== repo) setRepo(v)
    }
    return (
      <div className='flex h-screen flex-col'>
        <div className='flex items-center *:transition-all *:duration-300'>
          <PanelLeft
            className='stroke-1 size-8 shrink-0 hover:p-1.5 p-2 hover:cursor-pointer hover:bg-accent -mr-2'
            onClick={() => ref.current?.toggleSidebar()}
          />
          <Search
            className='stroke-1 hover:p-1.5 size-8 shrink-0 p-2 hover:cursor-pointer hover:bg-accent'
            onClick={submit}
          />
          <input
            autoComplete='off'
            className='min-w-0 flex-1 bg-transparent text-sm outline-none'
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') submit()
            }}
            placeholder={`${DEFAULT_REPO} · github username/repo`}
            type='search'
            value={input}
          />
          <button
            className='shrink-0 *:p-1.5 *:hover:p-1 *:size-8 hover:bg-accent [&_svg]:stroke-1'
            onClick={() => setTheme(mounted && resolvedTheme === 'dark' ? 'light' : 'dark')}
            type='button'>
            {mounted && resolvedTheme === 'dark' ? <Sun /> : <Moon />}
          </button>
        </div>
        {error ? (
          <div className='flex items-center gap-2 border-b border-border bg-amber-500/10 px-3 py-2 text-xs text-amber-500'>
            <AlertTriangle className='size-3.5 shrink-0' />
            {error}
            <button className='ml-auto shrink-0 opacity-60 hover:opacity-100' onClick={() => setError(null)} type='button'>
              <X className='size-3' />
            </button>
          </div>
        ) : null}
        <Workspace
          className='flex-1'
          expandDepth={2}
          initialFiles={init.files}
          onFilesChange={f => writeHash(repo, f)}
          onOpenFile={async item => {
            const content = await fetchFile(repo, item.path).catch(() => null)
            if (content !== null) return content
            return fetch(`https://raw.githubusercontent.com/${repo}/main/${item.path}`)
              .then(async r => (r.ok ? r.text() : null))
              .catch(() => null)
          }}
          ref={ref}
          tree={tree}
        />
      </div>
    )
  }
export default Explorer
