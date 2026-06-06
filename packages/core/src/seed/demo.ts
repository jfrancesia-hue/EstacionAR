// ─────────────────────────────────────────────────────────────────────────────
//  DATOS DEMO — EstacionAR. NO son datos reales de produccion.
//  Todo registro generado aca lleva la marca `demo: true` y nombres ficticios.
//  Sirve para poblar la demo comercial y el store en memoria de la API.
//  Empresa demo: "Nativos Consultora" (consultora del usuario) donde aplica.
// ─────────────────────────────────────────────────────────────────────────────
import type {
  ConfigSistema,
  Pago,
  Permisionario,
  Sector,
  Sesion,
  Tarifa,
  User,
  Valoracion,
} from "../domain/types.js";
import { calcularTarifa } from "../tarifa/calcularTarifa.js";

/** PRNG determinista (mulberry32) para que la demo sea estable entre corridas. */
function prng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const CONFIG_DEMO: ConfigSistema = {
  feePct: 0, // sin retencion municipal ni fee del proveedor: el beneficio digital va al ciudadano
  toleranceMinutes: 5,
  feriados: ["2026-06-20", "2026-07-09"], // Dia de la Bandera, Independencia
  nocturnoCorridors: ["Paseo Balcarce", "Paseo Güemes"],
};

// Tarifas vigentes 2026 (valores iniciales del seed, editables — CLAUDE.md §3.2).
export const TARIFAS_DEMO: Tarifa[] = [
  {
    id: "tar-auto-2026",
    vehicleType: "auto",
    minUnitMinutes: 15,
    firstBlockMinutes: 60,
    firstUnitAmount: 700,
    nextUnitAmount: 175,
    digitalDiscountPct: 10,
    validFrom: "2026-01-01T00:00:00.000Z",
    validTo: null,
    active: true,
  },
  {
    id: "tar-moto-2026",
    vehicleType: "moto",
    minUnitMinutes: 15,
    firstBlockMinutes: 60,
    firstUnitAmount: 300,
    nextUnitAmount: 75,
    digitalDiscountPct: 10,
    validFrom: "2026-01-01T00:00:00.000Z",
    validTo: null,
    active: true,
  },
];

// Sectores del microcentro de Salta (coordenadas aproximadas, geometria demo).
const C: Array<{ id: string; name: string; lng: number; lat: number; shift: Sector["shift"]; numbering: Sector["numbering"] }> = [
  { id: "sec-balcarce", name: "Paseo Balcarce", lng: -65.4078, lat: -24.7836, shift: "nocturno", numbering: "ambos" },
  { id: "sec-guemes", name: "Paseo Güemes", lng: -65.4035, lat: -24.7948, shift: "nocturno", numbering: "ambos" },
  { id: "sec-alvarado", name: "Plaza Alvarado", lng: -65.4126, lat: -24.7901, shift: "diurno", numbering: "par" },
  { id: "sec-9julio", name: "Plaza 9 de Julio", lng: -65.4109, lat: -24.7889, shift: "diurno", numbering: "ambos" },
  { id: "sec-belgrano", name: "Av. Belgrano", lng: -65.4145, lat: -24.7912, shift: "diurno", numbering: "impar" },
  { id: "sec-caseros", name: "Calle Caseros", lng: -65.4098, lat: -24.7895, shift: "diurno", numbering: "par" },
];

function rectRing(lng: number, lat: number, d = 0.0012): Sector["ring"] {
  return [
    [lng - d, lat - d],
    [lng + d, lat - d],
    [lng + d, lat + d],
    [lng - d, lat + d],
    [lng - d, lat - d],
  ];
}

export const SECTORES_DEMO: Sector[] = C.map((c) => ({
  id: c.id,
  name: c.name,
  numbering: c.numbering,
  shift: c.shift,
  notes: "Sector demo — geometria aproximada.",
  ring: rectRing(c.lng, c.lat),
  centroid: [c.lng, c.lat],
}));

const NOMBRES_DEMO = [
  "Carlos Ramírez",
  "Marta Quispe",
  "Jorge Villagrán",
  "Lucía Cardozo",
  "Diego Saravia",
  "Rosa Mamaní",
];

export const USERS_DEMO: User[] = [
  { id: "usr-admin", email: "admin@municipalidadsalta.demo", fullName: "Admin Municipal (DEMO)", role: "admin_municipal", createdAt: "2026-01-02T12:00:00.000Z" },
  { id: "usr-super", email: "supervisor@municipalidadsalta.demo", fullName: "Supervisor (DEMO)", role: "supervisor", createdAt: "2026-01-02T12:00:00.000Z" },
];

export interface SeedResult {
  config: ConfigSistema;
  users: User[];
  tarifas: Tarifa[];
  sectores: Sector[];
  permisionarios: Permisionario[];
  sesiones: Sesion[];
  pagos: Pago[];
  valoraciones: Valoracion[];
}

/**
 * Construye el dataset demo completo y coherente para una fecha de referencia.
 * Genera sesiones y pagos del dia y dias previos para que los dashboards luzcan poblados.
 * `qrTokens`: tokens firmados (se generan async fuera y se inyectan; si faltan, queda placeholder).
 */
export function buildSeed(now: string, qrTokens: Record<string, string> = {}): SeedResult {
  const rand = prng(20260605);
  const nowMs = new Date(now).getTime();

  const permisionarios: Permisionario[] = NOMBRES_DEMO.map((nombre, i) => {
    const sector = SECTORES_DEMO[i % SECTORES_DEMO.length]!;
    const id = `perm-${i + 1}`;
    return {
      id,
      userId: null,
      dni: `3${(2000000 + i * 13457).toString().padStart(7, "0")}`,
      fullName: `${nombre} (DEMO)`,
      contactPhone: `+5438742${(10000 + i * 777).toString().slice(0, 5)}`,
      status: i === 5 ? "suspended" : "active",
      qrToken: qrTokens[id] ?? `DEMO-QR-${id}`,
      sectorId: sector.id,
      shift: sector.shift,
      rating: 0, // se recalcula con valoraciones
      createdAt: "2026-02-01T12:00:00.000Z",
    };
  });

  const sesiones: Sesion[] = [];
  const pagos: Pago[] = [];
  const valoraciones: Valoracion[] = [];

  const plates = ["AB123CD", "AC456DE", "AD789FG", "AF012HI", "A001ABC", "B234CDE", "AE345JK", "AG678LM"];
  const tarifaAuto = TARIFAS_DEMO[0]!;
  const tarifaMoto = TARIFAS_DEMO[1]!;

  let counter = 0;
  const id = (p: string) => `${p}-seed-${++counter}`;

  // Genera operaciones de los ultimos 14 dias (mas densas hoy).
  for (let dayOffset = 13; dayOffset >= 0; dayOffset--) {
    const opsDelDia = dayOffset === 0 ? 28 : 12 + Math.floor(rand() * 10);
    for (let k = 0; k < opsDelDia; k++) {
      const perm = permisionarios[Math.floor(rand() * (permisionarios.length - 1))]!; // excluye suspendido
      const isMoto = rand() < 0.25;
      const vehicleType = isMoto ? "moto" : "auto";
      const tarifa = isMoto ? tarifaMoto : tarifaAuto;
      const isDigital = rand() < 0.68; // mayoria digital
      const minutes = [60, 60, 90, 120, 75][Math.floor(rand() * 5)]!;
      const hour = 8 + Math.floor(rand() * 12);
      const createdMs = nowMs - dayOffset * 86_400_000;
      const created = new Date(createdMs);
      created.setHours(hour, Math.floor(rand() * 60), 0, 0);
      const createdAt = created.toISOString();

      const calc = calcularTarifa({ vehicleType, minutes, isDigital, date: createdAt, tarifa, feriados: CONFIG_DEMO.feriados });
      const plate = plates[Math.floor(rand() * plates.length)]!;

      const sesion: Sesion = {
        id: id("ses"),
        plate,
        vehicleType,
        paidMinutes: minutes,
        startValid: createdAt,
        endValid: new Date(createdMs + minutes * 60_000).toISOString(),
        tarifaId: tarifa.id,
        amount: calc.amount,
        originSectorId: perm.sectorId,
        status: dayOffset === 0 && hour >= new Date(now).getHours() - 1 ? "active" : "expired",
        createdAt,
      };
      sesiones.push(sesion);

      const method = isDigital
        ? (["mercadopago", "qr", "modo", "naranja"] as const)[Math.floor(rand() * 4)]!
        : "cash";
      pagos.push({
        id: id("pago"),
        sesionId: sesion.id,
        method,
        amount: calc.amount,
        status: "approved",
        externalRef: isDigital ? `MP-${id("ref")}` : null,
        receiptUrl: null,
        registeredBy: isDigital ? null : perm.id,
        permisionarioId: perm.id,
        plate,
        sectorId: perm.sectorId,
        idempotencyKey: isDigital ? null : id("idem"),
        createdAt,
      });

      // Algunas valoraciones ciudadanas (FASE 5)
      if (rand() < 0.3) {
        valoraciones.push({
          id: id("val"),
          permisionarioId: perm.id,
          sesionId: sesion.id,
          rating: 3 + Math.floor(rand() * 3), // 3-5
          comment: null,
          createdAt,
        });
      }
    }
  }

  // Recalcula rating promedio por permisionario
  for (const perm of permisionarios) {
    const vs = valoraciones.filter((v) => v.permisionarioId === perm.id);
    perm.rating = vs.length ? Math.round((vs.reduce((a, v) => a + v.rating, 0) / vs.length) * 10) / 10 : 0;
  }

  return {
    config: CONFIG_DEMO,
    users: USERS_DEMO,
    tarifas: TARIFAS_DEMO,
    sectores: SECTORES_DEMO,
    permisionarios,
    sesiones,
    pagos,
    valoraciones,
  };
}
