/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./docs/**/*.html", "./docs/assets/js/**/*.js"],
  theme: {
    extend: {
      colors: {
        // Pulled from the Terra Elemental mark: sky blue, field green and sun yellow.
        sky: { DEFAULT: "#2b7bba", 50: "#eef6fc", 100: "#d6e9f6", 600: "#2b7bba", 700: "#22659a", 800: "#1c527d" },
        field: { DEFAULT: "#01a41d", 50: "#ecfbee", 100: "#cff5d5", 500: "#01a41d", 600: "#028a19", 700: "#056d17" },
        sun: { DEFAULT: "#ffd60a", 300: "#ffe45c", 400: "#ffd60a" },
        forest: {
          50: "#f2f7f3", 100: "#e1ece4", 200: "#c3d9c9", 300: "#98bea3", 400: "#679c77",
          500: "#467f57", 600: "#346544", 700: "#2a5137", 800: "#21402c", 900: "#183022", 950: "#0d1d14",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        serif: ["\"Source Serif 4\"", "Georgia", "serif"],
      },
      maxWidth: { site: "76rem" },
    },
  },
  plugins: [],
};
