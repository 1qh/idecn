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
/** Only a 404 means the package is genuinely not on npm; every other npm failure is the registry declining to answer. */
const notFoundRe = /E404|404 Not Found/u
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
  if (view.exitCode !== 0 && !notFoundRe.test(view.stderr.toString()))
    throw new Error(
      `npm view ${pkg.name} failed, so whether it needs publishing is unknown: ${view.stderr.toString().trim()}`
    )
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
const onNpm = resolved.filter(t => t.onNpm)
if (onNpm.length === 0) {
  console.log('no publishable package on npm (new packages are published manually once, then auto-release takes over)')
  process.exit(0)
}
const toPublish = onNpm.filter(t => !t.published)
if (toPublish.length === 0) {
  console.log(`already published: ${onNpm.map(t => `${t.name}@${t.version}`).join(', ')}`)
  process.exit(0)
}
const publishOne = async (t: Target): Promise<Target & { ok: boolean }> => {
  const pub = await $`bun publish --access public`.cwd(t.dir).nothrow()
  if (pub.exitCode === 0) return { ...t, ok: true }
  const recheck = await $`npm view ${t.name}@${t.version} version`.quiet().nothrow()
  return { ...t, ok: recheck.exitCode === 0 && recheck.stdout.toString().trim().length > 0 }
}
const results = await Promise.all(toPublish.map(publishOne))
const failed = results.filter(r => !r.ok)
if (failed.length > 0) {
  console.error(`publish failed: ${failed.map(f => `${f.name}@${f.version}`).join(', ')}`)
  process.exit(1)
}
const first = results[0]
const tag = `v${first?.version ?? '0.0.0'}`
const tagged = await $`git tag ${tag}`.nothrow()
const pushed = tagged.exitCode === 0 ? await $`git push origin ${tag}`.nothrow() : tagged
const released =
  pushed.exitCode === 0 ? await $`gh release create ${tag} --title ${tag} --generate-notes`.nothrow() : pushed
if (released.exitCode !== 0) {
  console.error(
    `published ${results.map(r => `${r.name}@${r.version}`).join(', ')} but ${tag} did not land: ${released.stderr.toString().trim()}`
  )
  process.exit(1)
}
const remoteTags = (await $`git ls-remote --tags origin`.quiet().nothrow()).stdout
  .toString()
  .split('\n')
  .map(line => line.split('/').at(-1) ?? '')
  .filter(t => t && t !== tag && !t.endsWith('^{}'))
await Promise.all(
  [...new Set(remoteTags)].map(async t => {
    await $`gh release delete ${t} --yes --cleanup-tag`.nothrow()
    await $`git push origin :refs/tags/${t}`.nothrow()
  })
)
console.log(`released: ${results.map(r => `${r.name}@${r.version}`).join(', ')}`)
