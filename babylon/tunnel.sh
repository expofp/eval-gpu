#!/bin/sh
cd "$(dirname "$0")"
mkdir -p artifacts
cloudflared tunnel --url http://127.0.0.1:5171 2>&1 | while IFS= read -r line; do
  printf '%s\n' "$line" | tee -a artifacts/tunnel.log
  url=$(printf '%s\n' "$line" | sed -n 's/.*\(https:\/\/[-a-z0-9]*\.trycloudflare.com\).*/\1/p')
  if [ -n "$url" ]; then printf '%s\n' "$url" > artifacts/public-url.txt; fi
done
