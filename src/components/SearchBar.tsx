"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type SearchItem = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  sign: string | null;
};

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<SearchItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/articles")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setItems(data.articles ?? []);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return items
      .filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.excerpt.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q) ||
          (a.sign ?? "").toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [query, items]);

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-full border border-gold/40 bg-noir-surface/60 px-3 py-1.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gold">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Buscar temas, signos, tarot…"
          aria-label="Buscar en Zodiac Noir"
          className="w-40 bg-transparent font-ui text-sm text-gold-pale placeholder:text-gold-dim focus:outline-none sm:w-56"
        />
      </div>

      {open && results.length > 0 && (
        <ul className="absolute right-0 z-30 mt-2 w-80 overflow-hidden rounded-xl border border-gold/30 bg-noir-surface shadow-2xl">
          {results.map((a) => (
            <li key={a.slug} className="border-b border-gold/10 last:border-0">
              <Link
                href={`/articulos/${a.slug}`}
                className="block px-4 py-3 font-ui text-sm text-gold-pale transition hover:bg-gold/10"
              >
                <span className="block font-display text-xs uppercase tracking-wide text-gold">{a.category}</span>
                {a.title}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {open && query.trim() && results.length === 0 && (
        <div className="absolute right-0 z-30 mt-2 w-72 rounded-xl border border-gold/30 bg-noir-surface p-4 font-ui text-sm text-gold-dim shadow-2xl">
          No encontramos artículos para "{query}".
        </div>
      )}
    </div>
  );
}
