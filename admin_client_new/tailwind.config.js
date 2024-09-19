/** @type {import('tailwindcss').Config} */
export default {
  purge: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    colors: {
      black: "#000",
      white: "#fff",
      secondary: "#5A5A5A",
      middlegrey: "#F5F5F5",
      "input-border": "#C2C2C2",
      "button-bg": "#2C2C2C",
    },
    extend: {
      fontFamily: {
        inter: ["Inter", "sans-serif"],
      },
      fontSize: {
        xss: "11px",
        xs: "12px",
        sm: "14px",
        md: "16px",
        lg: "20px",
        xl: "32px",
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
