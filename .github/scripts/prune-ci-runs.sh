#!/usr/bin/env sh
# prune-ci-runs — delete every completed workflow run except the current one, so
# the Actions history stays a single present run (mirrors the single-release +
# single-commit-mirror discipline). Env: GH_TOKEN, REPO, KEEP_RUN_ID.
set -eu
: "${REPO:?REPO required}"
: "${KEEP_RUN_ID:?KEEP_RUN_ID required}"
# A fixed path here is a host-wide singleton: every managed repo prunes on the same
# self-hosted runner, so two jobs overlapping means the second overwrites the first's list and
# the first then asks its own repo to delete another repo's run ids — every call 404s, nothing
# is pruned, and the history quietly keeps growing. A run-owned file cannot be clobbered.
runs=$(mktemp)
trap 'rm -f "$runs"' EXIT
gh run list --repo "$REPO" --limit 400 --json databaseId,status \
	-q '.[] | select(.status=="completed") | .databaseId' </dev/null >"$runs"
# A run already gone is nothing to report; anything else means the prune did not do its job, and
# saying ok regardless is what let a silent, systematic failure (a token without the scope) look
# like a working prune.
failed=0
while read -r id; do
	if [ "$id" = "$KEEP_RUN_ID" ]; then
		continue
	fi
	if ! gh api -X DELETE "/repos/${REPO}/actions/runs/${id}" </dev/null >/dev/null 2>&1; then
		if gh api "/repos/${REPO}/actions/runs/${id}" </dev/null >/dev/null 2>&1; then
			echo "prune-ci-runs: could not delete run ${id}" >&2
			failed=$((failed + 1))
		fi
	fi
	sleep 1
done <"$runs"
if [ "$failed" -gt 0 ]; then
	echo "prune-ci-runs: ${failed} run(s) still present" >&2
	exit 1
fi
echo ok
