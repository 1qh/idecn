#!/bin/bash
: "${PORT:=3000}"
set -euo pipefail

IDECN="$(cd "$(dirname "$0")/.." && pwd)"
DIR=$(mktemp -d)/test
mkdir -p "$DIR"
echo "→ Test dir: $DIR"
trap 'rm -rf "$(dirname "$DIR")"' EXIT

echo "→ Checking registry at localhost:$PORT"
curl -sf "http://localhost:$PORT/r/idecn.json" > /dev/null || { echo "✗ Dev server not running on port $PORT"; exit 1; }

echo "→ Creating Next.js + shadcn"
cd "$DIR"
bunx shadcn@latest init -t next -n test -d -s --no-monorepo 2>&1 | tail -3
cd test

echo "→ Adding idecn from registry"
bunx shadcn@latest add "http://localhost:$PORT/r/idecn.json" -s 2>&1 | tail -3

echo "→ Copying demo files"
cp "$IDECN/web/src/app/explorer.tsx" app/explorer.tsx
cp "$IDECN/web/src/app/github.ts" app/github.ts
cp "$IDECN/web/src/app/demo-tree.ts" app/demo-tree.ts
cp "$IDECN/web/src/app/fonts.ts" app/fonts.ts
cp "$IDECN/web/src/app/page.tsx" app/page.tsx
cp "$IDECN/web/src/app/layout.tsx" app/layout.tsx
cp "$IDECN/web/src/app/globals.css" app/globals.css

echo "→ Patching imports"
sed -i.bak "s|from 'idecn'|from '@/components/ui/idecn'|g" app/explorer.tsx app/github.ts
sed -i.bak "s|from '~/lib/utils'|from '@/lib/utils'|g" app/layout.tsx
rm -f app/*.bak

echo "→ Building"
if bun run build 2>&1 | tail -5; then
  echo "✓ Registry test passed"
else
  echo "✗ Build failed"
  exit 1
fi
