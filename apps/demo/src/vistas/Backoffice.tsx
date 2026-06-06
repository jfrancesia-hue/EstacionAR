import { useEffect, useState } from "react";
import { Boton, Cargando, formatFechaHora } from "@estacionar/ui";
import { clientLocal as client } from "../store.js";
import type { DatosBackoffice, Seccion } from "./backoffice/tipos.js";
import { SeccionInicio } from "./backoffice/Inicio.js";
import { SeccionTarifas } from "./backoffice/Tarifas.js";
import { SeccionPermisionarios } from "./backoffice/Permisionarios.js";
import { SeccionAltas } from "./backoffice/Altas.js";
import { SeccionSectores } from "./backoffice/Sectores.js";
import { SeccionFiscalizacion } from "./backoffice/Fiscalizacion.js";
import { SeccionReportes } from "./backoffice/Reportes.js";
import { SeccionAuditoria } from "./backoffice/Auditoria.js";

const SECCIONES: Array<{ id: Seccion; label: string; icono: string }> = [
  { id: "inicio", label: "Inicio", icono: "▦" },
  { id: "tarifas", label: "Tarifas", icono: "$" },
  { id: "permisionarios", label: "Permisionarios", icono: "◉" },
  { id: "altas", label: "Altas", icono: "✚" },
  { id: "sectores", label: "Sectores", icono: "⬡" },
  { id: "fiscalizacion", label: "Fiscalización", icono: "⊙" },
  { id: "reportes", label: "Reportes", icono: "▣" },
  { id: "auditoria", label: "Auditoría", icono: "✓" },
];

const TITULOS: Record<Seccion, string> = {
  inicio: "Panel municipal",
  tarifas: "Tarifas configurables",
  permisionarios: "Permisionarios",
  altas: "Alta y validación de permisionarios",
  sectores: "Sectores y mapa",
  fiscalizacion: "Fiscalización por patente",
  reportes: "Reportes de gestión",
  auditoria: "Auditoría fiscal",
};

export function VistaBackoffice() {
  const [seccion, setSeccion] = useState<Seccion>("inicio");
  const [datos, setDatos] = useState<DatosBackoffice | null>(null);
  const [cargandoInicial, setCargandoInicial] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [ultima, setUltima] = useState<string | null>(null);

  async function cargar() {
    setActualizando(true);
    const [dashboard, tarifas, permisionarios, sectores, config, auditoria] = await Promise.all([
      client.getDashboard(),
      client.getTarifas(),
      client.getPermisionarios(),
      client.getSectores(),
      client.getConfig(),
      client.getAuditoria(),
    ]);
    setDatos({ dashboard, tarifas, permisionarios, sectores, config, auditoria });
    setUltima(new Date().toISOString());
    setActualizando(false);
    setCargandoInicial(false);
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (cargandoInicial || !datos) return <Cargando texto="Cargando panel municipal…" />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:grid lg:grid-cols-[220px_1fr] lg:gap-8">
      {/* Navegación: sidebar en desktop, chips horizontales en mobile */}
      <aside className="mb-5 lg:mb-0">
        <nav aria-label="Secciones del backoffice" className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
          {SECCIONES.map((s) => (
            <button
              key={s.id}
              onClick={() => setSeccion(s.id)}
              aria-current={seccion === s.id ? "page" : undefined}
              className={`flex shrink-0 items-center gap-3 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition lg:w-full ${
                seccion === s.id ? "bg-cyan text-nocturno shadow-glow" : "text-texto-tenue hover:bg-white/5 hover:text-texto"
              }`}
            >
              <span aria-hidden="true" className="text-base">{s.icono}</span>
              {s.label}
            </button>
          ))}
        </nav>
      </aside>

      <div>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{TITULOS[seccion]}</h1>
            {ultima && <p className="text-xs text-texto-tenue">Datos en vivo · actualizado {formatFechaHora(ultima)}</p>}
          </div>
          <Boton variante="ambar" onClick={cargar} cargando={actualizando}>Actualizar</Boton>
        </div>

        {seccion === "inicio" && <SeccionInicio datos={datos} />}
        {seccion === "tarifas" && <SeccionTarifas datos={datos} onCambio={cargar} />}
        {seccion === "permisionarios" && <SeccionPermisionarios datos={datos} onCambio={cargar} />}
        {seccion === "altas" && <SeccionAltas onCambio={cargar} />}
        {seccion === "sectores" && <SeccionSectores datos={datos} />}
        {seccion === "fiscalizacion" && <SeccionFiscalizacion />}
        {seccion === "reportes" && <SeccionReportes datos={datos} />}
        {seccion === "auditoria" && <SeccionAuditoria datos={datos} />}
      </div>
    </div>
  );
}
