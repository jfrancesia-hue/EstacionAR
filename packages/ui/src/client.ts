// Cliente HTTP tipado de la API EstacionAR. Compartido por los 3 frontends.
import type {
  AuditoriaEntry,
  CalcularTarifaResult,
  ConfigSistema,
  ConsultaSesion,
  Incidencia,
  Liquidacion,
  Pago,
  Permisionario,
  Rendicion,
  Sector,
  Sesion,
  Tarifa,
  Valoracion,
  VehicleType,
} from "@estacionar/core";

export interface DashboardKpis {
  recaudacionHoy: number;
  recaudacionMes: number;
  recaudacionTotal: number;
  digitalTotal: number;
  cashTotal: number;
  operaciones: number;
  ticketPromedio: number;
  permisionariosActivos: number;
  sectores: number;
}

export interface SectorStat {
  sectorId: string;
  name: string;
  centroid: [number, number];
  ring: Array<[number, number]>;
  shift: "diurno" | "nocturno";
  total: number;
  ops: number;
}

export interface PermisionarioStat {
  permisionarioId: string;
  fullName: string;
  status: string;
  rating: number;
  total: number;
  ops: number;
}

export interface Dashboard {
  kpis: DashboardKpis;
  serieDiaria: Array<{ date: string; total: number; digital: number; cash: number; ops: number }>;
  porSector: SectorStat[];
  porPermisionario: PermisionarioStat[];
  mixMedios: Record<string, number>;
}

export type PermisionarioConSector = Permisionario & {
  sector: Sector | null;
  valoracionesCount: number;
};

export interface QrValidacion {
  valid: boolean;
  nonce: string;
  permisionario: { id: string; fullName: string; status: string; shift: string | null; rating: number };
  sector: Sector | null;
}

export interface ResultadoPago {
  sesion: Sesion;
  pago: Pago;
  calc: CalcularTarifaResult;
  extended: boolean;
  demo?: boolean;
  duplicado?: boolean;
}

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export class EstacionarClient {
  constructor(private baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  private async req<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}/api${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
    const text = await res.text();
    const body = text ? JSON.parse(text) : null;
    if (!res.ok) {
      throw new ApiError(res.status, body?.error ?? "Error de red", body?.details);
    }
    return body as T;
  }

  private post<T>(path: string, data: unknown): Promise<T> {
    return this.req<T>(path, { method: "POST", body: JSON.stringify(data) });
  }
  private patch<T>(path: string, data: unknown): Promise<T> {
    return this.req<T>(path, { method: "PATCH", body: JSON.stringify(data) });
  }

  // Salud / auth demo
  health() {
    return this.req<{ ok: boolean; demo: boolean }>("/health");
  }
  demoLogin(role: string) {
    return this.post<{ user: { id: string; fullName: string; role: string }; token: string }>(
      "/auth/demo-login",
      { role },
    );
  }

  // Catalogos
  getTarifas() {
    return this.req<Tarifa[]>("/tarifas");
  }
  crearTarifa(data: Omit<Tarifa, "id" | "active">) {
    return this.post<Tarifa>("/tarifas", data);
  }
  getSectores() {
    return this.req<Sector[]>("/sectores");
  }
  crearSector(data: {
    name: string;
    numbering: "par" | "impar" | "ambos";
    shift: "diurno" | "nocturno";
    notes?: string;
    centroid: [number, number];
  }) {
    return this.post<Sector>("/sectores", data);
  }
  getConfig() {
    return this.req<ConfigSistema>("/config");
  }
  setConfig(data: Partial<ConfigSistema>) {
    return this.patch<ConfigSistema>("/config", data);
  }

  // Permisionarios
  getPermisionarios() {
    return this.req<PermisionarioConSector[]>("/permisionarios");
  }
  getPermisionario(id: string) {
    return this.req<PermisionarioConSector>(`/permisionarios/${id}`);
  }
  crearPermisionario(data: {
    dni: string;
    fullName: string;
    contactPhone: string;
    sectorId?: string | null;
    shift?: "diurno" | "nocturno" | null;
  }) {
    return this.post<PermisionarioConSector>("/permisionarios", data);
  }
  editarPermisionario(id: string, data: Partial<Permisionario>) {
    return this.patch<PermisionarioConSector>(`/permisionarios/${id}`, data);
  }
  regenerarQr(id: string) {
    return this.post<{ qrToken: string }>(`/permisionarios/${id}/regenerar-qr`, {});
  }
  getMovimientos(id: string) {
    return this.req<Pago[]>(`/permisionarios/${id}/movimientos`);
  }
  getRecaudacionHoy(id: string) {
    return this.req<{ digital: number; cash: number; total: number; count: number }>(
      `/permisionarios/${id}/recaudacion-hoy`,
    );
  }
  getValoraciones(id: string) {
    return this.req<Valoracion[]>(`/permisionarios/${id}/valoraciones`);
  }

  // Transacciones
  validarQr(token: string) {
    return this.post<QrValidacion>("/qr/validar", { token });
  }
  cotizar(data: { vehicleType: VehicleType; minutes: number; isDigital?: boolean }) {
    return this.post<CalcularTarifaResult>("/cotizar", data);
  }
  consultarSesion(plate: string) {
    return this.req<ConsultaSesion>(`/sesiones/${encodeURIComponent(plate)}`);
  }
  pagarDigital(data: {
    plate: string;
    vehicleType: VehicleType;
    minutes: number;
    sectorId?: string | null;
    permisionarioId?: string | null;
    method?: "qr" | "mercadopago" | "modo" | "naranja" | "card";
  }) {
    return this.post<ResultadoPago>("/pagos/digital", data);
  }
  pagarEfectivo(data: {
    plate: string;
    vehicleType: VehicleType;
    minutes: number;
    permisionarioId: string;
    sectorId?: string | null;
    idempotencyKey: string;
  }) {
    return this.post<ResultadoPago>("/pagos/efectivo", data);
  }

  // Gestion
  getDashboard() {
    return this.req<Dashboard>("/dashboard");
  }
  getRecaudacionEnVivo() {
    return this.req<{
      fecha: string;
      total: number;
      operaciones: number;
      porPermisionario: Array<{ permisionarioId: string; fullName: string; total: number; ops: number }>;
    }>("/recaudacion-en-vivo");
  }
  getReporte(groupBy: "dia" | "sector" | "permisionario" | "medio", from?: string, to?: string) {
    const q = new URLSearchParams({ groupBy });
    if (from) q.set("from", from);
    if (to) q.set("to", to);
    return this.req<{
      groupBy: string;
      rows: Array<{ key: string; label: string; total: number; ops: number }>;
      total: number;
    }>(`/reportes/recaudacion?${q.toString()}`);
  }
  getIncidencias(permisionarioId?: string) {
    const q = permisionarioId ? `?permisionarioId=${permisionarioId}` : "";
    return this.req<Incidencia[]>(`/incidencias${q}`);
  }
  crearIncidencia(data: { permisionarioId: string; type: string; description: string }) {
    return this.post<Incidencia>("/incidencias", data);
  }
  editarIncidencia(id: string, status: "open" | "in_progress" | "closed") {
    return this.patch<Incidencia>(`/incidencias/${id}`, { status });
  }
  valorar(data: { permisionarioId: string; sesionId?: string | null; rating: number; comment?: string | null }) {
    return this.post<{ valoracion: Valoracion; nuevoPromedio: number }>("/valoraciones", data);
  }

  // Fiscal
  getRendiciones(date?: string) {
    const q = date ? `?date=${date}` : "";
    return this.req<Rendicion[]>(`/rendiciones${q}`);
  }
  generarRendiciones(date?: string) {
    return this.post<{ date: string; generadas: Rendicion[] }>("/rendiciones/generar", { date });
  }
  getLiquidaciones() {
    return this.req<Liquidacion[]>("/liquidaciones");
  }
  generarLiquidaciones(period?: string) {
    return this.post<{ period: string; feePct: number; generadas: Liquidacion[] }>(
      "/liquidaciones/generar",
      { period },
    );
  }
  getAuditoria(entity?: string, action?: string) {
    const q = new URLSearchParams();
    if (entity) q.set("entity", entity);
    if (action) q.set("action", action);
    const s = q.toString();
    return this.req<AuditoriaEntry[]>(`/auditoria${s ? `?${s}` : ""}`);
  }
}

/** Crea un cliente leyendo la URL de la API de Vite (VITE_API_URL) o localhost por defecto. */
export function crearClient(baseUrl?: string): EstacionarClient {
  const url =
    baseUrl ??
    (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_URL) ??
    "http://localhost:4000";
  return new EstacionarClient(url);
}
