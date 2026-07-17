import { defineConfig } from '@playwright/test'
/** Supplied by `scripts/e2e.sh`, which asks the OS for a free port once and exports it. It cannot be computed here: playwright re-evaluates this config in every worker, so each would pick a different port while only the webServer's answers — and a fixed port is a host-wide singleton this machine already serves another project on. */
// biome-ignore lint/style/noProcessEnv: E2E_PORT is the deliberate run-owned port seam
const configured = process.env.E2E_PORT
if (configured === undefined || configured === '')
  throw new Error(
    'E2E_PORT is not set — run the suite through `bun run test` (scripts/e2e.sh), which allocates a free port'
  )
const port = Number(configured)
export default defineConfig({
  retries: 1,
  testDir: '.',
  testMatch: 'e2e.test.ts',
  timeout: 30_000,
  use: {
    baseURL: `http://localhost:${String(port)}`
  },
  webServer: {
    command: `bun run dev -- --port ${String(port)}`,
    port,
    /** Never adopt a server this run did not start: reuse turns any stray process on the port into a silent wrong-app test run, so a collision fails loudly instead. */
    reuseExistingServer: false
  }
})
