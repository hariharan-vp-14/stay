/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      colors: {
        night: '#0B1021',
        mist: '#e8ecf3',
        accent: '#89CFF0',
        accentDark: '#5BA3D9',
      },
      boxShadow: {
        glow: '0 20px 60px rgba(137, 207, 240, 0.25)',
      },
      backgroundImage: {
        grid: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 0)',
      },
    },
  },
  plugins: [],
};
