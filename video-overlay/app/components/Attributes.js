export default function Attributes({ sex, age, x1, y1, x2, y2, color, fontSize = 16, opacity = 0.9, strokeWidth = 3 }) {
  const x = x1;
  const y = y1 - 7;
  const label = `Sex: ${sex} / Age: ${age}`;
  return (
    <g>
      <text
          x={x}
          y={y}
          fontSize={fontSize}
          stroke="white"
          strokeWidth={strokeWidth}
          strokeOpacity={opacity}
          fill="none">
        {label}
      </text>
      <text
          x={x}
          y={y}
          fontSize={fontSize}
          stroke="none"
          fill={color}
          fillOpacity={opacity} >
        {label}
      </text>
    </g>
  );
}
