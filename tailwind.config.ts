import type { Config } from "tailwindcss";

// Los colores de la marca leen variables CSS definidas en src/app/globals.css.
// Así cada tema (claro / noir) cambia la paleta completa sin tocar los componentes,
// y las opacidades de Tailwind (bg-gold/10, text-gold-pale/90…) siguen funcionando.
const token = (name: string) => `rgb(var(${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: ["selector", '[data-theme="noir"]'],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        noir: {
          bg: token("--c-bg"),
          surface: token("--c-surface"),
          surface2: token("--c-surface2"),
          line: token("--c-line"),
        },
        gold: {
          DEFAULT: token("--c-gold"),
          bright: token("--c-gold-bright"),
          pale: token("--c-pale"),
          dim: token("--c-dim"),
        },
        wine: {
          DEFAULT: token("--c-wine"),
          bright: token("--c-wine-bright"),
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
