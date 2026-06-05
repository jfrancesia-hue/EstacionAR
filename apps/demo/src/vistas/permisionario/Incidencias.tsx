import { useState } from "react";
import { Boton, Campo, Selector, Tarjeta, EstadoPill, formatFechaHora } from "@estacionar/ui";
import type { IncidenciaStatus } from "@estacionar/core";
import { clientLocal as client } from "../../store.js";
import type { DatosPermisionario } from "./tipos.js";

const TIPOS: Array<{ value: string; label: string }> = [
  { value: "vehiculo_mal_estacionado", label: "Vehículo mal estacionado" },
  { value: "falla_dispositivo", label: "Falla de dispositivo" },
  { value: "conflicto_usuario", label: "Conflicto con un usuario" },
  { value: "otro", label: "Otro" },
];

const ETIQUETA_TIPO: Record<string, string> = Object.fromEntries(TIPOS.map((t) => [t.value, t.label]));
const SIGUIENTE: Record<IncidenciaStatus, IncidenciaStatus | null> = { open: "in_progress", in_progress: "closed", closed: null };
const ACCION: Record<string, string> = { in_progress: "Marcar en curso", closed: "Cerrar" };

export function SeccionIncidencias({ datos, onCambio }: { datos: DatosPermisionario; onCambio: () => void }) {
  const [type, setType] = useState(TIPOS[0]!.value);
  const [description, setDescription] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function crear() {
    if (!description.trim()) return;
    setEnviando(true);
    await client.crearIncidencia({ permisionarioId: datos.perm.id, type, description: description.trim() });
    setDescription("");
    setEnviando(false);
    onCambio();
  }

  async function avanzar(id: string, status: IncidenciaStatus) {
    await client.editarIncidencia(id, status);
    onCambio();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Incidencias</h1>
        <p className="mt-2 text-texto-tenue">Reportá una situación en tu sector y seguí su estado.</p>
        <Tarjeta className="mt-5">
          <div className="space-y-3">
            <Selector label="Tipo" value={type} onChange={(e) => setType(e.target.value)}>
              {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Selector>
            <Campo label="Descripción" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Contá brevemente qué pasó…" />
          </div>
          <Boton className="mt-4 w-full" grande onClick={crear} cargando={enviando} disabled={!description.trim()}>
            Reportar incidencia
          </Boton>
        </Tarjeta>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-texto-tenue">Tus incidencias ({datos.incidencias.length})</h2>
        <div className="space-y-3">
          {datos.incidencias.length === 0 && <p className="text-sm text-texto-tenue">No tenés incidencias reportadas.</p>}
          {datos.incidencias.map((inc) => {
            const sig = SIGUIENTE[inc.status];
            return (
              <Tarjeta key={inc.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{ETIQUETA_TIPO[inc.type] ?? inc.type}</p>
                    <p className="mt-0.5 text-sm text-texto-tenue">{inc.description}</p>
                    <p className="mt-1 text-xs text-texto-tenue">{formatFechaHora(inc.createdAt)}</p>
                  </div>
                  <EstadoPill estado={inc.status} />
                </div>
                {sig && (
                  <div className="mt-3 flex justify-end">
                    <Boton variante="secundario" onClick={() => avanzar(inc.id, sig)}>{ACCION[sig]}</Boton>
                  </div>
                )}
              </Tarjeta>
            );
          })}
        </div>
      </div>
    </div>
  );
}
