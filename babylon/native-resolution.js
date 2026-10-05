// 100% = uncapped native devicePixelRatio. Percentages are relative to native pixels.
export function nativeResolution(engine, canvas) {
  let scale = 1, previousDpr = 0;
  function sync() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width * dpr * scale));
    const height = Math.max(1, Math.round(rect.height * dpr * scale));
    const hardwareScale = 1 / (dpr * scale);
    if (previousDpr !== dpr || engine.getHardwareScalingLevel() !== hardwareScale) {
      previousDpr = dpr;
      engine.setHardwareScalingLevel(hardwareScale);
    }
    // Babylon truncates fractional dimensions; explicitly round to the requested backing size.
    if (canvas.width !== width || canvas.height !== height) engine.setSize(width, height);
  }
  window.addEventListener('resize', sync);
  const observer = new ResizeObserver(sync); observer.observe(canvas);
  sync();
  return { sync, setScale(value) { scale = value; sync(); }, get dpr() { return window.devicePixelRatio || 1; } };
}
