const colors = require("tailwindcss/colors")

module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontSize: {
        xxs: ".6rem",
      },
      fontFamily: {
        serif:
          '"Merriweather", "Georgia", Cambria, "Times New Roman", Times, serif',
      },
      colors: {
        gray: colors.gray,
      },
      typography: {
        DEFAULT: {
          css: {
            "code::before": {
              content: '""',
            },
            "code::after": {
              content: '""',
            },
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
}
