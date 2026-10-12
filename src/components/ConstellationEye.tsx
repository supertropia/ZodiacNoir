// Los colores salen de las variables del tema (ver globals.css): se ve bien tanto en tema claro como en noir.
export function ConstellationEye({ className = "", size = 120 }: { className?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Emblema Zodiac Noir: ojo y luna creciente enmarcados por el círculo zodiacal"
    >
      <circle cx="100" cy="100" r="92" fill="none" className="stroke-gold" strokeWidth="1.4" opacity="0.8" />
      <circle cx="100" cy="100" r="76" fill="none" className="stroke-gold" strokeWidth="0.8" opacity="0.55" />

      {/* Marcas del círculo zodiacal */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const x1 = 100 + Math.cos(angle) * 84;
        const y1 = 100 + Math.sin(angle) * 84;
        const x2 = 100 + Math.cos(angle) * 92;
        const y2 = 100 + Math.sin(angle) * 92;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} className="stroke-gold" strokeWidth="1.2" opacity="0.7" />;
      })}

      {/* Ojo */}
      <path
        d="M30 100 Q100 55 170 100 Q100 145 30 100 Z"
        fill="none"
        className="stroke-gold"
        strokeWidth="1.8"
      />
      {/* Luna creciente como iris */}
      <path
        d="M112 74 A32 32 0 1 0 112 126 A24 24 0 1 1 112 74 Z"
        className="fill-gold"
      />
      {/* Estrella dentro de la luna */}
      <path
        d="M100 90 L104 98 L112 100 L104 102 L100 110 L96 102 L88 100 L96 98 Z"
        className="fill-[rgb(var(--c-moonstar))]"
        opacity="0.85"
      />

      {/* Estrellas titilantes alrededor */}
      {[
        [45, 55], [155, 50], [40, 150], [160, 148], [100, 25], [100, 175],
      ].map(([cx, cy], i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r="1.8"
          className="twinkle fill-[rgb(var(--c-star))]"
          style={{ animationDelay: `${i * 0.4}s` }}
        />
      ))}
    </svg>
  );
}
