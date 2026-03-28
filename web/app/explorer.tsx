/** biome-ignore-all lint/nursery/noNestedPromises: server action fallback to client fetch */
/* eslint-disable @eslint-react/hooks-extra/no-direct-set-state-in-use-effect */
/* oxlint-disable promise/prefer-await-to-then, promise/always-return, promise/catch-or-return, promise/no-nesting */
'use client'
import type { TreeDataItem, VirtualFile, WorkspaceRef } from 'idecn'
import { SiGithub } from '@icons-pack/react-simple-icons'
import { Workspace } from 'idecn'
import { AlertTriangle, Moon, PanelLeft, Search, Sun, X } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fetchFile, fetchTree } from './actions'
import { DEFAULT_FILES, DEFAULT_REPO, EXPAND_EXCLUDE } from './constants'
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
      [activity, setActivity] = useState(''),
      { resolvedTheme, setTheme } = useTheme(),
      ref = useRef<WorkspaceRef>(null),
      log = useCallback((msg: string) => setActivity(prev => `${prev}[${new Date().toLocaleTimeString()}] ${msg}\n`), []),
      files = useMemo(
        (): VirtualFile[] => [{ content: activity, language: 'log', name: 'Activity', open: true, pin: 'bottom' }],
        [activity]
      )
    /** biome-ignore lint/correctness/useExhaustiveDependencies: mount only */
    useEffect(() => {
      setMounted(true)
      log(`Loaded ${init.repo} with ${initialTree.length} root items`)
      const handler = (e: KeyboardEvent) => {
        const mods = [e.metaKey && '⌘', e.ctrlKey && 'Ctrl', e.altKey && '⌥', e.shiftKey && '⇧'].filter(Boolean).join('')
        if (mods) log(`Key: ${mods}+${e.code.replace('Key', '').replace('Digit', '')}`)
      }
      document.addEventListener('keydown', handler)
      return () => document.removeEventListener('keydown', handler)
    }, []) // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => {
      setError(null)
      if (repo === DEFAULT_REPO) {
        setTree(initialTree)
        log(`Tree: ${String(initialTree.length)} root items (local)`)
        return
      }
      log(`Fetching tree for ${repo}`)
      fetchTree(repo)
        .then(t => {
          setTree(t)
          log(`Tree: ${String(t.length)} root items (server action)`)
        })
        .catch(async () =>
          fetch(`https://data.jsdelivr.com/v1/packages/gh/${repo}@main`)
            .then(async r => r.json() as Promise<{ files?: unknown[] }>)
            .then(d => {
              if (!d.files) throw new Error('no files')
              setTree(d.files as TreeDataItem[])
            })
            .catch(async () =>
              fetch(`https://api.github.com/repos/${repo}/git/trees/main?recursive=1`)
                .then(
                  async r =>
                    r.json() as Promise<{
                      tree?: { path: string; type: string }[]
                    }>
                )
                .then(d => {
                  if (!d.tree) throw new Error('no tree')
                  const items: TreeDataItem[] = [],
                    dirs = new Map<string, TreeDataItem>()
                  for (const t of d.tree.toSorted((a, b) => {
                    if (a.type !== b.type) return a.type === 'tree' ? -1 : 1
                    return a.path.localeCompare(b.path)
                  })) {
                    const parts = t.path.split('/'),
                      name = parts.at(-1) ?? t.path,
                      node: TreeDataItem = { id: t.path, name, path: t.path }
                    if (t.type === 'tree') {
                      node.children = []
                      dirs.set(t.path, node)
                    }
                    if (parts.length === 1) items.push(node)
                    else dirs.get(parts.slice(0, -1).join('/'))?.children?.push(node)
                  }
                  setTree(items)
                })
                .catch(() => {
                  setTree([])
                  setError('Failed to load repo tree')
                })
            )
        )
    }, [initialTree, log, repo])
    const submit = () => {
      const v = input.trim()
      if (v && v !== repo) {
        setRepo(v)
        log(`Repo: ${v}`)
      }
    }
    return (
      <div className='flex h-screen flex-col'>
        <div className='flex items-center *:transition-all *:duration-300'>
          <PanelLeft
            className='stroke-1 size-8 shrink-0 hover:p-1.5 p-2 hover:cursor-pointer hover:bg-accent -mr-2'
            onClick={() => {
              ref.current?.toggleSidebar()
              log('Toggle sidebar')
            }}
          />
          <Search
            className='stroke-1 hover:p-1.5 size-8 shrink-0 p-2 hover:cursor-pointer hover:bg-accent'
            onClick={() => {
              submit()
              log('Search submitted')
            }}
          />
          <input
            autoComplete='off'
            className='min-w-0 flex-1 bg-transparent text-sm outline-none'
            onChange={e => setInput(e.target.value)}
            onFocus={() => {
              log('Search focused')
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') submit()
            }}
            placeholder={`${DEFAULT_REPO} · github username/repo`}
            type='search'
            value={input}
          />
          <a
            className='shrink-0 p-2 hover:p-1.5 hover:bg-accent transition-all duration-300'
            href={`https://github.com/${DEFAULT_REPO}`}
            rel='noopener noreferrer'
            target='_blank'>
            <SiGithub className='size-4' />
          </a>
          <button
            className='shrink-0 *:p-1.5 *:hover:p-1 *:size-8 hover:bg-accent [&_svg]:stroke-1'
            onClick={() => {
              const next = mounted && resolvedTheme === 'dark' ? 'light' : 'dark'
              setTheme(next)
              log(`Theme: ${next}`)
            }}
            type='button'>
            {mounted && resolvedTheme === 'dark' ? <Sun /> : <Moon />}
          </button>
        </div>
        {error ? (
          <div className='flex items-center gap-2 border-b border-border bg-amber-500/10 px-3 py-2 text-xs text-amber-500'>
            <AlertTriangle className='size-3.5 shrink-0' />
            {error}
            <button
              className='ml-auto shrink-0 opacity-60 hover:opacity-100'
              onClick={() => {
                setError(null)
                log('Error dismissed')
              }}
              type='button'>
              <X className='size-3' />
            </button>
          </div>
        ) : null}
        <Workspace
          activityLog={log}
          className='flex-1'
          expandDepth={2}
          expandExclude={EXPAND_EXCLUDE}
          files={files}
          initialFiles={init.files}
          onFilesChange={f => writeHash(repo, f)}
          onOpenFile={async item => {
            const content = await fetchFile(repo, item.path).catch(() => null)
            if (content !== null) {
              log(`Loaded ${item.path} (server action, ${content.length} chars)`)
              return content
            }
            const raw = await fetch(`https://raw.githubusercontent.com/${repo}/main/${item.path}`)
              .then(async r => (r.ok ? r.text() : null))
              .catch(() => null)
            if (raw !== null) {
              log(`Loaded ${item.path} (raw.githubusercontent, ${raw.length} chars)`)
              return raw
            }
            const ghContent = await fetch(`https://api.github.com/repos/${repo}/contents/${item.path}`)
              .then(async r => r.json() as Promise<{ content?: string }>)
              .then(d => (d.content ? atob(d.content) : null))
              .catch(() => null)
            if (ghContent !== null) {
              log(`Loaded ${item.path} (GitHub API, ${ghContent.length} chars)`)
              return ghContent
            }
            log(`Failed to load ${item.path}`)
            return null
          }}
          ref={ref}
          tree={tree}
        />
      </div>
    )
  }
export default Explorer
