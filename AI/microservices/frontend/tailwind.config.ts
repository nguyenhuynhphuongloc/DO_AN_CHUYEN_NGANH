import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#111827',
        paper: '#fffdf8',
        accent: '#0f766e',
        sand: '#f4e7d3',
        clay: '#d7c3a5',
      },
    },
  },
  plugins: [],
};

export default config;
