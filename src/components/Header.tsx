import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { ThemeToggle } from "./ThemeToggle";
import { FontSizeControl } from "./FontSizeControl";
import { SearchBar } from "./SearchBar";
import { AccountMenu } from "./AccountMenu";
import { MobileNav } from "./MobileNav";
import { getReadingsEnabled } from "@/lib/site-settings";

type NavEntry = { href: string; label: string; highlight?: boolean; mobileOnly?: boolean };

// "Lecturas" va primero y resaltada: es el servicio central del sitio. "Membresía" también va resaltada.
// "Sobre nosotros" queda solo en el menú del celular (en escritorio es accesible desde el pie de página
// y no entra en la barra junto a los otros siete enlaces).
const NAV: NavEntry[] = [
  { href: "/lecturas", label: "Lecturas", highlight: true },
  { href: "/blog", label: "Blog" },
  { href: "/signos", label: "Signos" },
  { href: "/efemerides", label: "Efemérides" },
  { href: "/tienda", label: "Tienda" },
  { href: "/membresia", label: "Membresía", highlight: true },
  { href: "/sobre-nosotros", label: "Sobre nosotros", mobileOnly: true },
];

export async function Header() {
  const session = await getServerSession(authOptions);
  const isAdmin = isAdminEmail(session?.user?.email);
  // "Lecturas" solo aparece en el menú cuando se publican desde el panel.
  const readingsEnabled = await getReadingsEnabled();
  const navItems = NAV.filter((item) => readingsEnabled || item.href !== "/lecturas");

  return (
    <header className="sticky top-0 z-40 border-b border-gold/15 bg-noir-bg/85 backdrop-blur supports-[backdrop-filter]:bg-noir-bg/70">
      <div className="relative mx-auto max-w-6xl px-5">
        <div className="flex items-center justify-between gap-3 py-3">
          <Link href="/" className="group flex items-center gap-2">
            {/* Marca: disco negro con aro y luna dorados (destaca sobre el fondo claro) */}
            <svg width="40" height="40" viewBox="0 0 100 100" aria-hidden="true">
              <circle cx="50" cy="50" r="49" fill="#120D1C" />
              <circle cx="50" cy="50" r="44" fill="none" stroke="#C9A24B" strokeWidth="2.5" />
              <path d="M58 34a18 18 0 100 32 13 13 0 010-32z" fill="#E0B13A" />
              <circle cx="73" cy="66" r="2.6" fill="#E0B13A" />
              <circle cx="76" cy="35" r="2" fill="#E0B13A" />
            </svg>
            <span className="font-display text-lg font-bold tracking-widest2 text-gold-pale group-hover:text-gold">
              ZODIAC <span className="text-gold">NOIR</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-5 font-ui text-[13px] uppercase tracking-wide text-gold-pale/90 xl:flex 2xl:gap-7 2xl:text-sm">
            {navItems.filter((item) => !item.mobileOnly).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={
                  item.highlight
                    ? "rounded-full border border-gold bg-gold/10 px-3.5 py-1 text-gold transition hover:bg-gold hover:text-noir-bg"
                    : "transition hover:text-gold"
                }
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <SearchBar />
            </div>
            <FontSizeControl />
            <ThemeToggle />
            <div className="hidden xl:block">
              <AccountMenu
                name={session?.user?.name}
                email={session?.user?.email}
                image={session?.user?.image}
                isAdmin={isAdmin}
              />
            </div>
            <MobileNav
              items={navItems}
              isAdmin={isAdmin}
              name={session?.user?.name}
              email={session?.user?.email}
              image={session?.user?.image}
            />
          </div>
        </div>

        <div className="border-t border-gold/10 py-2 sm:hidden">
          <SearchBar />
        </div>
      </div>
    </header>
  );
}
