import { useEffect, useState } from "react";
import { Badge, Cargando, EstadoPill, formatMinutos } from "@estacionar/ui";
import { clientLocal as client } from "../store.js";
import { Avatar } from "../Avatar.js";
import type { DatosPermisionario, PestanaPerm } from "./permisionario/tipos.js";
import { SeccionRecaudacion } from "./permisionario/Recaudacion.js";
import { SeccionRegistrarEfectivo } from "./permisionario/RegistrarEfectivo.js";
import { SeccionVencidas } from "./permisionario/Vencidas.js";
import { SeccionMovimientos } from "./permisionario/Movimientos.js";
import { SeccionIncidencias } from "./permisionario/Incidencias.js";
import { SeccionPerfil } from "./permisionario/Perfil.js";

const PESTANAS: Array<{ id: PestanaPerm; label: string }> = [
  { id: "recaudacion", label: "Recaudación" },
  { id: "efectivo", label: "Efectivo" },
  { id: "vencidas", label: "Vencidas" },
  { id: "movimientos", label: "Movimientos" },
  { id: "incidencias", label: "Incidencias" },
  { id: "perfil", label: "Mi credencial" },
];

export function VistaPermisionario() {
  const [pestana, setPestana] = useState<PestanaPerm>("recaudacion");
  const [datos, setDatos] = useState<DatosPermisionario | null>(null);
  const [cargando, setCargando] = useState(true);
  const [notis, setNotis] = useState(false);

  async function cargar() {
    const permisionarios = await client.getPermisionarios();
    const perm = permisionarios.find((p) => p.status === "active") ?? permisionarios[0];
    if (!perm) return;
    const [recaudacion, movimientos, incidencias, ordenesPendientes, deuda, vencidas] = await Promise.all([
      client.getRecaudacionHoy(perm.id),
      client.getMovimientos(perm.id),
      client.getIncidencias(perm.id),
      client.getOrdenesEfectivoPendientes(perm.id),
      client.getDeuda(perm.id),
      client.getSesionesVencidas(perm.id),
    ]);
    setDatos({ perm, recaudacion, movimientos, incidencias, ordenesPendientes, deuda, vencidas });
    setCargando(false);
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (cargando || !datos) return <Cargando texto="Cargando credencial…" />;

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar id={datos.perm.id} nombre={datos.perm.fullName} size={44} />
          <div>
            <p className="font-bold leading-tight">{datos.perm.fullName.replace(" (DEMO)", "")}</p>
            <p className="text-xs text-texto-tenue">{datos.perm.sector?.name ?? "Sin sector"}</p>
          </div>
          <EstadoPill estado={datos.perm.status} />
        </div>
        <div className="relative flex items-center gap-3">
          <button
            onClick={() => setNotis((v) => !v)}
            aria-label={`Notificaciones (${datos.vencidas.length})`}
            className="relative rounded-xl border border-white/10 bg-white/5 p-2 text-lg leading-none transition hover:bg-white/10"
          >
            🔔
            {datos.vencidas.length > 0 && (
              <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-red-500 text-[10px] font-black text-white">{datos.vencidas.length}</span>
            )}
          </button>
          <Badge tono="cyan">Credencial activa</Badge>
          {notis && (
            <div className="absolute right-0 top-12 z-30 w-72 rounded-2xl border border-white/10 bg-superficie p-3 shadow-2xl">
              <p className="mb-2 text-sm font-bold">Notificaciones</p>
              {datos.vencidas.length === 0 ? (
                <p className="py-2 text-xs text-texto-tenue">Sin avisos. Todo al día en tu zona.</p>
              ) : (
                <>
                  {datos.vencidas.slice(0, 4).map((v) => (
                    <div key={v.sesion.id} className="mb-1.5 rounded-lg bg-ambar/10 p-2 text-xs text-ambar-400">
                      Patente <b>{v.sesion.plate}</b> vencida · excedido {formatMinutos(v.minutosExcedidos)}
                    </div>
                  ))}
                  <button onClick={() => { setPestana("vencidas"); setNotis(false); }} className="mt-1 w-full rounded-lg bg-cyan/15 py-1.5 text-xs font-bold text-cyan hover:bg-cyan/25">
                    Ver patentes vencidas
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <nav aria-label="Secciones del permisionario" className="mb-6 flex gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-white/5 p-1">
        {PESTANAS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPestana(p.id)}
            aria-current={pestana === p.id ? "page" : undefined}
            className={`shrink-0 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition ${
              pestana === p.id ? "bg-cyan text-nocturno shadow-glow" : "text-texto-tenue hover:text-texto"
            }`}
          >
            {p.label}
            {p.id === "efectivo" && datos.ordenesPendientes.length > 0 && (
              <span className="ml-2 rounded-full bg-ambar px-1.5 text-[10px] font-black text-nocturno">{datos.ordenesPendientes.length}</span>
            )}
            {p.id === "vencidas" && datos.vencidas.length > 0 && (
              <span className="ml-2 rounded-full bg-red-500 px-1.5 text-[10px] font-black text-white">{datos.vencidas.length}</span>
            )}
          </button>
        ))}
      </nav>

      {pestana === "recaudacion" && <SeccionRecaudacion datos={datos} onCambio={cargar} />}
      {pestana === "efectivo" && <SeccionRegistrarEfectivo datos={datos} onCambio={cargar} />}
      {pestana === "vencidas" && <SeccionVencidas datos={datos} onCambio={cargar} />}
      {pestana === "movimientos" && <SeccionMovimientos datos={datos} />}
      {pestana === "incidencias" && <SeccionIncidencias datos={datos} onCambio={cargar} />}
      {pestana === "perfil" && <SeccionPerfil datos={datos} />}
    </main>
  );
}
