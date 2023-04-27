/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#3e5b53',
        secondary: '#71ada8',
        tertiary: '#8dbbb7',
        highlight: '#79ea04',
        danger: '#ff3d00'
      }
    },
    fontFamily: {
      verdana: ['VERDANA', 'sans-serif']
    }
  },
  plugins: []
}
