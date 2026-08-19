#!/usr/bin/env bun
/** biome-ignore-all lint/performance/noAwaitInLoops: npm calls are serialised to avoid concurrent manifest-write 422s */
/* eslint-disable no-console */
import { $, file } from 'bun'
import { join } from 'node:path'

const toVersionList = (parsed: unknown): string[] => {
  if (Array.isArray(parsed)) return parsed.filter((v): v is string => typeof v === 'string')
  if (typeof parsed === 'string') return [parsed]
  return []
}
const readPkg = async (path: string): Promise<{ name?: string; version?: string }> => {
  const parsed: unknown = await file(path).json()
  return typeof parsed === 'object' && parsed !== null ? parsed : {}
}
const pkgPath = join(process.cwd(), 'package.json')
const pkg = await readPkg(pkgPath)
if (!(pkg.name && pkg.version)) {
  console.error('package.json missing name or version')
  process.exit(1)
}
/** Only a 404 means the package is genuinely absent; every other npm failure is the registry declining to answer. */
const notFoundRe = /E404|404 Not Found/u
const view = await $`npm view ${pkg.name} versions --json`.quiet().nothrow()
if (view.exitCode !== 0 && !notFoundRe.test(view.stderr.toString())) {
  console.error(`npm view ${pkg.name} failed, so its old versions are unknown: ${view.stderr.toString().trim()}`)
  process.exit(1)
}
if (view.exitCode !== 0) {
  console.log(`${pkg.name}: first publish, nothing to clean`)
  process.exit(0)
}
const allVersions = toVersionList(JSON.parse(view.stdout.toString()))
const old = allVersions.filter(v => v !== pkg.version)
if (old.length === 0) {
  console.log(`${pkg.name}: no old versions`)
  process.exit(0)
}
const retained: string[] = []
for (const v of old) {
  // eslint-disable-next-line no-await-in-loop -- sequential to avoid concurrent npm manifest-write 422s
  const un = await $`npm unpublish ${pkg.name}@${v}`.nothrow()
  if (un.exitCode === 0) console.log(`${pkg.name}@${v} unpublished`)
  else {
    // eslint-disable-next-line no-await-in-loop -- sequential to avoid concurrent npm manifest-write 422s
    const dep = await $`npm deprecate ${pkg.name}@${v} ${'superseded by latest'}`.nothrow()
    if (dep.exitCode === 0) console.log(`${pkg.name}@${v} deprecated`)
    else retained.push(v)
  }
}
if (retained.length > 0) console.log(`${pkg.name}: retained by npm policy (past unpublish window): ${retained.join(', ')}`)
