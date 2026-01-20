"use client";

type Props = {
  src?: string;
  alt?: string;
  size?: number;
};

export function AssetLogo({ src, alt = "asset", size = 32 }: Props) {
  const fallback = alt?.[0]?.toUpperCase() ?? "?";

  return (
    <div
      aria-label={alt}
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        overflow: "hidden",
        background: "#f1ede7",
        border: "1px solid #e4dfd7",
        display: "grid",
        placeItems: "center",
        flexShrink: 0
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          loading="lazy"
        />
      ) : (
        <span style={{ fontSize: 12, fontWeight: 700, color: "#6a665f" }}>
          {fallback}
        </span>
      )}
    </div>
  );
}
