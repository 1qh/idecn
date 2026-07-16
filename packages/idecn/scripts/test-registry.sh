#!/bin/bash
: "${PORT:=3456}"
set -euo pipefail

IDECN="$(cd "$(dirname "$0")/.." && pwd)"
DIR=$(mktemp -d)/test
mkdir -p "$DIR"
STARTED_SERVER=false
echo "-> Test dir: $DIR"

DIST=""
if curl -sf "http://localhost:$PORT/r/idecn.json" >/dev/null 2>&1; then
	echo "-> Dev server already running on port $PORT"
elif curl -sf "http://localhost:3000/r/idecn.json" >/dev/null 2>&1; then
	PORT=3000
	echo "-> Dev server already running on port $PORT"
else
	# A fixed port and the shared .next are host-wide singletons: a second run on this
	# machine — a CI runner beside a local shell — races both. A run that starts its own
	# server asks the OS for a port and compiles into a dist dir it owns.
	PORT=$(bun -e 'const s = Bun.listen({ hostname: "127.0.0.1", port: 0, socket: { data() {} } }); console.log(s.port); s.stop(true)')
	DIST=".next/registry-test-$$"
	echo "-> Starting dev server on port $PORT (dist $DIST)"
	REPO_ROOT="$(cd "$IDECN/../.." && pwd)"
	(cd "$REPO_ROOT/apps/web" && NEXT_DIST_DIR="$DIST" bun x next dev --turbopack --port "$PORT") &
	DEV_PID=$!
	STARTED_SERVER=true
	# A fixed sleep either wastes time or fails a slow-but-healthy boot; wait for the real
	# readiness signal under a deadline, and say what actually went wrong on timeout.
	DEADLINE=$(($(date +%s) + 90))
	until curl -sf "http://localhost:$PORT/r/idecn.json" >/dev/null 2>&1; do
		if ! kill -0 "$DEV_PID" 2>/dev/null; then
			echo "x Dev server exited before serving the registry on port $PORT" >&2
			exit 1
		fi
		if [ "$(date +%s)" -gt "$DEADLINE" ]; then
			echo "x Dev server did not serve /r/idecn.json within 90s on port $PORT" >&2
			exit 1
		fi
		sleep 1
	done
fi
# Removes only what this run created, each addressed by its exact path — never a glob.
cleanup() {
	rm -rf "$(dirname "$DIR")"
	if $STARTED_SERVER; then
		kill "$DEV_PID" 2>/dev/null || true
		if [ -n "$DIST" ]; then rm -rf "$REPO_ROOT/apps/web/$DIST"; fi
	fi
}
trap cleanup EXIT

echo "-> Creating Next.js + shadcn"
cd "$DIR"
bunx shadcn@latest init -t next -n test -d -s --no-monorepo 2>&1 | tail -3
cd test

echo "-> Adding idecn from registry"
# `-s` only mutes output; without `-o` the add stops on "file already exists, overwrite?"
# and a non-tty answers No, so the components silently never land and the build then fails
# on an import of a file the add was supposed to write.
bunx shadcn@latest add "http://localhost:$PORT/r/idecn.json" -s -o 2>&1 | tail -3

echo "-> Installing extra deps"
# Two manifests matter: this package's, and the demo app's — the app copied in below brings
# its own imports, and installing only the component's deps leaves those unresolved.
# A `workspace:*` dep resolves only inside this monorepo, so handing it to `bun add` asks
# npm for a package that does not exist there and 404s the whole install. A scaffolded
# consumer receives those components through the registry JSON, never from the npm registry.
DEPS=$(cd "$IDECN" && bun -e "
const read = p => { try { return JSON.parse(require('fs').readFileSync(p, 'utf8')).dependencies ?? {} } catch { return {} } }
const all = { ...read('package.json'), ...read('../../apps/web/package.json') }
console.log(Object.entries(all).filter(([, v]) => !String(v).startsWith('workspace:')).map(([k]) => k).join(' '))")
read -ra DEP_ARR <<<"$DEPS"
bun add "${DEP_ARR[@]}" 2>&1 | tail -1

echo "-> Copying demo app"
REPO_ROOT="$(cd "$IDECN/../.." && pwd)"
# The scaffold's own globals.css is a consumer's equivalent of the workspace-private
# `@a/ui/globals.css`, so keep it before the demo app replaces this directory.
cp app/globals.css "$DIR/globals.css.keep"
rm -rf app
cp -r "$REPO_ROOT/apps/web/app" app
cp "$DIR/globals.css.keep" app/globals.css

echo "-> Patching imports"
# The demo app is monorepo-coupled: it reaches the shared kit through `@a/ui` and points
# tailwind at workspace-relative sources. A consumer has neither, so each resolves to the
# scaffold's own equivalent — exactly the rewrite the registry build applies to components.
find app \( -name '*.ts' -o -name '*.tsx' \) -exec sed -i.bak \
	-e "s|from 'idecn'|from '@/components/ui/idecn'|g" \
	-e "s|from '@a/ui'|from '@/lib/utils'|g" {} +
sed -i.bak -e "s|@import '@a/ui/globals.css';|@import './globals.css';|" -e "/^@source '\.\./d" app/global.css
find app -name '*.bak' -delete
sed -i.bak "1s|^|import 'dockview-core/dist/styles/dockview.css'\n|" app/layout.tsx
rm -f app/layout.tsx.bak

echo "-> Building"
# Terse on success, verbose on failure: piping the build through `tail` discards the very
# lines that name the unresolved module, leaving stack frames that identify nothing.
BUILD_LOG="$DIR/build.log"
if bun x next build >"$BUILD_LOG" 2>&1; then
	echo "v Registry test passed"
else
	echo "x Build failed" >&2
	cat "$BUILD_LOG" >&2
	exit 1
fi
