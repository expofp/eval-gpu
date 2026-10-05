#!/bin/bash
export CARGO_HOME="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/.tools/cargo"
export RUSTUP_HOME="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/.tools/rustup"
export PATH="$CARGO_HOME/bin:$PATH"
