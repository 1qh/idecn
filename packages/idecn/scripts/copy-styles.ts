import { copyFileSync } from 'node:fs'

const src = Bun.resolveSync('dockview-core/dist/styles/dockview.css', process.cwd())
copyFileSync(src, 'dist/idecn.css')
