import React, { useEffect, useState } from "react";
import MapView, { type CameraRequest } from "./components/MapView";
import type { Feature, LineString, FeatureCollection } from "geojson";
import {
  estimatePassageTime,
  type LeafletLatLngTuple,
  type RelevantRoutePoint,
} from "./lib/utils";
import InfoWindow from "./components/InfoWindow";
import { useIsMobile } from "./lib/layout-hooks";
import { getDefaultDay } from "./lib/date";
import Sidebar from "./components/Sidebar";
import { DaySelector } from "./components/RouteSelector";
import {
  EDITION,
  EVENT_DAYS,
  getDefaultStartTime,
} from "./config/edition";

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
  const [selectedDay, setSelectedDay] = useState<string>(getDefaultDay());
  const [cameraRequest, setCameraRequest] =
    useState<CameraRequest | null>(null);
  const nextCameraRequestId = React.useRef(0);
  const [selectedDistancesByDay, setSelectedDistancesByDay] = useState<
    Record<string, string[]>
  >({});
  const [startTimes, setStartTimes] = useState<Record<string, string>>({});
  const [hovered, setHovered] = useState<RelevantRoutePoint[] | null>(null);
  const [hoveredPoint, setHoveredPoint] =
    useState<LeafletLatLngTuple | null>(null);
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleDayChange = (day: string) => {
    setSelectedDay(day);
    nextCameraRequestId.current += 1;
    setCameraRequest({ day, id: nextCameraRequestId.current });
  };

  useEffect(() => {
    Promise.all(
      EDITION.routes.map(async ({ day, file }) => {
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
          const startTime = getDefaultStartTime(day, distance);
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
      for (const day of EVENT_DAYS) {
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
      : [];

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

  const selectedDayVariants = routeVariants.filter(
    (v) => v.day === selectedDay
  );

  // Only show variants whose distances are enabled. Camera framing uses all
  // variants for the day, so toggling a distance never moves the map.
  const visibleVariants = selectedDayVariants.filter((v) =>
    selectedDistances.includes(v.id)
  );

  // Passage time popup info
  function getPopupInfo() {
    if (!hovered || hovered.length === 0) return null;
    return hovered
      .map(({ routeId, pointIndices, latlng, cumulativeDistancesKm }) => {
        const variant = routeVariants.find((v) => v.id === routeId);
        if (!variant) return null;
        // If two indices, label as heen/terug
        return pointIndices.map((_, i) => {
          const distanceKm = cumulativeDistancesKm[i] ?? 0;
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

  // Floating DaySelector bar
  const daySelectorBar = (
    <div
      className={
        "flex flex-col items-center " +
        (isMobile
          ? "fixed top-4 right-4 z-40 justify-center gap-2"
          : "fixed top-4 left-1/2 transform -translate-x-1/2 z-40 justify-center items-center")
      }
    >
      <DaySelector
        days={EVENT_DAYS}
        selectedDay={selectedDay}
        onDayChange={handleDayChange}
        className="gap-2"
      />
      <a
        href={EDITION.source.url}
        target="_blank"
        rel="noreferrer"
        className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] text-gray-600 shadow-sm hover:text-gray-950"
        title={`Bron: ${EDITION.source.name}. Bijgewerkt op ${EDITION.source.lastUpdated}.`}
      >
        {EDITION.edition}e 4Daagse · routes {EDITION.year} · bron
      </a>
    </div>
  );

  return (
    <div className="touch-manipulation w-screen h-screen overflow-hidden relative">
      {daySelectorBar}
      <Sidebar
        isMobile={isMobile}
        selectedDay={selectedDay}
        distancesByDay={distancesByDay}
        selectedDistances={selectedDistances}
        onDistanceToggle={handleDistanceToggle}
        startTimes={startTimes}
        onStartTimeChange={handleStartTimeChange}
        minSpeed={minSpeed}
        maxSpeed={maxSpeed}
        setMinSpeed={setMinSpeed}
        setMaxSpeed={setMaxSpeed}
      />
      {/* Map always full screen, but sidebar overlays it */}
      <div className="absolute inset-0 z-10 ">
        <MapView
          routeVariants={visibleVariants}
          cameraRoutes={selectedDayVariants}
          cameraRequest={cameraRequest}
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
