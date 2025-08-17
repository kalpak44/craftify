import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
    optimizeDeps: {
        exclude: ['pyodide'],
    },
    define: {
        global: {}, // ✅ mock global to fix sockjs-client issue
    },
    plugins: [
        react(),
        svgr({
            svgrOptions: {
                // svgr options
            },
        }),
    ],
});
