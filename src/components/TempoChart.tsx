import { useRef, useState, type PointerEvent } from "react";

export interface TempoPoint {
  date: string;
  bpm: number;
}

interface Props {
  points: TempoPoint[];
  goal: number;
  /** Accessible name, also used as the table caption. */
  title: string;
}

const W = 340;
const H = 190;
const PAD = { top: 16, right: 16, bottom: 26, left: 34 };

function shortDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Single-series line of the fastest clean tempo per day, with the goal as a dashed reference line. */
export function TempoChart({ points, goal, title }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const values = points.map((p) => p.bpm);
  const lo = Math.floor((Math.min(goal - 30, ...values) - 5) / 10) * 10;
  const hi = Math.ceil((Math.max(goal + 5, ...values) + 5) / 10) * 10;
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (points.length <= 1 ? plotW / 2 : (i / (points.length - 1)) * plotW);
  const y = (v: number) => PAD.top + (1 - (v - lo) / (hi - lo)) * plotH;
  const ticks: number[] = [];
  for (let t = lo; t <= hi; t += 20) ticks.push(t);

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.bpm).toFixed(1)}`).join(" ");
  const last = points.length - 1;

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg || points.length === 0) return;
    const rect = svg.getBoundingClientRect();
    const sx = ((e.clientX - rect.left) / rect.width) * W;
    let best = 0;
    let dist = Infinity;
    points.forEach((_, i) => {
      const d = Math.abs(x(i) - sx);
      if (d < dist) {
        dist = d;
        best = i;
      }
    });
    setHover(best);
  };

  const h = hover !== null ? points[hover] : null;
  const tipX = hover !== null ? Math.min(Math.max(x(hover), PAD.left + 44), W - PAD.right - 44) : 0;

  return (
    <figure className="chart">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${title}. ${points.length ? `Latest ${points[last].bpm} bpm, goal ${goal}.` : "No clean runs yet."}`}
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={() => setHover(null)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line className="chart-grid" x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} />
            <text className="chart-tick" x={PAD.left - 6} y={y(t)} dy="0.32em" textAnchor="end">
              {t}
            </text>
          </g>
        ))}
        <line className="chart-goal" x1={PAD.left} x2={W - PAD.right} y1={y(goal)} y2={y(goal)} />
        <text className="chart-goal-label" x={W - PAD.right} y={y(goal) - 6} textAnchor="end">
          Goal {goal}
        </text>

        {points.length > 1 && <path className="chart-line" d={path} />}
        {points.length > 0 && (
          <>
            <circle className="chart-dot" cx={x(last)} cy={y(points[last].bpm)} r={5} />
            <text className="chart-end" x={x(last)} y={y(points[last].bpm) + 18} textAnchor={points.length > 1 ? "end" : "middle"}>
              {points[last].bpm}
            </text>
          </>
        )}
        {points.length > 0 && (
          <>
            <text className="chart-tick" x={PAD.left} y={H - 6} textAnchor="start">
              {shortDate(points[0].date)}
            </text>
            {points.length > 1 && (
              <text className="chart-tick" x={W - PAD.right} y={H - 6} textAnchor="end">
                {shortDate(points[last].date)}
              </text>
            )}
          </>
        )}

        {h && hover !== null && (
          <g className="chart-hover" pointerEvents="none">
            <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={H - PAD.bottom} />
            <circle className="chart-dot" cx={x(hover)} cy={y(h.bpm)} r={5} />
            <g transform={`translate(${tipX}, ${PAD.top})`}>
              <rect x={-42} y={-12} width={84} height={22} rx={6} />
              <text textAnchor="middle" y={3}>
                {shortDate(h.date)}: {h.bpm}
              </text>
            </g>
          </g>
        )}
      </svg>
      <button className="link" onClick={() => setTable((t) => !t)} aria-expanded={table}>
        {table ? "Hide the numbers" : "Show the numbers"}
      </button>
      {table && (
        <table className="chart-table">
          <caption>{title}</caption>
          <thead>
            <tr>
              <th scope="col">Day</th>
              <th scope="col">Fastest clean</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.date}>
                <td>{shortDate(p.date)}</td>
                <td>{p.bpm} bpm</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </figure>
  );
}
