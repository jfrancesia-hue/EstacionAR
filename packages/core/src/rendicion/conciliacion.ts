// Conciliacion / rendicion diaria (CLAUDE.md §3.5, FASE 4). Funciones puras.
import type { Pago, Rendicion } from "../domain/types.js";
import { DIGITAL_METHODS } from "../domain/enums.js";
import { toDateKey } from "../util/time.js";

export interface BuildRendicionInput {
  permisionarioId: string;
  date: string; // YYYY-MM-DD
  pagos: Pago[]; // pagos del permisionario (se filtran por fecha y estado approved)
  /** Efectivo declarado por el permisionario al cerrar el dia (para detectar diferencias). */
  declaredCash?: number;
  newId: () => string;
  now: string;
}

/**
 * Calcula la rendicion del dia de un permisionario: totales digital/efectivo, cantidad de
 * operaciones y diferencia entre el efectivo esperado (registrado) y el declarado.
 */
export function buildRendicion(input: BuildRendicionInput): Rendicion {
  const { permisionarioId, date, pagos, declaredCash, newId, now } = input;

  const delDia = pagos.filter(
    (p) =>
      p.permisionarioId === permisionarioId &&
      p.status === "approved" &&
      toDateKey(p.createdAt) === date,
  );

  let totalDigital = 0;
  let totalCash = 0;
  for (const p of delDia) {
    if (p.method === "cash") totalCash += p.amount;
    else if (DIGITAL_METHODS.includes(p.method)) totalDigital += p.amount;
  }

  const expectedCash = totalCash;
  const difference = declaredCash === undefined ? 0 : declaredCash - expectedCash;
  const status: Rendicion["status"] =
    declaredCash === undefined ? "pendiente" : difference === 0 ? "conciliada" : "con_diferencia";

  return {
    id: newId(),
    permisionarioId,
    date,
    totalDigital,
    totalCash,
    totalAmount: totalDigital + totalCash,
    operationsCount: delDia.length,
    expectedCash,
    difference,
    status,
    createdAt: now,
  };
}
