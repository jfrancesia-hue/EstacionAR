import type { Dashboard, PermisionarioConSector } from "@estacionar/ui";
import type { AuditoriaEntry, ConfigSistema, Sector, Tarifa } from "@estacionar/core";

export type Seccion = "inicio" | "tarifas" | "permisionarios" | "altas" | "sectores" | "fiscalizacion" | "reportes" | "auditoria";

/** Datos del backoffice cargados una vez por el shell y pasados a cada sección. */
export interface DatosBackoffice {
  dashboard: Dashboard;
  tarifas: Tarifa[];
  permisionarios: PermisionarioConSector[];
  sectores: Sector[];
  config: ConfigSistema;
  auditoria: AuditoriaEntry[];
}
