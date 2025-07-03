import React from "react";
import { useMap } from "react-leaflet";

export const PieIcon: React.FC<{
  colors: string[];
  radius?: number;
}> = ({ colors, radius = 10 }) => {
  const slices = colors.length;
  const angle = 360 / slices;
  const paths = [];
  for (let i = 0; i < slices; i++) {
    const startAngle = (angle * i - 90) * (Math.PI / 180);
    const endAngle = (angle * (i + 1) - 90) * (Math.PI / 180);
    const x1 = radius + radius * Math.cos(startAngle);
    const y1 = radius + radius * Math.sin(startAngle);
    const x2 = radius + radius * Math.cos(endAngle);
    const y2 = radius + radius * Math.sin(endAngle);
    const largeArc = angle > 180 ? 1 : 0;
    const d = `M${radius},${radius} L${x1},${y1} A${radius},${radius} 0 ${largeArc},1 ${x2},${y2} Z`;
    paths.push(
      <path key={i} d={d} fill={colors[i]} stroke="#fff" strokeWidth="1" />
    );
  }
  return (
    <svg width={radius * 2} height={radius * 2} style={{ display: "block" }}>
      {paths}
      <circle
        cx={radius}
        cy={radius}
        r={radius - 2}
        fill="none"
        stroke="#2563eb"
        strokeWidth="2"
      />
    </svg>
  );
};

const PieMarker: React.FC<{
  center: [number, number];
  radius?: number;
  colors: string[];
}> = ({ center, radius = 10, colors }) => {
  const map = useMap();
  const point = map.latLngToContainerPoint(center);
  return (
    <div
      style={{
        position: "absolute",
        left: point.x - radius,
        top: point.y - radius,
        pointerEvents: "none",
        zIndex: 500,
      }}
      data-leaflet-piemarker
    >
      <PieIcon colors={colors} radius={radius} />
    </div>
  );
};

export default PieMarker;
