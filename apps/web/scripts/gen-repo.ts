import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
const root = existsSync(resolve(process.cwd(), '.gitignore')) ? process.cwd() : resolve(process.cwd(), '../..')
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
    .map(l => (l.trim().endsWith('/') ? l.trim().slice(0, -1) : l.trim()))
    .filter(l => l && !l.startsWith('#'))
])
const files: Record<string, string> = {}
const walk = (dir: string, prefix: string) => {
  for (const name of readdirSync(dir).toSorted())
    if (!ignored.has(name)) {
      const full = resolve(dir, name)
      const rel = prefix ? `${prefix}/${name}` : name
      if (statSync(full).isDirectory()) walk(full, rel)
      else files[rel] = readFileSync(full).toString('base64')
    }
}
walk(root, '')
const outDir = resolve(process.cwd(), 'app/_generated')
mkdirSync(outDir, { recursive: true })
writeFileSync(resolve(outDir, 'repo.json'), JSON.stringify(files))
// eslint-disable-next-line no-console
console.log(`Generated ${String(Object.keys(files).length)} files`)
