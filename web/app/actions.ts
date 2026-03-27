/** biome-ignore-all lint/suspicious/useAwait: server actions must be async */
/* eslint-disable @typescript-eslint/require-await */
'use server'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
const root = resolve(process.cwd(), '..'),
  ignored = new Set([
    '.git',
    '.githooks',
    '.vercel',
    ...readFileSync(resolve(root, '.gitignore'), 'utf8')
      .split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('#'))
  ]),
  readFile = async (path: string): Promise<null | string> => {
    const full = resolve(root, path)
    if (!full.startsWith(root)) return null
    try {
      return readFileSync(full, 'utf8')
    } catch {
      return null
    }
  },
  readTree = async (): Promise<{ path: string; type: 'blob' | 'tree' }[]> => {
    const tree: { path: string; type: 'blob' | 'tree' }[] = [],
      walk = (dir: string, prefix: string) => {
        for (const name of readdirSync(dir).toSorted())
          if (!ignored.has(name)) {
            const full = resolve(dir, name),
              rel = prefix ? `${prefix}/${name}` : name
            if (statSync(full).isDirectory()) {
              tree.push({ path: rel, type: 'tree' })
              walk(full, rel)
            } else tree.push({ path: rel, type: 'blob' })
          }
      }
    walk(root, '')
    return tree
  }
export { readFile, readTree }
