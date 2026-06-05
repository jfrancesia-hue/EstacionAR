import { Badge, Kpi, Tarjeta, formatARS, etiquetaMedio } from "@estacionar/ui";
import type { DatosBackoffice } from "./tipos.js";

function GraficoBarras({ serie }: { serie: DatosBackoffice["dashboard"]["serieDiaria"] }) {
  const W = 640;
  const H = 240;
  const padB = 28;
  const padT = 12;
  const max = Math.max(1, ...serie.map((d) => d.total));
  const bw = (W / serie.length) * 0.62;
  const gap = W / serie.length;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Recaudación de los últimos 14 días">
      {serie.map((d, i) => {
        const x = i * gap + (gap - bw) / 2;
        const hDig = ((H - padB - padT) * d.digital) / max;
        const hCash = ((H - padB - padT) * d.cash) / max;
        const yCash = H - padB - hCash;
        const yDig = yCash - hDig;
        const esHoy = i === serie.length - 1;
        return (
          <g key={d.date}>
            <rect x={x} y={yCash} width={bw} height={hCash} rx="2" fill="#F5A623" opacity={esHoy ? 1 : 0.75} />
            <rect x={x} y={yDig} width={bw} height={hDig} rx="2" fill="#0FB6CE" opacity={esHoy ? 1 : 0.75} />
            {esHoy && <text x={x + bw / 2} y={yDig - 5} textAnchor="middle" fill="#0FB6CE" fontSize="10" fontWeight="700">hoy</text>}
            <text x={x + bw / 2} y={H - 9} textAnchor="middle" fill="rgba(255,255,255,.4)" fontSize="9">{d.date.slice(8, 10)}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function SeccionReportes({ datos }: { datos: DatosBackoffice }) {
  const k = datos.dashboard.kpis;
  const mix = Object.entries(datos.dashboard.mixMedios).sort((a, b) => b[1] - a[1]);
  const totalMix = mix.reduce((a, [, v]) => a + v, 0) || 1;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <Kpi label="Recaudación del mes" valor={formatARS(k.recaudacionMes)} />
        <Kpi label="Acumulado total" valor={formatARS(k.recaudacionTotal)} acento="ambar" />
        <Kpi label="Ticket promedio" valor={formatARS(k.ticketPromedio)} acento="texto" />
      </section>

      <Tarjeta titulo="Recaudación diaria (últimos 14 días)" accion={
        <span className="flex items-center gap-3 text-xs text-texto-tenue">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-cyan" /> Digital</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-ambar" /> Efectivo</span>
        </span>
      }>
        <GraficoBarras serie={datos.dashboard.serieDiaria} />
      </Tarjeta>

      <section className="grid gap-6 lg:grid-cols-2">
        <Tarjeta titulo="Mix de medios de pago">
          <div className="space-y-3">
            {mix.map(([medio, valor]) => {
              const pct = Math.round((valor / totalMix) * 100);
              return (
                <div key={medio}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span>{etiquetaMedio(medio)}</span>
                    <b>{formatARS(valor)} · {pct}%</b>
                  </div>
                  <div className="h-2.5 rounded-full bg-white/10">
                    <div className="h-2.5 rounded-full bg-gradient-to-r from-cyan to-ambar" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Tarjeta>

        <Tarjeta titulo="Top sectores" accion={<Badge tono="cyan">por recaudación</Badge>}>
          <div className="space-y-2">
            {[...datos.dashboard.porSector].sort((a, b) => b.total - a.total).slice(0, 6).map((s, i) => (
              <div key={s.sectorId} className="flex items-center justify-between gap-3 rounded-xl bg-white/5 p-3 text-sm">
                <span className="flex items-center gap-2"><span className="grid h-6 w-6 place-items-center rounded-lg bg-ambar/20 text-xs font-bold text-ambar">{i + 1}</span>{s.name}</span>
                <b className="text-cyan">{formatARS(s.total)}</b>
              </div>
            ))}
          </div>
        </Tarjeta>
      </section>

      <p className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-texto-tenue">
        En producción estos reportes se exportan a Excel y PDF, con comparativas de período y filtros por fecha, sector y permisionario.
      </p>
    </div>
  );
}
