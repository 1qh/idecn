/** biome-ignore-all lint/suspicious/useAwait: server actions must be async */
'use server'
import { downloadZip } from 'client-zip'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { DEFAULT_REPO } from './constants'
const findRoot = (): null | string => {
  const candidates = [process.cwd(), resolve(process.cwd(), '../..'), resolve(process.cwd(), '../../..')]
  for (const c of candidates) if (existsSync(resolve(c, '.gitignore'))) return c
  return null
}
const root = findRoot()
const bundledRepo = await (async (): Promise<Record<string, string>> => {
  try {
    const mod = (await import('./.cache/repo.json')) as { default: Record<string, string> }
    return mod.default
  } catch {
    return {}
  }
})()
const gitignore = root
  ? (() => {
      try {
        return readFileSync(resolve(root, '.gitignore'), 'utf8')
      } catch {
        return ''
      }
    })()
  : ''
const ignored = new Set([
  '.git',
  '.githooks',
  '.vercel',
  ...gitignore
    .split('\n')
    .map(l => (l.trim().endsWith('/') ? l.trim().slice(0, -1) : l.trim()))
    .filter(l => l && !l.startsWith('#'))
])
interface JsdelivrFile {
  files?: JsdelivrFile[]
  name: string
  type: 'directory' | 'file'
}
interface TreeItem {
  children?: TreeItem[]
  id: string
  name: string
  path: string
}
const jsdelivrToTree = (files: JsdelivrFile[], prefix = ''): TreeItem[] => {
  const items: TreeItem[] = []
  const sorted = [...files].toSorted((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1
    return a.name.localeCompare(b.name)
  })
  for (const f of sorted) {
    const path = prefix ? `${prefix}/${f.name}` : f.name
    const item: TreeItem = { id: path, name: f.name, path }
    if (f.type === 'directory' && f.files) item.children = jsdelivrToTree(f.files, path)
    items.push(item)
  }
  return items
}
const buildTreeFromPaths = (paths: string[]): TreeItem[] => {
  const items: TreeItem[] = []
  const dirs = new Map<string, TreeItem>()
  const allPaths = new Set<string>()
  for (const p of paths) {
    allPaths.add(p)
    const parts = p.split('/')
    for (let i = 1; i < parts.length; i += 1) allPaths.add(parts.slice(0, i).join('/'))
  }
  const sorted = [...allPaths].toSorted((a, b) => {
    const aIsDir = !paths.includes(a)
    const bIsDir = !paths.includes(b)
    if (aIsDir !== bIsDir) return aIsDir ? -1 : 1
    return a.localeCompare(b)
  })
  for (const p of sorted) {
    const parts = p.split('/')
    const name = parts.at(-1) ?? p
    const isDir = !paths.includes(p)
    const node: TreeItem = { id: p, name, path: p }
    if (isDir) {
      node.children = []
      dirs.set(p, node)
    }
    if (parts.length === 1) items.push(node)
    else dirs.get(parts.slice(0, -1).join('/'))?.children?.push(node)
  }
  return items
}
const fetchTree = async (repo: string): Promise<TreeItem[]> => {
  if (repo === DEFAULT_REPO) {
    if (root) {
      const tree: { path: string; type: 'blob' | 'tree' }[] = []
      const walk = (dir: string, prefix: string) => {
        for (const name of readdirSync(dir).toSorted())
          if (!ignored.has(name)) {
            const full = resolve(dir, name)
            const rel = prefix ? `${prefix}/${name}` : name
            if (statSync(full).isDirectory()) {
              tree.push({ path: rel, type: 'tree' })
              walk(full, rel)
            } else tree.push({ path: rel, type: 'blob' })
          }
      }
      walk(root, '')
      const items: TreeItem[] = []
      const dirs = new Map<string, TreeItem>()
      const sorted = [...tree].toSorted((a, b) => {
        if (a.type !== b.type) return a.type === 'tree' ? -1 : 1
        return a.path.localeCompare(b.path)
      })
      for (const t of sorted) {
        const parts = t.path.split('/')
        const name = parts.at(-1) ?? t.path
        const node: TreeItem = { id: t.path, name, path: t.path }
        if (t.type === 'tree') {
          node.children = []
          dirs.set(t.path, node)
        }
        if (parts.length === 1) items.push(node)
        else dirs.get(parts.slice(0, -1).join('/'))?.children?.push(node)
      }
      return items
    }
    return buildTreeFromPaths(Object.keys(bundledRepo))
  }
  const r = await fetch(`https://data.jsdelivr.com/v1/packages/gh/${repo}@main`)
  if (!r.ok) throw new Error(`jsdelivr: ${String(r.status)}`)
  const d = (await r.json()) as { files?: JsdelivrFile[] }
  return d.files ? jsdelivrToTree(d.files) : []
}
const IMAGE_EXTS = new Set(['apng', 'avif', 'bmp', 'gif', 'ico', 'jpeg', 'jpg', 'png', 'svg', 'webp'])
const MIME: Record<string, string> = {
  apng: 'image/apng',
  avif: 'image/avif',
  bmp: 'image/bmp',
  gif: 'image/gif',
  ico: 'image/x-icon',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  svg: 'image/svg+xml',
  webp: 'image/webp'
}
const readLocal = (path: string): Buffer | null => {
  if (root) {
    const full = resolve(root, path)
    if (!full.startsWith(root)) return null
    try {
      return readFileSync(full)
    } catch {
      return null
    }
  }
  const b64 = bundledRepo[path]
  return b64 ? Buffer.from(b64, 'base64') : null
}
const fetchFile = async (repo: string, path: string): Promise<null | string> => {
  const ext = path.split('.').at(-1)?.toLowerCase() ?? ''
  if (repo === DEFAULT_REPO) {
    const buf = readLocal(path)
    if (!buf) return null
    if (IMAGE_EXTS.has(ext)) return `data:${MIME[ext] ?? 'application/octet-stream'};base64,${buf.toString('base64')}`
    return buf.toString('utf8')
  }
  if (IMAGE_EXTS.has(ext)) {
    const r = await fetch(`https://raw.githubusercontent.com/${repo}/main/${path}`)
    if (!r.ok) return null
    const buf = Buffer.from(await r.arrayBuffer())
    return `data:${MIME[ext] ?? 'application/octet-stream'};base64,${buf.toString('base64')}`
  }
  const r = await fetch(`https://raw.githubusercontent.com/${repo}/main/${path}`)
  return r.ok ? r.text() : null
}
const downloadFile = async (repo: string, path: string): Promise<null | { base64: string; name: string }> => {
  if (repo === DEFAULT_REPO) {
    const buf = readLocal(path)
    if (!buf) return null
    return { base64: buf.toString('base64'), name: path.split('/').at(-1) ?? 'file' }
  }
  const r = await fetch(`https://raw.githubusercontent.com/${repo}/main/${path}`)
  if (!r.ok) return null
  const buf = Buffer.from(await r.arrayBuffer())
  return { base64: buf.toString('base64'), name: path.split('/').at(-1) ?? 'file' }
}
const collectLocalFiles = (prefix: string): { content: Buffer; path: string }[] => {
  const results: { content: Buffer; path: string }[] = []
  if (root) {
    const fullPrefix = resolve(root, prefix)
    const walk = (dir: string, rel: string) => {
      for (const name of readdirSync(dir).toSorted())
        if (!ignored.has(name)) {
          const full = resolve(dir, name)
          const r = rel ? `${rel}/${name}` : name
          if (statSync(full).isDirectory()) walk(full, r)
          else results.push({ content: readFileSync(full), path: r })
        }
    }
    walk(fullPrefix, '')
    return results
  }
  const normalizedPrefix = prefix ? `${prefix}/` : ''
  for (const [p, b64] of Object.entries(bundledRepo))
    if (p.startsWith(normalizedPrefix))
      results.push({ content: Buffer.from(b64, 'base64'), path: p.slice(normalizedPrefix.length) })
  return results
}
const downloadFolder = async (repo: string, path: string): Promise<null | { base64: string; name: string }> => {
  if (repo === DEFAULT_REPO)
    try {
      const folderName = path.split('/').at(-1) ?? 'folder'
      const entries = collectLocalFiles(path).map(f => ({ input: new Uint8Array(f.content), name: f.path }))
      if (entries.length === 0) return null
      const buf = Buffer.from(await downloadZip(entries).arrayBuffer())
      return { base64: buf.toString('base64'), name: folderName }
    } catch {
      return null
    }
  return null
}
export { downloadFile, downloadFolder, fetchFile, fetchTree }
