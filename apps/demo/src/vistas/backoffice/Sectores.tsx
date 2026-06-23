import { Badge, Tarjeta, formatARS } from "@estacionar/ui";
import { MapaSectores } from "./Mapa.js";
import type { DatosBackoffice } from "./tipos.js";

export function SeccionSectores({ datos }: { datos: DatosBackoffice }) {
  const porSector = datos.dashboard.porSector;
  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
      <div>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-texto-tenue">Microcentro de San Fernando del Valle de Catamarca</h2>
        <MapaSectores sectores={porSector} alto={460} />
      </div>
      <div>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-texto-tenue">Sectores ({datos.sectores.length})</h2>
        <div className="space-y-2">
          {porSector.map((s) => (
            <Tarjeta key={s.sectorId} className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-bold">{s.name}</p>
                  <p className="text-xs text-texto-tenue">{s.ops} operaciones</p>
                </div>
                <div className="text-right">
                  <Badge tono={s.shift === "nocturno" ? "alerta" : "cyan"}>{s.shift}</Badge>
                  <p className="mt-1 font-bold text-cyan">{formatARS(s.total)}</p>
                </div>
              </div>
            </Tarjeta>
          ))}
        </div>
        <p className="mt-4 rounded-xl border border-ambar/20 bg-ambar/10 p-3 text-xs text-ambar-400">
          La geometría de cada sector queda preparada para producción con PostGIS. En esta demo se muestra como mapa SVG propio para evitar dependencias de mapa y mantener compatibilidad con React 18.
        </p>
      </div>
    </div>
  );
}
