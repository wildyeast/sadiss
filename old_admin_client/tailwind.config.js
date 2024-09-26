/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        verdana: ['VERDANA', 'sans-serif'],
        'verdana-bold': ['VERDANA-BOLD', 'bold']
      }
    },
    colors: {
      primary: '#5A5A5A',
      secondary: '#71ada8',
      highlight: '#79ea04',
      light: '#faf1f1',
      danger: '#ff3d00'
    }
  },
  plugins: []
}
