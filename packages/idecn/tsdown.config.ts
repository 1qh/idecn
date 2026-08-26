import { defineConfig } from 'tsdown'

export default defineConfig({
  clean: true,
  copy: [{ from: '../../node_modules/dockview-react/dist/styles/dockview.css', to: 'dist' }],
  dts: true,
  entry: ['src/idecn.tsx', 'src/chunk-studio.tsx'],
  format: 'esm',
  outDir: 'dist',
  platform: 'browser'
})
