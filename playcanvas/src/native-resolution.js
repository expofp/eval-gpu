// Percentages are relative to the current display's native devicePixelRatio.
// Use explicit rounded backing dimensions; PlayCanvas resizeCanvas floors them.
export function nativeResolution(device, state, onResize = () => {}) {
  const resize = () => {
    const dpr = window.devicePixelRatio || 1;
    state.pixelRatio = dpr;
    device.setResolution(Math.max(1, Math.round(innerWidth * dpr * state.scale)), Math.max(1, Math.round(innerHeight * dpr * state.scale)));
    state.resolution = `${device.width} × ${device.height}`;
    onResize();
  };
  let query;
  const displayChanged = () => { resize(); watchDisplay(); };
  function watchDisplay() {
    if (query) query.removeEventListener('change', displayChanged);
    query = matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
    query.addEventListener('change', displayChanged, { once: true });
  }
  // Some browsers/emulation paths change DPR without firing a media-query event.
  const displayPoll = setInterval(() => {
    if (state.pixelRatio !== (window.devicePixelRatio || 1)) { resize(); watchDisplay(); }
  }, 250);
  addEventListener('pagehide', () => clearInterval(displayPoll), { once: true });
  addEventListener('resize', resize);
  watchDisplay();
  resize();
  return resize;
}
