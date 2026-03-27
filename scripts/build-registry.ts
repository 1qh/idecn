/* eslint-disable no-console */
import { file, write } from 'bun'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
const root = resolve(import.meta.dir, '..'),
  outDir = resolve(root, 'web/public/r'),
  read = async (path: string) => file(resolve(root, path)).text()
mkdirSync(outDir, { recursive: true })
let content = await read('src/idecn.tsx')
content = content
  .replaceAll("from './_generated/icons'", "from '@/lib/icons'")
  .replaceAll("'./monokai-lite'", "'@/lib/monokai-lite'")
await write(
  resolve(outDir, 'idecn.json'),
  JSON.stringify(
    {
      $schema: 'https://ui.shadcn.com/schema/registry-item.json',
      dependencies: [
        '@base-ui/react',
        '@monaco-editor/react',
        '@shikijs/monaco',
        'dockview-core',
        'dockview-react',
        'lucide-react',
        'react-resizable-panels',
        'shiki'
      ],
      description: 'Full IDE layout with file tree, tabbed editor, and async file loading.',
      files: [
        { content, path: 'components/ui/idecn.tsx', type: 'registry:component' },
        { content: await read('src/_generated/icons.ts'), path: 'lib/icons.ts', type: 'registry:lib' },
        { content: await read('src/monokai-lite.ts'), path: 'lib/monokai-lite.ts', type: 'registry:lib' }
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
