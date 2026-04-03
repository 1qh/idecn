#!/bin/bash
set -euo pipefail

REPO_URL=$(git remote get-url origin)
DIR=$(mktemp -d)
trap 'rm -rf "$DIR"' EXIT

echo "-> Updating screenshot"
cd apps/web && bun ../../packages/idecn/scripts/screenshot.ts && cd ../..
git add -A
git diff --cached --quiet || git commit -m "Update screenshot" --no-verify

echo "-> Pushing"
git push

echo "-> Cleaning git history (BFG)"
git clone --mirror "$REPO_URL" "$DIR/bare"
bfg --strip-blobs-bigger-than 100K "$DIR/bare"
cd "$DIR/bare"
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
cd -

echo "-> Syncing local"
git fetch origin
git reset --hard origin/main
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo "Done"
