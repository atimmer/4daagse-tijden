import React from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import type { FeatureCollection } from "geojson";
import "leaflet/dist/leaflet.css";

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
}

const center: [number, number] = [51.842, 5.852]; // Nijmegen area

const MapView: React.FC<MapViewProps> = ({ routes /*, onPointHover */ }) => {
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
          />
        ))}
    </MapContainer>
  );
};

export default MapView;
