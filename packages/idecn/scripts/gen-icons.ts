/* eslint-disable no-console */
import { generateManifest } from 'material-icon-theme'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
const manifest = generateManifest()
const iconsDir = resolve(import.meta.resolve('material-icon-theme').replace('file://', ''), '../../../icons')
const usedIcons = new Set<string>(
  [
    manifest.file ?? '',
    manifest.folder ?? '',
    manifest.folderExpanded ?? '',
    manifest.rootFolder ?? '',
    manifest.rootFolderExpanded ?? '',
    ...Object.values(manifest.folderNames ?? {}),
    ...Object.values(manifest.folderNamesExpanded ?? {}),
    ...Object.values(manifest.fileExtensions ?? {}),
    ...Object.values(manifest.fileNames ?? {}),
    ...Object.values(manifest.languageIds ?? {})
  ].filter(Boolean)
)
const svgMap: Record<string, string> = {}
for (const name of usedIcons)
  try {
    svgMap[name] = readFileSync(resolve(iconsDir, `${name}.svg`), 'utf8')
  } catch {
    /* Icon file not found */
  }
const outDir = resolve(import.meta.dir, '../src/_generated')
mkdirSync(outDir, { recursive: true })
const data = JSON.stringify({
  manifest: {
    file: manifest.file,
    fileExtensions: manifest.fileExtensions,
    fileNames: manifest.fileNames,
    folder: manifest.folder,
    folderExpanded: manifest.folderExpanded,
    folderNames: manifest.folderNames,
    folderNamesExpanded: manifest.folderNamesExpanded,
    languageIds: manifest.languageIds
  },
  svgs: svgMap
})
writeFileSync(resolve(outDir, 'icons.ts'), `const icons = ${data}\nexport { icons }\n`)
console.log(
  `Generated ${Object.keys(svgMap).length} icon SVGs, manifest with ${Object.keys(manifest.folderNames as object).length} folder mappings`
)
