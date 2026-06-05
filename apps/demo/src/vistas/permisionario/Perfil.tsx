import { Badge, Tarjeta, EstadoPill } from "@estacionar/ui";
import type { DatosPermisionario } from "./tipos.js";

function QrCredencial() {
  return (
    <div className="grid h-44 w-44 grid-cols-7 gap-1 rounded-2xl bg-white p-3 shadow-inner">
      {Array.from({ length: 49 }).map((_, i) => {
        const finder = (i < 14 && i % 7 < 2) || (i % 7 > 4 && i < 14) || (i > 34 && i % 7 < 2);
        const active = finder || i % 4 === 0 || i % 7 === 3 || [10, 19, 25, 31, 38].includes(i);
        return <span key={i} className={active ? "rounded-[2px] bg-[#0067B1]" : "rounded-[2px] bg-[#0A1A2F]/10"} />;
      })}
    </div>
  );
}

export function SeccionPerfil({ datos }: { datos: DatosPermisionario }) {
  const p = datos.perm;
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Mi credencial</h1>

      <Tarjeta className="bg-gradient-to-br from-superficie to-profundo/60">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <div className="text-center">
            <QrCredencial />
            <p className="mt-2 text-xs text-texto-tenue">Credencial QR firmada</p>
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
        Un QR clonado no puede desviar fondos: el cobro siempre va a la cuenta recaudadora municipal.
      </p>
    </div>
  );
}
