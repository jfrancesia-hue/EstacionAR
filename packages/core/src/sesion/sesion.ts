// Billetera de tiempo por patente (CLAUDE.md §3.1). Funciones puras sobre una lista de sesiones.
// La sesion se vincula a la PATENTE + ventana temporal, NUNCA a la cuadra. Reubicarse dentro
// de la ventana NO recobra. Tolerancia de 5 min post-vencimiento.
import type { Sesion } from "../domain/types.js";
import type { VehicleType } from "../domain/enums.js";
import { addMinutes, minutesBetween } from "../util/time.js";

export const DEFAULT_TOLERANCE_MINUTES = 5;

export function normalizarPatente(plate: string): string {
  return plate.trim().toUpperCase().replace(/\s+/g, "");
}

/** Devuelve la sesion activa (dentro de ventana + tolerancia) para una patente, si existe. */
export function buscarSesionActiva(
  sesiones: Sesion[],
  plate: string,
  now: string,
  toleranceMinutes = DEFAULT_TOLERANCE_MINUTES,
): Sesion | undefined {
  const p = normalizarPatente(plate);
  return sesiones.find(
    (s) =>
      s.plate === p &&
      s.status === "active" &&
      minutesBetween(now, s.endValid) >= -toleranceMinutes,
  );
}

export interface ConsultaSesion {
  vigente: boolean;
  remainingMinutes: number;
  sesion: Sesion | null;
}

/** Consulta el saldo de tiempo restante de una patente. */
export function consultarSesion(
  sesiones: Sesion[],
  plate: string,
  now: string,
  toleranceMinutes = DEFAULT_TOLERANCE_MINUTES,
): ConsultaSesion {
  const sesion = buscarSesionActiva(sesiones, plate, now, toleranceMinutes);
  if (!sesion) return { vigente: false, remainingMinutes: 0, sesion: null };
  const remaining = Math.max(0, Math.floor(minutesBetween(now, sesion.endValid)));
  return { vigente: remaining > 0, remainingMinutes: remaining, sesion };
}

export interface CrearOExtenderInput {
  plate: string;
  minutes: number;
  vehicleType: VehicleType;
  tarifaId: string;
  amount: number;
  sectorId: string | null;
  now: string;
  toleranceMinutes?: number;
  /** Generador de id (inyectable para tests deterministas). */
  newId: () => string;
}

export interface CrearOExtenderResult {
  sesion: Sesion;
  extended: boolean; // true si se extendio una sesion existente
}

/**
 * Crea una sesion nueva o extiende la activa de la patente, operando sobre la lista de sesiones.
 * - Si hay sesion activa dentro de la ventana (+tolerancia): suma `minutes` a `endValid`.
 * - Si no: crea una nueva con start = now, end = now + minutes.
 * El `sectorId` se registra solo para estadistica; reubicarse no recobra.
 */
export function crearOExtenderSesion(
  sesiones: Sesion[],
  input: CrearOExtenderInput,
): CrearOExtenderResult {
  const {
    plate,
    minutes,
    vehicleType,
    tarifaId,
    amount,
    sectorId,
    now,
    toleranceMinutes = DEFAULT_TOLERANCE_MINUTES,
    newId,
  } = input;

  if (minutes <= 0) throw new Error("Los minutos deben ser mayores a cero.");
  const p = normalizarPatente(plate);

  const activa = buscarSesionActiva(sesiones, p, now, toleranceMinutes);

  if (activa) {
    // Si ya vencio dentro de la tolerancia, extendemos desde "now"; si no, desde su fin.
    const base = minutesBetween(now, activa.endValid) >= 0 ? activa.endValid : now;
    activa.endValid = addMinutes(base, minutes);
    activa.paidMinutes += minutes;
    activa.amount += amount;
    return { sesion: activa, extended: true };
  }

  const sesion: Sesion = {
    id: newId(),
    plate: p,
    vehicleType,
    paidMinutes: minutes,
    startValid: now,
    endValid: addMinutes(now, minutes),
    tarifaId,
    amount,
    originSectorId: sectorId,
    status: "active",
    createdAt: now,
  };
  return { sesion, extended: false };
}

/** Marca como expiradas las sesiones cuya ventana + tolerancia ya paso. */
export function expirarSesiones(
  sesiones: Sesion[],
  now: string,
  toleranceMinutes = DEFAULT_TOLERANCE_MINUTES,
): Sesion[] {
  return sesiones.map((s) => {
    if (s.status === "active" && minutesBetween(now, s.endValid) < -toleranceMinutes) {
      return { ...s, status: "expired" };
    }
    return s;
  });
}
