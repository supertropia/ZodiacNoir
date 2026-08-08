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
      <circle cx="100" cy="100" r="92" fill="none" stroke="#C9A24B" strokeWidth="1" opacity="0.55" />
      <circle cx="100" cy="100" r="76" fill="none" stroke="#C9A24B" strokeWidth="0.6" opacity="0.4" />

      {/* Marcas del círculo zodiacal */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const x1 = 100 + Math.cos(angle) * 84;
        const y1 = 100 + Math.sin(angle) * 84;
        const x2 = 100 + Math.cos(angle) * 92;
        const y2 = 100 + Math.sin(angle) * 92;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#C9A24B" strokeWidth="1" opacity="0.5" />;
      })}

      {/* Ojo */}
      <path
        d="M30 100 Q100 55 170 100 Q100 145 30 100 Z"
        fill="none"
        stroke="#C9A24B"
        strokeWidth="1.4"
      />
      {/* Luna creciente como iris */}
      <path
        d="M112 74 A32 32 0 1 0 112 126 A24 24 0 1 1 112 74 Z"
        fill="#C9A24B"
      />
      {/* Estrella dentro de la luna */}
      <path
        d="M100 90 L104 98 L112 100 L104 102 L100 110 L96 102 L88 100 L96 98 Z"
        fill="#0B0B0D"
        opacity="0.85"
      />

      {/* Estrellas titilantes alrededor */}
      {[
        [45, 55], [155, 50], [40, 150], [160, 148], [100, 25], [100, 175],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="1.6" fill="#EADFC0" className="twinkle" style={{ animationDelay: `${i * 0.4}s` }} />
      ))}
    </svg>
  );
}
