import React from "react";

export interface RoutePopupProps {
  routeName: string;
  distanceKm: number;
  timeRange: { earliest: string; latest: string };
}

const RoutePopup: React.FC<RoutePopupProps> = ({
  routeName,
  distanceKm,
  timeRange,
}) => {
  return (
    <div className="p-2 text-sm">
      <div className="font-semibold">{routeName}</div>
      <div>Afstand vanaf start: {distanceKm.toFixed(1)} km</div>
      <div>
        Verwachte doorkomst:{" "}
        <span className="font-medium">
          {timeRange.earliest} – {timeRange.latest}
        </span>
      </div>
    </div>
  );
};

export default RoutePopup;
