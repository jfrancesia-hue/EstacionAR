// Entidades nucleo del dominio (CLAUDE.md §4). Espejo de las tablas SQL.
import type {
  IncidenciaStatus,
  LiquidacionStatus,
  Numbering,
  PaymentMethod,
  PaymentStatus,
  PermisionarioStatus,
  RendicionStatus,
  Role,
  SessionStatus,
  Shift,
  VehicleType,
} from "./enums.js";

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  createdAt: string;
}

export interface Permisionario {
  id: string;
  userId: string | null;
  dni: string;
  fullName: string;
  contactPhone: string;
  status: PermisionarioStatus;
  qrToken: string;
  sectorId: string | null;
  shift: Shift | null;
  rating: number; // promedio de valoracion ciudadana (0-5)
  createdAt: string;
}

// Geometria simplificada (anillo de coordenadas [lng, lat]) — compatible con PostGIS Polygon 4326.
export type Ring = Array<[number, number]>;

export interface Sector {
  id: string;
  name: string;
  numbering: Numbering;
  shift: Shift;
  notes: string;
  ring: Ring; // poligono del sector
  centroid: [number, number];
}

export interface Asignacion {
  id: string;
  permisionarioId: string;
  sectorId: string;
  shift: Shift;
  schedule: { from: string; to: string; days: number[] }; // jsonb
}

// Motor de tarifas configurable (CLAUDE.md §3.2). NUNCA hardcodear valores.
export interface Tarifa {
  id: string;
  vehicleType: VehicleType;
  minUnitMinutes: number; // granularidad de fraccionamiento (ej. 15)
  firstBlockMinutes: number; // duracion del primer bloque (ej. 60)
  firstUnitAmount: number; // importe del primer bloque (ej. 700)
  nextUnitAmount: number; // importe por cada fraccion adicional
  digitalDiscountPct: number; // descuento por pago digital (ej. 20)
  validFrom: string; // ISO date
  validTo: string | null;
  active: boolean;
}

export interface Sesion {
  id: string;
  plate: string;
  vehicleType: VehicleType;
  paidMinutes: number;
  startValid: string;
  endValid: string;
  tarifaId: string;
  amount: number;
  originSectorId: string | null;
  status: SessionStatus;
  createdAt: string;
}

export interface Pago {
  id: string;
  sesionId: string;
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  externalRef: string | null;
  receiptUrl: string | null;
  registeredBy: string | null; // user/permisionario que registro (efectivo)
  permisionarioId: string | null;
  plate: string;
  sectorId: string | null;
  idempotencyKey: string | null; // antiduplicidad de efectivo
  createdAt: string;
}

export interface Incidencia {
  id: string;
  permisionarioId: string;
  type: string;
  description: string;
  status: IncidenciaStatus;
  createdAt: string;
}

export interface Rendicion {
  id: string;
  permisionarioId: string;
  date: string; // YYYY-MM-DD
  totalDigital: number;
  totalCash: number;
  totalAmount: number;
  operationsCount: number;
  expectedCash: number;
  difference: number;
  status: RendicionStatus;
  createdAt: string;
}

export interface Liquidacion {
  id: string;
  permisionarioId: string;
  period: string; // YYYY-MM-DD (T+1)
  grossAmount: number;
  feePct: number;
  feeAmount: number;
  netAmount: number;
  status: LiquidacionStatus;
  transferRef: string | null;
  createdAt: string;
}

export interface AuditoriaEntry {
  id: string;
  actorUserId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface Valoracion {
  id: string;
  permisionarioId: string;
  sesionId: string | null;
  rating: number; // 1-5
  comment: string | null;
  createdAt: string;
}

// Configuracion global editable desde el backoffice (no hardcodear).
export interface ConfigSistema {
  feePct: number; // comision municipal sobre pago digital (split / liquidacion)
  toleranceMinutes: number; // tolerancia post-vencimiento
  feriados: string[]; // fechas YYYY-MM-DD sin cobro
  nocturnoCorridors: string[]; // nombres de corredores con turno nocturno
}
