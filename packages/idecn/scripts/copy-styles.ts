import { copyFileSync } from 'node:fs'
// oxlint-disable-next-line node/no-sync
const src = Bun.resolveSync('dockview-react/dist/styles/dockview.css', process.cwd())
// oxlint-disable-next-line node/no-sync
copyFileSync(src, 'dist/idecn.css')
