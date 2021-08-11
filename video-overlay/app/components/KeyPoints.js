export default function KeyPoints({ points, color, radius = 2, fillOpacity = 0.5 }) {
  return (
    <g>
      {points.map(([ x, y ], index) => (
        <circle
            key={index}
            cx={x}
            cy={y}
            r={radius}
            stroke="none"
            fill={color}
            fillOpacity={fillOpacity} />
      ))}
    </g>
  );
}
