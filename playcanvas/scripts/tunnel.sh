#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
: > tunnel.log
cloudflared tunnel --url http://127.0.0.1:5173 --no-autoupdate 2>&1 | while IFS= read -r line; do
  printf '%s\n' "$line" | tee -a tunnel.log
  url=$(printf '%s\n' "$line" | sed -n 's/.*\(https:\/\/[a-z0-9-]*\.trycloudflare\.com\).*/\1/p')
  if [ -n "$url" ]; then printf '%s\n' "$url" > tunnel-url.txt; fi
done
