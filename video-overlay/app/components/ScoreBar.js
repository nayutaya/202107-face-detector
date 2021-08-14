export default function ScoreBar({ score, x1, y1, x2, y2, color, height = 4, padding = 5, strokeWidth = 3, strokeOpacity = 0.7, fillOpacity = 0.8 }) {
  const width = x2 - x1;
  return (
    <g>
      <rect
          x={x1 + padding}
          y={y1 + padding}
          width={width - padding * 2}
          height={height}
          stroke="white"
          strokeWidth={strokeWidth}
          strokeOpacity={strokeOpacity}
          fill="white"
          fillOpacity={fillOpacity} />
      <rect
          x={x1 + padding}
          y={y1 + padding}
          width={(width - padding * 2) * score}
          height={height}
          fill={color}
          fillOpacity={fillOpacity} />
    </g>
  );
}
