import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { ThemeToggle } from "./ThemeToggle";
import { FontSizeControl } from "./FontSizeControl";
import { SearchBar } from "./SearchBar";
import { AccountMenu } from "./AccountMenu";
import { MobileNav } from "./MobileNav";

const NAV = [
  { href: "/articulos", label: "Artículos" },
  { href: "/signos", label: "Signos" },
  { href: "/efemerides", label: "Efemérides" },
  { href: "/tienda", label: "Tienda" },
  { href: "/membresia", label: "Membresía" },
  { href: "/sobre-nosotros", label: "Sobre nosotros" },
];

export async function Header() {
  const session = await getServerSession(authOptions);
  const isAdmin = isAdminEmail(session?.user?.email);

  return (
    <header className="sticky top-0 z-40 border-b border-gold/15 bg-noir-bg/85 backdrop-blur supports-[backdrop-filter]:bg-noir-bg/70">
      <div className="relative mx-auto max-w-6xl px-5">
        <div className="flex items-center justify-between gap-3 py-3">
          <Link href="/" className="group flex items-center gap-2">
            <svg width="26" height="26" viewBox="0 0 100 100" aria-hidden="true">
              <circle cx="50" cy="50" r="46" fill="none" stroke="#C9A24B" strokeWidth="1.2" />
              <path d="M58 34a18 18 0 100 32 13 13 0 010-32z" fill="#C9A24B" />
            </svg>
            <span className="font-display text-lg tracking-widest2 text-gold-pale group-hover:text-gold">
              ZODIAC <span className="text-gold">NOIR</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-5 font-ui text-[13px] uppercase tracking-wide text-gold-pale/90 xl:flex 2xl:gap-7 2xl:text-sm">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="transition hover:text-gold">
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
              items={NAV}
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
