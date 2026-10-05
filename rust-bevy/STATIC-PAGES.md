# GitHub Pages / nested static deployment

Both scenes support deployment at:

- `https://expofp.github.io/eval-gpu/rust-bevy/`
- `https://expofp.github.io/eval-gpu/rust-bevy/?scene=exhibition`

These are the intended deployment paths; the parent project owns publishing. Existing manifests intentionally retain their local/tunnel URLs.

## CI build and artifact contract

From `rust-bevy/`, with Node 22 and Bash:

```sh
bash scripts/setup.sh
npm run build
```

Copy **the contents of `rust-bevy/web/`** into `rust-bevy/` in the parent Pages upload artifact. This includes `index.html`, CSS/JS, `pkg/lattice.js`, `pkg/lattice_bg.wasm`, **all `pkg/snippets/` files**, and `assets/shaders/interference.wgsl`. No development server, tunnel, URL rewrite, SPA fallback, cross-origin isolation header, or precompression support is needed.

`web/pkg/lattice_bg.wasm.gz` is optional for Pages: the runtime requests the ordinary `.wasm`, and the smoke server deliberately serves it uncompressed. Keep the uncompressed `.wasm` in the uploaded artifact even if the `.gz` file is copied too. The browser module loader, wasm-bindgen glue and Bevy shader asset reader all resolve within the deployment directory.

Only `web/` is a deployment artifact. Do **not** upload the source folder wholesale: `.tools/`, `target/`, `node_modules/`, `logs/`, `.pages-preview/`, and test output are local tooling/evidence. `.gitignore` excludes these and excludes generated `web/pkg/` from source Git; CI recreates `pkg/` from the pinned Rust source and `Cargo.lock`. Build/test scripts and application source remain source files.

## Ubuntu / Node 22 setup audit

The setup script's `Linux-x86_64` branch downloads wasm-bindgen **0.2.100 x86_64-unknown-linux-musl**, a statically linked ELF executable compatible with the intended Ubuntu x86_64 runner. That exact release archive was fetched and inspected locally. Rust **1.89.0** and `wasm32-unknown-unknown` are installed in this folder's `.tools/` using scoped `CARGO_HOME` / `RUSTUP_HOME`. The Rust version, Bevy version, wasm-bindgen version and dependency lockfiles are pinned. `npm ci` supports Node 22; there is no Vite or platform-specific Node build dependency.

The exact `scripts/setup.sh` then `npm run build` sequence was exercised with local **Node 22.20.0**. The host was macOS; a Linux execution was not available because the Docker daemon was not running. Ubuntu support is based on the portable Bash/Rust build flow and verified Linux binary, not a claimed local Ubuntu build. Parent CI remains the actual Ubuntu build verification.

## Reproduce the nested static smoke

```sh
npm run test:static
```

This stages only `web/` into `.pages-preview/public/eval-gpu/rust-bevy/`, starts its own plain static server on **127.0.0.1:5184**, and launches an isolated Chrome process. It closes that process and its temporary server on completion. It never restarts or stops the normal server on 5174 or its tunnel.

For a persistent manual preview:

```sh
npm run preview:pages
# http://127.0.0.1:5184/eval-gpu/rust-bevy/
# http://127.0.0.1:5184/eval-gpu/rust-bevy/?scene=exhibition
```

Default Chrome executable is `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`; override with `CHROME_EXECUTABLE` if needed. Browser tests require Chrome with WebGPU and a display. Runtime source remains compatible with ordinary static Pages hosting.

The smoke asserts:

- Real `BrowserWebGpu` renderer initialization, actual WASM and WGSL requests under the nested directory; no failed requests or engine/browser errors.
- Scene links work in both directions and retain the nested project path.
- Native HiDPI 2880×1920 backing at CSS 1440×960 / DPR 2 in both scenes at default and maximum complexity, fixed 100%, adaptive OFF.
- Original crystal picking; exhibition routing around corner amenities, overhead map, label selection, night lighting and manual 50% recovery.

Evidence: `tests/static-subpath-results.json`, `tests/static-original.png`, `tests/static-exhibition-day.png`, `tests/static-exhibition-night.png`. Private console/build logs stay under ignored `logs/` and are not deployment assets.

## Verified result

The nested preview passed in isolated Chrome with zero engine/browser errors and zero failed requests. Every runtime HTTP request remained under `/eval-gpu/rust-bevy/`, including the actual WASM binary, generated JS snippet and custom WGSL. Both scenes retained 2880×1920 backing at DPR 2 at default and maximum complexity. Scene navigation, original picking, exhibition aisle routing/overhead selection/night mode, and manual 50% passed. Original and night screenshots were visually inspected. The smoke's Chrome process and port-5184 server were closed; normal local/tunnel services were preserved.
