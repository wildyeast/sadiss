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
      primary: '#3e5b53',
      secondary: '#253833',
      highlight: '#79ea04',
      light: '#faf1f1'
    }
  },
  plugins: []
}
