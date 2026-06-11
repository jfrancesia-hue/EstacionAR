import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { formatARS } from "@estacionar/ui";
import type { Dashboard } from "@estacionar/ui";

// Mapa real (OpenStreetMap) con los sectores del microcentro de Salta como marcadores.
export function MapaReal({ sectores, alto = 380 }: { sectores: Dashboard["porSector"]; alto?: number }) {
  const lats = sectores.map((s) => s.centroid[1]);
  const lngs = sectores.map((s) => s.centroid[0]);
  const centro: [number, number] = [
    lats.length ? lats.reduce((a, b) => a + b, 0) / lats.length : -24.7886,
    lngs.length ? lngs.reduce((a, b) => a + b, 0) / lngs.length : -65.4106,
  ];
  const maxTotal = Math.max(1, ...sectores.map((s) => s.total));

  return (
    <div className="overflow-hidden rounded-[2rem] border border-cyan/20" style={{ height: alto }}>
      <MapContainer center={centro} zoom={15} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {sectores.map((s) => {
          const color = s.shift === "nocturno" ? "#F5A623" : "#0FB6CE";
          const radius = 8 + (s.total / maxTotal) * 14;
          return (
            <CircleMarker
              key={s.sectorId}
              center={[s.centroid[1], s.centroid[0]]}
              radius={radius}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.45, weight: 2 }}
            >
              <Tooltip direction="top">
                <b>{s.name}</b> · {formatARS(s.total)} · {s.ops} ops
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
