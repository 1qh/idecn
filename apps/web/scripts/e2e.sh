#!/bin/sh
# Playwright re-evaluates its config in every worker process, so a port computed inside the
# config differs per worker and only the one the server bound answers. The port is chosen once
# here and exported, so every worker and the webServer agree on it — and asking the OS for a
# free one keeps two runs (a CI job beside a local shell) off each other's port.
set -eu
# A fresh CI runner has no browser binary, so the suite dies with "Executable doesn't exist".
# The install is idempotent — it downloads chromium only when absent, so a local machine that
# already has it is a fast no-op.
bunx playwright install chromium
E2E_PORT=$(bun -e 'const s = Bun.listen({ hostname: "127.0.0.1", port: 0, socket: { data() {} } }); console.log(s.port); s.stop(true)')
export E2E_PORT
exec bunx playwright test "$@"
