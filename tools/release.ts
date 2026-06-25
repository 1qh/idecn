#!/usr/bin/env bun
/* eslint-disable no-console */
import { $, file, Glob } from 'bun'
import { dirname, join } from 'node:path'

interface Pkg {
  name?: string
  private?: boolean
  version?: string
  workspaces?: string[]
}
interface Target {
  dir: string
  name: string
  onNpm: boolean
  published: boolean
  version: string
}
const root = process.cwd()
const rootPkg = (await file(join(root, 'package.json'))
  .json()
  .catch(() => ({}))) as Pkg
const globs = rootPkg.workspaces ?? ['packages/*']
const scanned = await Promise.all(
  globs.map(async g =>
    (await Array.fromAsync(new Glob(`${g}/package.json`).scan({ cwd: root }))).map(rel => join(root, rel))
  )
)
const rootCandidate = rootPkg.name ? [join(root, 'package.json')] : []
const paths = [...rootCandidate, ...scanned.flat()]
const pkgs = await Promise.all(
  paths.map(async path => ({
    path,
    pkg: (await file(path)
      .json()
      .catch(() => ({}))) as Pkg
  }))
)
const resolve = async (path: string, pkg: Pkg): Promise<null | Target> => {
  if (!(pkg.name && pkg.version) || pkg.private) return null
  const view = await $`npm view ${pkg.name} versions --json`.quiet().nothrow()
  const versions = view.exitCode === 0 ? (JSON.parse(view.stdout.toString().trim() || '[]') as string | string[]) : []
  const all = Array.isArray(versions) ? versions : [versions]
  return {
    dir: dirname(path),
    name: pkg.name,
    onNpm: view.exitCode === 0,
    published: all.includes(pkg.version),
    version: pkg.version
  }
}
const resolved = (await Promise.all(pkgs.map(async ({ path, pkg }) => resolve(path, pkg)))).filter(
  (t): t is Target => t !== null
)
const target = resolved.find(t => t.onNpm)
if (!target) {
  console.log('no publishable package on npm (new packages are published manually once, then auto-release takes over)')
  process.exit(0)
}
if (target.published) {
  console.log(`${target.name}@${target.version} already published`)
  process.exit(0)
}
const pub = await $`bun publish --access public`.cwd(target.dir).nothrow()
if (pub.exitCode !== 0) {
  console.error(`publish failed for ${target.name}@${target.version}`)
  process.exit(1)
}
const tag = `v${target.version}`
await $`git tag ${tag}`.nothrow()
await $`git push origin ${tag}`.nothrow()
await $`gh release create ${tag} --title ${tag} --generate-notes`.nothrow()
console.log(`released ${target.name}@${target.version}`)
