import { useState } from "react";
import { Badge, Boton, Kpi, Tarjeta, formatARS } from "@estacionar/ui";
import { acreditadoPermisionario, SPLIT } from "../../split.js";
import { clientLocal as client } from "../../store.js";
import type { DatosPermisionario } from "./tipos.js";

// Umbrales de deuda (configurables). Sobre el crítico, el Municipio podría restringir nuevos efectivos.
const DEUDA_AVISO = 2000;
const DEUDA_CRITICA = 5000;

export function SeccionRecaudacion({ datos, onCambio }: { datos: DatosPermisionario; onCambio: () => void }) {
  const { recaudacion: r, deuda } = datos;
  const acreditadoDigital = acreditadoPermisionario(r.digital);
  const totalTuyo = acreditadoDigital + r.cash;
  const [pagando, setPagando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  async function pagarDeuda() {
    setPagando(true);
    try {
      const { pagado } = await client.pagarDeuda(datos.perm.id);
      setAviso(`Deuda saldada: ${formatARS(pagado)}. ¡Gracias!`);
      onCambio();
    } finally {
      setPagando(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Badge tono="cyan">Tu dinero de hoy</Badge>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">{formatARS(totalTuyo)}</h1>
        <p className="mt-2 text-texto-tenue">{r.count} operaciones · el digital se acredita directo a tu cuenta (80%); el efectivo lo cobrás en mano.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi label="Digital acreditado (80%)" valor={formatARS(acreditadoDigital)} sub="directo a tu cuenta, al instante" />
        <Kpi label="Efectivo en mano" valor={formatARS(r.cash)} acento="ambar" sub="genera deuda de plataforma" />
        <Kpi label="Operaciones" valor={r.count} acento="texto" />
      </div>

      {/* Deuda de plataforma (comisión del efectivo) */}
      <Tarjeta titulo="Deuda de plataforma" accion={deuda.total > 0 ? <Badge tono={deuda.total >= DEUDA_CRITICA ? "error" : deuda.total >= DEUDA_AVISO ? "alerta" : "cyan"}>{deuda.total >= DEUDA_AVISO ? "A regularizar" : "Al día"}</Badge> : <Badge tono="ok">Sin deuda</Badge>}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-3xl font-extrabold">{formatARS(deuda.total)}</p>
            <p className="text-xs text-texto-tenue">10% de plataforma por cada efectivo confirmado · porcentaje municipal trazado en backoffice.</p>
          </div>
          <Boton variante="primario" onClick={pagarDeuda} cargando={pagando} disabled={deuda.total <= 0}>Pagar deuda</Boton>
        </div>
        {deuda.total >= DEUDA_CRITICA && (
          <p className="mt-3 rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-300">
            Tu deuda superó el límite. Regularizala para seguir registrando efectivo.
          </p>
        )}
        {deuda.total >= DEUDA_AVISO && deuda.total < DEUDA_CRITICA && (
          <p className="mt-3 rounded-xl bg-ambar/15 px-3 py-2 text-sm text-ambar-400">
            Conviene regularizar tu deuda de plataforma pronto.
          </p>
        )}
        {aviso && <p className="mt-3 rounded-xl bg-emerald-500/15 px-3 py-2 text-sm text-emerald-300">{aviso}</p>}
      </Tarjeta>

      <Tarjeta titulo="Cómo se reparte cada pago digital">
        <div className="mb-3 flex h-5 overflow-hidden rounded-full bg-profundo text-[10px] font-bold">
          <div className="flex items-center justify-center bg-cyan text-nocturno" style={{ width: `${SPLIT.permisionarioPct}%` }}>VOS {SPLIT.permisionarioPct}%</div>
          <div className="flex items-center justify-center bg-ambar text-nocturno" style={{ width: `${SPLIT.plataformaPct}%` }}>{SPLIT.plataformaPct}%</div>
          <div className="flex items-center justify-center bg-profundo text-texto" style={{ width: `${SPLIT.municipioPct}%` }}>{SPLIT.municipioPct}%</div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs text-texto-tenue sm:grid-cols-4">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-cyan" /> Vos (permisionario) {SPLIT.permisionarioPct}%</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-ambar" /> Plataforma {SPLIT.plataformaPct}%</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-profundo" /> Municipalidad {SPLIT.municipioPct}%</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-white/30" /> Descuento app {SPLIT.descuentoCiudadanoPct}%</span>
        </div>
      </Tarjeta>

      <div className="rounded-2xl border border-cyan/25 bg-cyan/10 p-4 text-sm text-texto">
        Tu <b>80% se acredita directo a tu cuenta en el momento</b> de cada pago digital — no esperás liquidación.
        La Municipalidad fiscaliza online cada operación y conserva su 10% sin demorar tu cobro.
      </div>
    </div>
  );
}
