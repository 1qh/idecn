/** biome-ignore-all lint/nursery/noNestedPromises: server action fallback to client fetch */
/* eslint-disable @eslint-react/hooks-extra/no-direct-set-state-in-use-effect */
/* oxlint-disable promise/prefer-await-to-then, promise/always-return, promise/catch-or-return, promise/no-nesting */
'use client'
import type { FileActions, TreeDataItem, VirtualFile, WorkspaceRef } from 'idecn'
import { SiGithub } from '@icons-pack/react-simple-icons'
import { Workspace } from 'idecn'
import { AlertTriangle, Moon, PanelLeft, Search, Sun, X } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { downloadFile, downloadFolder, fetchFile, fetchTree } from './actions'
import { DEFAULT_FILES, DEFAULT_REPO, EXPAND_EXCLUDE } from './constants'
const triggerDownload = (base64: string, filename: string) => {
  const bytes = Uint8Array.from(atob(base64), c => c.codePointAt(0) ?? 0)
  const blob = new Blob([bytes])
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
const markMutable = (items: TreeDataItem[]): TreeDataItem[] =>
  items.map(item => ({
    ...item,
    children: item.children ? markMutable(item.children) : undefined,
    mutable: true
  }))
const Explorer = ({ tree: initialTree }: { tree: TreeDataItem[] }) => {
  const [repo, setRepo] = useState(DEFAULT_REPO)
  const [tree, setTree] = useState(initialTree)
  const [error, setError] = useState<null | string>(null)
  const [input, setInput] = useState('')
  const [mounted, setMounted] = useState(false)
  const [activity, setActivity] = useState('')
  const { resolvedTheme, setTheme } = useTheme()
  const ref = useRef<WorkspaceRef>(null)
  const log = useCallback((msg: string) => setActivity(prev => `${prev}[${new Date().toLocaleTimeString()}] ${msg}\n`), [])
  const files = useMemo(
    (): VirtualFile[] => [{ content: activity, language: 'log', name: 'Activity', open: true, pin: 'bottom' }],
    [activity]
  )
  /** biome-ignore lint/correctness/useExhaustiveDependencies: mount only */
  useEffect(() => {
    setMounted(true)
    log(`Loaded ${DEFAULT_REPO} with ${initialTree.length} root items`)
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
                const items: TreeDataItem[] = []
                const dirs = new Map<string, TreeDataItem>()
                for (const t of d.tree.toSorted((a, b) => {
                  if (a.type !== b.type) return a.type === 'tree' ? -1 : 1
                  return a.path.localeCompare(b.path)
                })) {
                  const parts = t.path.split('/')
                  const name = parts.at(-1) ?? t.path
                  const node: TreeDataItem = { id: t.path, name, path: t.path }
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
  const demoActions: FileActions = useMemo(
    () => ({
      onCreateFile: (parentPath, name) => {
        toast(`Demo: would create file "${name}" in ${parentPath || '/'}`)
        log(`Create file: ${parentPath}/${name}`)
      },
      onCreateFolder: (parentPath, name) => {
        toast(`Demo: would create folder "${name}" in ${parentPath || '/'}`)
        log(`Create folder: ${parentPath}/${name}`)
      },
      onDelete: paths => {
        toast(`Demo: would delete ${String(paths.length)} item(s)`)
        log(`Delete: ${paths.join(', ')}`)
      },
      onDownload: async path => {
        log(`Download: ${path}`)
        const file = await downloadFile(repo, path).catch(() => null)
        if (file) {
          triggerDownload(file.base64, file.name)
          toast(`Downloaded ${file.name}`)
          log(`Downloaded file: ${file.name}`)
          return
        }
        const folder = await downloadFolder(repo, path).catch(() => null)
        if (folder) {
          triggerDownload(folder.base64, `${folder.name}.tar.gz`)
          toast(`Downloaded ${folder.name}.tar.gz`)
          log(`Downloaded folder: ${folder.name}.tar.gz`)
          return
        }
        toast.error(`Failed to download "${path}"`)
      },
      onRename: (path, newName) => {
        toast(`Demo: would rename "${path}" to "${newName}"`)
        log(`Rename: ${path} → ${newName}`)
      },
      onUpload: (parentPath, fileList) => {
        toast(`Demo: would upload ${String(fileList.length)} file(s) to ${parentPath || '/'}`)
        log(`Upload: ${String(fileList.length)} files to ${parentPath || '/'}`)
      }
    }),
    [log, repo]
  )
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
          className='-mr-2 stroke-1 size-8 shrink-0 p-2 hover:p-1.5 hover:cursor-pointer hover:bg-accent flex items-center justify-center'
          href={`https://github.com/${DEFAULT_REPO}`}
          rel='noopener noreferrer'
          target='_blank'>
          <SiGithub className='mb-0.5 size-full' />
        </a>
        <button
          className='stroke-1 size-8 shrink-0 p-1.5 hover:p-1 hover:cursor-pointer hover:bg-accent'
          onClick={() => {
            const next = mounted && resolvedTheme === 'dark' ? 'light' : 'dark'
            setTheme(next)
            log(`Theme: ${next}`)
          }}
          type='button'>
          {mounted && resolvedTheme === 'dark' ? (
            <Sun className='size-full stroke-1' />
          ) : (
            <Moon className='size-full stroke-1' />
          )}
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
        fileActions={demoActions}
        files={files}
        initialFiles={DEFAULT_FILES}
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
        tree={markMutable(tree)}
      />
    </div>
  )
}
export default Explorer
