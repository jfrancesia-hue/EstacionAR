import { Badge, Kpi, Tarjeta, formatARS } from "@estacionar/ui";
import { MapaSectores } from "./Mapa.js";
import type { DatosBackoffice } from "./tipos.js";

export function SeccionInicio({ datos }: { datos: DatosBackoffice }) {
  const k = datos.dashboard.kpis;
  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-4">
        <Kpi label="Recaudación de hoy" valor={formatARS(k.recaudacionHoy)} sub="Cuenta recaudadora municipal" />
        <Kpi label="Digital" valor={formatARS(k.digitalTotal)} sub="MP · MODO · QR · Naranja" />
        <Kpi label="Efectivo auditado" valor={formatARS(k.cashTotal)} sub="Carga inmutable permisionario" acento="ambar" />
        <Kpi label="Operaciones" valor={k.operaciones} sub={`Ticket promedio ${formatARS(k.ticketPromedio)}`} />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <div>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-texto-tenue">Mapa de sectores</h2>
          <MapaSectores sectores={datos.dashboard.porSector} />
        </div>
        <div>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-texto-tenue">Recaudación por permisionario</h2>
          <Tarjeta>
            <div className="space-y-2">
              {datos.dashboard.porPermisionario.slice(0, 6).map((p, i) => (
                <div key={p.permisionarioId} className="flex items-center justify-between gap-3 rounded-xl bg-white/5 p-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-cyan/20 text-xs font-bold text-cyan">{i + 1}</span>
                    <span className="truncate">{p.fullName.replace(" (DEMO)", "")}</span>
                  </span>
                  <span className="text-texto-tenue">{p.ops} ops</span>
                  <b className="text-cyan">{formatARS(p.total)}</b>
                </div>
              ))}
            </div>
          </Tarjeta>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <Kpi label="Permisionarios activos" valor={k.permisionariosActivos} acento="texto" />
            <Kpi label="Sectores" valor={k.sectores} acento="texto" />
          </div>
        </div>
      </section>

      <section>
        <Tarjeta titulo="Tesis comercial" accion={<Badge tono="cyan">Para el Municipio</Badge>}>
          <div className="grid gap-3 text-sm text-texto-tenue md:grid-cols-3">
            <p><b className="text-texto">La plata entra primero al Municipio.</b> Toda la recaudación —digital y efectivo— ingresa a la cuenta municipal antes de cualquier liquidación.</p>
            <p><b className="text-texto">Trazabilidad total.</b> Cada operación queda auditada (QR firmado → patente → pago → sesión → rendición).</p>
            <p><b className="text-texto">Se preserva al permisionario.</b> No pierde ingresos; el sistema ordena el efectivo y aumenta el pago digital.</p>
          </div>
        </Tarjeta>
      </section>
    </div>
  );
}
