import { Badge, Kpi, Tarjeta, formatARS } from "@estacionar/ui";
import { MapaSectores } from "./Mapa.js";
import type { DatosBackoffice } from "./tipos.js";

export function SeccionInicio({ datos }: { datos: DatosBackoffice }) {
  const k = datos.dashboard.kpis;
  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-4">
        <Kpi label="Pagos fiscalizados hoy" valor={formatARS(k.recaudacionHoy)} sub="Acreditación directa" />
        <Kpi label="Digital con beneficio" valor={formatARS(k.digitalTotal)} sub="20% menos por app" />
        <Kpi label="Efectivo auditado" valor={formatARS(k.cashTotal)} sub="Carga inmutable permisionario" acento="ambar" />
        <Kpi label="Operaciones" valor={k.operaciones} sub={`Ticket promedio ${formatARS(k.ticketPromedio)}`} />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <div>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-texto-tenue">Mapa de sectores</h2>
          <MapaSectores sectores={datos.dashboard.porSector} />
        </div>
        <div>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-texto-tenue">Acreditado por permisionario</h2>
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
            <p><b className="text-texto">La plata no entra a rentas generales.</b> El pago digital se acredita directo al permisionario asociado al QR.</p>
            <p><b className="text-texto">Beneficio completo al vecino.</b> Sin 10% para proveedor ni comisión municipal: el 20% se convierte en descuento por usar la app.</p>
            <p><b className="text-texto">Control sin carga administrativa.</b> El Municipio ve comprobantes, sectores y operaciones en vivo sin transferirle a 800/900 personas por día.</p>
          </div>
        </Tarjeta>
      </section>
    </div>
  );
}
