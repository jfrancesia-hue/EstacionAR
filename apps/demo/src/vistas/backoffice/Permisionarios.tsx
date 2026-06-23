import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Badge, Boton, Tarjeta, EstadoPill, formatARS } from "@estacionar/ui";
import { clientLocal as client } from "../../store.js";
import { urlPagoQR } from "../../qr.js";
import { Avatar } from "../../Avatar.js";
import { desglosarPagado } from "../../split.js";
import type { DatosBackoffice } from "./tipos.js";

export function SeccionPermisionarios({ datos, onCambio }: { datos: DatosBackoffice; onCambio: () => void }) {
  const [selId, setSelId] = useState<string>(datos.permisionarios[0]?.id ?? "");
  const [procesando, setProcesando] = useState(false);
  const sel = datos.permisionarios.find((p) => p.id === selId) ?? datos.permisionarios[0];
  const recaudacion = datos.dashboard.porPermisionario.find((p) => p.permisionarioId === sel?.id);

  async function cambiarEstado() {
    if (!sel) return;
    setProcesando(true);
    await client.editarPermisionario(sel.id, { status: sel.status === "active" ? "suspended" : "active" });
    setProcesando(false);
    onCambio();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      <div>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-texto-tenue">Permisionarios ({datos.permisionarios.length})</h2>
        <div className="space-y-2">
          {datos.permisionarios.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelId(p.id)}
              className={`flex w-full items-center justify-between gap-3 rounded-2xl border p-3 text-left transition ${
                p.id === sel?.id ? "border-cyan/50 bg-cyan/10" : "border-borde/60 bg-superficie/60 hover:border-borde"
              }`}
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-sm font-bold">{p.fullName.charAt(0)}</span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{p.fullName.replace(" (DEMO)", "")}</span>
                  <span className="block truncate text-xs text-texto-tenue">{p.sector?.name ?? "Sin sector"}</span>
                </span>
              </span>
              <EstadoPill estado={p.status} />
            </button>
          ))}
        </div>
      </div>

      {sel && (
        <div>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-texto-tenue">Ficha</h2>
          <Tarjeta className="bg-gradient-to-br from-superficie to-profundo/60">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <Avatar id={sel.id} nombre={sel.fullName} size={64} />
                <div>
                  <h3 className="text-2xl font-extrabold">{sel.fullName.replace(" (DEMO)", "")}</h3>
                  <p className="text-sm text-texto-tenue">DNI {sel.dni} · {sel.contactPhone}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <EstadoPill estado={sel.status} />
                    <Badge tono={sel.shift === "nocturno" ? "alerta" : "cyan"}>{sel.shift ?? "—"}</Badge>
                    <Badge tono="neutro">★ {sel.rating || "s/d"}</Badge>
                  </div>
                </div>
              </div>
              <div className="shrink-0 rounded-xl bg-white p-2 shadow-inner">
                <QRCodeSVG value={urlPagoQR(sel)} size={96} bgColor="#ffffff" fgColor="#2B0F15" level="M" />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              <div className="rounded-xl bg-white/5 p-3"><p className="text-texto-tenue">Sector</p><b>{sel.sector?.name ?? "—"}</b></div>
              <div className="rounded-xl bg-white/5 p-3"><p className="text-texto-tenue">Acreditado (80%)</p><b className="text-cyan">{formatARS(desglosarPagado(recaudacion?.total ?? 0).permisionario)}</b></div>
              <div className="rounded-xl bg-white/5 p-3"><p className="text-texto-tenue">Operaciones</p><b>{recaudacion?.ops ?? 0}</b></div>
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-nocturno/40 p-3">
              <p className="text-xs uppercase tracking-wide text-texto-tenue">Token QR (credencial firmada)</p>
              <p className="mt-1 break-all font-mono text-[11px] text-texto-tenue">{sel.qrToken}</p>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <p className="text-xs text-texto-tenue">
                Un permisionario suspendido no puede operar (el QR se rechaza del lado del servidor).
              </p>
              <Boton variante={sel.status === "active" ? "peligro" : "primario"} onClick={cambiarEstado} cargando={procesando}>
                {sel.status === "active" ? "Suspender" : "Activar"}
              </Boton>
            </div>
          </Tarjeta>
        </div>
      )}
    </div>
  );
}
