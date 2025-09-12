import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';


export default defineConfig({
    base:"./",
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
