// Liquidacion con split (CLAUDE.md §3.4, FASE 4). Funciones puras.
// La recaudacion pasa SIEMPRE por la cuenta municipal; luego se liquida al permisionario T+1
// aplicando la comision configurada (no hardcodear: viene de ConfigSistema.feePct).
import type { Liquidacion } from "../domain/types.js";
import { redondearPeso } from "../util/money.js";

export interface CalcularLiquidacionInput {
  permisionarioId: string;
  period: string; // YYYY-MM-DD (T+1)
  grossAmount: number; // recaudado del periodo
  feePct: number; // comision municipal (modelo de recaudacion ampliada)
  newId: () => string;
  now: string;
}

export interface SplitResult {
  feeAmount: number;
  netAmount: number;
}

/** Calcula el split: comision municipal y neto a transferir al permisionario. */
export function calcularSplit(grossAmount: number, feePct: number): SplitResult {
  if (feePct < 0 || feePct > 100) throw new Error("feePct debe estar entre 0 y 100.");
  const feeAmount = redondearPeso(grossAmount * (feePct / 100));
  return { feeAmount, netAmount: grossAmount - feeAmount };
}

/** Construye una liquidacion T+1 para un permisionario. */
export function calcularLiquidacion(input: CalcularLiquidacionInput): Liquidacion {
  const { permisionarioId, period, grossAmount, feePct, newId, now } = input;
  const { feeAmount, netAmount } = calcularSplit(grossAmount, feePct);
  return {
    id: newId(),
    permisionarioId,
    period,
    grossAmount,
    feePct,
    feeAmount,
    netAmount,
    status: "pending",
    transferRef: null,
    createdAt: now,
  };
}
