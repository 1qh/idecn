/* eslint-disable no-console */
import { file, write } from 'bun'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
const root = resolve(import.meta.dir, '..'),
  outDir = resolve(root, 'web/public/r'),
  read = async (path: string) => file(resolve(root, path)).text(),
  pkg = JSON.parse(await read('package.json')) as { dependencies: Record<string, string> },
  src = await read('src/idecn.tsx'),
  srcImports = new Set(
    src.match(/from '(?:[^.][^']*)'/gu)?.map(m => {
      const dep = m.slice(6, -1)
      return dep.startsWith('@') ? dep.split('/').slice(0, 2).join('/') : dep.split('/')[0]
    })
  ),
  deps = Object.keys(pkg.dependencies).filter(d => srcImports.has(d))
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
        }
      ],
      name: 'idecn',
      registryDependencies: [...new Set(src.match(/from '\.\/ui\/(?:[^']+)'/gu)?.map(m => m.slice(10, -1)))],
      title: 'idecn',
      type: 'registry:component'
    },
    null,
    2
  )
)
console.log('Built r/idecn.json (3 files)')
