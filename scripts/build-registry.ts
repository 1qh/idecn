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
    /^import.*from '\.\/(icon|tree|file-tree|tab|panels|workspace)'.*/gmu,
    /^import.*from '\.\/_generated\/.*'.*/gmu
  ],
  CN_IMPORT = /^import.*from '\.\/cn'.*/gmu,
  ICON_IMPORT = `import svgData from '@/lib/icon-svgs.json' with { type: 'json' }\nimport manifestData from '@/lib/icon-manifest.json' with { type: 'json' }\n`
mkdirSync(outDir, { recursive: true })
const parts: string[] = [ICON_IMPORT]
for (const path of SRC) {
  let content = await read(path)
  for (const re of INTERNAL_IMPORTS) content = content.replaceAll(re, '')
  content = content.replaceAll(CN_IMPORT, "import { cn } from '@/lib/utils'")
  content = content
    .replaceAll(/^\/\*.*?\*\/\s*\n/gmu, '')
    .replaceAll(/^'use client'\s*\n/gmu, '')
    .replaceAll(/^export\s+(type\s+)?\{[^}]+\}\s*\n/gmu, '')
    .trim()
  if (content) parts.push(content)
}
const merged = `'use client'\n${parts.join('\n')}\nexport { FileTree, findPath, FileIcon, FolderIcon, getIconSvg, Tree, TreeFile, TreeFolder, Tab, Workspace }\nexport type { FileTreeProps, TreeDataItem, TabProps, WorkspaceProps, WorkspaceRef }\n`
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
