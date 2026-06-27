/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: [
    "./src/pages/**/*.{js,jsx}",
    "./src/components/**/*.{js,jsx}",
    "./src/app/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark': {
          'bg': 'rgb(var(--color-bg-primary) / <alpha-value>)',
          'bg-secondary': 'rgb(var(--color-bg-secondary) / <alpha-value>)',
          'bg-tertiary': 'rgb(var(--color-bg-tertiary) / <alpha-value>)',
          'bg-hover': 'rgb(var(--color-bg-hover) / <alpha-value>)',
          'border': 'rgb(var(--color-border) / <alpha-value>)',
          'border-light': 'rgb(var(--color-border-light) / <alpha-value>)',
          'text': 'rgb(var(--color-text-primary) / <alpha-value>)',
          'text-secondary': 'rgb(var(--color-text-secondary) / <alpha-value>)',
          'text-muted': 'rgb(var(--color-text-muted) / <alpha-value>)',
        },
        'accent': {
          'primary': 'rgb(var(--color-accent-primary) / <alpha-value>)',
          'secondary': 'rgb(var(--color-accent-secondary) / <alpha-value>)',
          'light': 'rgb(var(--color-accent-light) / <alpha-value>)',
          'dark': 'rgb(var(--color-accent-dark) / <alpha-value>)',
        },
      },
      boxShadow: {
        'dark-sm': '0 1px 2px var(--shadow-color)',
        'dark-md': '0 4px 6px var(--shadow-color)',
        'dark-lg': '0 10px 15px var(--shadow-color)',
        'dark-xl': '0 20px 25px var(--shadow-color)',
        'glow': '0 0 20px var(--shadow-glow)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};