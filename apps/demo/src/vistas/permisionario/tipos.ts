import type { PermisionarioConSector } from "@estacionar/ui";
import type { Incidencia, Pago } from "@estacionar/core";
import type { MovimientoDeuda, OrdenEfectivo } from "../../store.js";

export type PestanaPerm = "recaudacion" | "efectivo" | "movimientos" | "incidencias" | "perfil";

export interface RecaudacionHoy {
  digital: number;
  cash: number;
  total: number;
  count: number;
}

export interface DatosPermisionario {
  perm: PermisionarioConSector;
  recaudacion: RecaudacionHoy;
  movimientos: Pago[];
  incidencias: Incidencia[];
  ordenesPendientes: OrdenEfectivo[];
  deuda: { total: number; movimientos: MovimientoDeuda[] };
}
