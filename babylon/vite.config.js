import { defineConfig } from 'vite';
export default defineConfig({base:'./',server:{allowedHosts:['.trycloudflare.com']},build:{chunkSizeWarningLimit:2000}});
