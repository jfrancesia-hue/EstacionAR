import { formatARS } from "@estacionar/ui";
import type { Dashboard } from "@estacionar/ui";

// Mapa estilizado de sectores: proyecta las coordenadas reales (lng/lat) del seed a un
// viewBox SVG. Sin dependencias de mapas; da la lectura territorial (capa Fase 5).
export function MapaSectores({ sectores, alto = 380 }: { sectores: Dashboard["porSector"]; alto?: number }) {
  const W = 600;
  const H = alto;
  const pad = 60;
  const pts = sectores.map((s) => s.centroid);
  const lngs = pts.map((p) => p[0]);
  const lats = pts.map((p) => p[1]);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const spanLng = maxLng - minLng || 1;
  const spanLat = maxLat - minLat || 1;
  const maxTotal = Math.max(1, ...sectores.map((s) => s.total));

  // lat crece hacia el norte → se invierte en Y (pantalla crece hacia abajo).
  const px = (lng: number) => pad + ((lng - minLng) / spanLng) * (W - pad * 2);
  const py = (lat: number) => pad + ((maxLat - lat) / spanLat) * (H - pad * 2);

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-cyan/20 bg-[#061323]">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Mapa de sectores del microcentro de Salta">
        {/* grilla */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0H0V40" fill="none" stroke="rgba(15,182,206,.12)" strokeWidth="1" />
          </pattern>
          <radialGradient id="glow" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="rgba(15,182,206,.18)" />
            <stop offset="100%" stopColor="rgba(15,182,206,0)" />
          </radialGradient>
        </defs>
        <rect width={W} height={H} fill="url(#grid)" />
        <rect width={W} height={H} fill="url(#glow)" />

        {sectores.map((s) => {
          const ring = s.ring.map(([lng, lat]) => `${px(lng).toFixed(1)},${py(lat).toFixed(1)}`).join(" ");
          const intensidad = 0.15 + (s.total / maxTotal) * 0.55;
          const color = s.shift === "nocturno" ? "245,166,35" : "15,182,206";
          return (
            <polygon
              key={`ring-${s.sectorId}`}
              points={ring}
              fill={`rgba(${color},${intensidad})`}
              stroke={`rgba(${color},.9)`}
              strokeWidth="1.5"
            />
          );
        })}

        {sectores.map((s) => {
          const cx = px(s.centroid[0]);
          const cy = py(s.centroid[1]);
          const r = 5 + (s.total / maxTotal) * 9;
          const color = s.shift === "nocturno" ? "#F5A623" : "#0FB6CE";
          return (
            <g key={`pt-${s.sectorId}`}>
              <circle cx={cx} cy={cy} r={r} fill={color} opacity="0.9" />
              <circle cx={cx} cy={cy} r={r + 5} fill="none" stroke={color} strokeWidth="1" opacity="0.4" />
              <text x={cx} y={cy - r - 7} textAnchor="middle" className="fill-white" fontSize="12" fontWeight="700">{s.name}</text>
              <text x={cx} y={cy + r + 14} textAnchor="middle" fill="rgba(255,255,255,.6)" fontSize="10">{formatARS(s.total)}</text>
            </g>
          );
        })}
      </svg>
      <div className="flex flex-wrap items-center gap-4 border-t border-white/10 px-5 py-3 text-xs text-texto-tenue">
        <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-cyan" /> Diurno</span>
        <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-ambar" /> Nocturno</span>
        <span>El tamaño del punto refleja la recaudación del sector.</span>
      </div>
    </div>
  );
}
