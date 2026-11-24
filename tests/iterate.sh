#!/usr/bin/env bash
set -euo pipefail
n="$1"
out="artifacts/refine-$n"
mkdir -p "$out"
port=4201
tests/monitor.sh "$out/resources.csv" & mon=$!
node node_modules/vite/bin/vite.js --host 127.0.0.1 --port "$port" --strictPort > "$out/vite.log" 2>&1 & server=$!
trap 'kill "$mon" "$server" 2>/dev/null || true' EXIT
for i in $(seq 1 20); do curl -fs "http://127.0.0.1:$port/" >/dev/null && break; sleep 1; done
TIMEFORMAT='TEST_SECONDS=%3R'; time OUT="$out" URL="http://127.0.0.1:$port" node tests/render.mjs
