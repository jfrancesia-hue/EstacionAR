import { QRCodeSVG } from "qrcode.react";
import { Badge, Tarjeta, EstadoPill } from "@estacionar/ui";
import { payloadQR } from "../../qr.js";
import type { DatosPermisionario } from "./tipos.js";

export function SeccionPerfil({ datos }: { datos: DatosPermisionario }) {
  const p = datos.perm;
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Mi credencial</h1>

      <Tarjeta className="bg-gradient-to-br from-superficie to-profundo/60">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <div className="text-center">
            <div className="inline-block rounded-2xl bg-white p-3 shadow-inner">
              <QRCodeSVG value={payloadQR(p)} size={160} bgColor="#ffffff" fgColor="#0A1A2F" level="M" />
            </div>
            <p className="mt-2 text-xs text-texto-tenue">Credencial QR · escaneable</p>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-extrabold">{p.fullName.replace(" (DEMO)", "")}</h2>
              <EstadoPill estado={p.status} />
            </div>
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-xl bg-white/5 p-3"><p className="text-texto-tenue">DNI</p><b>{p.dni}</b></div>
              <div className="rounded-xl bg-white/5 p-3"><p className="text-texto-tenue">Teléfono</p><b>{p.contactPhone}</b></div>
              <div className="rounded-xl bg-white/5 p-3"><p className="text-texto-tenue">Sector asignado</p><b>{p.sector?.name ?? "—"}</b></div>
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-texto-tenue">Turno</p>
                <Badge tono={p.shift === "nocturno" ? "alerta" : "cyan"}>{p.shift ?? "—"}</Badge>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-5 rounded-xl border border-white/10 bg-nocturno/40 p-3">
          <p className="text-xs uppercase tracking-wide text-texto-tenue">Token de la credencial</p>
          <p className="mt-1 break-all font-mono text-[11px] text-texto-tenue">{p.qrToken}</p>
        </div>
      </Tarjeta>

      <p className="rounded-xl border border-cyan/20 bg-cyan/10 p-4 text-sm text-cyan-300">
        El QR identifica al permisionario y se valida del lado del servidor en cada escaneo (estado, sector y turno vigentes).
        Un QR clonado no puede desviar fondos: el pago queda asociado a esta credencial y se acredita directo al permisionario.
      </p>
    </div>
  );
}
