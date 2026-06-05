// Motor de tarifas (CLAUDE.md §3.2). Funcion PURA: toda la parametria viene de la tabla `tarifas`.
// Nunca se hardcodean importes. La misma funcion sirve al pago digital y al efectivo.
import type { Tarifa } from "../domain/types.js";
import type { VehicleType } from "../domain/enums.js";
import { aplicarDescuento, redondearPeso } from "../util/money.js";
import { isFeriado } from "../util/time.js";

export interface CalcularTarifaInput {
  vehicleType: VehicleType;
  minutes: number;
  isDigital: boolean;
  /** Momento del calculo (ISO). Se usa para detectar feriados. */
  date: string;
  /** Tarifa vigente (leida de la tabla, no constante). */
  tarifa: Tarifa;
  /** Feriados configurados (YYYY-MM-DD). En feriado no se cobra. */
  feriados?: string[];
}

export interface CalcularTarifaResult {
  /** Importe final a cobrar (ya con descuento digital si corresponde). */
  amount: number;
  /** Importe antes del descuento digital. */
  grossAmount: number;
  /** Descuento aplicado en pesos. */
  discount: number;
  /** Cantidad de fracciones adicionales cobradas (mas alla del primer bloque). */
  extraFractions: number;
  /** True si el dia es feriado sin cobro. */
  feriado: boolean;
  tarifaId: string;
}

/**
 * Calcula el importe de una sesion:
 *  - El primer bloque (`firstBlockMinutes`) cuesta `firstUnitAmount`.
 *  - Cada fraccion adicional de `minUnitMinutes` cuesta `nextUnitAmount`.
 *  - Si el pago es digital, aplica `digitalDiscountPct`.
 *  - Si la fecha es feriado configurado, no se cobra (0).
 */
export function calcularTarifa(input: CalcularTarifaInput): CalcularTarifaResult {
  const { vehicleType, minutes, isDigital, date, tarifa, feriados = [] } = input;

  if (minutes <= 0) {
    throw new Error("Los minutos a cobrar deben ser mayores a cero.");
  }
  if (tarifa.vehicleType !== vehicleType) {
    throw new Error(
      `La tarifa provista es para "${tarifa.vehicleType}" pero se pidio "${vehicleType}".`,
    );
  }

  const feriado = isFeriado(date, feriados);
  if (feriado) {
    return {
      amount: 0,
      grossAmount: 0,
      discount: 0,
      extraFractions: 0,
      feriado: true,
      tarifaId: tarifa.id,
    };
  }

  let extraFractions = 0;
  if (minutes > tarifa.firstBlockMinutes) {
    const extraMinutes = minutes - tarifa.firstBlockMinutes;
    extraFractions = Math.ceil(extraMinutes / tarifa.minUnitMinutes);
  }

  const grossAmount = redondearPeso(
    tarifa.firstUnitAmount + extraFractions * tarifa.nextUnitAmount,
  );

  const amount = isDigital ? aplicarDescuento(grossAmount, tarifa.digitalDiscountPct) : grossAmount;
  const discount = grossAmount - amount;

  return {
    amount,
    grossAmount,
    discount,
    extraFractions,
    feriado: false,
    tarifaId: tarifa.id,
  };
}

/** Selecciona la tarifa vigente para un tipo de vehiculo en una fecha dada. */
export function seleccionarTarifaVigente(
  tarifas: Tarifa[],
  vehicleType: VehicleType,
  date: string,
): Tarifa | undefined {
  const t = new Date(date).getTime();
  return tarifas
    .filter(
      (x) =>
        x.active &&
        x.vehicleType === vehicleType &&
        new Date(x.validFrom).getTime() <= t &&
        (x.validTo === null || new Date(x.validTo).getTime() >= t),
    )
    .sort((a, b) => new Date(b.validFrom).getTime() - new Date(a.validFrom).getTime())[0];
}
