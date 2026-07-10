import React from "react";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  CircleMarker,
  Marker,
  Polyline,
  useMapEvent,
  useMap,
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
import {
  divIcon,
  geoJSON as createGeoJsonLayer,
  latLngBounds,
  type LeafletMouseEvent,
} from "leaflet";

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

/** A tracked person's estimated position, ready to render. */
export interface PersonMarkerData {
  id: string;
  name: string;
  color: string;
  latlng: LeafletLatLngTuple;
  /** Route slice covering the uncertainty range, when the speed is unknown. */
  segment?: LeafletLatLngTuple[];
  /** e.g. "km 23,4", "km 20,1–26,3", "start 05:30", "binnen" */
  subtitle: string;
  /** Not started or already finished. */
  dimmed?: boolean;
  /** Vertical distance between the map point and its label chip. */
  labelOffsetPx?: number;
}

export interface MapViewProps {
  routeVariants: RouteVariant[];
  cameraRoutes: RouteVariant[];
  cameraRequest?: CameraRequest | null;
  onPointHover?: (hoveredRoutes: RelevantRoutePoint[] | null) => void;
  /** Fires on every map click with the route points near the click. */
  onRouteClick?: (points: RelevantRoutePoint[]) => void;
  hoveredPoint?: LeafletLatLngTuple | null;
  hoveredRoutes?:
    | Pick<RelevantRoutePoint, "routeId" | "pointIndices" | "latlng">[]
    | null;
  personMarkers?: PersonMarkerData[];
}

export interface CameraRequest {
  day: string;
  id: number;
}

const center: LeafletLatLngTuple = [51.842, 5.852]; // Nijmegen area

const MapCameraController: React.FC<{
  routeVariants: RouteVariant[];
  cameraRequest?: CameraRequest | null;
}> = ({ routeVariants, cameraRequest }) => {
  const map = useMap();
  const initialFitDone = React.useRef(false);
  const handledRequestId = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (routeVariants.length === 0) return;

    const requestedDayIsReady =
      cameraRequest !== null &&
      cameraRequest !== undefined &&
      routeVariants.every((route) => route.day === cameraRequest.day);
    const hasNewRequest =
      requestedDayIsReady && handledRequestId.current !== cameraRequest.id;

    if (initialFitDone.current && !hasNewRequest) return;

    const bounds = latLngBounds([]);
    for (const route of routeVariants) {
      bounds.extend(createGeoJsonLayer(route.geojson).getBounds());
    }
    if (!bounds.isValid()) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const desktopSidebarWidth = window.innerWidth >= 1280 ? 400 : 0;

    map.fitBounds(bounds, {
      animate: initialFitDone.current && !reducedMotion,
      duration: 0.9,
      paddingTopLeft: [desktopSidebarWidth + 32, 80],
      paddingBottomRight: [32, 32],
    });

    initialFitDone.current = true;
    if (hasNewRequest) handledRequestId.current = cameraRequest.id;
  }, [cameraRequest, map, routeVariants]);

  return null;
};

const isTouchDevice = () => {
  if (typeof window === "undefined") return false;
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-expect-error: msMaxTouchPoints is for legacy IE/Edge support
    navigator.msMaxTouchPoints > 0
  );
};

function useRouteSearchIndex(routeVariants: RouteVariant[]): RouteSearchIndex {
  return React.useMemo(
    () => buildRouteSearchIndex(routeVariants),
    [routeVariants]
  );
}

const MapEventHandler: React.FC<{
  routeVariants: RouteVariant[];
  onPointHover?: MapViewProps["onPointHover"];
  onRouteClick?: MapViewProps["onRouteClick"];
}> = ({ routeVariants, onPointHover, onRouteClick }) => {
  const touchDevice = isTouchDevice();
  const eventType = touchDevice ? "click" : "mousemove";
  const searchIndex = useRouteSearchIndex(routeVariants);
  const animationFrame = React.useRef<number | null>(null);
  const pendingLatLng = React.useRef<LeafletLatLngTuple | null>(null);
  const onPointHoverRef = React.useRef(onPointHover);
  const onRouteClickRef = React.useRef(onRouteClick);

  React.useEffect(() => {
    onPointHoverRef.current = onPointHover;
  }, [onPointHover]);

  React.useEffect(() => {
    onRouteClickRef.current = onRouteClick;
  }, [onRouteClick]);

  useMapEvent("click", (e: LeafletMouseEvent) => {
    if (!onRouteClickRef.current) return;
    const results = getRelevantRoutePoints(
      leafletLatLngToLngLat([e.latlng.lat, e.latlng.lng]),
      searchIndex
    );
    onRouteClickRef.current(results);
  });

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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function personIcon(marker: PersonMarkerData) {
  const labelOffsetPx = marker.labelOffsetPx ?? 12;
  return divIcon({
    className: "person-marker",
    iconSize: [0, 0],
    html: `
      <div class="person-marker-chip${marker.dimmed ? " person-marker-dimmed" : ""}" style="border-color:${marker.color};bottom:${labelOffsetPx}px">
        <strong>${escapeHtml(marker.name)}</strong><span>${escapeHtml(marker.subtitle)}</span>
      </div>
      <div class="person-marker-dot" style="background:${marker.color}"></div>`,
  });
}

const MapView: React.FC<MapViewProps> = ({
  routeVariants,
  cameraRoutes,
  cameraRequest,
  onPointHover,
  onRouteClick,
  hoveredPoint,
  hoveredRoutes,
  personMarkers,
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
      <MapCameraController
        routeVariants={cameraRoutes}
        cameraRequest={cameraRequest}
      />
      <MapEventHandler
        routeVariants={routeVariants}
        onPointHover={onPointHover}
        onRouteClick={onRouteClick}
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
      {/* Tracked people: uncertainty range + name chip */}
      {personMarkers && personMarkers.length > 0 && (
        <Pane name="person-markers" style={{ zIndex: 660 }}>
          {personMarkers.map((marker) => (
            <React.Fragment key={marker.id}>
              {marker.segment && marker.segment.length > 1 && (
                <Polyline
                  positions={marker.segment}
                  pathOptions={{
                    color: marker.color,
                    weight: 10,
                    opacity: 0.45,
                    lineCap: "round",
                  }}
                />
              )}
              <Marker
                position={marker.latlng}
                icon={personIcon(marker)}
                interactive={false}
              />
            </React.Fragment>
          ))}
        </Pane>
      )}
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
