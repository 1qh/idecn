#!/bin/bash
: "${PORT:=3000}"
set -euo pipefail

IDECN="$(cd "$(dirname "$0")/.." && pwd)"
DIR=$(mktemp -d)/test
mkdir -p "$DIR"
echo "-> Test dir: $DIR"
trap 'rm -rf "$(dirname "$DIR")"' EXIT

echo "-> Checking registry at localhost:$PORT"
curl -sf "http://localhost:$PORT/r/idecn.json" > /dev/null || { echo "x Dev server not running on port $PORT"; exit 1; }

echo "-> Creating Next.js + shadcn"
cd "$DIR"
bunx shadcn@latest init -t next -n test -d -s --no-monorepo 2>&1 | tail -3
cd test

echo "-> Adding idecn from registry"
bunx shadcn@latest add "http://localhost:$PORT/r/idecn.json" -s 2>&1 | tail -3

echo "-> Copying demo files"
for f in demo-tree.ts fonts.ts globals.css layout.tsx page.tsx utils.ts; do
  cp "$IDECN/web/app/$f" "app/$f"
done

echo "-> Patching imports"
sed -i.bak "s|from 'idecn'|from '@/components/ui/idecn'|g" app/page.tsx app/utils.ts
rm -f app/*.bak

echo "-> Building"
if bun run build 2>&1 | tail -5; then
  echo "v Registry test passed"
else
  echo "x Build failed"
  exit 1
fi
