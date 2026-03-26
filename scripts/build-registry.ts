/** biome-ignore-all lint/style/noNonNullAssertion: build script */
/** biome-ignore-all lint/performance/noAwaitInLoops: sequential file reads */
/* eslint-disable no-await-in-loop, no-console */
import { file, write } from 'bun'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
const root = resolve(import.meta.dir, '..'),
  outDir = resolve(root, 'web/public/r'),
  read = async (path: string) => file(resolve(root, path)).text(),
  SRC = ['src/icon.tsx', 'src/tree.tsx', 'src/file-tree.tsx', 'src/tab.ts', 'src/panels.tsx', 'src/workspace.tsx'],
  INTERNAL_IMPORTS = [
    /^import.*from '\.\/(cn|icon|tree|file-tree|tab|panels|workspace)'.*/gmu,
    /^import.*from '\.\/_generated\/.*'.*/gmu
  ],
  CN_IMPORT = /^import.*from '\.\/cn'.*/gmu,
  IMPORT_RE = /^import\s.+$/gmu,
  SKIP_LINE = /^(\/\*.*?\*\/|'use client'|export\s+(type\s+)?\{[^}]+\})\s*$/gmu
mkdirSync(outDir, { recursive: true })
const rawImports: string[] = [],
  codeBlocks: string[] = []
rawImports.push("import svgData from '@/lib/icon-svgs.json' with { type: 'json' }")
rawImports.push("import manifestData from '@/lib/icon-manifest.json' with { type: 'json' }")
for (const path of SRC) {
  let content = await read(path)
  content = content.replaceAll(CN_IMPORT, "import { cn } from '@/lib/utils'")
  for (const re of INTERNAL_IMPORTS) content = content.replaceAll(re, '')
  const lines = content.split('\n'),
    code: string[] = []
  for (const line of lines) {
    if (SKIP_LINE.test(line)) {
      SKIP_LINE.lastIndex = 0
      continue
    }
    if (IMPORT_RE.test(line)) {
      IMPORT_RE.lastIndex = 0
      rawImports.push(line)
    } else code.push(line)
  }
  const block = code.join('\n').trim()
  if (block) codeBlocks.push(block)
}
const seen = new Set<string>(),
  mergedImports: string[] = [],
  moduleImports = new Map<string, { names: Set<string>; types: Set<string> }>()
for (const line of rawImports) {
  if (line.includes(' with ')) {
    if (!seen.has(line)) {
      seen.add(line)
      mergedImports.push(line)
    }
    continue
  }
  const fromMatch = /from\s+'([^']+)'/u.exec(line)
  if (!fromMatch) continue
  const mod = fromMatch[1],
    isType = /^import\s+type\s/u.test(line),
    namesMatch = /\{\s*([^}]+)\s*\}/u.exec(line)
  if (!moduleImports.has(mod)) moduleImports.set(mod, { names: new Set(), types: new Set() })
  const entry = moduleImports.get(mod)!
  if (namesMatch)
    for (const n of namesMatch[1]
      .split(',')
      .map(s => s.trim())
      .filter(Boolean))
      if (isType) entry.types.add(n)
      else entry.names.add(n)
  else {
    const defMatch = /import\s+(\w+)\s+from/u.exec(line)
    if (defMatch) entry.names.add(`default:${defMatch[1]}`)
  }
}
for (const [mod, { names, types }] of moduleImports) {
  const defItem = [...names].find(n => n.startsWith('default:')),
    named = [...names].filter(n => !n.startsWith('default:')),
    allNamed = [...named, ...(types.size > 0 ? [...types].map(t => `type ${t}`) : [])],
    def = defItem ? defItem.slice(8) : ''
  if (def && allNamed.length > 0) mergedImports.push(`import ${def}, { ${allNamed.join(', ')} } from '${mod}'`)
  else if (def) mergedImports.push(`import ${def} from '${mod}'`)
  else if (allNamed.length > 0) mergedImports.push(`import { ${allNamed.join(', ')} } from '${mod}'`)
}
const merged = [
  "'use client'",
  ...mergedImports,
  '',
  ...codeBlocks,
  '',
  'export { FileTree, findPath, FileIcon, FolderIcon, getIconSvg, Tree, TreeFile, TreeFolder, Tab, Workspace }',
  'export type { FileTreeProps, TreeDataItem, TabProps, WorkspaceProps, WorkspaceRef }',
  ''
].join('\n')
await write(
  resolve(outDir, 'idecn.json'),
  JSON.stringify(
    {
      $schema: 'https://ui.shadcn.com/schema/registry-item.json',
      dependencies: [
        '@base-ui/react',
        '@monaco-editor/react',
        'dockview-core',
        'dockview-react',
        'lucide-react',
        'next-themes',
        'react-resizable-panels'
      ],
      description: 'Full IDE layout with file tree, tabbed editor, and async file loading.',
      files: [
        { content: merged, path: 'components/ui/idecn.tsx', type: 'registry:component' },
        { content: await read('src/_generated/icon-svgs.json'), path: 'lib/icon-svgs.json', type: 'registry:lib' },
        { content: await read('src/_generated/manifest.json'), path: 'lib/icon-manifest.json', type: 'registry:lib' }
      ],
      name: 'idecn',
      registryDependencies: [],
      title: 'idecn',
      type: 'registry:component'
    },
    null,
    2
  )
)
console.log('Built r/idecn.json (3 files)')
