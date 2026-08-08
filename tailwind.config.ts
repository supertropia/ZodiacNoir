import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["selector", '[data-theme="noir"]'],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        noir: {
          bg: "#0B0B0D",
          surface: "#15141A",
          surface2: "#1D1B23",
          line: "#2C2A33",
        },
        gold: {
          DEFAULT: "#C9A24B",
          bright: "#E6C878",
          pale: "#EADFC0",
          dim: "#8A733B",
        },
        wine: {
          DEFAULT: "#5C2233",
          bright: "#7A2E42",
        },
        day: {
          bg: "#F5F0E4",
          surface: "#FFFDF8",
          ink: "#221F2A",
        },
      },
      fontFamily: {
        display: ["var(--font-cinzel)", "serif"],
        body: ["var(--font-cormorant)", "serif"],
        ui: ["var(--font-jost)", "sans-serif"],
      },
      letterSpacing: {
        widest2: "0.35em",
      },
      backgroundImage: {
        "velvet-noir":
          "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(201,162,75,0.12), transparent 60%), radial-gradient(ellipse 60% 50% at 90% 110%, rgba(92,34,51,0.18), transparent 60%), #0B0B0D",
        "velvet-day":
          "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(201,162,75,0.10), transparent 60%), #F5F0E4",
      },
    },
  },
  plugins: [],
};

export default config;
