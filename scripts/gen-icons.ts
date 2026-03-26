/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, no-console */
import { generateManifest } from 'material-icon-theme'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
const manifest = generateManifest(),
  iconsDir = resolve(
    import.meta.dir,
    '../node_modules/.bun/material-icon-theme@5.32.0/node_modules/material-icon-theme/icons'
  ),
  usedIcons = new Set<string>([
    manifest.file as string,
    manifest.folder as string,
    manifest.folderExpanded as string,
    manifest.rootFolder as string,
    manifest.rootFolderExpanded as string,
    ...Object.values(manifest.folderNames as Record<string, string>),
    ...Object.values(manifest.folderNamesExpanded as Record<string, string>),
    ...Object.values(manifest.fileExtensions as Record<string, string>),
    ...Object.values(manifest.fileNames as Record<string, string>)
  ]),
  svgMap: Record<string, string> = {}
for (const name of usedIcons)
  try {
    svgMap[name] = readFileSync(resolve(iconsDir, `${name}.svg`), 'utf8')
  } catch {
    /* Icon file not found */
  }
const outDir = resolve(import.meta.dir, '../packages/nicetree/src/_generated')
mkdirSync(outDir, { recursive: true })
writeFileSync(resolve(outDir, 'icon-svgs.json'), JSON.stringify(svgMap))
writeFileSync(
  resolve(outDir, 'manifest.json'),
  JSON.stringify({
    file: manifest.file,
    fileExtensions: manifest.fileExtensions,
    fileNames: manifest.fileNames,
    folder: manifest.folder,
    folderExpanded: manifest.folderExpanded,
    folderNames: manifest.folderNames,
    folderNamesExpanded: manifest.folderNamesExpanded
  })
)
console.log(
  `Generated ${Object.keys(svgMap).length} icon SVGs, manifest with ${Object.keys(manifest.folderNames as object).length} folder mappings`
)
