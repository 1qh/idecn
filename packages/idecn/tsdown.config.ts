import { defineConfig } from 'tsdown'

export default defineConfig({
  clean: true,
  copy: [{ from: '../../node_modules/dockview-core/dist/styles/dockview.css', to: 'dist' }],
  dts: true,
  entry: ['src/idecn.tsx'],
  format: 'esm',
  outDir: 'dist',
  platform: 'browser'
})
