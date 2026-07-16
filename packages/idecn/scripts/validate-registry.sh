#!/bin/sh
# The registry is what a consumer installs, and it is derived from source — so it is checked on
# every run rather than by a script someone remembers to call. build-registry refuses to emit an
# item a consumer cannot build; this catches the other half, a committed copy that no longer
# matches its source, which would serve everyone a stale component.
# Lives beside the thing it guards, never in the fleet-managed up.sh: only this repo ships a registry.
set -eu
ROOT=$(cd "$(dirname "$0")/../../.." && pwd)
REG=apps/web/public/r/idecn.json
bun "$ROOT/packages/idecn/scripts/build-registry.ts" >/dev/null
if ! git -C "$ROOT" diff --quiet -- "$REG"; then
	echo "registry is stale — run 'bun run gen' in packages/idecn and commit the result" >&2
	git -C "$ROOT" diff --stat -- "$REG" >&2
	exit 1
fi
