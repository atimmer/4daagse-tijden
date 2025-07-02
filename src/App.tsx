import React, { useEffect, useState } from "react";
import MapView from "./components/MapView";
import type { RouteData } from "./components/MapView";
import RouteTogglePanel from "./components/RouteTogglePanel";
import SpeedSelector from "./components/SpeedSelector";
import StartTimeEditor from "./components/StartTimeEditor";
import RoutePopup from "./components/RoutePopup";
import { getCumulativeDistances, estimatePassageTime } from "./lib/utils";
import { Popup } from "react-leaflet";
import type { Feature, LineString, Position } from "geojson";
import "./App.css";

// Route meta info
const ROUTES = [
  {
    name: "Dinsdag",
    file: "/src/assets/routes/4Daagse_dinsdag_2025_complete.geojson",
    color: "#2563eb",
    defaultStart: "07:00",
  },
  {
    name: "Woensdag",
    file: "/src/assets/routes/4Daagse_woensdag_2025_complete.geojson",
    color: "#16a34a",
    defaultStart: "07:00",
  },
  {
    name: "Donderdag",
    file: "/src/assets/routes/4Daagse_donderdag_2025_complete.geojson",
    color: "#f59e42",
    defaultStart: "07:00",
  },
  {
    name: "Vrijdag",
    file: "/src/assets/routes/4Daagse_vrijdag_2025_complete.geojson",
    color: "#dc2626",
    defaultStart: "07:00",
  },
];

const SPEED_OPTIONS = [4, 5, 6];

const App: React.FC = () => {
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [startTimes, setStartTimes] = useState<{ [name: string]: string }>({});
  const [speed, setSpeed] = useState<number>(5);
  const [hovered, setHovered] = useState<{
    routeName: string;
    pointIndex: number;
    latlng: [number, number];
  } | null>(null);

  // Load GeoJSON files
  useEffect(() => {
    Promise.all(
      ROUTES.map(async (route) => {
        const geojson = await fetch(route.file).then((res) => res.json());
        return {
          name: route.name,
          geojson,
          color: route.color,
          visible: true,
        } as RouteData;
      })
    ).then((loadedRoutes) => {
      setRoutes(loadedRoutes);
      setStartTimes(
        Object.fromEntries(ROUTES.map((r) => [r.name, r.defaultStart]))
      );
    });
  }, []);

  // Handlers
  const handleToggleRoute = (routeName: string) => {
    setRoutes((prev) =>
      prev.map((r) =>
        r.name === routeName ? { ...r, visible: !r.visible } : r
      )
    );
  };

  const handleSpeedChange = (newSpeed: number) => setSpeed(newSpeed);

  const handleStartTimeChange = (routeName: string, newTime: string) => {
    setStartTimes((prev) => ({ ...prev, [routeName]: newTime }));
  };

  // Helper to get passage time info for popup
  function getPopupInfo() {
    if (!hovered) return null;
    const route = routes.find((r) => r.name === hovered.routeName);
    if (!route) return null;
    // Find the first LineString in the route
    const feature = route.geojson.features.find(
      (f) => f.geometry.type === "LineString"
    ) as Feature<LineString> | undefined;
    if (!feature) return null;
    // Filter only [number, number] coordinates
    const coords = (feature.geometry.coordinates as Position[]).filter(
      (c): c is [number, number] =>
        Array.isArray(c) &&
        c.length >= 2 &&
        typeof c[0] === "number" &&
        typeof c[1] === "number"
    );
    const dists = getCumulativeDistances(coords);
    const distanceKm = dists[hovered.pointIndex] || 0;
    const startTime = startTimes[route.name] || "07:00";
    // Show range for min/max speed
    const minSpeed = Math.min(...SPEED_OPTIONS);
    const maxSpeed = Math.max(...SPEED_OPTIONS);
    const earliest = estimatePassageTime(startTime, distanceKm, maxSpeed);
    const latest = estimatePassageTime(startTime, distanceKm, minSpeed);
    return {
      routeName: route.name,
      distanceKm,
      timeRange: { earliest, latest },
      latlng: hovered.latlng,
    };
  }

  const popupInfo = getPopupInfo();

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        Nijmeegse 4Daagse Passage Tijd Schatter
      </h1>
      <RouteTogglePanel
        routes={routes.map((r) => ({ name: r.name, visible: r.visible }))}
        onToggle={handleToggleRoute}
      />
      <StartTimeEditor
        startTimes={ROUTES.map((r) => ({
          name: r.name,
          time: startTimes[r.name] || r.defaultStart,
        }))}
        onChange={handleStartTimeChange}
      />
      <SpeedSelector
        speed={speed}
        options={SPEED_OPTIONS}
        onChange={handleSpeedChange}
      />
      <MapView
        routes={routes}
        onPointHover={(routeName, pointIndex, latlng) =>
          setHovered({ routeName, pointIndex, latlng })
        }
        popupInfo={popupInfo}
      />
    </div>
  );
};

export default App;
