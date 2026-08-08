"use client";

import { usePrefs } from "./Providers";

export function ThemeToggle() {
  const { theme, toggleTheme } = usePrefs();

  return (
    <button
      onClick={toggleTheme}
      aria-label={theme === "noir" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
      className="focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-gold/40 text-gold transition hover:border-gold hover:bg-gold/10"
      title={theme === "noir" ? "Tema claro" : "Tema noir"}
    >
      {theme === "noir" ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="4.5" />
          <path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.5 14.5A8.5 8.5 0 019.5 3.5a9 9 0 1011 11z" />
        </svg>
      )}
    </button>
  );
}
