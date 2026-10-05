#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p .tools
source scripts/env.sh
if [ ! -x "$CARGO_HOME/bin/rustup" ]; then
 curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs -o .tools/rustup-init.sh
 sh .tools/rustup-init.sh -y --no-modify-path --profile minimal --default-toolchain 1.89.0 --target wasm32-unknown-unknown
else
 rustup toolchain install 1.89.0 --profile minimal
 rustup target add wasm32-unknown-unknown --toolchain 1.89.0
fi
if [ ! -x .tools/wasm-bindgen/wasm-bindgen ]; then
 case "$(uname -s)-$(uname -m)" in
 Darwin-arm64) triple=aarch64-apple-darwin;;
 Darwin-x86_64) triple=x86_64-apple-darwin;;
 Linux-x86_64) triple=x86_64-unknown-linux-musl;;
 *) cargo install wasm-bindgen-cli --version 0.2.100 --locked --root .tools/bindgen-install; mkdir -p .tools/wasm-bindgen; cp .tools/bindgen-install/bin/wasm-bindgen .tools/wasm-bindgen/; triple=;;
 esac
 if [ -n "$triple" ]; then
 curl -fLs "https://github.com/wasm-bindgen/wasm-bindgen/releases/download/0.2.100/wasm-bindgen-0.2.100-$triple.tar.gz" -o .tools/bindgen.tar.gz
 mkdir -p .tools/wasm-bindgen
 tar -xzf .tools/bindgen.tar.gz -C .tools/wasm-bindgen --strip-components=1
 fi
fi
npm ci
