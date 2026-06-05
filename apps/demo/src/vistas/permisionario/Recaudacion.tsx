import { Badge, Kpi, Tarjeta, formatARS } from "@estacionar/ui";
import type { DatosPermisionario } from "./tipos.js";

export function SeccionRecaudacion({ datos }: { datos: DatosPermisionario }) {
  const { recaudacion: r } = datos;
  const pctDigital = r.total ? Math.round((r.digital / r.total) * 100) : 0;
  return (
    <div className="space-y-6">
      <div>
        <Badge tono="cyan">Tu recaudación de hoy</Badge>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">{formatARS(r.total)}</h1>
        <p className="mt-2 text-texto-tenue">{r.count} operaciones registradas hoy.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi label="Digital" valor={formatARS(r.digital)} sub={`${pctDigital}% del total`} />
        <Kpi label="Efectivo" valor={formatARS(r.cash)} acento="ambar" sub="Carga auditada" />
        <Kpi label="Operaciones" valor={r.count} acento="texto" />
      </div>

      <Tarjeta titulo="Composición del día">
        <div className="mb-2 flex h-4 overflow-hidden rounded-full bg-white/10">
          <div className="bg-cyan" style={{ width: `${pctDigital}%` }} />
          <div className="bg-ambar" style={{ width: `${100 - pctDigital}%` }} />
        </div>
        <div className="flex items-center justify-between text-xs text-texto-tenue">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-cyan" /> Digital {formatARS(r.digital)}</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-ambar" /> Efectivo {formatARS(r.cash)}</span>
        </div>
      </Tarjeta>

      <div className="rounded-2xl border border-cyan/20 bg-cyan/10 p-4 text-sm text-cyan-300">
        El Municipio ve esta recaudación <b>en tiempo real</b>, antes de cualquier liquidación. Tu liquidación se acredita
        T+1 según convenio, descontando solo la comisión configurada.
      </div>
    </div>
  );
}
