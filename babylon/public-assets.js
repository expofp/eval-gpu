// Vite's relative base resolves against the HTML document, not the hashed JS chunk.
// The same URLs work at /, /eval-gpu/babylon/, and other static hosting prefixes.
const publicBase = new URL(import.meta.env.BASE_URL, document.baseURI);
const asset = path => new URL(path, publicBase).href;
export const compilerOptions = {
  glslang: { jsPath: asset('vendor/glslang/glslang.js'), wasmPath: asset('vendor/glslang/glslang.wasm') },
  twgsl: { jsPath: asset('vendor/twgsl/twgsl.js'), wasmPath: asset('vendor/twgsl/twgsl.wasm') },
};
