#!/usr/bin/env bun
/* eslint-disable no-console */
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const pkgPath = join(process.cwd(), 'package.json')
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { name?: string; version?: string }
if (!(pkg.name && pkg.version)) {
  console.error('package.json missing name or version')
  process.exit(1)
}
const result = spawnSync('npm', ['view', pkg.name, 'versions', '--json'], { encoding: 'utf8' })
if (result.status !== 0) {
  console.log(`${pkg.name}: first publish, nothing to clean`)
  process.exit(0)
}
const versions = JSON.parse(result.stdout) as string | string[]
const allVersions = Array.isArray(versions) ? versions : [versions]
const old = allVersions.filter(v => v !== pkg.version)
if (old.length === 0) {
  console.log(`${pkg.name}: no old versions`)
  process.exit(0)
}
for (const v of old) {
  const r = spawnSync('npm', ['unpublish', `${pkg.name}@${v}`], { encoding: 'utf8', stdio: 'inherit' })
  if (r.status === 0) console.log(`${pkg.name}@${v} unpublished`)
}
