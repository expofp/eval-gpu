# Heliogarden

A self-contained procedural GPU field study built with PlayCanvas 2.23.0. No downloaded models, textures, fonts, or runtime CDN dependencies.

## Run

Requires Node.js 22.12+ (or a current Node 24), npm, and a modern browser.

```sh
cd playcanvas
npm ci
npm run dev
```

Open http://127.0.0.1:5173. The server binds only localhost and uses strict port 5173. A secure context is required for WebGPU; localhost and the HTTPS tunnel qualify. WebGL2 is automatically used when WebGPU initialization is unavailable. Force the fallback with `?backend=webgl`.

```sh
npm run build
# Stop the development server before using the same port:
npm run preview
```

## Public tunnel

In a separate persistent terminal, with the server running:

```sh
./scripts/tunnel.sh
```

The script launches this project's own cloudflared quick tunnel and writes `tunnel.log` and `tunnel-url.txt`. Each restart receives a new URL. Only `.trycloudflare.com` is additionally allowed by Vite. This is a public unauthenticated demo; do not put secrets in this directory. Active URL at delivery: https://precise-amp-arcade-colin.trycloudflare.com.

## Interaction

Drag to orbit, Shift-drag or right-drag to pan, scroll to zoom. Click the central reactor or the six satellite lanterns to inspect. Pause freezes the animation; reset restores the camera; automatic orbit can be toggled separately. The complexity slider increases crystal density quadratically and pollen/skyline counts linearly, from 380 to 17,580 instances. Mobile supports one-finger orbit and the same on-screen controls; pinch zoom is not implemented.

## Rendering

- Procedural bronze gyroscopic reactor, jade crystal beds, radial industrial platform, and distant infrastructure.
- Hardware-instanced faceted crystals, skyline and animated pollen. Pollen transforms are CPU simulated and uploaded to one instance buffer; this is not compute simulation.
- Clustered dynamic point lighting: one central light, six animated satellite lights, two shadow-casting satellites, and a shadow-casting directional key.
- Real-time raster shadow maps, physically based metallic/rough surfaces, exponential distance fog.
- PlayCanvas CameraFrame HDR bloom, ACES tone mapping, screen-space ambient occlusion, and vignette.

## Honest measurement and bounds

FPS and wall-frame milliseconds are rolling averages of actual browser frame intervals. They include scheduling and CPU/GPU effects and are **not GPU timestamps**. Draw calls and submitted triangle counts come from PlayCanvas AppStats (including repeated shadow/post passes); instance count is this demo's active procedural instance count. Render size is the actual backing-buffer size, at the display’s native device pixel ratio.

Both scenes start at fixed 100% resolution with adaptive quality off. Opt-in adaptive quality reduces resolution in 10-point steps down to 50% when the rolling frame time exceeds 23 ms, and recovers in 5-point steps below 17.5 ms. Decisions have a three-second cooldown. SSAO switches off below 70%. Manual 100%, 75%, and 50% resolution policies are available. No quality preference is persisted. Shared GPU contention and headless browser scheduling can influence these measurements; this is an interactive evaluation, not an isolated hardware benchmark.

All instance buffers are preallocated and total work is capped. Off-tab rendering is suspended. No hardware ray tracing, reflection capture, compute particles, GPU timestamps, or automatic benchmark score is claimed. Pause stops simulation, but leaves rendering running for inspection.

## Tests

```sh
npm test
```

Requires the server on port 5173. Uses its own headless system Chrome process/profile through Playwright and closes it after testing. Default macOS executable is `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`; override with `CHROME_PATH` on other systems. Tests inspect backend, full backing resolution, low/high complexity, click selection, orbit/pan/zoom/reset, pause/resume, manual resolution/AO policy, automatic orbit, WebGL2 fallback, and browser errors. Screenshots and measured samples are saved in `evidence/`. `evidence/tunnel-http.txt` records the verified public HTTP response. The default screenshot is captured at manual 100% to make image review independent of temporary GPU contention.

`demo-manifest.json` is the root integration artifact. `server.log` / `tunnel.log` and PID files from early startup may exist; active delivery processes are persistent terminal sessions, not detached nohup jobs. Stop the corresponding terminal session to stop them.

## Round 2: EXPO / City Pavilion

Open `http://127.0.0.1:5173/?scene=exhibition` or the same query on the public tunnel. Visible navigation switches between the two scenes. Both use the actual PlayCanvas engine and both now default to **fixed 100%, adaptive off, full native device pixel ratio**. A 1440×960 CSS viewport at devicePixelRatio2 therefore creates a 2880×1920 backing buffer. Dimensions are `round(CSS size × devicePixelRatio × resolutionScale)`; 50% produces1440×960 on that same display. Both window resizes and live display/DPR changes update the backing buffer. Camera, pointer picking and HTML labels remain in CSS coordinates. Fixed mode never silently lowers resolution or effects; manual 75%/50% and opt-in adaptation provide recovery.

The self-contained `exhibition-spec.json` is copied from the coordinator's shared specification. Pavilion size is 90×64 m; all 24 booths, both cafés, both restrooms, entrance/exit, information desk, road positions, and the initial perspective camera follow it. Default view is [85,95,-105] looking at the origin, vertical FOV 45°. Default daylight and complexity35 produce exactly120 visitors. Crowd count is `round(24 + 1176 * (complexity / 100)^2.39)`, reaching1200 at100.

The city includes32 procedural buildings, windows, streetlights, roads/crosswalks, moving cars, benches and trees. The open-roof pavilion includes display products/plinths, reception desks with terminals, café tables/chairs, WC partitions, potted plants and illuminated booth beams. Static elements are hardware instanced. Each visitor has13 instanced articulated body parts with a changing walk cycle, moving along a connected aisle graph. Visitors are CPU simulated; no compute simulation is claimed. Person-to-person collision avoidance is not implemented; their randomized lane offsets reduce exact overlap.

Click a stand/facility label or its floor footprint, or choose it in the destination selector. Dijkstra routing starts at the south entrance and follows walkable aisle edges, plus short destination spurs. The route is highlighted in amber with animated flow markers, distance and approximate walk time. The corner cafés/WCs overlap nominal z=±27 aisles, so the graph detours around their footprints via z=±31. The two southern corner booths have north-side access/gaps; their routes approach from z=-14. No booths or facilities move to accommodate this.

Night mode changes sunlight to moonlight, enables14 local lights (six pavilion spots and eight promenade lights), lights city windows, and increases HDR bloom accents. Two pavilion spotlights and the directional light cast real-time shadows. Daylight retains directional shadows. Map view is orthographic; orbit view retains mouse orbit, Shift/right-drag pan, wheel zoom and reset. Exterior walls switch between1.1m cutaway and5m full height; labels can be toggled. Pause stops people and city traffic.

```sh
# Run with the development server already active:
node scripts/exhibition-test.mjs
```

The test uses an isolated Chrome process, CSS1440×960 and deviceScaleFactor2. Evidence is written under `evidence/exhibition/`, including default/day (with an additional full native2880×1920 capture), night, max crowd, map, route and WebGL fallback screenshots. It asserts native2880×1920 backing under both default and max load for both scenes, half-native manual resolution, live DPR and viewport changes, people counts, initial camera, all route/aisle footprint checks, controls and original scene preservation. FPS observations are not cross-engine comparisons and may reflect external GPU contention.

Remaining limits: software crowd animation and lane routing rather than full crowd collision avoidance; graph distance estimates rather than accessibility certification; open roof has no indoor ceiling; screen-space ambient occlusion and raster shadows rather than ray tracing; labels are HTML overlays; no GPU timestamps; touch pinch is not implemented. Geometry, fonts and materials require no external asset requests.

## Static hosting / GitHub Pages

The Vite production build uses `base: './'`. Publish **only the contents of `dist/`** into the site's `playcanvas/` directory. Both scenes work below the GitHub project path:

- Planned original URL: `https://expofp.github.io/eval-gpu/playcanvas/`
- Planned exhibition URL: `https://expofp.github.io/eval-gpu/playcanvas/?scene=exhibition`

These are deployment targets, not a claim that this worker published them. The parent project owns the repository, Pages workflow, and deployment. Existing manifest URLs intentionally continue to reference the running local/tunnel demos until the parent assembler maps them.

```sh
npm ci
npm run build
# Copy dist/* to the parent's Pages artifact at playcanvas/.
```

HTML scene links use Vite's `%BASE_URL%`; runtime exhibition links use `import.meta.env.BASE_URL`. The entry module and all bundled JS/CSS/chunk URLs are relative. There are no runtime models, textures, compiler/WASM downloads, font CDNs, API endpoints or other external assets to relocate. The WebGPU path uses PlayCanvas's native WGSL rendering support; WebGL2 fallback is included. The app's source JSON layout is compiled into the bundle.

Reproduce the production-subpath smoke test:

```sh
npm run test:static
```

This builds the actual distribution, starts a temporary strict static server on **127.0.0.1:5183** with only `/eval-gpu/playcanvas/` mounted, tests it in its own Chrome process, then closes that browser and server. It does not use Vite's development transforms or SPA fallback, and domain-root assets deliberately return404. Set `CHROME_PATH` to another installed Chrome executable if needed.

The test covers both scenes and both backends, visible scene navigation in both directions, original object selection, exhibition destination route/map/night mode, crowd120→1200, native HiDPI2880×1920 at CSS1440×960/DPR2, fixed resolution under maximum load, and manual50% native resolution. It records every browser request and fails on console/runtime/network/HTTP errors or any request outside the mounted project directory. Results and screenshots are in `evidence/static-subpath/`.

For manual inspection, `npm run preview:subpath` starts the same strict server; open `http://127.0.0.1:5183/eval-gpu/playcanvas/`. The existing development server on5173 and its tunnel are unaffected.

Source control excludes `node_modules/`, `dist/`, temporary preview folders, PID files, logs, and the generated tunnel URL file. No private server/tunnel logs or local toolchains should be copied to the Pages artifact; publish only `dist/`.

Both scenes explicitly import `playcanvas/profiler`, the official engine build that retains rendering counters in production. This keeps the live triangle/draw-call telemetry available after Vite production optimization; the static smoke test asserts nonzero engine triangle counts. GPU timestamp collection is still not enabled or claimed.
