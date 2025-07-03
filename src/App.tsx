import React, { useEffect, useState } from "react";
import RouteSelector, { DaySelector } from "./components/RouteSelector";
import MapView from "./components/MapView";
import type { Feature, LineString, FeatureCollection, Position } from "geojson";
import { getCumulativeDistances, estimatePassageTime } from "./lib/utils";
import SpeedRangeSelector from "./components/SpeedSelector";
import InfoWindow from "./components/InfoWindow";
import { useIsMobile } from "./lib/layout-hooks";

const ROUTE_FILES = [
  {
    day: "Dinsdag",
    file: "/4Daagse_dinsdag_2025_complete.geojson",
  },
  {
    day: "Woensdag",
    file: "/4Daagse_woensdag_2025_complete.geojson",
  },
  {
    day: "Donderdag",
    file: "/4Daagse_donderdag_2025_complete.geojson",
  },
  {
    day: "Vrijdag",
    file: "/4Daagse_vrijdag_2025_complete.geojson",
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
  "40km": "05:00",
  "30km": "07:00",
};

const DAYS = ["Dinsdag", "Woensdag", "Donderdag", "Vrijdag"];

// Add local type for RoutePopupInfo
interface RoutePopupInfo {
  routeName: string;
  color: string;
  distanceKm: number;
  timeRange: { earliest: string; latest: string };
  latlng: [number, number];
  direction?: string;
}

const App: React.FC = () => {
  const [routeVariants, setRouteVariants] = useState<RouteVariant[]>([]);
  const [minSpeed, setMinSpeed] = useState<number>(4);
  const [maxSpeed, setMaxSpeed] = useState<number>(6);
  const [selectedDay, setSelectedDay] = useState<string>(DAYS[0]);
  const [selectedDistancesByDay, setSelectedDistancesByDay] = useState<
    Record<string, string[]>
  >({});
  const [startTimes, setStartTimes] = useState<Record<string, string>>({});
  const [hovered, setHovered] = useState<
    | { routeId: string; pointIndices: number[]; latlng: [number, number] }[]
    | null
  >(null);
  const [hoveredPoint, setHoveredPoint] = useState<[number, number] | null>(
    null
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);

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
          // Special Friday logic for military
          let startTime = DEFAULT_START_TIMES[distance] || "07:00";
          if (
            day === "Vrijdag" &&
            (distance === "40km MIL" || distance === "40km ML")
          ) {
            startTime = "03:30";
          }
          return {
            id,
            day,
            distance,
            label,
            color,
            geojson: variantGeojson,
            visible: false,
            startTime,
          } as RouteVariant;
        });
      })
    ).then((allVariants) => {
      const flatVariants = allVariants.flat();
      setRouteVariants(flatVariants);
      // Set startTimes state for each variant
      const initialStartTimes: Record<string, string> = {};
      for (const v of flatVariants) {
        initialStartTimes[v.id] = v.startTime;
      }
      setStartTimes(initialStartTimes);
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
    if (!hovered || hovered.length === 0) return null;
    return hovered
      .map(({ routeId, pointIndices, latlng }) => {
        const variant = routeVariants.find((v) => v.id === routeId);
        if (!variant) return null;
        const feature = variant.geojson.features.find(
          (f) => f.geometry.type === "LineString"
        ) as Feature<LineString> | undefined;
        if (!feature) return null;
        const coords = (feature.geometry.coordinates as Position[]).filter(
          (c): c is [number, number] =>
            Array.isArray(c) &&
            c.length >= 2 &&
            typeof c[0] === "number" &&
            typeof c[1] === "number"
        );
        const dists = getCumulativeDistances(coords);
        // If two indices, label as heen/terug
        return pointIndices.map((pointIndex, i) => {
          const distanceKm = dists[pointIndex] || 0;
          const startTime = variant.startTime;
          const earliest = estimatePassageTime(startTime, distanceKm, maxSpeed);
          const latest = estimatePassageTime(startTime, distanceKm, minSpeed);
          return {
            routeName: variant.label,
            color: variant.color,
            distanceKm,
            timeRange: { earliest, latest },
            latlng,
            ...(pointIndices.length > 1
              ? { direction: i === 0 ? "Heenreis" : "Terugreis" }
              : {}),
          };
        });
      })
      .flat()
      .filter((item): item is RoutePopupInfo => item !== null);
  }

  const popupInfo = getPopupInfo();

  // Sidebar/Overlay content
  const sidebarContent = (
    <div className="flex flex-col h-full overflow-y-auto p-4 bg-white shadow-lg w-full max-w-md">
      <button
        className="md:hidden self-end mb-2 text-lg"
        onClick={() => setSidebarOpen(false)}
        aria-label="Sluit menu"
        style={{ display: isMobile ? "block" : "none" }}
      >
        ✕
      </button>
      <h1 className="text-2xl font-bold mb-4">
        Nijmeegse 4Daagse Passage Tijd Schatter
      </h1>
      <RouteSelector
        distancesByDay={distancesByDay}
        selectedDay={selectedDay}
        selectedDistances={selectedDistances}
        onDistanceToggle={handleDistanceToggle}
        startTimes={startTimes}
        onStartTimeChange={handleStartTimeChange}
      />
      <SpeedRangeSelector
        minSpeed={minSpeed}
        maxSpeed={maxSpeed}
        onChange={(min, max) => {
          setMinSpeed(min);
          setMaxSpeed(max);
        }}
      />
    </div>
  );

  // Floating DaySelector bar
  const daySelectorBar = (
    <div
      className={
        " " +
        (isMobile
          ? "fixed top-4 right-4 z-40 justify-center gap-2"
          : "fixed top-4 left-1/2 transform -translate-x-1/2 z-40 justify-center items-center")
      }
    >
      <DaySelector
        days={DAYS}
        selectedDay={selectedDay}
        onDayChange={setSelectedDay}
        className="gap-2"
      />
    </div>
  );

  return (
    <div className="w-screen h-screen overflow-hidden relative">
      {daySelectorBar}
      {/* Sidebar for desktop, overlay for mobile */}
      <div
        className={
          isMobile
            ? `fixed inset-0 z-30 bg-black/40 transition-opacity ${
                sidebarOpen
                  ? "opacity-100 pointer-events-auto"
                  : "opacity-0 pointer-events-none"
              }`
            : "fixed left-0 top-0 bottom-0 z-20 w-full max-w-md bg-white shadow-lg"
        }
        style={
          isMobile
            ? { display: sidebarOpen ? "block" : "none" }
            : { width: "350px" }
        }
        onClick={isMobile ? () => setSidebarOpen(false) : undefined}
      >
        <div
          className={
            isMobile
              ? `absolute left-0 top-0 bottom-0 w-80 max-w-full bg-white shadow-lg transition-transform ${
                  sidebarOpen ? "translate-x-0" : "-translate-x-full"
                }`
              : "h-full"
          }
          style={isMobile ? { height: "100vh" } : {}}
          onClick={(e) => e.stopPropagation()}
        >
          {sidebarContent}
        </div>
      </div>
      {/* Toggle button for mobile */}
      {isMobile && !sidebarOpen && (
        <button
          className="fixed top-4 left-4 z-40 bg-white rounded shadow p-2"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          ☰
        </button>
      )}
      {/* Map always full screen, but sidebar overlays it */}
      <div className="absolute inset-0 z-10 ">
        <MapView
          routeVariants={visibleVariants}
          onPointHover={(hovered) => {
            setHovered(hovered);
            if (hovered && hovered.length > 0) {
              setHoveredPoint(hovered[0].latlng);
            } else {
              setHoveredPoint(null);
            }
          }}
          hoveredPoint={hoveredPoint}
          hoveredRoutes={hovered}
        />
      </div>
      {/* InfoWindow for Doorkomst info, always visible */}
      <InfoWindow
        popupInfo={popupInfo}
        isMobile={isMobile}
        drawerOpen={drawerOpen}
        setDrawerOpen={setDrawerOpen}
      />
    </div>
  );
};

export default App;
