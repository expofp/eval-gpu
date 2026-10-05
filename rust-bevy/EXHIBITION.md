# EXPO / City Pavilion

Second real Rust + Bevy + wgpu WASM scene, at `/?scene=exhibition`. Lattice remains at `/`; visible links switch between both. The existing static server on port 5174 and its Cloudflare tunnel serve both scenes.

## Common comparison baseline

The copied `exhibition-spec.json` is the shared layout source, also served in `web/`. Its original DPR=1 setting is explicitly superseded by the user correction recorded in `comparison-overrides.json`. The implementation in `src/exhibition.rs` uses its exact 90 × 64 m floor, 24 booth centers and 8 × 8 m footprints, amenities, roads, and 32 buildings. Default perspective camera is (85,95,-105), target (0,0,0), vertical FOV 45°. Default is day, cutaway walls, complexity 35, and 120 walking people. No auto-orbit.

Both scenes default to **fixed 100% resolution**, native HiDPI: backing width and height are `round(CSS dimension × devicePixelRatio)`. No DPR cap or override is applied. The panel shows the actual backing width × height. Adaptive mode is an explicit optional selection. Fixed mode changes neither resolution nor visual effects when overloaded.

Crowd formula: `round(24 + 1176 * (complexity / 100)^2.39)`, capped at 1,200. Default 35 gives exactly 120; zero gives 24; 100 gives 1,200. At most 24 new articulated people are created per frame. Lowering load hides retained people. The scene is bounded; manual resolution and crowd reduction provide recovery from low frame rate.

## Architecture and interaction

Booths include colored platforms, practical back/wing walls, framing, illuminated signage rails, reception counters, screen graphics, meeting tables/chairs, product plinths and animated products. Cafés include espresso counters and tables/chairs. Toilets contain partitions, doors and sanitary fixtures. The pavilion is surrounded by roads, crossings, buildings with windows and rooftop equipment, trees, planters, benches, streetlights and animated cars. Perimeter walls are 5 m high with a 0.65 m cutaway display option. Roof intentionally omitted.

Readable stand numbers and facility labels are HTML buttons projected from Bevy's 3D camera; they do not render the scene itself. Click a label, floor footprint, or destination directory option to select a destination. Bevy highlights its footprint and draws the walkable route from the South Entrance. The inspector shows its name, use, distance and estimated walking time. Drag to orbit, Shift/right-drag to pan, scroll to zoom. Overhead map and reset/orbit controls are included.

The route graph uses the common circulation axes. Corner café/restroom footprints overlap the nominal ±27 m aisle, so short detours use the outer ±31 m perimeter gap. Destination routes use Dijkstra shortest paths plus orthogonal access spurs, ending outside the destination footprint. Pedestrians walk connected graph edges, rather than cutting diagonally through booths. Visitors have articulated arms/legs and a walking bob. They do not perform person-to-person collision avoidance; some overlap is expected under stress.

## Day / night

A directional light uses real-time cascade shadow maps in both modes. Night changes ambient/sun lighting and sky color, activates nine warm pavilion point lights, and illuminates building windows, stand screens and street fixtures. HDR bloom and tone mapping operate in both modes. Point lights do not cast additional shadows. Moving cars and kinetic product displays remain visible; there is no ray tracing, SSR, SSAO claim or custom compute crowd simulation.

## Measurement and limitations

FPS / wall frame are browser RAF cadence, not GPU timestamp duration. Counts are real active people, fixed booths/buildings, and estimated source mesh triangle counts before culling, excluding additional shadow passes. CPU-driven animation, transform propagation and render submission can limit performance. Comparisons should run one active demo at a time. WebGPU is required; unsupported browsers receive an explanatory screen, with no hidden WebGL substitute.

## Build, run, test

```sh
bash scripts/setup.sh
npm run build
npm start
# In another persistent terminal if a fresh tunnel is needed:
bash scripts/tunnel.sh
# Tests run sequentially in their own Chrome process:
npm run test:exhibition
npm test
```

See `README.md` for local toolchain details. Test evidence is in `tests/exhibition-results.json` and `tests/exhibition-*.png`. The main exhibition test uses a 1440×960 CSS viewport with deviceScaleFactor 2 to catch Retina errors; manual 50% must render 1440×960. It asserts 2880×1920 backing at default and stress load, adaptive off, default and maximum crowds, route obstacle avoidance, walking, camera controls, map, day/night, cutaway, pause, manual recovery, and original-scene preservation. It closes its Chrome process afterward.

## Final native HiDPI evidence

`tests/exhibition-results.json` reports `passed: true`, zero errors and zero failed requests. At CSS 1440×960 / DPR 2, default 120 and maximum 1,200 visitors both kept a 2880×1920 backing buffer, including during 6× CPU-throttled stress with fixed mode enabled. The original scene also retained 2880×1920 at maximum complexity. Manual 50% produced 1440×960. Resizing to CSS 1200×800 yielded 2400×1600; changing DPR live to 1.5 yielded 2160×1440. Both projected-label and direct CSS-coordinate floor picking passed after those changes.

Day, night, maximum-load, overhead-route and close-up screenshots were visually inspected. Articulated people and varied chair/lamp/robot/vehicle products are visible in the detail image. Original-scene regression and unsupported-WebGPU explanations passed separately. Public query HTML and compressed WASM both returned HTTP 200 through the existing tunnel. All automated test browsers closed afterward; the server and tunnel remain running.
