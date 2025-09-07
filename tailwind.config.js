/** @type {import('tailwindcss').Config} */
const plugin = require("tailwindcss/plugin");

module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./App.tsx", "./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  corePlugins: {
    space: false,
  },
  theme: {
    // NOTE to AI: You can extend the theme with custom colors or styles here.
    extend: {
      // For example, you can add a primary or secondary color here.
      // colors: {
      //   primary: "#INSERT_VALID_HEX_CODE",
      //   secondary: "#INSERT_VALID_HEX_CODE",
      // },
      fontSize: {
        xs: "11px",
        sm: "13px", 
        base: "17px",
        lg: "19px",
        xl: "21px",
        "2xl": "28px",
        "3xl": "34px",
        "4xl": "40px",
        "5xl": "48px",
        "6xl": "56px",
        "7xl": "64px",
        "8xl": "72px",
        "9xl": "80px",
      },
      lineHeight: {
        tight: "1.2",
        snug: "1.3",
        normal: "1.4",
        relaxed: "1.5",
        loose: "1.6",
      },
      spacing: {
        "safe-top": "44px",
        "safe-bottom": "34px",
        "touch-target": "44px",
      },
    },
  },
  darkMode: "class",
  plugins: [
    plugin(({ matchUtilities, theme }) => {
      const spacing = theme("spacing");

      // space-{n}  ->  gap: {n}
      matchUtilities(
        { space: (value) => ({ gap: value }) },
        { values: spacing, type: ["length", "number", "percentage"] }
      );

      // space-x-{n}  ->  column-gap: {n}
      matchUtilities(
        { "space-x": (value) => ({ columnGap: value }) },
        { values: spacing, type: ["length", "number", "percentage"] }
      );

      // space-y-{n}  ->  row-gap: {n}
      matchUtilities(
        { "space-y": (value) => ({ rowGap: value }) },
        { values: spacing, type: ["length", "number", "percentage"] }
      );
    }),
  ],
};
