import React from "react";

interface RoutePopupInfo {
  routeName: string;
  color: string;
  distanceKm: number;
  timeRange: { earliest: string; latest: string };
  latlng: [number, number];
  direction?: string;
}

export interface RoutePopupProps {
  routes: RoutePopupInfo[];
}

const RoutePopup: React.FC<RoutePopupProps> = ({ routes }) => {
  // Group routes by direction
  const heenreis = routes.filter((r) => r.direction === "Heenreis");
  const terugreis = routes.filter((r) => r.direction === "Terugreis");
  const overige = routes.filter((r) => !r.direction);

  const renderGroup = (group: RoutePopupInfo[], heading?: string) =>
    group.length > 0 && (
      <div className="mb-4 last:mb-0">
        {heading && (
          <div className="text-base font-extrabold text-gray-700 mb-3 mt-2 tracking-wide">
            {heading}
          </div>
        )}
        {group.map((r, i) => (
          <div
            key={heading ? heading + i : i}
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

  return (
    <div className="p-2 text-sm min-w-[220px]">
      {renderGroup(heenreis, "Heen")}
      {renderGroup(terugreis, "Terug")}
      {renderGroup(overige)}
    </div>
  );
};

export default RoutePopup;
