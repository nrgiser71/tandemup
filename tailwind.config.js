/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        tandemup: {
          primary: '#3B82F6',
          secondary: '#F59E0B',
          accent: '#10B981',
          neutral: '#374151',
          'base-100': '#FFFFFF',
          info: '#3B82F6',
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
        },
      },
      'light',
    ],
    base: true,
    styled: true,
    utils: true,
    logs: true,
  },
};