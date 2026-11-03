type Point = { day: string; entries: number; views: number };

function shortDate(day: string): string {
  const [, month, date] = day.split("-");
  return `${date}/${month}`;
}

/** Gráfico de barras de visitas por día. Se dibuja en el servidor, sin librerías. */
export function TrafficChart({ data }: { data: Point[] }) {
  const W = 720;
  const H = 230;
  const padL = 44;
  const padR = 8;
  const padT = 14;
  const padB = 30;

  const rawMax = Math.max(0, ...data.map((d) => d.entries));
  const max = Math.max(4, Math.ceil(rawMax / 4) * 4);
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const slot = plotW / Math.max(1, data.length);
  const barW = Math.max(2, slot * 0.68);
  const ticks = [0, 1, 2, 3, 4].map((i) => (max / 4) * i);
  const y = (value: number) => padT + plotH - (value / max) * plotH;

  const total = data.reduce((sum, d) => sum + d.entries, 0);
  const labelIdx = Array.from(new Set([0, Math.floor((data.length - 1) / 2), data.length - 1]));

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Gráfico de visitas por día: ${total} visitas entre el ${shortDate(data[0]?.day ?? "0-0-0")} y el ${shortDate(
        data[data.length - 1]?.day ?? "0-0-0"
      )}`}
      className="h-auto w-full"
    >
      {ticks.map((t) => (
        <g key={t}>
          <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} className="stroke-gold/20" strokeWidth={1} />
          <text x={padL - 8} y={y(t) + 4} textAnchor="end" className="fill-gold-dim font-ui" fontSize={11}>
            {t}
          </text>
        </g>
      ))}
      {data.map((d, i) => {
        const h = (d.entries / max) * plotH;
        return (
          <rect
            key={d.day}
            x={padL + i * slot + (slot - barW) / 2}
            y={padT + plotH - h}
            width={barW}
            height={Math.max(h, d.entries > 0 ? 1 : 0)}
            rx={1.5}
            className="fill-gold"
          >
            <title>{`${shortDate(d.day)}: ${d.entries} ${d.entries === 1 ? "visita" : "visitas"}, ${d.views} páginas vistas`}</title>
          </rect>
        );
      })}
      {labelIdx.map((i) => (
        <text
          key={i}
          x={padL + i * slot + slot / 2}
          y={H - 8}
          textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"}
          className="fill-gold-dim font-ui"
          fontSize={11}
        >
          {data[i] ? shortDate(data[i].day) : ""}
        </text>
      ))}
    </svg>
  );
}
