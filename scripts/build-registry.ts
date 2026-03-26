/** biome-ignore-all lint/style/noNonNullAssertion: build script */
/** biome-ignore-all lint/performance/noAwaitInLoops: sequential file reads */
/* eslint-disable no-await-in-loop, no-console */
import { file, write } from 'bun'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
interface RegistryFile {
  path: string
  target: string
  type: string
}
interface RegistryItem {
  dependencies?: string[]
  description: string
  files: RegistryFile[]
  name: string
  registryDependencies?: string[]
  title: string
  type: string
}
const root = resolve(import.meta.dir, '..'),
  registry = (await file(resolve(root, 'registry.json')).json()) as { items: RegistryItem[] },
  outDir = resolve(root, 'web/public/r'),
  rewriteImports = (content: string): string =>
    content
      .replaceAll("from './icon'", "from '@/components/ui/tree-icon'")
      .replaceAll("from './cn'", "from '@/lib/cn'")
      .replaceAll("from './tree'", "from '@/components/ui/tree'")
      .replaceAll("from './file-tree'", "from '@/components/ui/file-tree'")
      .replaceAll("from './panels'", "from '@/components/ui/workspace-panels'")
      .replaceAll("from './tab'", "from '@/components/ui/workspace-tab'")
      .replaceAll("from './_generated/icon-svgs.json'", "from '@/lib/icon-svgs.json'")
      .replaceAll("from './_generated/manifest.json'", "from '@/lib/icon-manifest.json'")
mkdirSync(outDir, { recursive: true })
for (const item of registry.items) {
  const files: { content: string; path: string; type: string }[] = []
  for (const f of item.files) {
    let content = await file(resolve(root, f.path)).text()
    if (f.path.endsWith('.tsx') || f.path.endsWith('.ts')) content = rewriteImports(content)
    files.push({ content, path: f.target, type: f.type })
  }
  await write(
    resolve(outDir, `${item.name}.json`),
    JSON.stringify(
      {
        $schema: 'https://ui.shadcn.com/schema/registry-item.json',
        dependencies: item.dependencies ?? [],
        description: item.description,
        files,
        name: item.name,
        registryDependencies: item.registryDependencies ?? [],
        title: item.title,
        type: item.type
      },
      null,
      2
    )
  )
  console.log(`Built r/${item.name}.json`)
}
