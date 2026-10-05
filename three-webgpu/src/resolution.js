// Native HiDPI, including fractional DPR. Three.js normally floors buffer sizes;
// pass rounded dimensions back as logical sizes to honor the explicit rounding policy.
// The tiny epsilon prevents IEEE-754 division/multiplication from losing a pixel.
export function nativeResolution(renderer,scale=1){
  const nativeDpr=window.devicePixelRatio||1;
  const pixelRatio=nativeDpr*scale;
  const width=Math.max(1,Math.round(innerWidth*pixelRatio));
  const height=Math.max(1,Math.round(innerHeight*pixelRatio));
  renderer.setDrawingBufferSize((width+1e-7)/pixelRatio,(height+1e-7)/pixelRatio,pixelRatio);
  renderer.domElement.style.width='100%';
  renderer.domElement.style.height='100%';
  return {nativeDpr,pixelRatio,width,height};
}
export function nativeResolutionChanged(renderer,scale){
  return renderer.getPixelRatio()!==(window.devicePixelRatio||1)*scale;
}
