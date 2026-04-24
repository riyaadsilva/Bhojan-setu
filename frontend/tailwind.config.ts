/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontSize: {
        'main-heading': 'clamp(2.4rem, 4vw, 4rem)',
        'section-heading': 'clamp(1.8rem, 3vw, 2.6rem)',
        'subheading': '1.25rem',
        'body': ['1rem', { lineHeight: '1.65' }],
        'body-large': ['1.1rem', { lineHeight: '1.65' }],
        'small-label': ['0.85rem', { letterSpacing: '0.14em' }],
        'small-label-large': ['0.95rem', { letterSpacing: '0.18em' }],
        'card-label': '0.95rem',
        'important-number': 'clamp(2rem, 2.5vw, 2.8rem)',
      },
      fontWeight: {
        'main-heading': '700',
        'section-heading': '700',
        'subheading': '600',
        'small-label': '600',
        'important-number': '700',
      },
      lineHeight: {
        'main-heading': '1.1',
        'section-heading': '1.2',
        'subheading': '1.4',
        'body': '1.65',
        'important-number': '1.1',
      },
      colors: {
        border: "hsl(240 5.9% 90%)",
        input: "hsl(240 5.9% 90%)",
        ring: "hsl(240 10% 3.9%)",

        background: "hsl(0 0% 100%)",
        foreground: "hsl(240 10% 3.9%)",

        primary: {
          DEFAULT: "#FF5722",
          foreground: "#ffffff",
        },

        muted: {
          DEFAULT: "#f5f5f5",
          foreground: "#6b7280",
        },
        // Custom dark theme colors
        'dark-bg': '#0f0e0b',
        'dark-text': 'rgba(255, 255, 255, 0.95)',
        'dark-text-secondary': 'rgba(255, 255, 255, 0.78)',
        'dark-text-muted': 'rgba(255, 255, 255, 0.72)',
        'dark-accent': '#f2ede4',
        'dark-muted': '#a89b85',
      },
    },
  },
  plugins: [],
};