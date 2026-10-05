# PELAGIC — GPU Observatory

Two self-contained Three.js r186 / TSL scenes: Pelagic and EXPO / City Pavilion. No remote textures, models, fonts, or runtime CDN dependencies.

## Setup and run

Requires Node.js 20.19+ (or 22.12+) and npm. Tested with Node 26 and macOS Chrome.

```sh
cd /Users/emt/projects/eval-gpu/three-webgpu
npm ci
npm run dev
```

Open http://127.0.0.1:5172. Production build and server:

```sh
npm run build
npm run preview
```

Both commands bind only this project's server to 127.0.0.1:5172; run only one server at a time. The delivered running instance serves `dist` through Vite preview. Dependencies are exactly pinned; transitive dependencies are locked in package-lock.json.

## Public tunnel

With the server running in one persistent terminal, run in another:

```sh
./scripts/tunnel.sh
```

Requires `cloudflared` on PATH. The script writes `tunnel.log` and `tunnel-url.txt`, and updates `demo-manifest.json` with the newly assigned URL. Restarting creates a different URL. Quick tunnels last only while their process is running. The tunnel exposes the production demo server, not the parent repository. Vite explicitly allows trycloudflare hosts.

## Controls

- Drag to orbit; scroll/pinch to zoom; right drag to pan.
- Click a satellite to track it with an orange selection ring and ID. Click the central heart to change its roughness and inspect the plasma material.
- Complexity continuously increases particle and satellite counts with a quadratic ramp, capped at 120,000 and 1,800 respectively.
- Both scenes default to fixed 100% **native HiDPI** resolution: backing dimensions are `round(CSS width × devicePixelRatio)` by `round(CSS height × devicePixelRatio)`. There is no DPR cap. Adaptive is OFF by default. Select adaptive resolution explicitly or manual 100%, 75%, 50% of native pixel dimensions. At DPR 2, a 1440 × 960 CSS viewport renders at 2880 × 1920 by default; manual 50% renders at 1440 × 960. Opt-in adaptive mode reduces scale by 10 percentage points when the rolling wall-frame average exceeds 26 ms; it recovers by 5 points below 18 ms, every 2.5 seconds, bounded at 50–100%.
- Toggle bloom, scene motion, and automatic orbit independently. Reset restores camera and target.
- `?webgl` forces the WebGL2 fallback for evaluation.

## Implemented techniques and honest limits

1. **TSL wave surface:** 180k-triangle ocean, three analytic sinusoidal displacement terms, matching analytic normals, radial emissive interference bands, physically based direct lighting, and received shadow mapping.
2. **GPU orbital particle field:** a WebGPU compute shader writes per-particle positions into a storage buffer each frame. Instanced additive sprites consume that buffer. WebGL2 evaluates the same deterministic analytic orbit in the vertex shader; it does not run compute. This is an analytic animated field, not a physics fluid simulation.
3. **Plasma and post-processing:** procedural plasma bands and view-dependent Fresnel emission on a physical core; multiple gyroscopic rings; HDR bloom through Three.js RenderPipeline.

The scene includes a shadow-casting directional light, two colored point lights, hemisphere fill, moving beacons, rotating instanced satellites, metallic structures and animated orbital rings. Point lights do not cast shadows. Water is a lit opaque approximation: no planar reflections, ray tracing, volumetrics, or SSR are claimed.

FPS and milliseconds measure rolling request-animation wall intervals, including CPU work and scheduling. They are **not GPU timer measurements**. Submitted triangle and draw-call counters come from renderer.info and include shadow and post passes; they do not represent unique geometry or visible pixels. The graph displays up to 80 ms per sample. Device/browser contention and refresh rate affect the results. Adaptive resolution responds to wall time, so CPU pressure can also reduce it. Extreme load is bounded, but no minimum frame rate is guaranteed. Unsupported WebGPU falls back to WebGL2; failure of both shows the initialization error.

## Validation

With either server running:

```sh
npm test
```

The test uses its own Playwright-launched system Chrome process and closes it after testing. Set `CHROME_PATH` for a different Chrome executable. It checks real WebGPU rendering, low/high complexity, submitted triangle growth, manual resolution, orbit/pan/zoom, satellite picking, bloom/motion controls, adaptive resolution under explicitly synthetic main-thread pressure, mobile layout, and forced WebGL2 rendering. Results and screenshots are in `artifacts/`. Synthetic pressure is used only in tests; displayed production statistics are never substituted.

`artifacts/test-results.json` contains the latest assertions and measured renderer counters. `default.png`, `high.png`, `mobile.png`, and `webgl.png` are browser screenshots. `tunnel-headers.txt` records the public HTTP verification. Production build emits an expected bundle-size advisory for Three.js; npm audit currently reports zero vulnerabilities.

Implementation references: [Three.js compute particles](https://threejs.org/examples/webgpu_compute_particles.html), [WebGPU bloom](https://threejs.org/examples/webgpu_postprocessing_bloom.html), and the installed r186 source. Reference HTML downloaded during development is retained alongside the project.


## Round 2: EXPO / City Pavilion

Open **http://127.0.0.1:5172/?scene=exhibition**, or append `?scene=exhibition` to the URL in `tunnel-url.txt`. Both scenes have visible scene-switch links. The same server and tunnel serve both; no additional processes or ports are needed.

The copied, self-contained `exhibition-spec.json` defines the common layout. Its 90 × 64 m floor, 24 stand positions, cafés, toilets, information desk, entrance/exit, streets, 32 surrounding buildings, and default camera `[85,95,-105]` with 45° vertical FOV are implemented. Daylight and complexity 35 are the initial state. Crowd count is exactly `round(24 + 1176 * (complexity / 100) ** 2.39)`: 24 at zero, **120 at 35**, and **1,200 at 100**.

Stands contain six product families: living-room furniture, bicycles, plants, technology kiosks, ceramics, and architectural models. Cafés contain counters, tables and chairs. The city includes road markings, crossings, moving wheeled cars, windows, trees, benches, and lamp posts. Pavilion boundary walls start in cutaway mode; a checkbox raises them to 5 m.

Select a destination by clicking its floor, wall, counter or sign, or use the accessible destination dropdown. Orange boundaries highlight the selection and an animated orange line follows a Dijkstra route from the south entrance. Distance and approximate walking time appear in the destination card. The graph uses the common aisle coordinates with additional perimeter detours at the corner amenities to avoid walking through them. Booth routes end in the aisle at the open booth frontage. Café/WC routes end beside the amenity footprint; indoor routing within those facilities is not simulated.

The visitors have visible heads, torsos, arms and legs, with independently phased gait swing and bob. CPU path traversal updates GPU-instanced meshes. They remain on the aisle graph and avoid booth/facility footprints, but do **not** perform person-to-person collision avoidance. Some clustering is expected at intersections. They are not compute particles.

Night changes sun/moon and ambient lighting, turns on six real point lights, illuminated city windows, booth/road accents, and stronger bloom. The directional light casts real-time shadows in both modes; the point lights are unshadowed. The entrance pylons and route use animated TSL emission. Two transparent additive cone meshes approximate entrance light beams; these are not volumetric scattering or ray tracing. No external assets are loaded.

Use **Overhead map** for a top-down perspective view with pan/zoom and rotation disabled; **Reset** returns to the exact specified orbit camera. The map is not an orthographic projection. The motion toggle pauses scene motion. Bloom and cutaway walls remain explicit controls. Fixed mode does not reduce resolution, shadows, crowd or effects under load. Manual reduction or opt-in adaptive scaling is available for recovery; no frame-rate guarantee is made.

### Exhibition verification

With the production or development server running:

```sh
npm run test:exhibition
```

`artifacts/exhibition/test-results.json` records a **1440 × 960 CSS viewport with deviceScaleFactor 2**. Assertions cover matching **2880 × 1920 backing pixels** at default and maximum load, fixed 100%, adaptive off, 120/1,200 crowd counts, exact default camera/FOV, fixed mode under synthetic main-thread pressure, walkable graph and destination routes, moving visitors, picking, orbit/pan/zoom, overhead/reset, day/night, toggles, manual scaling, WebGL2 fallback, and original scene preservation. Tests use one isolated Chrome at a time and close it when finished. Screenshots include day, night, maximum load, route map, booth detail, fallback, and the preserved original scene. `exhibition-manifest.json` is the round-2 integration artifact.


### Native HiDPI correction

The user's later native-HiDPI instruction supersedes the original `pixelRatio: 1` field in the copied shared layout specification. The layout file is retained verbatim for provenance; both scene runtimes use native `window.devicePixelRatio` without a cap. CSS viewport coordinates still drive the camera aspect ratio and pointer/raycast input. `src/resolution.js` rounds the requested backing dimensions explicitly (including fractional DPR), handles normal resize events, and detects DPR changes each animation frame, such as moving the window between displays. The test includes same-window DPR changes from 2 to 1.25 and fractional rounding: 1202 × 802 CSS pixels becomes 1503 × 1003 backing pixels. Original and exhibition scenes are both tested.

## Static hosting under a project subpath

Both scenes support the intended GitHub Pages location `https://expofp.github.io/eval-gpu/three-webgpu/` and its `?scene=exhibition` query. Publication is handled by the parent project; the demo manifests retain their existing local/tunnel URLs.

Build with Node 22.12+ and npm:

```sh
npm ci
npm run build
```

Copy **only the contents of `three-webgpu/dist/`** into the site's `three-webgpu/` directory. `dist/index.html` and its `assets/` directory are the complete runtime. No Vite server, tunnel, API, external assets, WASM toolchain, or SPA rewrite is required. Vite uses `base: './'`; generated imports, preload links and CSS references are relative. Scene links use `./` and `./?scene=exhibition`. All runtime assets are bundled imports, generated canvas textures, or embedded data, so there are no separate public-asset URLs to configure. If public files are added later, resolve them using `import.meta.env.BASE_URL` instead of a root-absolute path.

Do not publish the entire source folder. Local logs, diagnostic screenshots, `node_modules`, tunnel details and the `.pages-preview` fixture are excluded from the runtime and ignored for source version control. Existing local `npm run dev` / `npm run preview` and the current tunnel still work at their original root URL.

### Reproduce the nested static smoke test

```sh
npm run test:static
```

This builds `dist`, copies it into `.pages-preview/eval-gpu/three-webgpu/`, starts a strict static file server on **127.0.0.1:5182**, and launches one isolated Chrome process. Requests outside that path and nonexistent files receive 404; there is no SPA fallback to hide broken asset paths. The test checks both scenes, navigation in both directions, direct exhibition query loading, WebGPU/WebGL2, native Retina buffers (2880 × 1920 for 1440 × 960 CSS pixels at DPR 2) at default/max load, night mode, aisle routing, screen-coordinate picking, overhead/reset, crowd counts, and manual half resolution. Console errors, failed requests, HTTP failures and every static request are recorded in `artifacts/static-subpath/results.json`. Screenshots are saved alongside it. The browser and temporary static server close after the test; port 5172 and cloudflared are untouched.

On macOS the test defaults to system Chrome. Set `CHROME_PATH` for another executable; on Linux install Playwright Chromium with `npx playwright install chromium` (or provide `CHROME_PATH`) and set `HEADLESS=1` when no graphical display is available. These browser dependencies are only needed for tests, not the production build.

For a manual nested preview, run `npm run build && npm run preview:static`, then open `http://127.0.0.1:5182/eval-gpu/three-webgpu/`. Stop that temporary preview before running `test:static` on the same port.
