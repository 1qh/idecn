#!/usr/bin/env bun
/* eslint-disable no-console */
import { $, file } from 'bun'
import { join } from 'node:path'

const pkgPath = join(process.cwd(), 'package.json')
const pkg = (await file(pkgPath).json()) as { name?: string; version?: string }
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
const versions = JSON.parse(view.stdout.toString()) as string | string[]
const allVersions = Array.isArray(versions) ? versions : [versions]
const old = allVersions.filter(v => v !== pkg.version)
if (old.length === 0) {
  console.log(`${pkg.name}: no old versions`)
  process.exit(0)
}
const results = await Promise.all(
  old.map(async v => {
    const r = await $`npm unpublish ${pkg.name}@${v}`.nothrow()
    return { ok: r.exitCode === 0, v }
  })
)
for (const { ok, v } of results) if (ok) console.log(`${pkg.name}@${v} unpublished`)
const stuck = results.filter(r => !r.ok)
if (stuck.length > 0) {
  console.error(`${pkg.name}: still on npm after prune: ${stuck.map(s => s.v).join(', ')}`)
  process.exit(1)
}
