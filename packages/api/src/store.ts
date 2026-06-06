// Store en memoria sembrado desde @estacionar/core (DEMO). Migrable a Supabase:
// cada array equivale a una tabla; reemplazar los accesores por queries sin tocar los servicios.
import {
  buildSeed,
  newId,
  signQrToken,
  type AuditoriaEntry,
  type ConfigSistema,
  type Incidencia,
  type Liquidacion,
  type Pago,
  type Permisionario,
  type Rendicion,
  type Sector,
  type Sesion,
  type Tarifa,
  type User,
  type Valoracion,
} from "@estacionar/core";
import { env } from "./env.js";

export interface Db {
  config: ConfigSistema;
  users: User[];
  tarifas: Tarifa[];
  sectores: Sector[];
  permisionarios: Permisionario[];
  sesiones: Sesion[];
  pagos: Pago[];
  incidencias: Incidencia[];
  rendiciones: Rendicion[];
  liquidaciones: Liquidacion[];
  auditoria: AuditoriaEntry[];
  valoraciones: Valoracion[];
  /** nonces ya usados (antifraude: un escaneo => un cobro). */
  noncesUsados: Set<string>;
  /** idempotency keys de efectivo ya registradas (antiduplicidad). */
  idempotencyKeys: Set<string>;
}

export const db: Db = {
  config: { feePct: 0, toleranceMinutes: 5, feriados: [], nocturnoCorridors: [] },
  users: [],
  tarifas: [],
  sectores: [],
  permisionarios: [],
  sesiones: [],
  pagos: [],
  incidencias: [],
  rendiciones: [],
  liquidaciones: [],
  auditoria: [],
  valoraciones: [],
  noncesUsados: new Set(),
  idempotencyKeys: new Set(),
};

/** Inicializa el store con datos demo y firma los QR de cada permisionario. */
export async function initStore(now = new Date().toISOString()): Promise<void> {
  // Primero generamos seed base para conocer los permisionarios y sus sectores/turnos.
  const base = buildSeed(now);
  // Firmamos un QR real por permisionario (JWT-like HMAC).
  const qrTokens: Record<string, string> = {};
  for (const p of base.permisionarios) {
    qrTokens[p.id] = await signQrToken(
      { permisionarioId: p.id, sectorId: p.sectorId, shift: p.shift, iat: new Date(now).getTime() },
      env.qrSecret,
    );
  }
  const seed = buildSeed(now, qrTokens);

  db.config = seed.config;
  db.users = seed.users;
  db.tarifas = seed.tarifas;
  db.sectores = seed.sectores;
  db.permisionarios = seed.permisionarios;
  db.sesiones = seed.sesiones;
  db.pagos = seed.pagos;
  db.valoraciones = seed.valoraciones;

  // Incidencias demo
  db.incidencias = [
    {
      id: newId("inc"),
      permisionarioId: seed.permisionarios[0]!.id,
      type: "vehiculo_mal_estacionado",
      description: "Auto bloqueando rampa de discapacitados (DEMO).",
      status: "open",
      createdAt: now,
    },
    {
      id: newId("inc"),
      permisionarioId: seed.permisionarios[1]!.id,
      type: "falla_dispositivo",
      description: "No me anda el lector del celular (DEMO).",
      status: "in_progress",
      createdAt: now,
    },
  ];
}

/** Registra una entrada de auditoria (append-only). */
export function audit(
  action: string,
  entity: string,
  entityId: string | null,
  payload: Record<string, unknown>,
  actorUserId: string | null = null,
): void {
  db.auditoria.unshift({
    id: newId("aud"),
    actorUserId,
    action,
    entity,
    entityId,
    payload,
    createdAt: new Date().toISOString(),
  });
}
