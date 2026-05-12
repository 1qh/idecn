#!/bin/sh
command -v zsh >/dev/null 2>&1 || { echo "ERROR: zsh required (brew install zsh / apt install zsh)" >&2; exit 1; }
exec zsh -c 'setopt null_glob; rm -rf node_modules bun.lock .cache .turbo **/node_modules **/.cache **/.next **/.source **/.turbo **/dist **/build **/tsconfig.tsbuildinfo **/test-results "$@"' clean "$@"
