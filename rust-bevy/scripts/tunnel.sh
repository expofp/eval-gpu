#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p logs
cloudflared tunnel --url http://127.0.0.1:5174 --no-autoupdate 2>&1 | tee logs/tunnel.log | while IFS= read -r line; do
  printf '%s\n' "$line"
  url=$(printf '%s\n' "$line" | sed -n 's/.*\(https:\/\/[-a-z0-9]*\.trycloudflare\.com\).*/\1/p')
  if [ -n "$url" ]; then printf '%s\n' "$url" > public-url.txt; fi
done
