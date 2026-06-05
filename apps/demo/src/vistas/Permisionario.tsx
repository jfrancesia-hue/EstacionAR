import { useEffect, useState } from "react";
import { Badge, Cargando, EstadoPill } from "@estacionar/ui";
import { clientLocal as client } from "../store.js";
import type { DatosPermisionario, PestanaPerm } from "./permisionario/tipos.js";
import { SeccionRecaudacion } from "./permisionario/Recaudacion.js";
import { SeccionRegistrarEfectivo } from "./permisionario/RegistrarEfectivo.js";
import { SeccionMovimientos } from "./permisionario/Movimientos.js";
import { SeccionIncidencias } from "./permisionario/Incidencias.js";
import { SeccionPerfil } from "./permisionario/Perfil.js";

const PESTANAS: Array<{ id: PestanaPerm; label: string }> = [
  { id: "recaudacion", label: "Recaudación" },
  { id: "efectivo", label: "Registrar efectivo" },
  { id: "movimientos", label: "Movimientos" },
  { id: "incidencias", label: "Incidencias" },
  { id: "perfil", label: "Mi credencial" },
];

export function VistaPermisionario() {
  const [pestana, setPestana] = useState<PestanaPerm>("recaudacion");
  const [datos, setDatos] = useState<DatosPermisionario | null>(null);
  const [cargando, setCargando] = useState(true);

  async function cargar() {
    const permisionarios = await client.getPermisionarios();
    const perm = permisionarios.find((p) => p.status === "active") ?? permisionarios[0];
    if (!perm) return;
    const [recaudacion, movimientos, incidencias] = await Promise.all([
      client.getRecaudacionHoy(perm.id),
      client.getMovimientos(perm.id),
      client.getIncidencias(perm.id),
    ]);
    setDatos({ perm, recaudacion, movimientos, incidencias });
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
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan/15 text-lg font-bold text-cyan">{datos.perm.fullName.charAt(0)}</span>
          <div>
            <p className="font-bold leading-tight">{datos.perm.fullName.replace(" (DEMO)", "")}</p>
            <p className="text-xs text-texto-tenue">{datos.perm.sector?.name ?? "Sin sector"}</p>
          </div>
          <EstadoPill estado={datos.perm.status} />
        </div>
        <Badge tono="cyan">Credencial activa</Badge>
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
          </button>
        ))}
      </nav>

      {pestana === "recaudacion" && <SeccionRecaudacion datos={datos} />}
      {pestana === "efectivo" && <SeccionRegistrarEfectivo datos={datos} onCambio={cargar} />}
      {pestana === "movimientos" && <SeccionMovimientos datos={datos} />}
      {pestana === "incidencias" && <SeccionIncidencias datos={datos} onCambio={cargar} />}
      {pestana === "perfil" && <SeccionPerfil datos={datos} />}
    </main>
  );
}
