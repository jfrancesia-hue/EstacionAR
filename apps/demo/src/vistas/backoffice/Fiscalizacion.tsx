import { useState } from "react";
import { Badge, Boton, Campo, Kpi, Tarjeta, formatARS, formatHora, formatMinutos, formatFechaHora, etiquetaMedio } from "@estacionar/ui";
import { clientLocal as client } from "../../store.js";

type Fisc = Awaited<ReturnType<typeof client.fiscalizarPatente>>;

const ESTADO_UI: Record<string, { label: string; tono: "ok" | "alerta" | "error" | "neutro" }> = {
  vigente: { label: "Vigente", tono: "ok" },
  por_vencer: { label: "Por vencer", tono: "alerta" },
  vencida: { label: "Vencida", tono: "error" },
  sin_sesion: { label: "Sin estacionamiento", tono: "neutro" },
};

const EJEMPLOS = ["AB123CD", "GH456IJ", "KL789MN"];

export function SeccionFiscalizacion() {
  const [plate, setPlate] = useState("");
  const [res, setRes] = useState<Fisc | null>(null);
  const [buscando, setBuscando] = useState(false);

  async function buscar(p?: string) {
    const patente = (p ?? plate).trim();
    if (!patente) return;
    if (p) setPlate(p);
    setBuscando(true);
    setRes(await client.fiscalizarPatente(patente));
    setBuscando(false);
  }

  const ui = res ? ESTADO_UI[res.estado] : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <p className="text-sm text-texto-tenue">
        Control rápido de Tránsito Municipal por patente: estado del estacionamiento, vigencia, permisionario, comprobante, medio de pago y alertas de excedente. También sirve como base para futuros controles de espacios reservados y libre estacionamiento.
      </p>

      <form onSubmit={(e) => { e.preventDefault(); buscar(); }} className="flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1">
          <Campo label="Patente a controlar" value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase())} placeholder="AB123CD" />
        </div>
        <Boton type="submit" grande cargando={buscando} disabled={!plate.trim()}>Controlar</Boton>
      </form>
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-texto-tenue">Ejemplos demo microcentro SFVC:</span>
        {EJEMPLOS.map((p) => (
          <button key={p} onClick={() => buscar(p)} className="rounded-full border border-borde bg-profundo/70 px-3 py-1 text-xs font-mono hover:border-cyan/50">{p}</button>
        ))}
      </div>

      {res && ui && (
        <Tarjeta titulo={`Patente ${res.plate}`} accion={<Badge tono={ui.tono}>{ui.label}</Badge>}>
          {res.estado === "sin_sesion" ? (
            <p className="py-4 text-sm text-texto-tenue">No registra estacionamiento activo. {res.alerta && "Tiene una alerta de excedente reciente (ver abajo)."}</p>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <Kpi label="Vigencia" valor={res.sesion ? `${formatHora(res.sesion.startValid)}–${formatHora(res.sesion.endValid)}` : "—"} acento="texto" />
                <Kpi label={res.estado === "vencida" ? "Excedido" : "Restante"} valor={res.estado === "vencida" ? formatMinutos(res.minutosExcedidos) : res.sesion ? formatMinutos(Math.max(0, Math.round((new Date(res.sesion.endValid).getTime() - Date.now()) / 60000))) : "—"} acento={res.estado === "vencida" ? "ambar" : "cyan"} />
                <Kpi label="Tolerancia" valor={formatMinutos(res.toleranceMinutes)} acento="texto" />
              </div>
              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-xl bg-profundo/70 p-3"><p className="text-texto-tenue">Permisionario</p><b>{res.permisionario?.fullName.replace(" (DEMO)", "") ?? "—"}</b></div>
                <div className="rounded-xl bg-profundo/70 p-3"><p className="text-texto-tenue">Sector</p><b>{res.sector?.name ?? "—"}</b></div>
                <div className="rounded-xl bg-profundo/70 p-3"><p className="text-texto-tenue">Medio de pago</p><b>{res.pago ? etiquetaMedio(res.pago.method) : "—"}</b></div>
                <div className="rounded-xl bg-profundo/70 p-3"><p className="text-texto-tenue">Comprobante</p><b className="font-mono text-xs">{res.pago?.id ?? "—"}</b></div>
              </div>
            </>
          )}
          {res.alerta && (
            <div className="mt-4 rounded-xl border border-ambar/30 bg-ambar/10 p-3 text-sm text-ambar-400">
              <b>Alerta de excedente activa</b> — {formatMinutos(res.alerta.minutosExcedidos)} excedidos · sugerido {formatARS(res.alerta.montoSugerido)} · desde {formatFechaHora(res.alerta.createdAt)}.
            </div>
          )}
        </Tarjeta>
      )}
    </div>
  );
}
