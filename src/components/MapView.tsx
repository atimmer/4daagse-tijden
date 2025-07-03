import React from "react";
import { MapContainer, TileLayer, GeoJSON, CircleMarker } from "react-leaflet";
import type { FeatureCollection, LineString, Feature, Position } from "geojson";
import type { LeafletMouseEvent } from "leaflet";
import "leaflet/dist/leaflet.css";
import { getCumulativeDistances, getRelevantRoutePoints } from "../lib/utils";

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

const MapView: React.FC<MapViewProps> = ({
  routeVariants,
  onPointHover,
  hoveredPoint,
}) => {
  // Use touch/click for mobile, hover for desktop
  const eventType = isTouchDevice() ? "click" : "mousemove";

  return (
    <MapContainer
      center={center}
      zoom={12}
      style={{ height: "100vh", width: "100vw" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {routeVariants.map((route) => (
        <GeoJSON
          key={route.id}
          data={route.geojson}
          style={() => ({ color: route.color, weight: 4 })}
          eventHandlers={{
            [eventType]: (e: LeafletMouseEvent) => {
              if (!onPointHover) return;
              const hoveredLatLng: [number, number] = [
                e.latlng.lat,
                e.latlng.lng,
              ];
              const results = getRelevantRoutePoints(
                hoveredLatLng,
                routeVariants
              );
              if (results.length > 0) {
                onPointHover(results);
              }
            },
          }}
        />
      ))}
      {hoveredPoint && (
        <CircleMarker
          center={hoveredPoint}
          radius={10}
          pathOptions={{ color: "#2563eb", fillColor: "#fff", fillOpacity: 1 }}
        />
      )}
    </MapContainer>
  );
};

export default MapView;
