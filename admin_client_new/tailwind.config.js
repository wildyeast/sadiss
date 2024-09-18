/** @type {import('tailwindcss').Config} */
export default {
  purge: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    colors: {
      black: "#000",
      white: "#fff",
      secondary: "#5A5A5A",
    },
    extend: {
      fontFamily: {
        inter: ["Inter", "sans-serif"],
      },
      fontSize: {
        xss: "11px",
        xs: "12px",
        sm: "14px",
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
