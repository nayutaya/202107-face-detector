export default function BoundingBox({ x1, y1, x2, y2, color, size = 0.2, strokeOpacity = 0.7, strokeWidth = 3, border = 2 }) {
  const dx = (x2 - x1) * size;
  const dy = (y2 - y1) * size;
  return (
    <g>
      <path
          d={
            `M${x1 - border},${y1 + dy} L${x1 - border},${y1 - border}  L${x1 + dx},${y1 - border}`
            + ` M${x2 + border},${y1 + dy} L${x2 + border},${y1 - border}  L${x2 - dx},${y1 - border}`
            + ` M${x1 - border},${y2 - dy} L${x1 - border},${y2 + border}  L${x1 + dx},${y2 + border}`
            + ` M${x2 + border},${y2 - dy} L${x2 + border},${y2 + border}  L${x2 - dx},${y2 + border}`
          }
          stroke="white"
          strokeOpacity={strokeOpacity}
          strokeWidth={border}
          fill="none" />
      <path
          d={
            `M${x1 + border},${y1 + dy} L${x1 + border},${y1 + border}  L${x1 + dx},${y1 + border}`
            + ` M${x2 - border},${y1 + dy} L${x2 - border},${y1 + border}  L${x2 - dx},${y1 + border}`
            + ` M${x1 + border},${y2 - dy} L${x1 + border},${y2 - border}  L${x1 + dx},${y2 - border}`
            + ` M${x2 - border},${y2 - dy} L${x2 - border},${y2 - border}  L${x2 - dx},${y2 - border}`
          }
          stroke="white"
          strokeOpacity={strokeOpacity}
          strokeWidth={border}
          fill="none" />
      <path
          d={
            `M${x1},${y1 + dy} L${x1},${y1}  L${x1 + dx},${y1}`
            + ` M${x2},${y1 + dy} L${x2},${y1}  L${x2 - dx},${y1}`
            + ` M${x1},${y2 - dy} L${x1},${y2}  L${x1 + dx},${y2}`
            + ` M${x2},${y2 - dy} L${x2},${y2}  L${x2 - dx},${y2}`
          }
          stroke={color}
          strokeOpacity={strokeOpacity}
          strokeWidth={strokeWidth}
          fill="none" />
    </g>
  );
}
