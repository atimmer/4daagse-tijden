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
import { getRelevantRoutePoints } from "../lib/utils";
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
  onPointHover?: (
    hoveredRoutes:
      | { routeId: string; pointIndices: number[]; latlng: [number, number] }[]
      | null
  ) => void;
  hoveredPoint?: [number, number] | null;
  hoveredRoutes?:
    | { routeId: string; pointIndices: number[]; latlng: [number, number] }[]
    | null;
}

const center: [number, number] = [51.842, 5.852]; // Nijmegen area

const isTouchDevice = () => {
  if (typeof window === "undefined") return false;
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-expect-error: msMaxTouchPoints is for legacy IE/Edge support
    navigator.msMaxTouchPoints > 0
  );
};

const MapEventHandler: React.FC<{
  routeVariants: RouteVariant[];
  onPointHover?: MapViewProps["onPointHover"];
}> = ({ routeVariants, onPointHover }) => {
  const eventType = isTouchDevice() ? "click" : "mousemove";
  useMapEvent(eventType, (e: LeafletMouseEvent) => {
    if (!onPointHover) return;
    const hoveredLatLng: [number, number] = [e.latlng.lat, e.latlng.lng];
    const results = getRelevantRoutePoints(hoveredLatLng, routeVariants);
    if (results.length > 0) {
      onPointHover(results);
    }
  });
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
