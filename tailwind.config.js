export default {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    fontFamily: {
      mono: ["Courier New", "Consolas", "monospace"],
      sans: ["Inter", "Roboto", "sans-serif"],
    },
    extend: {
      colors: {
        black: "#000000",
        "retro-black": "#1e1e2d",
        "retro-gray": "#2c2c38",
        "retro-green": "#32cd32",
        "retro-teal": "#14b8a6",
        "retro-light-gray": "#d1d5db",
        "retro-dark-gray": "#1f2937",
        "retro-yellow": "#ffff00",
      },
      boxShadow: {
        'retro-glow': '0 0 10px 2px rgba(50, 205, 50, 0.6)',
        'retro-card': '0 4px 6px -1px rgba(44, 44, 56, 0.5), 0 2px 4px -1px rgba(44, 44, 56, 0.25)',
      },
      borderRadius: {
        'retro-rounded': '8px',
      },
      transitionTimingFunction: {
        'retro-ease': 'cubic-bezier(0.25, 1, 0.5, 1)',
      },
      keyframes: {
        blink: {
          '50%': { opacity: '0' },
        },
      },
      animation: {
        blink: 'blink 1s step-end infinite',
      },
    },
  },
  plugins: [],
};
