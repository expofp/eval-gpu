#!/bin/bash
set -eu
cd "$(dirname "$0")/.."
: > tunnel.log
cloudflared tunnel --url http://127.0.0.1:5172 --no-autoupdate 2>&1 | while IFS= read -r line; do
  printf '%s\n' "$line" | tee -a tunnel.log
  url=$(printf '%s\n' "$line" | sed -nE 's/.*(https:\/\/[a-z0-9-]+\.trycloudflare\.com).*/\1/p')
  if [ -n "$url" ]; then
    printf '%s\n' "$url" > tunnel-url.txt
    node -e 'const fs=require("fs");for(const p of ["demo-manifest.json","exhibition-manifest.json"]){if(fs.existsSync(p)){const m=JSON.parse(fs.readFileSync(p));m.publicUrl=process.argv[1]+(p.startsWith("exhibition")?"/?scene=exhibition":"");fs.writeFileSync(p,JSON.stringify(m,null,2)+"\n")}}' "$url"
  fi
done
