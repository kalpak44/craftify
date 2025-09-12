import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

const base = process.env.BASE_PATH || '/';

export default defineConfig({
    base,
    optimizeDeps: {
        exclude: [],
    },
    define: {
        global: {},
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
