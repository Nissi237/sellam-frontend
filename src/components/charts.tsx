// Lightweight, dependency-free SVG charts, theme-aware via the palette CSS vars.
// Design follows the dataviz method: single hue for magnitude/time, two well-
// separated hues (leaf vs clay) for two-series, recessive grid, direct labels,
// native hover tooltips (<title>).

const LEAF = "var(--color-leaf)";
const CLAY = "var(--color-clay)";
const FOREST = "var(--color-forest-800)";
const GRID = "var(--color-forest-300)";
const INK = "var(--color-forest-500)";

const fmtCompact = (v: number) =>
  v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`;

// ---------------------------------------------------------------------------
// Bar chart — single series (magnitude / time). One hue.
// ---------------------------------------------------------------------------
export function BarChart({
  data,
  height = 160,
  format = fmtCompact,
  color = LEAF,
}: {
  data: { label: string; value: number; hover?: string }[];
  height?: number;
  format?: (v: number) => string;
  color?: string;
}) {
  const n = Math.max(data.length, 1);
  const W = Math.max(320, n * 44);
  const padTop = 12, padBottom = 24, padX = 6;
  const chartH = height - padTop - padBottom;
  const max = Math.max(...data.map((d) => d.value), 1);
  const slot = (W - padX * 2) / n;
  const barW = Math.min(slot * 0.6, 34);

  return (
    <svg viewBox={`0 0 ${W} ${height}`} width="100%" height={height} role="img" preserveAspectRatio="none">
      {/* recessive baseline */}
      <line x1={padX} y1={padTop + chartH} x2={W - padX} y2={padTop + chartH} stroke={GRID} strokeWidth={1} />
      {data.map((d, i) => {
        const h = Math.max((d.value / max) * chartH, d.value > 0 ? 3 : 0);
        const x = padX + i * slot + (slot - barW) / 2;
        const y = padTop + chartH - h;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={h} rx={4} fill={color}>
              <title>{d.hover ?? `${d.label}: ${format(d.value)}`}</title>
            </rect>
            <text x={x + barW / 2} y={height - 8} textAnchor="middle" fontSize={10} fill={INK}>
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Line chart — one or two series over time.
// ---------------------------------------------------------------------------
export function LineChart({
  labels,
  series,
  height = 180,
  format = fmtCompact,
}: {
  labels: string[];
  series: { name: string; color: string; values: number[] }[];
  height?: number;
  format?: (v: number) => string;
}) {
  const n = Math.max(labels.length, 1);
  const W = Math.max(340, n * 26);
  const padTop = 12, padBottom = 24, padL = 30, padR = 8;
  const chartH = height - padTop - padBottom;
  const chartW = W - padL - padR;
  const max = Math.max(...series.flatMap((s) => s.values), 1);
  const x = (i: number) => padL + (n === 1 ? chartW / 2 : (i / (n - 1)) * chartW);
  const y = (v: number) => padTop + chartH - (v / max) * chartH;

  const gridLines = [0, 0.5, 1];

  return (
    <svg viewBox={`0 0 ${W} ${height}`} width="100%" height={height} role="img" preserveAspectRatio="none">
      {gridLines.map((g, i) => (
        <g key={i}>
          <line x1={padL} y1={padTop + chartH * (1 - g)} x2={W - padR} y2={padTop + chartH * (1 - g)} stroke={GRID} strokeWidth={1} strokeDasharray="2 4" />
          <text x={4} y={padTop + chartH * (1 - g) + 3} fontSize={9} fill={INK}>{format(max * g)}</text>
        </g>
      ))}
      {series.map((s) => (
        <g key={s.name}>
          <polyline
            fill="none"
            stroke={s.color}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(" ")}
          />
          {s.values.map((v, i) => (
            <circle key={i} cx={x(i)} cy={y(v)} r={2.5} fill={s.color}>
              <title>{`${labels[i]} — ${s.name}: ${format(v)}`}</title>
            </circle>
          ))}
        </g>
      ))}
      {labels.map((l, i) =>
        i % Math.ceil(n / 8) === 0 ? (
          <text key={i} x={x(i)} y={height - 8} textAnchor="middle" fontSize={9} fill={INK}>{l}</text>
        ) : null
      )}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Donut chart — part-to-whole.
// ---------------------------------------------------------------------------
export function DonutChart({
  segments,
  size = 160,
  centerLabel,
  centerValue,
}: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
  centerLabel?: string;
  centerValue?: string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = size / 2;
  const stroke = size * 0.16;
  const radius = r - stroke / 2 - 2;
  const circ = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img">
      <g transform={`rotate(-90 ${r} ${r})`}>
        {segments.map((s, i) => {
          const frac = s.value / total;
          const dash = frac * circ;
          const el = (
            <circle
              key={i}
              cx={r}
              cy={r}
              r={radius}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            >
              <title>{`${s.label}: ${Math.round(frac * 100)}%`}</title>
            </circle>
          );
          offset += dash;
          return el;
        })}
      </g>
      {centerValue && (
        <text x={r} y={r - 2} textAnchor="middle" fontSize={size * 0.16} fontWeight={700} fill="var(--color-forest-950)">
          {centerValue}
        </text>
      )}
      {centerLabel && (
        <text x={r} y={r + size * 0.12} textAnchor="middle" fontSize={size * 0.075} fill={INK}>
          {centerLabel}
        </text>
      )}
    </svg>
  );
}

export const CHART_COLORS = { LEAF, CLAY, FOREST, GRID, INK };
