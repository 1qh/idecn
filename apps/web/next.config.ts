import type { NextConfig } from 'next'

const config: NextConfig = {
  /** The build dir is a host-wide singleton, so two dev servers on one machine — a CI runner beside a local shell — serve each other's half-written output. A run that owns its own gets a private one. Relative only: an absolute path stops the server booting. */
  // biome-ignore lint/style/noProcessEnv: the build dir is deliberately configurable
  distDir: process.env.NEXT_DIST_DIR ?? '.next',
  reactStrictMode: true
}
export default config
