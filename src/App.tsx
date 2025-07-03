import React, { useEffect, useState } from "react";
import RouteSelector from "./components/RouteSelector";
import SpeedSelector from "./components/SpeedSelector";
import MapView from "./components/MapView";
import type { Feature, LineString, FeatureCollection, Position } from "geojson";
import "./App.css";
import { getCumulativeDistances, estimatePassageTime } from "./lib/utils";

const ROUTE_FILES = [
  {
    day: "Dinsdag",
    file: "/src/assets/routes/4Daagse_dinsdag_2025_complete.geojson",
  },
  {
    day: "Woensdag",
    file: "/src/assets/routes/4Daagse_woensdag_2025_complete.geojson",
  },
  {
    day: "Donderdag",
    file: "/src/assets/routes/4Daagse_donderdag_2025_complete.geojson",
  },
  {
    day: "Vrijdag",
    file: "/src/assets/routes/4Daagse_vrijdag_2025_complete.geojson",
  },
];

const DISTANCE_COLORS: Record<string, string> = {
  "50km": "#dc2626", // Red
  "40km MIL": "#16a34a", // Green
  "40km ML": "#16a34a", // Green (alt spelling)
  "40km": "#facc15", // Yellow
  "30km": "#2563eb", // Blue
};

const DISTANCE_LABELS: Record<string, string> = {
  "50km": "50km",
  "40km MIL": "40km militair",
  "40km ML": "40km militair",
  "40km": "40km",
  "30km": "30km",
};

const SPEED_OPTIONS = [4, 5, 6];

export interface RouteVariant {
  id: string; // e.g. 'Dinsdag-30km'
  day: string;
  distance: string; // '30km', '40km', '40km MIL', '50km'
  label: string; // e.g. '30km', '40km militair'
  color: string;
  geojson: FeatureCollection;
  visible: boolean;
  startTime: string;
}

const DEFAULT_START_TIMES: Record<string, string> = {
  "50km": "04:00",
  "40km MIL": "04:30",
  "40km ML": "04:30",
  "40km": "05:30",
  "30km": "07:00",
};

const DAYS = ["Dinsdag", "Woensdag", "Donderdag", "Vrijdag"];

const App: React.FC = () => {
  const [routeVariants, setRouteVariants] = useState<RouteVariant[]>([]);
  const [speed, setSpeed] = useState<number>(5);
  const [selectedDay, setSelectedDay] = useState<string>(DAYS[0]);
  const [selectedDistancesByDay, setSelectedDistancesByDay] = useState<
    Record<string, string[]>
  >({});
  const [startTimes, setStartTimes] = useState<Record<string, string>>({});
  const [hovered, setHovered] = useState<{
    id: string;
    pointIndex: number;
    latlng: [number, number];
  } | null>(null);

  useEffect(() => {
    Promise.all(
      ROUTE_FILES.map(async ({ day, file }) => {
        const geojson: FeatureCollection = await fetch(file).then((res) =>
          res.json()
        );
        const byDistance: Record<string, Feature<LineString>[]> = {};
        geojson.features.forEach((f) => {
          if (
            f.geometry.type === "LineString" &&
            f.properties &&
            f.properties.layer
          ) {
            const layer = f.properties.layer as string;
            if (!byDistance[layer]) byDistance[layer] = [];
            byDistance[layer].push(f as Feature<LineString>);
          }
        });
        return Object.entries(byDistance).map(([distance, features]) => {
          const variantGeojson: FeatureCollection = {
            type: "FeatureCollection",
            features,
          };
          const color = DISTANCE_COLORS[distance] || "#888";
          const label = DISTANCE_LABELS[distance] || distance;
          const id = `${day}-${distance}`;
          return {
            id,
            day,
            distance,
            label,
            color,
            geojson: variantGeojson,
            visible: false,
            startTime: DEFAULT_START_TIMES[distance] || "07:00",
          } as RouteVariant;
        });
      })
    ).then((allVariants) => {
      setRouteVariants(allVariants.flat());
    });
  }, []);

  // Build distancesByDay for RouteSelector
  const distancesByDay: Record<
    string,
    { key: string; label: string; color: string }[]
  > = React.useMemo(() => {
    const byDay: Record<
      string,
      { key: string; label: string; color: string }[]
    > = {};
    for (const v of routeVariants) {
      if (!byDay[v.day]) byDay[v.day] = [];
      if (!byDay[v.day].some((d) => d.key === v.id)) {
        byDay[v.day].push({ key: v.id, label: v.label, color: v.color });
      }
    }
    return byDay;
  }, [routeVariants]);

  // On first load, set selectedDistances for each day to all available
  React.useEffect(() => {
    setSelectedDistancesByDay((prev) => {
      const next = { ...prev };
      for (const day of DAYS) {
        if (!next[day] && distancesByDay[day]) {
          next[day] = distancesByDay[day].map((d) => d.key);
        }
      }
      return next;
    });
  }, [distancesByDay]);

  // When day changes, get selected distances or fallback to all for that day
  const selectedDistances =
    selectedDistancesByDay[selectedDay] &&
    selectedDistancesByDay[selectedDay].length > 0
      ? selectedDistancesByDay[selectedDay]
      : distancesByDay[selectedDay]?.map((d) => d.key) || [];

  // Toggle distance for selected day
  const handleDistanceToggle = (distanceKey: string) => {
    setSelectedDistancesByDay((prev) => {
      const current = prev[selectedDay] || [];
      return {
        ...prev,
        [selectedDay]: current.includes(distanceKey)
          ? current.filter((k) => k !== distanceKey)
          : [...current, distanceKey],
      };
    });
  };

  // Start time change for a distance
  const handleStartTimeChange = (distanceKey: string, newTime: string) => {
    setStartTimes((prev) => ({ ...prev, [distanceKey]: newTime }));
    setRouteVariants((prev) =>
      prev.map((v) => (v.id === distanceKey ? { ...v, startTime: newTime } : v))
    );
  };

  // Only show visible variants for selected day and selected distances
  const visibleVariants = routeVariants.filter(
    (v) => v.day === selectedDay && selectedDistances.includes(v.id)
  );

  // Passage time popup info
  function getPopupInfo() {
    if (!hovered) return null;
    const variant = routeVariants.find((v) => v.id === hovered.id);
    if (!variant) return null;
    // Find the first LineString in the variant
    const feature = variant.geojson.features.find(
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
    const startTime = variant.startTime;
    // Show range for min/max speed
    const minSpeed = Math.min(...SPEED_OPTIONS);
    const maxSpeed = Math.max(...SPEED_OPTIONS);
    const earliest = estimatePassageTime(startTime, distanceKm, maxSpeed);
    const latest = estimatePassageTime(startTime, distanceKm, minSpeed);
    return {
      routeName: variant.label,
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
      <RouteSelector
        days={DAYS}
        distancesByDay={distancesByDay}
        selectedDay={selectedDay}
        onDayChange={setSelectedDay}
        selectedDistances={selectedDistances}
        onDistanceToggle={handleDistanceToggle}
        startTimes={startTimes}
        onStartTimeChange={handleStartTimeChange}
      />
      <SpeedSelector
        speed={speed}
        options={SPEED_OPTIONS}
        onChange={setSpeed}
      />
      <MapView
        routeVariants={visibleVariants}
        onPointHover={(id, pointIndex, latlng) =>
          setHovered({ id, pointIndex, latlng })
        }
        popupInfo={popupInfo}
      />
    </div>
  );
};

export default App;
