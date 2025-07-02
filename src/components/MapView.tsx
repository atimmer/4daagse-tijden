import React from "react";
import { MapContainer, TileLayer, GeoJSON, Popup } from "react-leaflet";
import type { FeatureCollection, LineString, Feature, Position } from "geojson";
import "leaflet/dist/leaflet.css";
import RoutePopup from "./RoutePopup";

export interface RouteData {
  name: string;
  geojson: FeatureCollection;
  color: string;
  visible: boolean;
}

export interface MapViewProps {
  routes: RouteData[];
  onPointHover?: (
    routeName: string,
    pointIndex: number,
    latlng: [number, number]
  ) => void;
  popupInfo?: {
    routeName: string;
    distanceKm: number;
    timeRange: { earliest: string; latest: string };
    latlng: [number, number];
  } | null;
}

const center: [number, number] = [51.842, 5.852]; // Nijmegen area

// Helper to find closest point index on a LineString to a given latlng
function findClosestPointIndex(
  coords: [number, number][],
  lat: number,
  lng: number
): number {
  let minDist = Infinity;
  let minIdx = 0;
  for (let i = 0; i < coords.length; i++) {
    const [clng, clat] = coords[i];
    const d = Math.pow(clat - lat, 2) + Math.pow(clng - lng, 2);
    if (d < minDist) {
      minDist = d;
      minIdx = i;
    }
  }
  return minIdx;
}

const MapView: React.FC<MapViewProps> = ({
  routes,
  onPointHover,
  popupInfo,
}) => {
  // Helper to extract all LineString features from a route
  function getLineStringFeatures(route: RouteData): Feature<LineString>[] {
    return route.geojson.features.filter(
      (f): f is Feature<LineString> => f.geometry.type === "LineString"
    );
  }

  return (
    <MapContainer
      center={center}
      zoom={12}
      style={{ height: "70vh", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {routes
        .filter((r) => r.visible)
        .map((route) => (
          <GeoJSON
            key={route.name}
            data={route.geojson}
            style={() => ({ color: route.color, weight: 4 })}
            eventHandlers={{
              mousemove: (e) => {
                if (!onPointHover) return;
                // Filter only [number, number] coordinates
                const coords = (
                  getLineStringFeatures(route)[0].geometry
                    .coordinates as Position[]
                ).filter(
                  (c): c is [number, number] =>
                    Array.isArray(c) &&
                    c.length >= 2 &&
                    typeof c[0] === "number" &&
                    typeof c[1] === "number"
                );
                if (coords.length === 0) return;
                const idx = findClosestPointIndex(
                  coords,
                  e.latlng.lat,
                  e.latlng.lng
                );
                const [lng, lat] = coords[idx];
                onPointHover(route.name, idx, [lat, lng]);
              },
            }}
          />
        ))}
      {popupInfo && (
        <Popup position={popupInfo.latlng}>
          <RoutePopup
            routeName={popupInfo.routeName}
            distanceKm={popupInfo.distanceKm}
            timeRange={popupInfo.timeRange}
          />
        </Popup>
      )}
    </MapContainer>
  );
};

export default MapView;
