import { downloadZip } from 'client-zip'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import bundled from '../../.cache/repo.json' with { type: 'json' }
const bundledRepo = bundled as Record<string, string>
const findRoot = (): null | string => {
  const candidates = [process.cwd(), resolve(process.cwd(), '../..'), resolve(process.cwd(), '../../..')]
  for (const c of candidates) if (existsSync(resolve(c, '.gitignore'))) return c
  return null
}
const root = findRoot()
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
const collectLocalFiles = (prefix: string): { content: Uint8Array; path: string }[] => {
  const results: { content: Uint8Array; path: string }[] = []
  if (root) {
    const fullPrefix = resolve(root, prefix)
    const walk = (dir: string, rel: string) => {
      for (const name of readdirSync(dir).toSorted())
        if (!ignored.has(name)) {
          const full = resolve(dir, name)
          const r = rel ? `${rel}/${name}` : name
          if (statSync(full).isDirectory()) walk(full, r)
          else results.push({ content: new Uint8Array(readFileSync(full)), path: r })
        }
    }
    walk(fullPrefix, '')
    return results
  }
  const normalizedPrefix = prefix ? `${prefix}/` : ''
  for (const [p, b64] of Object.entries(bundledRepo))
    if (p.startsWith(normalizedPrefix))
      results.push({ content: new Uint8Array(Buffer.from(b64, 'base64')), path: p.slice(normalizedPrefix.length) })
  return results
}
const readFile = (path: string): null | Uint8Array => {
  if (root) {
    const full = resolve(root, path)
    if (!full.startsWith(root)) return null
    try {
      return new Uint8Array(readFileSync(full))
    } catch {
      return null
    }
  }
  const b64 = bundledRepo[path]
  return b64 ? new Uint8Array(Buffer.from(b64, 'base64')) : null
}
const GET = (req: Request): Response => {
  const url = new URL(req.url)
  const path = url.searchParams.get('path') ?? ''
  const name = path.split('/').at(-1) ?? 'download'
  const buf = readFile(path)
  if (buf)
    return new Response(new Blob([buf as BlobPart]), {
      headers: {
        'content-disposition': `attachment; filename="${name}"`,
        'content-type': 'application/octet-stream'
      }
    })
  const entries = collectLocalFiles(path).map(f => ({ input: f.content, name: f.path }))
  if (entries.length === 0) return new Response('Not found', { status: 404 })
  return new Response(downloadZip(entries).body, {
    headers: {
      'content-disposition': `attachment; filename="${name}.zip"`,
      'content-type': 'application/zip'
    }
  })
}
export { GET }
