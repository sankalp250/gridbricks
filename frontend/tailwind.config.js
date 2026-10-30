/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bone: "#FBFBFA",
        surface: "#FFFFFF",
        charcoal: "#111111",
        muted: "#787774",
        borderline: "#EAEAEA",
        pastel: {
          red: "#FDEBEC",
          redText: "#9F2F2D",
          green: "#EDF3EC",
          greenText: "#346538",
          blue: "#E1F3FE",
          blueText: "#1F6C9F",
          yellow: "#FBF3DB",
          yellowText: "#956400",
        }
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "'SF Pro Display'",
          "'Geist Sans'",
          "'Helvetica Neue'",
          "sans-serif"
        ],
        mono: [
          "'SF Mono'",
          "'Geist Mono'",
          "'JetBrains Mono'",
          "Menlo",
          "monospace"
        ]
      }
    },
  },
  plugins: [],
}
