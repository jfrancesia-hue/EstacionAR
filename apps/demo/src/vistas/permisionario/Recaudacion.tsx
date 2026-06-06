import { Badge, Kpi, Tarjeta, formatARS } from "@estacionar/ui";
import { acreditadoPermisionario, SPLIT } from "../../split.js";
import type { DatosPermisionario } from "./tipos.js";

export function SeccionRecaudacion({ datos }: { datos: DatosPermisionario }) {
  const { recaudacion: r } = datos;
  // El permisionario recibe el 80% de cada pago digital, acreditado directo. El efectivo lo cobra en mano.
  const acreditadoDigital = acreditadoPermisionario(r.digital);
  const totalTuyo = acreditadoDigital + r.cash;

  return (
    <div className="space-y-6">
      <div>
        <Badge tono="cyan">Acreditado a tu cuenta hoy</Badge>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">{formatARS(totalTuyo)}</h1>
        <p className="mt-2 text-texto-tenue">{r.count} operaciones · acreditación directa, sin esperar liquidación del Municipio.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi label="Digital acreditado (80%)" valor={formatARS(acreditadoDigital)} sub="directo a tu cuenta, al instante" />
        <Kpi label="Efectivo en mano" valor={formatARS(r.cash)} acento="ambar" sub="genera deuda de plataforma" />
        <Kpi label="Operaciones" valor={r.count} acento="texto" />
      </div>

      <Tarjeta titulo="Cómo se reparte cada pago digital">
        <div className="mb-3 flex h-5 overflow-hidden rounded-full bg-white/10 text-[10px] font-bold">
          <div className="flex items-center justify-center bg-cyan text-nocturno" style={{ width: `${SPLIT.permisionarioPct}%` }}>VOS {SPLIT.permisionarioPct}%</div>
          <div className="flex items-center justify-center bg-ambar text-nocturno" style={{ width: `${SPLIT.plataformaPct}%` }}>{SPLIT.plataformaPct}%</div>
          <div className="flex items-center justify-center bg-white/30" style={{ width: `${SPLIT.descuentoCiudadanoPct}%` }}>{SPLIT.descuentoCiudadanoPct}%</div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs text-texto-tenue sm:grid-cols-4">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-cyan" /> Vos (permisionario) {SPLIT.permisionarioPct}%</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-ambar" /> Plataforma {SPLIT.plataformaPct}%</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-white/30" /> Descuento al ciudadano {SPLIT.descuentoCiudadanoPct}%</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-white/10" /> Municipio 0%</span>
        </div>
      </Tarjeta>

      <div className="rounded-2xl border border-cyan/20 bg-cyan/10 p-4 text-sm text-cyan-300">
        Tu <b>80% se acredita directo a tu cuenta en el momento</b> de cada pago digital — no esperás liquidación.
        El Municipio fiscaliza online cada operación, sin retener fondos ni demorar tu cobro.
      </div>
    </div>
  );
}
