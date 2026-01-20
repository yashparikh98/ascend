import { useMemo } from "react";

type Range = "1D" | "1W" | "1M" | "1Y" | "ALL";

export default function ChartStub({
  range,
  onRangeChange,
  loading
}: {
  range: Range;
  onRangeChange: (r: Range) => void;
  loading?: boolean;
}) {
  const ranges: Range[] = ["1D", "1W", "1M", "1Y", "ALL"];
  const placeholderBars = useMemo(() => Array.from({ length: 20 }), []);

  return (
    <div className="card soft">
      <div className="scroll-row" aria-label="Chart ranges">
        {ranges.map((r) => (
          <button
            key={r}
            className={`segmented-btn${range === r ? " is-active" : ""}`}
            onClick={() => onRangeChange(r)}
            type="button"
            disabled={loading}
          >
            {r}
          </button>
        ))}
      </div>
      <div className="chart-area" aria-live="polite">
        {loading ? (
          <div className="skeleton" />
        ) : (
          <div className="chart-bars">
            {placeholderBars.map((_, idx) => (
              <div key={idx} className="chart-bar" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
