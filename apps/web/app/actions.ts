/** biome-ignore-all lint/suspicious/useAwait: server actions must be async */
'use server'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { DEFAULT_REPO } from './constants'
const root = resolve(process.cwd(), '..')
const gitignore = (() => {
  try {
    return readFileSync(resolve(root, '.gitignore'), 'utf8')
  } catch {
    return ''
  }
})()
const ignored = new Set([
  '.git',
  '.githooks',
  '.vercel',
  ...gitignore
    .split('\n')
    .map(l => l.trim())
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
const fetchTree = async (repo: string): Promise<TreeItem[]> => {
  if (repo === DEFAULT_REPO) {
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
const fetchFile = async (repo: string, path: string): Promise<null | string> => {
  const ext = path.split('.').at(-1)?.toLowerCase() ?? ''
  if (repo === DEFAULT_REPO) {
    const full = resolve(root, path)
    if (!full.startsWith(root)) return null
    try {
      if (IMAGE_EXTS.has(ext)) {
        const buf = readFileSync(full)
        return `data:${MIME[ext] ?? 'application/octet-stream'};base64,${buf.toString('base64')}`
      }
      return readFileSync(full, 'utf8')
    } catch {
      return null
    }
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
export { fetchFile, fetchTree }
