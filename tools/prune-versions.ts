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
const view = await $`npm view ${pkg.name} versions --json`.quiet().nothrow()
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
