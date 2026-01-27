import { AssetLogo } from "../shared/AssetLogo";
import { getAssetBySymbol } from "../../config/assets";

export type DiscoverAsset = {
  symbol: string;
  name: string;
  type: string;
  change: string;
  timeframe: string;
  price: string;
  sparkline: number[];
  note?: string;
};

export function getChangeColor(change: string) {
  return change.trim().startsWith("-") ? "#c7393a" : "#0f8f6a";
}

function Sparkline({
  points,
  color,
  id,
  width = 180,
  height = 72,
}: {
  points: number[];
  color: string;
  id?: string;
  width?: number;
  height?: number;
}) {
  if (!points.length) return null;

  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const coords = points.map((p, idx) => {
    const x = (idx / (points.length - 1)) * width;
    const y = height - ((p - min) / range) * height;
    return { x, y };
  });

  const linePoints = coords.map(({ x, y }) => `${x},${y}`).join(" ");
  const areaPoints = `${linePoints} ${width},${height} 0,${height}`;
  const last = coords[coords.length - 1];
  const gradientId = `spark-${id ?? color.replace("#", "")}`;

  return (
    <svg
      className="sparkline"
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Performance sparkline"
    >
      <defs>
        <linearGradient
          id={`${gradientId}-fill`}
          x1="0%"
          y1="0%"
          x2="0%"
          y2="100%"
        >
          <stop offset="0%" stopColor={color} stopOpacity={0.16} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <polyline
        points={areaPoints}
        fill={`url(#${gradientId}-fill)`}
        stroke="none"
      />
      <polyline
        points={linePoints}
        fill="none"
        stroke={color}
        strokeWidth={2.4}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={last.x} cy={last.y} r={3.4} fill={color} />
    </svg>
  );
}

export function DiscoverCard({
  item,
  onSelect,
}: {
  item: DiscoverAsset;
  onSelect?: (symbol: string) => void;
}) {
  const asset = getAssetBySymbol(item.symbol);
  const color = getChangeColor(item.change);

  return (
    <div className="asset-card" role="listitem">
      <div className="asset-card__top">
        <div className="asset-meta">
          <AssetLogo
            src={asset?.logoURI}
            alt={asset?.symbol ?? item.symbol}
            size={36}
          />
          <div>
            <strong>{item.name}</strong>
            <div className="muted" style={{ fontSize: 12 }}>
              {item.symbol} • {item.type}
            </div>
          </div>
        </div>
        <span className="asset-move" style={{ color }}>
          {item.change}
        </span>
      </div>

      <div className="asset-price">
        <span className="price">{item.price}</span>
        <span className="muted">{item.timeframe}</span>
      </div>

      <Sparkline points={item.sparkline} color={color} id={item.symbol} />

      <div className="asset-card__footer">
        <span className="asset-chip">
          {item.note ?? "Non-custodial access"}
        </span>
        <button
          className="pill primary compact"
          type="button"
          onClick={() => onSelect?.(item.symbol)}
        >
          View
        </button>
      </div>
    </div>
  );
}
