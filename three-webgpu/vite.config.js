import { defineConfig } from 'vite';
export default defineConfig({base:'./',server:{host:'127.0.0.1',port:5172,strictPort:true,allowedHosts:['.trycloudflare.com'],fs:{strict:true,allow:[process.cwd()]}},preview:{host:'127.0.0.1',port:5172,strictPort:true,allowedHosts:['.trycloudflare.com']}});
