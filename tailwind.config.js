/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        admin: {
          base: '#05050a',
          surface: '#0c0c14',
          elevated: '#14141f',
          border: 'rgba(255,255,255,0.08)',
          accent: '#8b5cf6',
          'accent-muted': '#a78bfa',
        },
        chart: {
          purple: '#a78bfa',
          pink: '#f472b6',
          blue: '#60a5fa',
          green: '#34d399',
          amber: '#fbbf24',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'sans-serif'],
      },
      backgroundImage: {
        'grid-fade':
          'linear-gradient(to bottom, rgba(139,92,246,0.06), transparent), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
        'hero-radial':
          'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(139,92,246,0.25), transparent), radial-gradient(ellipse 60% 40% at 100% 0%, rgba(244,114,182,0.12), transparent)',
      },
      backgroundSize: {
        grid: '24px 24px',
      },
      boxShadow: {
        'glow-violet': '0 0 40px -8px rgba(139, 92, 246, 0.45)',
        'glow-sm': '0 0 24px -10px rgba(139, 92, 246, 0.35)',
        glass: 'inset 0 1px 0 0 rgba(255,255,255,0.06)',
      },
      keyframes: {
        'live-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
      },
      animation: {
        'live-pulse': 'live-pulse 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
