/** biome-ignore-all lint/performance/noAwaitInLoops: sequential file reads */
/** biome-ignore-all lint/nursery/useNamedCaptureGroup: simple extraction */
/* eslint-disable no-console, no-await-in-loop, prefer-named-capture-group */
/* oxlint-disable no-await-in-loop */
import { file, write } from 'bun'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
const root = resolve(import.meta.dir, '..')
const outDir = resolve(root, 'web/public/r')
const read = async (path: string) => file(resolve(root, path)).text()
const pkg = JSON.parse(await read('package.json')) as { dependencies: Record<string, string> }
const src = await read('src/idecn.tsx')
const srcImports = new Set(
  src.match(/from '(?:[^.][^']*)'/gu)?.map(m => {
    const dep = m.slice(6, -1)
    return dep.startsWith('@') ? dep.split('/').slice(0, 2).join('/') : dep.split('/')[0]
  })
)
const deps = Object.keys(pkg.dependencies).filter(d => srcImports.has(d))
const uiImports = [...new Set(src.match(/from '\.\/ui\/([^']+)'/gu)?.map(m => m.slice(11, -1)))]
const uiFiles: { content: string; path: string; type: string }[] = []
const nestedRegistryDeps = new Set<string>()
for (const name of uiImports) {
  const uiSrc = await read(`src/ui/${name}.tsx`)
  const uiContent = uiSrc
    .replaceAll('../lib/utils', '@/lib/utils')
    .replaceAll(/"\.\/([^"]+)"/gu, '"@/components/ui/$1"')
    .replaceAll(/'\.\/([^']+)'/gu, "'@/components/ui/$1'")
  uiFiles.push({ content: uiContent, path: `components/ui/${name}.tsx`, type: 'registry:component' })
  const nested = uiSrc.match(/from ['"]\.\/([^'"]+)['"]/gu)?.map(m => m.slice(8, -1))
  if (nested) for (const n of nested) if (!uiImports.includes(n)) nestedRegistryDeps.add(n)
}
mkdirSync(outDir, { recursive: true })
let content = src
content = content
  .replace("import 'dockview-core/dist/styles/dockview.css'\n", '')
  .replaceAll('./_generated/icons', '@/lib/icons')
  .replaceAll('./monokai-lite', '@/lib/monokai-lite')
  .replaceAll('./lib/utils', '@/lib/utils')
  .replaceAll(/'.\/ui\/(?<name>[^']+)'/gu, "'@/components/ui/$<name>'")
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
