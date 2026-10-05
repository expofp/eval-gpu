#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
source scripts/env.sh
cargo build --release --target wasm32-unknown-unknown --locked
.tools/wasm-bindgen/wasm-bindgen --target web --out-dir web/pkg --out-name lattice target/wasm32-unknown-unknown/release/lattice_observatory.wasm
gzip -9 -c web/pkg/lattice_bg.wasm > web/pkg/lattice_bg.wasm.gz
