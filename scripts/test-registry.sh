#!/bin/bash
: "${PORT:=3333}"
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
  (cd "$IDECN/web" && bun x next dev --turbopack --port "$PORT") &
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

echo "-> Copying demo app"
rm -rf app
cp -r "$IDECN/web/app" app

echo "-> Patching imports"
find app -name '*.ts' -o -name '*.tsx' | xargs sed -i.bak "s|from 'idecn'|from '@/components/ui/idecn'|g"
rm -f app/*.bak

echo "-> Building"
if bun run build 2>&1 | tail -5; then
  echo "v Registry test passed"
else
  echo "x Build failed"
  exit 1
fi
