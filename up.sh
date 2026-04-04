log=$(mktemp)
sh clean.sh > "$log" 2>&1 && bun i --silent >> "$log" 2>&1 && bun run build >> "$log" 2>&1 && bun run fix >> "$log" 2>&1 && bun run check >> "$log" 2>&1 || { cat "$log"; rm -f "$log"; exit 1; }
rm -f "$log"
