import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-gold/15">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:grid-cols-3">
        <div>
          <span className="font-display text-base tracking-widest2 text-gold-pale">
            ZODIAC <span className="text-gold">NOIR</span>
          </span>
          <p className="mt-3 max-w-xs font-ui text-sm leading-relaxed text-gold-dim">
            Astrología revisada, escrita por personas. Revelando lo invisible desde 2026.
          </p>
        </div>

        <div className="font-ui text-sm text-gold-pale/90">
          <p className="mb-3 uppercase tracking-wide text-gold-dim">Explorar</p>
          <ul className="space-y-2">
            <li><Link href="/articulos" className="hover:text-gold">Artículos</Link></li>
            <li><Link href="/signos" className="hover:text-gold">Signos</Link></li>
            <li><Link href="/efemerides" className="hover:text-gold">Efemérides</Link></li>
            <li><Link href="/tienda" className="hover:text-gold">Tienda</Link></li>
            <li><Link href="/membresia" className="hover:text-gold">Membresía</Link></li>
            <li><Link href="/sobre-nosotros" className="hover:text-gold">Editorial y método</Link></li>
          </ul>
        </div>

        <div className="font-ui text-sm text-gold-pale/90">
          <p className="mb-3 uppercase tracking-wide text-gold-dim">Seguinos</p>
          <ul className="space-y-2">
            <li><a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-gold">Instagram</a></li>
            <li><a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-gold">X (Twitter)</a></li>
            <li><a href="https://pinterest.com" target="_blank" rel="noopener noreferrer" className="hover:text-gold">Pinterest</a></li>
          </ul>
        </div>
      </div>
      <div className="gold-line" />
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-6 font-ui text-xs text-gold-dim sm:flex-row sm:items-center sm:justify-between">
        <span>© {new Date().getFullYear()} Zodiac Noir. Contenido con fines de entretenimiento y autoconocimiento.</span>
        <span className="flex gap-4">
          <Link href="/terminos" className="hover:text-gold">Términos y condiciones</Link>
          <Link href="/privacidad" className="hover:text-gold">Privacidad</Link>
          <Link href="/contacto" className="hover:text-gold">Contacto</Link>
        </span>
      </div>
    </footer>
  );
}
