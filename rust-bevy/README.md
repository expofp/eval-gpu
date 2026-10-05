# Lattice / GPU Observatory

A procedural kinetic crystal landscape rendered by **Rust + Bevy 0.16.1 + wgpu**, compiled to WebAssembly and using **WebGPU**. The HTML interface supplies controls and honest browser-frame instrumentation; it does not render the 3D scene.

## Run the delivered build

```sh
cd /Users/emt/projects/eval-gpu/rust-bevy
npm start
```

Open **http://127.0.0.1:5174** in current Chrome/Edge with WebGPU and hardware acceleration. The server serves only `web/`, never the repository or local toolchain. No Node production dependencies are needed. Built WASM is included in `web/pkg/`.

## Reproduce from source

```sh
bash scripts/setup.sh
npm run build
npm start
```

Setup installs Rust 1.89.0, its WASM target, and wasm-bindgen 0.2.100 **inside this directory**. It does not modify shell configuration. `Cargo.lock`, `package-lock.json`, exact Bevy/wasm-bindgen versions and `rust-toolchain.toml` pin the build. The first release build can take several minutes. The CLI release is downloaded for macOS arm64/x64 or Linux x64; other platforms compile it locally.

## Public tunnel

In a second persistent terminal:

```sh
bash scripts/tunnel.sh
```

Requires `cloudflared` on PATH. The unauthenticated HTTPS URL is saved in `public-url.txt`; full output is saved in `logs/tunnel.log`. Restarting creates a new ephemeral URL. Keep the server and tunnel terminal sessions alive. Only this demo's static web directory is exposed.

## Controls

- Drag: orbit; Shift-drag or right-drag: pan; wheel: zoom.
- Click a crystal: select it, enlarge it, and show its identity in the inspector.
- Complexity slider/presets: 49–6,049 visible crystals and 80–780 animated mesh particles.
- Fixed native HiDPI 100% is the default, adaptive OFF. Optional adaptive resolution: 100% down to a 50% linear-resolution floor; manual full/75%/50% options (relative to native devicePixelRatio backing dimensions).
- Spectral interference: toggle the custom shader contribution.
- Freeze: pause simulation while retaining camera interaction. Reset viewpoint restores the camera.

## Rendering techniques and limits

The faceted crystals use a custom WGSL extension of Bevy's StandardMaterial. It adds animated world-space emissive interference bands and view-dependent spectral color to normal PBR lighting. This is an artistic interference approximation, not physical thin-film spectral transport or actual glass refraction.

A directional light uses a 2,048-pixel shadow map. Two colored point lights add illumination without additional shadow maps. Metallic platforms, procedural torus rings, distance fog, HDR bloom and Tony McMapface tone mapping complete the scene. All meshes are generated in Rust; there are no external model/image/font dependencies.

Animation is CPU/ECS driven. Meshes and materials are shared so Bevy can batch compatible objects. This demo does not claim custom GPU compute simulation, hardware ray tracing, path tracing, GPU timestamp measurements, measured draw counts or VRAM usage. The visible frame metrics are **browser requestAnimationFrame wall cadence**, including any CPU/browser/compositor delays. They are not GPU execution time.

Triangle counts describe active source mesh geometry, before visibility culling and without shadow passes. Crystal spawn work is bounded to 96 entities per frame. Lowering complexity hides retained allocations; it does not reclaim their memory. Maximum requested scene work is explicitly capped. Adaptive mode lowers linear render resolution in 10-point steps when the rolling average is above 38 ms, and recovers in 5-point steps below 23 ms, at most once per 4.5 seconds. It targets approximately 30 FPS but cannot guarantee it. Slow CPU submission can remain limiting at maximum complexity.

WebGPU only: unsupported environments get an explicit explanatory screen. There is no hidden WebGL fallback. Adapter details may be withheld by browser privacy policy. The initial WASM binary is approximately 31 MB before transport compression, served as approximately 6.2 MB gzip.

## Browser verification

```sh
npm ci
npm test
```

The test launches and closes its own Chrome process, never an existing user browser. Override with `CHROME_EXECUTABLE` if needed. Default executable: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`. It checks actual WebGPU rendering, browser/engine errors, complexity low/high, orbit/pan/zoom, selection, freeze, manual resolution, return to low load, and rendering notes. Screenshots and structured evidence are saved under `tests/`; `logs/browser.log` contains the complete run. Tests keep the GPU active briefly and close the automated browser in a `finally` block.

Source: `src/lib.rs`, `web/assets/shaders/interference.wgsl`, `web/app.js`. Runtime: `scripts/server.mjs`. Integration: `demo-manifest.json`.

## Verified result

The final native HiDPI regression suites passed with zero browser/engine errors or failed requests. Both scenes rendered **2880×1920** at a **1440×960 CSS viewport / DPR 2**, at default and maximum complexity, with fixed 100% and adaptive OFF. Manual 50% rendered 1440×960. The exhibition also passed live DPR changes, resizing, destination routing, floor picking and day/night checks. Earlier one-CSS-pixel results are archived under `tests/pre-hidpi/` and are superseded. Current evidence: `tests/results.json`, `tests/exhibition-results.json`, and `tests/compatibility.json`.

Bevy reports an optional SSAO capability warning on the tested adapter; SSAO is not enabled or claimed by this demo. Full evidence: `tests/results.json`, `tests/compatibility.json`, screenshots, and tunnel HTTP headers.

## Round 2: City Pavilion

A complete exhibition scene is now available at `/?scene=exhibition`, with visible scene-switch links. Both scenes now default to **fixed 100%, native HiDPI devicePixelRatio, adaptive OFF**. The live panel shows the actual backing dimensions. See [EXHIBITION.md](EXHIBITION.md) and `exhibition-manifest.json` for layout, routes, crowd behavior and verification. Earlier round-one adaptive-default observations above are historical; the native HiDPI fixed baseline supersedes them.

## Nested static hosting

Both scenes use relative asset and navigation URLs and support `/eval-gpu/rust-bevy/` without a server application. See [STATIC-PAGES.md](STATIC-PAGES.md) for the Ubuntu/Node 22 CI build contract, exact artifact-copy instructions and `npm run test:static`. Generated `web/pkg/` is excluded from source Git and rebuilt by CI. Local server and tunnel commands are unchanged.
