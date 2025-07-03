import React from "react";
import type { RoutePopupInfo } from "./MapView";

export interface RoutePopupProps {
  routes: RoutePopupInfo[];
}

const RoutePopup: React.FC<RoutePopupProps> = ({ routes }) => {
  return (
    <div className="p-2 text-sm min-w-[220px]">
      {routes.map((r, i) => (
        <div
          key={i}
          className="mb-2 last:mb-0 flex items-start gap-2 border-l-4 pl-2"
          style={{ borderColor: r.color }}
        >
          <div className="flex-1">
            <div className="font-semibold flex items-center gap-1">
              <span
                className="inline-block w-3 h-3 rounded-full mr-1"
                style={{ background: r.color }}
                aria-label="kleur"
              />
              {r.routeName}
              {r.direction && (
                <span className="ml-2 text-xs bg-gray-100 rounded px-1 py-0.5 border border-gray-300">
                  {r.direction}
                </span>
              )}
            </div>
            <div>Afstand vanaf start: {r.distanceKm.toFixed(1)} km</div>
            <div>
              Verwachte doorkomst:{" "}
              <span className="font-medium">
                {r.timeRange.earliest} – {r.timeRange.latest}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RoutePopup;
