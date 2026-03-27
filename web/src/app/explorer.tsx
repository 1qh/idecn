/** biome-ignore-all lint/suspicious/useAwait: fetch chains */
/* eslint-disable @eslint-react/hooks-extra/no-direct-set-state-in-use-effect */
/* oxlint-disable promise/prefer-await-to-then, promise/always-return */
'use client'
import type { WorkspaceRef } from 'idecn'
import { Workspace } from 'idecn'
import { Moon, PanelLeft, Search, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useRef, useState } from 'react'
import type { GitHubContent, GitHubTreeItem } from './types'
import { DEFAULT_REPO, EMPTY_TREE } from './constants'
import { DEMO_TREE } from './demo-tree'
import { buildTree } from './github'
import { readHash, writeHash } from './hash'
const init = readHash(),
  Explorer = () => {
    const [repo, setRepo] = useState(init.repo),
      [tree, setTree] = useState(EMPTY_TREE),
      [loading, setLoading] = useState(true),
      [input, setInput] = useState(init.repo === DEFAULT_REPO ? '' : init.repo),
      [mounted, setMounted] = useState(false),
      { resolvedTheme, setTheme } = useTheme(),
      ref = useRef<WorkspaceRef>(null)
    useEffect(() => setMounted(true), [])
    useEffect(() => {
      setLoading(true)
      if (repo === DEFAULT_REPO) {
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
            className='stroke-1 size-8 shrink-0 p-2 hover:cursor-pointer hover:bg-accent -mr-2'
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
            placeholder={`${DEFAULT_REPO} · github username/repo`}
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
          onFilesChange={f => writeHash(repo, f)}
          onOpenFile={async item =>
            fetch(`https://api.github.com/repos/${repo}/contents/${item.path}`)
              .then(async r => r.json() as Promise<GitHubContent>)
              .then(d => (d.content ? atob(d.content) : null))
              .catch(() => null)
          }
          ref={ref}
          sidebarSize='15%'
          tree={loading ? EMPTY_TREE : tree}
        />
      </div>
    )
  }
export default Explorer
