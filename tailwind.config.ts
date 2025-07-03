import type { Config } from 'tailwindcss'
import plugin from 'tailwindcss/plugin'

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [
    plugin(function ({ addUtilities }) {
      const newUtilities = {
        '.scrollbar-none': {
          '-ms-overflow-style': 'none', // IE 10+
          'scrollbar-width': 'none',    // Firefox
          '&::-webkit-scrollbar': {
            display: 'none',            // Chrome, Safari, Edge
          },
        },
      }
      addUtilities(newUtilities)
    }),
  ],
}

export default config
