/* eslint-disable no-console */
import { write } from 'bun'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
const root = resolve(import.meta.dir, '..'),
  gitignore = readFileSync(resolve(root, '.gitignore'), 'utf8'),
  ignored = new Set([
    '.git',
    '.githooks',
    '.vercel',
    ...gitignore
      .split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('#'))
  ]),
  tree: { path: string; type: 'blob' | 'tree' }[] = [],
  walk = (dir: string, prefix: string) => {
    const entries = readdirSync(dir).toSorted()
    for (const name of entries)
      if (!ignored.has(name)) {
        const fullPath = resolve(dir, name),
          relPath = prefix ? `${prefix}/${name}` : name,
          stat = statSync(fullPath)
        if (stat.isDirectory()) {
          tree.push({ path: relPath, type: 'tree' })
          walk(fullPath, relPath)
        } else tree.push({ path: relPath, type: 'blob' })
      }
  }
walk(root, '')
const items = tree.map(t => `  { path: '${t.path}', type: '${t.type}' as const }`).join(',\n')
await write(resolve(root, 'web/src/app/demo-tree.ts'), `const DEMO_TREE = [\n${items}\n]\nexport { DEMO_TREE }\n`)
console.log(`Generated demo-tree.ts: ${tree.length} entries`)
