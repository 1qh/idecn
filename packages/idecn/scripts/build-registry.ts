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
const uiPkg = JSON.parse(await file(resolve(repoRoot, 'readonly/ui/package.json')).text()) as {
  dependencies: Record<string, string>
}
/** A vendored ui file carries its own npm deps (its package declares them, this one does not), so resolving an import against this package alone silently drops them and the consumer installs a component whose imports cannot resolve. */
const knownDeps = { ...uiPkg.dependencies, ...pkg.dependencies }
/** The consumer's own app already provides these; declaring them would fight their versions. */
const peerProvided = new Set(['next', 'react', 'react-dom'])
const src = await read('src/idecn.tsx')
const fileExtRe = /\.tsx?$/u
const workspaceLeakRe = /@a\/ui[^'"]*/gu
const aliasImportRe = /from\s+(?<q>['"])@\/(?<path>[^'"]+)\k<q>/gu
/** The npm package an import specifier resolves to — `@scope/pkg/deep` is `@scope/pkg`, `pkg/deep` is `pkg`. */
const packageOf = (specifier: string): string =>
  specifier.startsWith('@') ? specifier.split('/').slice(0, 2).join('/') : (specifier.split('/')[0] ?? specifier)
/** Every npm import in a source, either quote style. A pattern that excludes `@` cannot see a scoped package at all, so every `@scope/...` dep silently misses the manifest while the code that reads it looks correct — but `@/` is the consumer's own path alias, not a scope, and counting it as a package invents a dependency nothing can install. */
const externalPackages = (source: string): string[] =>
  [...source.matchAll(/from\s+(?<q>['"])(?<spec>[^.'"][^'"]*)\k<q>/gu)]
    .map(m => m.groups?.spec)
    .filter((s): s is string => s !== undefined && !s.startsWith('@/'))
    .map(packageOf)
const uiImports = [
  ...new Set(
    [...src.matchAll(/from\s+(?<q>['"])@a\/ui\/(?<name>[^'"]+)\k<q>/gu)]
      .map(m => m.groups?.name)
      .filter((n): n is string => n !== undefined)
  )
]
const uiFiles: { content: string; path: string; type: string }[] = []
const nestedRegistryDeps = new Set<string>()
const uiResults = await Promise.all(
  uiImports.map(async name => {
    const uiSrc = await readUi(`components/${name}.tsx`)
    return { name, uiSrc }
  })
)
/** `@a/ui` is workspace-private, so any import of it that survives into the registry is unresolvable in the consumer's app the moment they install. Every emitted file goes through this, never one path only: the main component and the vendored ui files both import it, and rewriting just one ships the other broken. Matches either quote style — the vendored files are double-quoted and the main component single-quoted, so a single-quote-only pattern silently rewrites nothing in half the tree. Longest prefix first: the bare `@a/ui/<name>` rule would otherwise turn `lib/utils` into `components/ui/lib/utils`. */
const rewriteWorkspaceAliases = (source: string): string =>
  source
    .replaceAll(/(?<q>['"])@a\/ui\/lib\/(?<name>[^'"]+)\k<q>/gu, "'@/lib/$<name>'")
    .replaceAll(/(?<q>['"])@a\/ui\/components\/(?<name>[^'"]+)\k<q>/gu, "'@/components/ui/$<name>'")
    .replaceAll(/(?<q>['"])@a\/ui\/(?<name>[^'"]+)\k<q>/gu, "'@/components/ui/$<name>'")
    .replaceAll(/(?<q>['"])@a\/ui\k<q>/gu, "'@/lib/utils'")
for (const { name, uiSrc } of uiResults) {
  const uiContent = rewriteWorkspaceAliases(
    uiSrc
      .replaceAll('../lib/utils', '@/lib/utils')
      .replaceAll(/"\.\/(?<path>[^"]+)"/gu, '"@/components/ui/$<path>"')
      .replaceAll(/'\.\/(?<path>[^']+)'/gu, "'@/components/ui/$<path>'")
  )
  uiFiles.push({ content: uiContent, path: `components/ui/${name}.tsx`, type: 'registry:component' })
  const nested = uiSrc.match(/from ['"]\.\/[^'"]+['"]/gu)?.map(m => m.slice(8, -1))
  if (nested) for (const n of nested) if (!uiImports.includes(n)) nestedRegistryDeps.add(n)
  for (const m of uiSrc.matchAll(/from\s+(?<q>['"])@a\/ui\/components\/(?<name>[^'"]+)\k<q>/gu)) {
    const dep = m.groups?.name
    if (dep !== undefined && !uiImports.includes(dep)) nestedRegistryDeps.add(dep)
  }
}
// oxlint-disable-next-line node/no-sync
mkdirSync(outDir, { recursive: true })
let content = src
content = rewriteWorkspaceAliases(
  content
    .replace("import 'dockview-core/dist/styles/dockview.css'\n", '')
    .replaceAll('./_generated/icons', '@/lib/icons')
    .replaceAll('./monokai-lite', '@/lib/monokai-lite')
    .replaceAll('./annotation-hosts', '@/lib/annotation-hosts')
)
/** Every sibling the main component imports has to be emitted; one that is rewritten to an alias but never shipped resolves to nothing in the consumer's app. */
const annotationHosts = rewriteWorkspaceAliases(await read('src/annotation-hosts.tsx'))
const icons = await read('src/_generated/icons.ts')
const monokai = await read('src/monokai-lite.ts')
/** Derived from what is actually emitted, never a hand-kept list: a dep reachable only from a vendored ui file or a sibling module is invisible to a scan of the main component alone. */
const deps = [
  ...new Set([content, annotationHosts, icons, monokai, ...uiFiles.map(f => f.content)].flatMap(externalPackages))
]
  .filter(dep => dep in knownDeps && !peerProvided.has(dep))
  .toSorted((a, b) => (a < b ? -1 : Number(a > b)))
const files = [
  {
    content,
    path: 'components/ui/idecn.tsx',
    type: 'registry:component'
  },
  {
    content: annotationHosts,
    path: 'lib/annotation-hosts.tsx',
    type: 'registry:lib'
  },
  {
    content: icons,
    path: 'lib/icons.ts',
    type: 'registry:lib'
  },
  {
    content: monokai,
    path: 'lib/monokai-lite.ts',
    type: 'registry:lib'
  },
  ...uiFiles
]
/** Refuses to emit a registry a consumer cannot build. Every rule here is a way this artifact has silently shipped broken: an import rewrite that no-ops (a pattern matching the wrong quote style) leaves a workspace-private path, a dep scan that misses a source leaves an import nothing installs, and a sibling module that is aliased but never emitted resolves to nothing. Each failure mode is invisible in the JSON and only surfaces in someone else's `next build`, so the generator asserts rather than trusting the transforms above. */
/** `shadcn init` writes `lib/utils.ts` (the `cn` helper) into every scaffold, so an import of it resolves in the consumer's app without this registry shipping or declaring it. */
const scaffoldProvided = new Set(['lib/utils'])
const emittedModules = new Set([...files.map(f => f.path.replace(fileExtRe, '')), ...scaffoldProvided])
const aliasImportsOf = (source: string): string[] =>
  [...source.matchAll(aliasImportRe)].map(m => m.groups?.path).filter((p): p is string => p !== undefined)
const problems = files.flatMap(f => [
  ...(f.content.match(workspaceLeakRe) ?? []).map(spec => `${f.path}: workspace-private import survived — ${spec}`),
  ...aliasImportsOf(f.content)
    .filter(target => !(emittedModules.has(target) || nestedRegistryDeps.has(target.split('/').at(-1) ?? target)))
    .map(target => `${f.path}: imports @/${target}, which is neither emitted nor a declared registryDependency`),
  ...externalPackages(f.content)
    .filter(dep => !(deps.includes(dep) || peerProvided.has(dep)))
    .map(dep => `${f.path}: imports ${dep}, which no manifest declares — the consumer installs nothing for it`)
])
if (problems.length > 0) {
  const problemLines = [...new Set(problems)].map(p => `  - ${p}`).join('\n')
  throw new Error(`refusing to write a registry a consumer cannot build:\n${problemLines}`)
}
await write(
  resolve(outDir, 'idecn.json'),
  JSON.stringify(
    {
      $schema: 'https://ui.shadcn.com/schema/registry-item.json',
      dependencies: deps,
      description: 'Full IDE layout with file tree, tabbed editor, and async file loading.',
      files,
      name: 'idecn',
      registryDependencies: [...nestedRegistryDeps],
      title: 'idecn',
      type: 'registry:component'
    },
    null,
    2
  )
)
console.log(`Built r/idecn.json (${files.length} files, ${deps.length} deps, ${nestedRegistryDeps.size} nested deps)`)
