import React from "react";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  CircleMarker,
  useMapEvent,
  Pane,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  buildRouteSearchIndex,
  getRelevantRoutePoints,
  leafletLatLngToLngLat,
  type LeafletLatLngTuple,
  type RelevantRoutePoint,
  type RouteSearchIndex,
} from "../lib/utils";
import type { FeatureCollection } from "geojson";
import type { LeafletMouseEvent } from "leaflet";

export interface RouteVariant {
  id: string;
  day: string;
  distance: string;
  label: string;
  color: string;
  geojson: FeatureCollection;
  visible: boolean;
  startTime: string;
}

export interface MapViewProps {
  routeVariants: RouteVariant[];
  onPointHover?: (hoveredRoutes: RelevantRoutePoint[] | null) => void;
  hoveredPoint?: LeafletLatLngTuple | null;
  hoveredRoutes?:
    | Pick<RelevantRoutePoint, "routeId" | "pointIndices" | "latlng">[]
    | null;
}

const center: LeafletLatLngTuple = [51.842, 5.852]; // Nijmegen area

const isTouchDevice = () => {
  if (typeof window === "undefined") return false;
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-expect-error: msMaxTouchPoints is for legacy IE/Edge support
    navigator.msMaxTouchPoints > 0
  );
};

function searchRoutesAreEqual(
  previous: readonly RouteVariant[],
  next: readonly RouteVariant[]
): boolean {
  return (
    previous.length === next.length &&
    previous.every(
      (route, index) =>
        route.id === next[index].id && route.geojson === next[index].geojson
    )
  );
}

function useRouteSearchIndex(routeVariants: RouteVariant[]): RouteSearchIndex {
  const cached = React.useRef<{
    routes: RouteVariant[];
    index: RouteSearchIndex;
  }>(null);

  if (
    !cached.current ||
    !searchRoutesAreEqual(cached.current.routes, routeVariants)
  ) {
    cached.current = {
      routes: routeVariants.slice(),
      index: buildRouteSearchIndex(routeVariants),
    };
  }

  return cached.current.index;
}

const MapEventHandler: React.FC<{
  routeVariants: RouteVariant[];
  onPointHover?: MapViewProps["onPointHover"];
}> = ({ routeVariants, onPointHover }) => {
  const touchDevice = isTouchDevice();
  const eventType = touchDevice ? "click" : "mousemove";
  const searchIndex = useRouteSearchIndex(routeVariants);
  const animationFrame = React.useRef<number | null>(null);
  const pendingLatLng = React.useRef<LeafletLatLngTuple | null>(null);
  const onPointHoverRef = React.useRef(onPointHover);
  onPointHoverRef.current = onPointHover;

  const processPoint = React.useCallback(
    (latlng: LeafletLatLngTuple) => {
      const results = getRelevantRoutePoints(
        leafletLatLngToLngLat(latlng),
        searchIndex
      );
      onPointHoverRef.current?.(results.length > 0 ? results : null);
    },
    [searchIndex]
  );

  useMapEvent(eventType, (e: LeafletMouseEvent) => {
    if (!onPointHover) return;
    const latlng: LeafletLatLngTuple = [e.latlng.lat, e.latlng.lng];

    // Taps should feel immediate and retain their selection. Desktop pointer
    // events are reduced to one query per rendered frame.
    if (touchDevice) {
      processPoint(latlng);
      return;
    }

    pendingLatLng.current = latlng;
    if (animationFrame.current !== null) return;
    animationFrame.current = requestAnimationFrame(() => {
      animationFrame.current = null;
      if (pendingLatLng.current) processPoint(pendingLatLng.current);
    });
  });

  useMapEvent("mouseout", () => {
    if (touchDevice) return;
    pendingLatLng.current = null;
    if (animationFrame.current !== null) {
      cancelAnimationFrame(animationFrame.current);
      animationFrame.current = null;
    }
    onPointHoverRef.current?.(null);
  });

  React.useEffect(
    () => () => {
      if (animationFrame.current !== null) {
        cancelAnimationFrame(animationFrame.current);
      }
    },
    []
  );

  return null;
};

const MapView: React.FC<MapViewProps> = ({
  routeVariants,
  onPointHover,
  hoveredPoint,
  hoveredRoutes,
}) => {
  // Get the colors for the hovered routes
  let hoveredColors: string[] = [];
  if (hoveredRoutes && hoveredRoutes.length > 0) {
    hoveredColors = hoveredRoutes
      .map((r) => {
        const route = routeVariants.find((v) => v.id === r.routeId);
        return route ? route.color : undefined;
      })
      .filter(Boolean) as string[];
  }
  return (
    <MapContainer
      center={center}
      zoom={12}
      style={{ height: "100vh", width: "100vw" }}
    >
      <MapEventHandler
        routeVariants={routeVariants}
        onPointHover={onPointHover}
      />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {routeVariants.map((route) => (
        <GeoJSON
          key={route.id}
          data={route.geojson}
          style={() => ({ color: route.color, weight: 4 })}
        />
      ))}
      {/* Custom marker logic */}
      {hoveredPoint && (
        <Pane name="marker-top" style={{ zIndex: 650 }}>
          <CircleMarker
            center={hoveredPoint}
            radius={10}
            pathOptions={{
              color: hoveredColors.length === 1 ? hoveredColors[0] : "#000",
              fillColor: "#fff",
              fillOpacity: 1,
            }}
          />
        </Pane>
      )}
    </MapContainer>
  );
};

export default MapView;
