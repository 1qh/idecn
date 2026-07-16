#!/bin/sh
command -v zsh >/dev/null 2>&1 || {
	echo "ERROR: zsh required (brew install zsh / apt install zsh)" >&2
	exit 1
}
log=$(mktemp)
if sh clean.sh >"$log" 2>&1 && bun i --silent >>"$log" 2>&1 && bun run build >>"$log" 2>&1 && bun run fix >>"$log" 2>&1 && bun run check >>"$log" 2>&1 && bun packages/idecn/scripts/build-registry.ts >>"$log" 2>&1; then
	# The registry is what a consumer installs, and it is derived from source — so it is checked
	# here, on every run, rather than by a script someone remembers to call. The generator above
	# refuses to emit an unbuildable item; this catches the other half, a committed copy that no
	# longer matches its source, which would serve everyone a stale component.
	if ! git diff --quiet -- apps/web/public/r/idecn.json; then
		echo "registry is stale — run 'bun run gen' in packages/idecn and commit the result" >&2
		git diff --stat -- apps/web/public/r/idecn.json >&2
		rm -f "$log"
		exit 1
	fi
	rm -f "$log"
else
	cat "$log"
	rm -f "$log"
	exit 1
fi
