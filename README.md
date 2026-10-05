# Browser GPU Lab

Four independent rendering engines, each with an original showcase and a shared exhibition-map scene, coordinated through a small comparison dashboard.

## GitHub Pages

**Live site:** https://expofp.github.io/eval-gpu/

**Public source:** https://github.com/expofp/eval-gpu

Every push to `main` builds and deploys all eight scenes through [the Pages workflow](.github/workflows/pages.yml). The hosted comparison uses static catalogs and relative URLs; it does not depend on local servers or Cloudflare tunnels. WebGPU works over GitHub Pages HTTPS.

To reproduce the static deployment locally:

```sh
npm ci --prefix babylon
npm ci --prefix three-webgpu
npm ci --prefix playcanvas
bash rust-bevy/scripts/setup.sh
npm run build
npm run test:pages
```

The result is `_site/`, which can be served by any ordinary static HTTP server, including beneath a project path. Node 22 and the pinned Rust/WASM toolchain are used in CI. The Rust binary is rebuilt from source; local toolchains, browser recordings, tunnel logs, and generated builds are excluded from Git.

Each engine also has a nested-path browser smoke test documented in its README. These tests verify real rendering, scene switching, interaction, and native HiDPI after static packaging.

## Open locally

The comparison page runs at **http://localhost:5170**. Choose **Exhibition map** or **Engine showcases**. Exhibition links append `?scene=exhibition` to each demo URL. Each demo has a dedicated local server and its own temporary, unauthenticated HTTPS Cloudflare tunnel. The dashboard reads current public URLs from the demo manifests.

| Folder | Stack | Local port |
| --- | --- | --- |
| `babylon/` | Babylon.js / WebGPU | 5171 |
| `three-webgpu/` | Three.js / WebGPU / TSL | 5172 |
| `playcanvas/` | PlayCanvas / WebGPU | 5173 |
| `rust-bevy/` | Rust / Bevy / wgpu / WASM | 5174 |

Each folder owns its dependencies, scene, controls, tests, build instructions, and tunnel. See its README for setup and backend-specific limitations.

## Restart

After installing the dependencies described in each demo README:

```sh
npm run start:all
```

This starts the comparison server and any demo server that is not already listening. It does not reinstall dependencies, build Rust, or recreate tunnels. Ctrl+C stops only processes started by this command.

To run just the dashboard (no dependencies needed; Node 20+):

```sh
npm start
```

To publish the dashboard temporarily:

```sh
cloudflared tunnel --url http://127.0.0.1:5170 --no-autoupdate
```

Start each demo's tunnel using its README. Quick-tunnel URLs change on restart and expire when the corresponding process stops. Update `publicUrl` in that demo's `demo-manifest.json` if starting its tunnel manually. The dashboard automatically refreshes metadata and local server availability every ten seconds.


## Exhibition comparison baseline

[exhibition-spec.json](exhibition-spec.json) defines the common 90 × 64 m single-floor pavilion, 24 stands, two cafés, two toilet areas, entrance/exit, aisle network, surrounding city, camera and crowd formula. Workers copy the relevant data into their own folders, so each implementation remains self-contained.

All scenes default to **fixed 100% backing resolution**, native devicePixelRatio (Retina/HiDPI), with adaptive resolution off. At the same viewport dimensions and DPR, their displayed render sizes should match: 1440 × 960 CSS pixels at DPR 2 means a 2880 × 1920 backing buffer. Day mode and complexity 35 are the exhibition defaults, with approximately 120 walking people. Complexity 100 raises the crowd to 1,200. The night toggle changes lighting; destination selection displays a walking route from the entrance.

Use the same viewport, day/night setting, complexity, camera and resolution mode when comparing FPS. Automatic quality is opt-in. Engine implementations can still differ in materials, geometry, shadows and extra effects, so these are practical engine comparisons rather than mathematically equivalent workloads.

## Compare fairly

Run one scene at a time, keep the window size consistent, let shaders compile, and increase complexity gradually. These are capability explorations with different geometry, materials, and effects—not equivalent benchmark workloads. Compare responsiveness and the cost of each technique, rather than treating equal slider values as equal work.

FPS and wall-frame time include scheduling, CPU work, and display synchronization; they are not GPU timestamps unless a demo explicitly labels an actual GPU measurement. Adaptive quality may trade resolution or effects for responsiveness; check each scene's displayed quality state. Backend labels belong to the running demo, not merely detection of `navigator.gpu`.

The root server exposes only its dashboard assets and demo metadata endpoint. Each public demo tunnel targets only its own server.
