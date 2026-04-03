#!/bin/bash
: "${PORT:=3456}"
set -euo pipefail

IDECN="$(cd "$(dirname "$0")/.." && pwd)"
DIR=$(mktemp -d)/test
mkdir -p "$DIR"
STARTED_SERVER=false
echo "-> Test dir: $DIR"

if curl -sf "http://localhost:$PORT/r/idecn.json" > /dev/null 2>&1; then
  echo "-> Dev server already running on port $PORT"
elif curl -sf "http://localhost:3000/r/idecn.json" > /dev/null 2>&1; then
  PORT=3000
  echo "-> Dev server already running on port $PORT"
else
  echo "-> Starting dev server on port $PORT"
  REPO_ROOT="$(cd "$IDECN/../.." && pwd)"
  (cd "$REPO_ROOT/apps/web" && bun x next dev --turbopack --port "$PORT") &
  DEV_PID=$!
  STARTED_SERVER=true
  sleep 5
  curl -sf "http://localhost:$PORT/r/idecn.json" > /dev/null || { echo "x Dev server failed"; exit 1; }
fi
trap 'rm -rf "$(dirname "$DIR")"; if $STARTED_SERVER; then kill $DEV_PID 2>/dev/null; fi' EXIT

echo "-> Creating Next.js + shadcn"
cd "$DIR"
bunx shadcn@latest init -t next -n test -d -s --no-monorepo 2>&1 | tail -3
cd test

echo "-> Adding idecn from registry"
bunx shadcn@latest add "http://localhost:$PORT/r/idecn.json" -s 2>&1 | tail -3

echo "-> Installing extra deps"
DEPS=$(cd "$IDECN" && bun -e "const p = JSON.parse(require('fs').readFileSync('package.json','utf8')); console.log(Object.keys(p.dependencies).join(' '))")
bun add $DEPS 2>&1 | tail -1

echo "-> Copying demo app"
rm -rf app
REPO_ROOT="$(cd "$IDECN/../.." && pwd)"
cp -r "$REPO_ROOT/apps/web/app" app

echo "-> Patching imports"
find app -name '*.ts' -o -name '*.tsx' | xargs sed -i.bak "s|from 'idecn'|from '@/components/ui/idecn'|g"
rm -f app/*.bak
sed -i.bak "1s|^|import 'dockview-core/dist/styles/dockview.css'\n|" app/layout.tsx
rm -f app/layout.tsx.bak

echo "-> Building"
if bun x next build 2>&1 | tail -5; then
  echo "v Registry test passed"
else
  echo "x Build failed"
  exit 1
fi
