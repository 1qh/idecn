import { defineConfig } from '@playwright/test'
export default defineConfig({
  retries: 1,
  testDir: '.',
  testMatch: 'e2e.test.ts',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:3001'
  },
  webServer: {
    command: 'bun run dev -- --port 3001',
    port: 3001,
    reuseExistingServer: true
  }
})
