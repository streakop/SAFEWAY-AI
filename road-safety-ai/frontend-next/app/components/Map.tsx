"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

type Alert = {
  location: string;
  severity: string;
  time: string;
};

const coords: Record<string, [number, number]> = {
  "Bhopal Highway": [23.2599, 77.4126],
  "Delhi Expressway": [28.6139, 77.2090],
};

export default function Map({ alerts }: { alerts: Alert[] }) {
  return (
    <div style={{ height: "400px", width: "100%" }}>
      <MapContainer
        center={[23.2599, 77.4126]}
        zoom={5}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {alerts.map((a, i) => {
          const c = coords[a.location];
          if (!c) return null;

          return (
            <Marker key={i} position={c}>
              <Popup>{a.location}</Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}