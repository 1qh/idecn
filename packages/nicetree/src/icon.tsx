/** biome-ignore-all lint/security/noDangerouslySetInnerHtml: trusted SVG from material-icon-theme */
/* eslint-disable @eslint-react/dom/no-dangerously-set-innerhtml, react/no-danger */
import svgData from './_generated/icon-svgs.json' with { type: 'json' }
/* oxlint-disable react-perf/jsx-no-new-object-as-prop */
import manifestData from './_generated/manifest.json' with { type: 'json' }
const manifest = manifestData as {
    file: string
    fileExtensions: Record<string, string>
    fileNames: Record<string, string>
    folder: string
    folderExpanded: string
    folderNames: Record<string, string>
    folderNamesExpanded: Record<string, string>
  },
  svgs = svgData as Record<string, string>,
  fallback = svgs[manifest.file] ?? '',
  getSvg = (name: string): string => svgs[name] ?? fallback,
  resolveFileIcon = (filename: string): string => {
    const lower = filename.toLowerCase()
    if (manifest.fileNames[lower]) return manifest.fileNames[lower]
    const ext = lower.includes('.') ? lower.slice(lower.indexOf('.') + 1) : ''
    if (ext && manifest.fileExtensions[ext]) return manifest.fileExtensions[ext]
    const lastExt = lower.split('.').at(-1) ?? ''
    if (lastExt && manifest.fileExtensions[lastExt]) return manifest.fileExtensions[lastExt]
    return manifest.file
  },
  resolveFolderIcon = (folderName: string, open: boolean): string => {
    const lower = folderName.toLowerCase()
    if (open) return manifest.folderNamesExpanded[lower] ?? manifest.folderExpanded
    return manifest.folderNames[lower] ?? manifest.folder
  },
  FileIcon = ({ name, className }: { className?: string; name: string }) => (
    <span className={className} dangerouslySetInnerHTML={{ __html: getSvg(resolveFileIcon(name)) }} />
  ),
  FolderIcon = ({ className, name, open }: { className?: string; name: string; open?: boolean }) => (
    <span className={className} dangerouslySetInnerHTML={{ __html: getSvg(resolveFolderIcon(name, open ?? false)) }} />
  )
export { FileIcon, FolderIcon }
