/** @type {import('tailwindcss').Config} */
const path = import.meta.env.VITE_APP_ROOT_PATH;
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {},
    },
    plugins: [],
    base: path,
}