# HELIOS — Orbital foundry

A self-contained Babylon.js / WebGPU graphics evaluation scene. Native WebGPU is attempted first; WebGL2/WebGL1 fallback is explicitly displayed. Append `?webgl` to exercise fallback.

## Run

Requires Node.js 22.12+ and npm. From this directory:

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5171. The server binds only this project on port 5171. Dependencies are exact-version pinned in package.json and package-lock.json. Shader compiler JS/WASM is vendored under public/vendor; no runtime CDN, model, font, or texture downloads are required.

```sh
npm run build
npm run preview
```

Stop the dev server before using preview (same fixed port).

## Public tunnel

With cloudflared installed, leave the local server running and launch in another persistent terminal:

```sh
./tunnel.sh
```

This creates a public unauthenticated temporary tunnel to this project's port. The current URL is written to artifacts/public-url.txt; logs append to artifacts/tunnel.log. Restarting creates a new URL. Keep both terminals alive. The Vite allowlist permits trycloudflare.com hosts.

## Controls and workload

- Left drag: orbit; right drag: pan; wheel: zoom. Reset view restores framing. Auto orbit and Pause motion are explicit controls.
- Click reactor core, gimbals, or clamps to inspect and toggle reactor light intensity.
- Complexity: 300–24,000 thin-instance polyhedra, 100–1,000 emitted particles/second (4,000 hard capacity), 20–64 fragment ray-integration steps. Instance matrices are allocated once; rigid orbital motion happens through the parent transform.
- Adaptive resolution targets approximately 45 FPS with hysteresis, bounded to 50–100% of native device-pixel resolution. Manual 100/75/50% controls are available. Native devicePixelRatio is used without a DPR cap; manual percentages scale native dimensions. Shadows stay bounded at 1024²; geometry and particle work are capped. Minimum resolution cannot guarantee a frame-rate floor on every GPU.
- Hidden tabs stop rendering. Pause freezes scene motion, plasma time, and particle simulation, while continuing rendering so telemetry remains available.

## Implemented techniques

1. Analytic ray/sphere intersection and bounded front-to-back plasma density integration in a fragment shader, compiled for WebGPU or WebGL. This is a small procedural volume, not hardware ray tracing or general path tracing.
2. Thin-instanced orbital debris with preallocated matrices and GPU instance submission.
3. Locally generated cubemap reflections on PBR metals, moving gyroscopic geometry, four lights including a shadow-casting directional light with PCF, CPU-simulated billboard sparks, HDR bloom, ACES tone mapping and FXAA.

FPS is derived from smoothed wall-frame intervals. Frame time is explicitly **not GPU timestamp timing**. Draw calls use Babylon's per-frame instrumentation counter and include shadow/post passes. Submitted triangle estimate counts active main-view mesh indices multiplied by instance count; excludes shadows, particles and post passes. It is not a hardware primitive query. No compute particles, dynamic scene reflections, hardware RT or GPU timing are claimed.

## Tests

```sh
npm test
```

Uses Playwright with installed macOS Google Chrome at `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`, in an isolated headed process/profile. Change `executablePath` in test.mjs for another platform. It briefly tests native WebGPU, complexity endpoints, manual resolution, pause, orbit/zoom, picking, and forced WebGL fallback, captures screenshots, writes errors.json, then closes only its own browser. Console evidence is in artifacts/test.log; screenshot evidence is in artifacts/*.png. Do not interpret frame rates from this shared machine as a controlled benchmark.

Additional control regression: `node controls-test.mjs`. This asserts right-drag pan and auto-orbit, and injects a temporary 40ms CPU callback to verify wall-frame-driven adaptive reduction. The observed 85% → 55% reduction is control-path evidence, not a GPU performance result. Results: artifacts/controls-test.json.

## Round 2 — EXPO / City Pavilion

Open `http://127.0.0.1:5171/?scene=exhibition` (or append `?scene=exhibition` to the current public URL). Header links switch between the exhibition and the preserved HELIOS reactor. Both scenes default to **fixed 100%: full native devicePixelRatio (HiDPI), with no DPR cap**, with adaptive resolution **off**. Neither scene silently reduces effects or resolution at high load. Lower fixed resolutions and adaptive mode are opt-in.

The exhibition imports the locally copied `exhibition-spec.json`: 90×64 m open-roof floor, all 24 8×8 m booths at the common coordinates, both cafés, both toilets, information, entrances, and surrounding streets with 32 buildings. Default camera is exactly `[85,95,-105] → [0,0,0]`, vertical FOV 45°, daylight, complexity 35, **120 people**. Crowd count is `round(24 + 1176 * (complexity/100)^2.39)`, capped at **1,200**.

Click a projected stand/facility label or a stand's physical geometry, or use the destination menu. Dijkstra routing draws a ground route from the south entrance and reports its distance. The aisle graph rejects edges intersecting expanded booth or facility footprints; corner cafés/toilets are reached from the outer ±42 m service aisles, avoiding the blocked ±27 m cross-aisle sections. All 30 selectable destinations are tested for reachability and obstacle-free routes. Visitor motion uses those same safe graph edges, with animated arms, legs, shoes, heads and torso bob. This is CPU path following and matrix animation with thin-instance rendering, not a collision-avoidance crowd solver; visitors may overlap one another.

Night mode changes sky, moon/fill lighting, two real hall lights, emissive architectural strips, city windows and bloom. A fixed 2048² PCF shadow map remains enabled in both modes and at all complexities. City cars move on the outer roads. Product displays include furniture, lamps, robots, screens and shelves. HTML labels are projected from 3D positions for crisp text at the common camera distance, with simple overlap spacing. The overhead map, reset, drag/pan/zoom, pause and resolution controls are in the panel. The overhead view retains perspective at a near-vertical angle.

```sh
node exhibition-test.mjs
```

This isolated Chrome test uses exactly **1440×960 CSS pixels and deviceScaleFactor 2** and asserts a **2880×1920 canvas backing buffer**, fixed100%, adaptive off at both default and maximum crowd, 120/1,200 visitors, original-scene preservation, day/night, routes, projected label interaction, camera controls and WebGL2 fallback. Screenshots: `artifacts/exhibition-{day,night,max,map,route,webgl}.png`; structured evidence: `artifacts/exhibition-tests.json`. FPS values are observational wall-frame measurements, not cross-engine benchmark scores.

The later native-HiDPI user instruction supersedes the pixelRatio:1 entry in the preserved shared layout specification. Runtime resolution follows `round(CSS size × devicePixelRatio × selected scale)` in both scenes, including window resize and DPR changes. Manual 50% at 1440×960 CSS / DPR 2 yields 1440×960 backing pixels. No automatic quality change occurs in fixed mode.

Native HiDPI and label regression: `node hidpi-label-test.mjs`. This verifies default and maximum-crowd 2880×1920 backing, readable non-overlapping labels, label selection, exhibition resize to 2400×1600 at 1200×800 CSS / DPR 2, and a live DPR 1.5 change to 2160×1440 at 1440×960 CSS. Results are in `artifacts/hidpi-label-tests.json`. Labels displaced to avoid overlap have leader lines back to their map positions. The original scene's resize and DPR-change assertions are in the main exhibition test.

## Static hosting under GitHub Pages

Both scenes support `https://expofp.github.io/eval-gpu/babylon/` and `https://expofp.github.io/eval-gpu/babylon/?scene=exhibition`. This is the intended deployment location; deployment is handled by the parent project. No development server, tunnel, SPA rewrite, CDN assets or cross-origin headers are needed at runtime. WebGPU requires HTTPS (or localhost).

```sh
npm ci
npm run build
```

Publish **only the contents of `dist/`** into the site's `babylon/` directory. `dist/index.html`, hashed `dist/assets/` chunks, and all `dist/vendor/` compiler JS/WASM files must be copied together. Vite uses `base: './'`; public compiler assets resolve through `import.meta.env.BASE_URL` in `public-assets.js`; header links use relative directory URLs. Native HiDPI and fixed 100% defaults are unchanged. Manifests retain their local/tunnel URLs for the parent assembler to map.

Reproduce the built-artifact subpath check:

```sh
npm run test:static
```

The test rebuilds, copies `dist/` to `.pages-preview/eval-gpu/babylon/`, starts a strict static-file server on **127.0.0.1:5181**, and opens isolated Chrome at that exact nested path. It verifies both scenes, both scene navigation links, native WebGPU and forced WebGL2, local compiler/WASM fetches, day/night, stand and facility routing, overhead/reset controls, manual 50%, and native 2880×1920 backing at 1440×960 CSS / DPR 2 at default and maximum complexity. It records all responses, failed requests, console errors and page errors; any request outside the nested directory fails the test. The test closes its own browser and preview server when complete. Evidence is written to `artifacts/static-subpath-tests.json` and `artifacts/static-*.png`.

On macOS the test uses installed Google Chrome. Set `CHROME_PATH` for another executable, or on Linux run `npx playwright install chromium` first to use Playwright's browser. Set `HEADLESS=1` for headless execution (GPU backend availability depends on the machine). For manual static preview after building, run `npm run preview:pages` and open `http://127.0.0.1:5181/eval-gpu/babylon/`.

`artifacts/`, `.pages-preview/`, `node_modules/` and `dist/` are ignored by Git. Do not publish local tunnel/test logs or tooling directories; the static deployment artifact is `dist/` only. The vendored JS/WASM compiler files are required browser runtime assets, not a private build toolchain.
