/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'conflux-dark': '#1A1B26',
                'conflux-blue': '#3B82F6',
                'conflux-blue-light': '#60A5FA',
                'conflux-accent': '#38BDF8',
                'conflux-text': '#F8FAFC',
                'conflux-text-secondary': '#94A3B8',
                'conflux-border': '#2D3748',
            },
        },
    },
    plugins: [],
};
