import { defineConfig } from 'tsdown'
export default defineConfig({
  clean: true,
  dts: true,
  entry: ['src/idecn.tsx'],
  format: 'esm',
  outDir: 'dist'
})
