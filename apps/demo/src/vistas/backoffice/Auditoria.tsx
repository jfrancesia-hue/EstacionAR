import { useMemo, useState } from "react";
import { Badge, Selector, Tarjeta, formatFechaHora } from "@estacionar/ui";
import type { DatosBackoffice } from "./tipos.js";

const ETIQUETA_ACCION: Record<string, string> = {
  pago_digital: "Pago digital",
  efectivo_confirmado: "Efectivo confirmado",
  orden_efectivo_creada: "Efectivo iniciado",
  orden_efectivo_cancelada: "Efectivo cancelado",
  deuda_pagada: "Deuda saldada",
  excedente_cobrado: "Excedente cobrado",
  excedente_no_pagado: "Excedente no pagado",
  valoracion: "Valoración ciudadana",
  tarifa_update: "Cambio de tarifa",
  permisionario_update: "ABM permisionario",
  permisionario_alta: "Alta de permisionario",
  permisionarios_importados: "Importación de padrón",
  permisionario_approved: "Permisionario aprobado",
  permisionario_observed: "Permisionario observado",
  permisionario_rejected: "Permisionario rechazado",
  config_update: "Cambio de config",
  incidencia_create: "Incidencia creada",
  incidencia_update: "Incidencia actualizada",
};

const TONO_ACCION: Record<string, "ok" | "alerta" | "cyan" | "neutro" | "error"> = {
  pago_digital: "cyan",
  efectivo_confirmado: "alerta",
  orden_efectivo_creada: "neutro",
  orden_efectivo_cancelada: "neutro",
  deuda_pagada: "ok",
  excedente_cobrado: "alerta",
  excedente_no_pagado: "error",
  valoracion: "ok",
  tarifa_update: "ok",
  permisionario_update: "neutro",
  permisionario_alta: "cyan",
  permisionarios_importados: "cyan",
  permisionario_approved: "ok",
  permisionario_observed: "alerta",
  permisionario_rejected: "error",
  config_update: "neutro",
  incidencia_create: "alerta",
  incidencia_update: "neutro",
};

export function SeccionAuditoria({ datos }: { datos: DatosBackoffice }) {
  const [filtro, setFiltro] = useState("todas");
  const acciones = useMemo(() => Array.from(new Set(datos.auditoria.map((a) => a.action))), [datos.auditoria]);
  const filtradas = filtro === "todas" ? datos.auditoria : datos.auditoria.filter((a) => a.action === filtro);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-texto-tenue">
          Registro <b className="text-texto">append-only</b>: cada operación sensible queda asentada y no se puede editar ni borrar.
        </p>
        <div className="w-56">
          <Selector value={filtro} onChange={(e) => setFiltro(e.target.value)} aria-label="Filtrar por acción">
            <option value="todas">Todas las acciones ({datos.auditoria.length})</option>
            {acciones.map((a) => (
              <option key={a} value={a}>{ETIQUETA_ACCION[a] ?? a}</option>
            ))}
          </Selector>
        </div>
      </div>

      <Tarjeta>
        {filtradas.length === 0 ? (
          <p className="py-8 text-center text-sm text-texto-tenue">
            Sin eventos todavía. Generá pagos o cambios desde las otras secciones/roles y aparecerán acá.
          </p>
        ) : (
          <ol className="divide-y divide-white/5">
            {filtradas.slice(0, 40).map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span className="flex items-center gap-3">
                  <Badge tono={TONO_ACCION[a.action] ?? "neutro"}>{ETIQUETA_ACCION[a.action] ?? a.action}</Badge>
                  <span className="text-sm text-texto-tenue">{a.entity}{a.entityId ? ` · ${a.entityId}` : ""}</span>
                </span>
                <span className="flex items-center gap-4">
                  <span className="hidden font-mono text-xs text-texto-tenue sm:inline">{resumenPayload(a.payload)}</span>
                  <time className="text-xs text-texto-tenue">{formatFechaHora(a.createdAt)}</time>
                </span>
              </li>
            ))}
          </ol>
        )}
      </Tarjeta>
    </div>
  );
}

function resumenPayload(payload: Record<string, unknown>): string {
  const entries = Object.entries(payload).slice(0, 3);
  if (entries.length === 0) return "";
  return entries.map(([k, v]) => `${k}: ${v !== null && typeof v === "object" ? JSON.stringify(v) : String(v)}`).join("  ·  ");
}
