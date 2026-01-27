import { useMemo } from "react";

type Range = "1D" | "1W" | "1M" | "1Y" | "ALL";

const DATA: Record<Range, number[]> = {
  "1D": [102, 104, 101, 103, 105, 108, 107, 111, 114, 113],
  "1W": [96, 98, 99, 103, 101, 104, 107, 109, 112, 115],
  "1M": [86, 90, 92, 95, 101, 104, 99, 106, 110, 118],
  "1Y": [70, 74, 79, 90, 94, 105, 112, 124, 132, 145],
  ALL: [40, 48, 60, 72, 66, 84, 102, 118, 132, 148],
};

function buildPaths(points: number[], width = 360, height = 180) {
  if (!points.length) return { line: "", area: "", last: { x: 0, y: 0 } };

  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;

  const coords = points.map((p, idx) => {
    const x = (idx / (points.length - 1)) * width;
    const y = height - ((p - min) / range) * height;
    return { x, y };
  });

  const line = coords.map(({ x, y }) => `${x},${y}`).join(" ");
  const area = `${line} ${width},${height} 0,${height}`;
  const last = coords[coords.length - 1];

  return { line, area, last };
}

export default function ChartStub({
  range,
  onRangeChange,
  loading,
}: {
  range: Range;
  onRangeChange: (r: Range) => void;
  loading?: boolean;
}) {
  const ranges: Range[] = ["1D", "1W", "1M", "1Y", "ALL"];
  const points = useMemo(() => DATA[range], [range]);
  const { line, area, last } = useMemo(
    () => buildPaths(points),
    [points]
  );

  const changePct = useMemo(() => {
    if (!points.length) return 0;
    const start = points[0];
    const end = points[points.length - 1];
    return ((end - start) / start) * 100;
  }, [points]);

  return (
    <div className="chart-card" aria-live="polite">
      <div className="chart-header">
        <div>
          <p className="eyebrow">Performance</p>
          <div className="chart-change">
            <span className={`pill compact ${changePct >= 0 ? "gain" : "loss"}`}>
              {changePct >= 0 ? "+" : ""}
              {changePct.toFixed(1)}%
            </span>
            <span className="muted">{range}</span>
          </div>
        </div>

        <div className="chart-ranges" role="group" aria-label="Chart ranges">
          {ranges.map((r) => (
            <button
              key={r}
              className={`range-pill${range === r ? " is-active" : ""}`}
              onClick={() => onRangeChange(r)}
              type="button"
              disabled={loading}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-figure">
        {loading ? (
          <div className="skeleton" />
        ) : (
          <svg
            className="chart-svg"
            viewBox="0 0 360 180"
            role="img"
            aria-label={`Portfolio chart for ${range}`}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0f6b5b" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#0f6b5b" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            <polyline
              points={area}
              fill="url(#chart-fill)"
              stroke="none"
            />
            <polyline
              points={line}
              fill="none"
              stroke="#0f6b5b"
              strokeWidth={3}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <circle cx={last.x} cy={last.y} r={5} fill="#0f6b5b" />
          </svg>
        )}
      </div>
    </div>
  );
}
