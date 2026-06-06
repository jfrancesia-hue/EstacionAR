import type { PermisionarioConSector } from "@estacionar/ui";
import type { Incidencia, Pago, Sesion } from "@estacionar/core";
import type { MovimientoDeuda, OrdenEfectivo } from "../../store.js";

export type PestanaPerm = "recaudacion" | "efectivo" | "vencidas" | "movimientos" | "incidencias" | "perfil";

export interface VencidaItem {
  sesion: Sesion;
  permisionarioId: string | null;
  sectorName: string | null;
  minutosExcedidos: number;
}

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
  vencidas: VencidaItem[];
}
