#!/usr/bin/env sh
# prune-ci-runs — delete every completed workflow run except the current one, so
# the Actions history stays a single present run (mirrors the single-release +
# single-commit-mirror discipline). Env: GH_TOKEN, REPO, KEEP_RUN_ID.
set -eu
: "${REPO:?REPO required}"
: "${KEEP_RUN_ID:?KEEP_RUN_ID required}"
gh run list --repo "$REPO" --limit 400 --json databaseId,status \
	-q '.[] | select(.status=="completed") | .databaseId' </dev/null >/tmp/ci_runs.txt
while read -r id; do
	if [ "$id" = "$KEEP_RUN_ID" ]; then
		continue
	fi
	gh api -X DELETE "/repos/${REPO}/actions/runs/${id}" </dev/null >/dev/null 2>&1 || true
	sleep 1
done </tmp/ci_runs.txt
echo ok
