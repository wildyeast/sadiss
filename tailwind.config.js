module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3E5B53',
        secondary: '#79EA04',
        tertiary: '#FFF'
      },
      fontFamily: {
        'sans': ['Verdana']
      }
    },
  },
  plugins: [],
}
