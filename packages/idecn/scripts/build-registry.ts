/* eslint-disable no-console */
import { file, write } from 'bun'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dir, '..')
const repoRoot = resolve(root, '../..')
const outDir = resolve(repoRoot, 'apps/web/public/r')
const read = async (path: string) => file(resolve(root, path)).text()
const readUi = async (path: string) => file(resolve(repoRoot, 'readonly/ui/src', path)).text()
const pkg = JSON.parse(await read('package.json')) as { dependencies: Record<string, string> }
const src = await read('src/idecn.tsx')
const srcImports = new Set(
  src.match(/from '(?:[^.@][^']*)'/gu)?.map(m => {
    const dep = m.slice(6, -1)
    return dep.startsWith('@') ? dep.split('/').slice(0, 2).join('/') : dep.split('/')[0]
  })
)
const deps = Object.keys(pkg.dependencies).filter(d => srcImports.has(d))
const uiImports = [...new Set(src.match(/from '@a\/ui\/(?<name>[^']+)'/gu)?.map(m => m.slice(12, -1)))]
const uiFiles: { content: string; path: string; type: string }[] = []
const nestedRegistryDeps = new Set<string>()
const uiResults = await Promise.all(
  uiImports.map(async name => {
    const uiSrc = await readUi(`components/${name}.tsx`)
    return { name, uiSrc }
  })
)
for (const { name, uiSrc } of uiResults) {
  const uiContent = uiSrc
    .replaceAll('../lib/utils', '@/lib/utils')
    .replaceAll(/"\.\/(?<path>[^"]+)"/gu, '"@/components/ui/$<path>"')
    .replaceAll(/'\.\/(?<path>[^']+)'/gu, "'@/components/ui/$<path>'")
  uiFiles.push({ content: uiContent, path: `components/ui/${name}.tsx`, type: 'registry:component' })
  const nested = uiSrc.match(/from ['"]\.\/(?<path>[^'"]+)['"]/gu)?.map(m => m.slice(8, -1))
  if (nested) for (const n of nested) if (!uiImports.includes(n)) nestedRegistryDeps.add(n)
}
// oxlint-disable-next-line node/no-sync
mkdirSync(outDir, { recursive: true })
let content = src
content = content
  .replace("import 'dockview-core/dist/styles/dockview.css'\n", '')
  .replaceAll('./_generated/icons', '@/lib/icons')
  .replaceAll('./monokai-lite', '@/lib/monokai-lite')
  .replaceAll("from '@a/ui'", "from '@/lib/utils'")
  .replaceAll(/'@a\/ui\/(?<name>[^']+)'/gu, "'@/components/ui/$<name>'")
await write(
  resolve(outDir, 'idecn.json'),
  JSON.stringify(
    {
      $schema: 'https://ui.shadcn.com/schema/registry-item.json',
      dependencies: deps,
      description: 'Full IDE layout with file tree, tabbed editor, and async file loading.',
      files: [
        {
          content,
          path: 'components/ui/idecn.tsx',
          type: 'registry:component'
        },
        {
          content: await read('src/_generated/icons.ts'),
          path: 'lib/icons.ts',
          type: 'registry:lib'
        },
        {
          content: await read('src/monokai-lite.ts'),
          path: 'lib/monokai-lite.ts',
          type: 'registry:lib'
        },
        ...uiFiles
      ],
      name: 'idecn',
      registryDependencies: [...nestedRegistryDeps],
      title: 'idecn',
      type: 'registry:component'
    },
    null,
    2
  )
)
console.log(`Built r/idecn.json (${3 + uiFiles.length} files, ${nestedRegistryDeps.size} nested deps)`)
