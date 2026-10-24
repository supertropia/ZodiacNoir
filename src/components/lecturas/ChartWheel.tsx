import { signs } from "@/data/signs";

// Rueda de carta natal decorativa (no representa ninguna carta real). Los colores salen de las
// variables del tema (ver globals.css): se ve bien en el tema claro y en el noir.
export function ChartWheel({ size = 360, className = "" }: { size?: number; className?: string }) {
  const c = 200;

  // Punto sobre un círculo: 0° arriba, avanzando en el sentido de las agujas del reloj.
  const point = (radius: number, deg: number): [number, number] => {
    const angle = ((deg - 90) * Math.PI) / 180;
    return [c + radius * Math.cos(angle), c + radius * Math.sin(angle)];
  };

  const planets = [18, 66, 112, 151, 207, 249, 301, 337];
  const aspectPoints = [18, 138, 258, 66, 246];

  return (
    <svg
      viewBox="0 0 400 400"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Ilustración de una carta natal: círculo zodiacal con casas, planetas y aspectos"
    >
      <circle cx={c} cy={c} r="190" fill="none" className="stroke-gold" strokeWidth="1.6" opacity="0.85" />
      <circle cx={c} cy={c} r="150" fill="none" className="stroke-gold" strokeWidth="1" opacity="0.7" />
      <circle cx={c} cy={c} r="72" fill="none" className="stroke-gold" strokeWidth="1" opacity="0.6" />
      <circle cx={c} cy={c} r="196" fill="none" className="stroke-gold" strokeWidth="0.6" opacity="0.4" />

      {/* Los doce signos: divisiones y glifos */}
      {signs.map((sign, i) => {
        const [x1, y1] = point(150, i * 30);
        const [x2, y2] = point(190, i * 30);
        const [gx, gy] = point(170, i * 30 + 15);
        return (
          <g key={sign.slug}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} className="stroke-gold" strokeWidth="1" opacity="0.7" />
            <text
              x={gx}
              y={gy}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="19"
              className="fill-gold"
              style={{ fontFamily: "var(--font-cinzel), serif" }}
            >
              {sign.glyph}
              {"︎"}
            </text>
          </g>
        );
      })}

      {/* Las doce casas */}
      {Array.from({ length: 12 }).map((_, i) => {
        const [x1, y1] = point(72, i * 30 + 8);
        const [x2, y2] = point(150, i * 30 + 8);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} className="stroke-gold" strokeWidth="0.8" opacity="0.5" />;
      })}

      {/* Eje Ascendente – Descendente */}
      <line x1={c - 196} y1={c} x2={c + 196} y2={c} className="stroke-gold" strokeWidth="1.4" opacity="0.8" />

      {/* Aspectos */}
      <polygon
        points={aspectPoints
          .slice(0, 3)
          .map((deg) => point(72, deg).join(","))
          .join(" ")}
        fill="none"
        className="stroke-gold"
        strokeWidth="0.9"
        opacity="0.75"
      />
      <line
        x1={point(72, aspectPoints[3])[0]}
        y1={point(72, aspectPoints[3])[1]}
        x2={point(72, aspectPoints[4])[0]}
        y2={point(72, aspectPoints[4])[1]}
        className="stroke-gold"
        strokeWidth="0.9"
        opacity="0.55"
      />

      {/* Planetas */}
      {planets.map((deg, i) => {
        const [x, y] = point(118 + (i % 2 === 0 ? 0 : 12), deg);
        return (
          <g key={deg}>
            <circle cx={x} cy={y} r="6.5" className="fill-noir-bg stroke-gold" strokeWidth="1.2" />
            <circle
              cx={x}
              cy={y}
              r="2.4"
              className="twinkle fill-gold"
              style={{ animationDelay: `${i * 0.45}s` }}
            />
          </g>
        );
      })}

      <circle cx={c} cy={c} r="3" className="fill-gold" />
    </svg>
  );
}
