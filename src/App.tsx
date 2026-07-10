import React, { useEffect, useState } from "react";
import MapView, {
  type CameraRequest,
  type PersonMarkerData,
} from "./components/MapView";
import type { Feature, LineString, FeatureCollection } from "geojson";
import {
  estimatePassageTime,
  type LeafletLatLngTuple,
  type RelevantRoutePoint,
} from "./lib/utils";
import InfoWindow from "./components/InfoWindow";
import { useBreakpoints, useIsMobile } from "./lib/layout-hooks";
import { getDefaultDay } from "./lib/date";
import Sidebar from "./components/Sidebar";
import { DaySelector } from "./components/RouteSelector";
import {
  EDITION,
  EVENT_DAYS,
  getDefaultStartTime,
  type EventDay,
} from "./config/edition";
import { fetchRouteData } from "./lib/route-data";
import PeoplePanel, { type VariantOption } from "./components/PeoplePanel";
import PeopleSheet from "./components/PeopleSheet";
import SightingDialog, {
  type PendingSighting,
  type SightingOption,
} from "./components/SightingDialog";
import { useTrackedPeople } from "./lib/use-tracked-people";
import {
  buildRouteGeometry,
  estimatePersonPosition,
  formatKm,
  minutesToTime,
  pointAtKm,
  routeSliceBetweenKm,
  timeToMinutes,
  type PersonPosition,
  type RouteGeometry,
  type TrackedPerson,
} from "./lib/tracking";

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

function currentMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function toPersonMarker(
  person: TrackedPerson,
  position: PersonPosition,
  geometry: RouteGeometry
): PersonMarkerData {
  const base = { id: person.id, name: person.name, color: person.color };
  switch (position.kind) {
    case "not-started":
      return {
        ...base,
        latlng: pointAtKm(geometry, 0),
        subtitle: `start ${person.startTime}`,
        dimmed: true,
      };
    case "finished":
      return {
        ...base,
        latlng: pointAtKm(geometry, geometry.lengthKm),
        subtitle: "binnen",
        dimmed: true,
      };
    case "point":
      return {
        ...base,
        latlng: pointAtKm(geometry, position.km),
        subtitle: `km ${formatKm(position.km)}`,
      };
    case "range":
      return {
        ...base,
        latlng: pointAtKm(geometry, (position.minKm + position.maxKm) / 2),
        segment: routeSliceBetweenKm(geometry, position.minKm, position.maxKm),
        subtitle: `km ${formatKm(position.minKm)}–${formatKm(position.maxKm)}`,
      };
  }
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

  // --- Tracked people (lopers) ---
  const {
    people,
    addPerson,
    removePerson,
    setPersonStartTime,
    addSighting,
    removeSighting,
  } = useTrackedPeople();
  const [sightingPersonId, setSightingPersonId] = useState<string | null>(null);
  const [pendingSighting, setPendingSighting] =
    useState<PendingSighting | null>(null);
  /** null = live "nu"; otherwise a fixed 'HH:mm' the positions are shown for. */
  const [viewTime, setViewTime] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [nowMinutes, setNowMinutes] = useState(currentMinutes);
  const { smallerThan, largerThan } = useBreakpoints();

  useEffect(() => {
    const timer = setInterval(() => setNowMinutes(currentMinutes()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const handleDayChange = (day: string) => {
    setSelectedDay(day);
    nextCameraRequestId.current += 1;
    setCameraRequest({ day, id: nextCameraRequestId.current });
  };

  useEffect(() => {
    Promise.all(
      EDITION.routes.map(async ({ day, file }) => {
        const geojson = await fetchRouteData(file);
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
      }).map((route) => route.catch(() => []))
    ).then((allVariants) => {
      const flatVariants = allVariants.flat();
      setRouteVariants(flatVariants);
      setSelectedDistancesByDay((previous) => {
        const next = { ...previous };
        for (const day of EVENT_DAYS) {
          if (!next[day]) {
            next[day] = flatVariants
              .filter((variant) => variant.day === day)
              .map((variant) => variant.id);
          }
        }
        return next;
      });
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

  // When day changes, get selected distances or fallback to all for that day
  const selectedDistances = React.useMemo(() => {
    const distances = selectedDistancesByDay[selectedDay];
    return distances && distances.length > 0 ? distances : [];
  }, [selectedDay, selectedDistancesByDay]);

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

  const selectedDayVariants = React.useMemo(
    () => routeVariants.filter((variant) => variant.day === selectedDay),
    [routeVariants, selectedDay]
  );

  // Only show variants whose distances are enabled. Camera framing uses all
  // variants for the day, so toggling a distance never moves the map.
  const visibleVariants = React.useMemo(
    () =>
      selectedDayVariants.filter((variant) =>
        selectedDistances.includes(variant.id)
      ),
    [selectedDayVariants, selectedDistances]
  );

  // --- Tracked people: positions and map markers ---
  const routeGeometries = React.useMemo(() => {
    const geometries = new Map<string, RouteGeometry>();
    for (const variant of routeVariants) {
      const geometry = buildRouteGeometry(variant.geojson);
      if (geometry) geometries.set(variant.id, geometry);
    }
    return geometries;
  }, [routeVariants]);

  const viewMinutes = viewTime ? timeToMinutes(viewTime) : nowMinutes;

  const { personPositions, personMarkers } = React.useMemo(() => {
    const positions = new Map<string, PersonPosition>();
    const markers: PersonMarkerData[] = [];
    const markerGroupCounts = new Map<string, number>();
    for (const person of people) {
      if (person.day !== selectedDay) continue;
      const geometry = routeGeometries.get(person.routeVariantId);
      if (!geometry) continue;
      const position = estimatePersonPosition(person, viewMinutes, {
        minSpeedKmh: minSpeed,
        maxSpeedKmh: maxSpeed,
        routeLengthKm: geometry.lengthKm,
      });
      positions.set(person.id, position);
      const marker = toPersonMarker(person, position, geometry);
      const groupKey = marker.latlng
        .map((coordinate) => coordinate.toFixed(3))
        .join(",");
      const indexInGroup = markerGroupCounts.get(groupKey) ?? 0;
      markerGroupCounts.set(groupKey, indexInGroup + 1);
      markers.push({
        ...marker,
        labelOffsetPx: 12 + indexInGroup * 28,
      });
    }
    return { personPositions: positions, personMarkers: markers };
  }, [people, selectedDay, routeGeometries, viewMinutes, minSpeed, maxSpeed]);

  const variantOptions: VariantOption[] = selectedDayVariants.map((v) => ({
    id: v.id,
    label: v.label,
    color: v.color,
    defaultStartTime: getDefaultStartTime(v.day as EventDay, v.distance),
  }));

  const sightingPerson = sightingPersonId
    ? people.find((p) => p.id === sightingPersonId) ?? null
    : null;

  const handleStartSighting = (personId: string) => {
    const person = people.find((p) => p.id === personId);
    if (!person) return;
    // Make sure the person's route is visible so the tap can hit it.
    setSelectedDistancesByDay((prev) => {
      const current = prev[person.day] || [];
      return current.includes(person.routeVariantId)
        ? prev
        : { ...prev, [person.day]: [...current, person.routeVariantId] };
    });
    if (person.day !== selectedDay) handleDayChange(person.day);
    setSidebarOpen(false);
    setPeopleOpen(false);
    setHovered(null);
    setHoveredPoint(null);
    setSightingPersonId(personId);
  };

  const handleRouteClick = (points: RelevantRoutePoint[]) => {
    if (!sightingPerson) return;
    const match = points.find(
      (p) => p.routeId === sightingPerson.routeVariantId
    );
    if (!match) return;
    const kms = [...match.cumulativeDistancesKm].sort((a, b) => a - b);
    const options: SightingOption[] = kms.map((km, index) => ({
      distanceKm: km,
      direction:
        kms.length > 1
          ? index === 0
            ? "Heenreis"
            : "Terugreis"
          : undefined,
    }));
    setPendingSighting({
      personId: sightingPerson.id,
      personName: sightingPerson.name,
      options,
    });
  };

  const handleConfirmSighting = (option: SightingOption, time: string) => {
    if (!pendingSighting) return;
    addSighting(pendingSighting.personId, {
      timeMinutes: timeToMinutes(time),
      distanceKm: option.distanceKm,
    });
    setPendingSighting(null);
    setSightingPersonId(null);
  };

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
        "flex flex-col items-center gap-2 " +
        (isMobile
          ? "fixed top-4 right-4 z-40 justify-center"
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

  const peoplePanel = (
    <PeoplePanel
      people={people}
      positions={personPositions}
      selectedDay={selectedDay}
      variantOptions={variantOptions}
      viewTime={viewTime}
      currentTime={minutesToTime(nowMinutes)}
      sightingPersonId={sightingPersonId}
      onViewTimeChange={setViewTime}
      onAddPerson={addPerson}
      onRemovePerson={removePerson}
      onPersonStartTimeChange={setPersonStartTime}
      onStartSighting={handleStartSighting}
      onCancelSighting={() => setSightingPersonId(null)}
      onRemoveSighting={removeSighting}
    />
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
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        peoplePanel={largerThan.xl ? peoplePanel : undefined}
      />
      {smallerThan.xl ? (
        <PeopleSheet
          open={peopleOpen}
          onOpenChange={setPeopleOpen}
          walkerCount={people.filter((person) => person.day === selectedDay).length}
        >
          {peoplePanel}
        </PeopleSheet>
      ) : null}
      {/* Map always full screen, but sidebar overlays it */}
      <div
        className={
          "absolute inset-0 z-10" +
          (sightingPerson ? " [&_.leaflet-container]:cursor-crosshair" : "")
        }
      >
        <MapView
          routeVariants={visibleVariants}
          cameraRoutes={selectedDayVariants}
          cameraRequest={cameraRequest}
          onPointHover={(hovered) => {
            if (sightingPersonId) return;
            setHovered(hovered);
            if (hovered && hovered.length > 0) {
              setHoveredPoint(hovered[0].latlng);
            } else {
              setHoveredPoint(null);
            }
          }}
          onRouteClick={handleRouteClick}
          hoveredPoint={hoveredPoint}
          hoveredRoutes={hovered}
          personMarkers={personMarkers}
        />
      </div>
      {/* Sighting mode banner */}
      {sightingPerson && !pendingSighting && (
        <div className="fixed top-16 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 whitespace-nowrap rounded-full bg-gray-900/90 px-4 py-2 text-sm text-white shadow-lg">
          <span>
            Tik of klik op de route waar je <b>{sightingPerson.name}</b> zag
          </span>
          <button
            type="button"
            className="underline underline-offset-2"
            onClick={() => setSightingPersonId(null)}
          >
            Annuleren
          </button>
        </div>
      )}
      {pendingSighting && (
        <SightingDialog
          pending={pendingSighting}
          defaultTime={minutesToTime(nowMinutes)}
          onConfirm={handleConfirmSighting}
          onCancel={() => setPendingSighting(null)}
        />
      )}
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
