import React from "react";
import { MapContainer, TileLayer, GeoJSON, Popup } from "react-leaflet";
import type { FeatureCollection, LineString, Feature, Position } from "geojson";
import "leaflet/dist/leaflet.css";
import RoutePopup from "./RoutePopup";
import { getCumulativeDistances } from "../lib/utils";

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

export interface RoutePopupInfo {
  routeName: string;
  color: string;
  distanceKm: number;
  timeRange: { earliest: string; latest: string };
  latlng: [number, number];
  direction?: string;
}

export interface MapViewProps {
  routeVariants: RouteVariant[];
  onPointHover?: (
    hoveredRoutes:
      | { routeId: string; pointIndices: number[]; latlng: [number, number] }[]
      | null
  ) => void;
  popupInfo?: RoutePopupInfo[] | null;
}

const center: [number, number] = [51.842, 5.852]; // Nijmegen area

const MapView: React.FC<MapViewProps> = ({
  routeVariants,
  onPointHover,
  popupInfo,
}) => {
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
      {routeVariants.map((route) => (
        <GeoJSON
          key={route.id}
          data={route.geojson}
          style={() => ({ color: route.color, weight: 4 })}
          eventHandlers={{
            mousemove: (e) => {
              if (!onPointHover) return;
              const hoveredLatLng: [number, number] = [
                e.latlng.lat,
                e.latlng.lng,
              ];
              const results: {
                routeId: string;
                pointIndices: number[];
                latlng: [number, number];
              }[] = [];
              for (const r of routeVariants) {
                const features = r.geojson.features.filter(
                  (f): f is Feature<LineString> =>
                    f.geometry.type === "LineString"
                );
                for (const feature of features) {
                  const coords = (
                    feature.geometry.coordinates as Position[]
                  ).filter(
                    (c): c is [number, number] =>
                      Array.isArray(c) &&
                      c.length >= 2 &&
                      typeof c[0] === "number" &&
                      typeof c[1] === "number"
                  );
                  // 1. Find all indices within 100 meters
                  const pointsWithDist = coords
                    .map(([lng, lat], idx) => ({
                      idx,
                      dist: Math.sqrt(
                        Math.pow(lat - hoveredLatLng[0], 2) +
                          Math.pow(lng - hoveredLatLng[1], 2)
                      ),
                      coord: [lng, lat] as [number, number],
                    }))
                    .filter(({ dist }) => dist < 0.001); // ~100m
                  // 2. Order by distance
                  pointsWithDist.sort((a, b) => a.dist - b.dist);
                  // 3. Deduplicate: only keep points whose cumulative distances from start differ by at least 1km
                  const cumDists = getCumulativeDistances(coords);
                  const deduped: typeof pointsWithDist = [];
                  for (const pt of pointsWithDist) {
                    if (
                      deduped.every(
                        (d) => Math.abs(cumDists[pt.idx] - cumDists[d.idx]) > 1
                      )
                    ) {
                      deduped.push(pt);
                    }
                    if (deduped.length === 2) break; // Only keep up to 2
                  }
                  // 4. Only show the 1 or 2 closest points per route
                  if (deduped.length > 0) {
                    results.push({
                      routeId: r.id,
                      pointIndices: deduped.map((d) => d.idx),
                      latlng: hoveredLatLng,
                    });
                  }
                }
              }
              if (results.length > 0) {
                onPointHover(results);
              }
            },
          }}
        />
      ))}
      {popupInfo && popupInfo.length > 0 && (
        <Popup position={popupInfo[0].latlng}>
          <RoutePopup routes={popupInfo} />
        </Popup>
      )}
    </MapContainer>
  );
};

export default MapView;
