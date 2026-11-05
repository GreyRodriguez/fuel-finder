/** Responsive SVG sparkline. `data` = [{ week_start, avg_price }]. Resizes to its container width. */
export default function Sparkline({ data = [], stroke = "#94a3b8", label = "Price trend" }) {
  const W = 100;
  const H = 40;
  const PAD = 4;

  if (data.length < 2) {
    return (
      <div className="h-16 flex items-center justify-center text-xs text-slate-500 border border-dashed border-white/10 rounded-lg">
        Not enough history yet
      </div>
    );
  }

  const values = data.map((d) => d.avg_price);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = data.map((d, i) => ({
    x: (i / (data.length - 1)) * W,
    y: PAD + (1 - (d.avg_price - min) / span) * (H - PAD * 2),
  }));
  const line = pts.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
  const area = `0,${H} ${line} ${W},${H}`;
  const last = pts[pts.length - 1];
  const gradId = `spark-${stroke.replace("#", "")}`;

  return (
    <div className="relative h-16 w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`${label}: from ₱${values[0].toFixed(2)} to ₱${values[values.length - 1].toFixed(2)} over ${data.length} weeks`}
        className="w-full h-full overflow-visible"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.25" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={area} fill={`url(#${gradId})`} />
        <polyline
          points={line}
          fill="none"
          stroke={stroke}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="6" fill="transparent">
            <title>{`${data[i].week_start}: ₱${data[i].avg_price.toFixed(2)}`}</title>
          </circle>
        ))}
      </svg>
      {/* Current-value dot as HTML so it stays round while the SVG stretches */}
      <span
        aria-hidden="true"
        className="absolute w-2.5 h-2.5 rounded-full -translate-x-1/2 -translate-y-1/2 ring-2 ring-dark-700"
        style={{ left: `${last.x}%`, top: `${(last.y / H) * 100}%`, background: stroke }}
      />
    </div>
  );
}

