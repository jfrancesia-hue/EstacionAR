// Store local en memoria del navegador (DEMO sin backend).
// Replica la lógica de la API usando las funciones puras de @estacionar/core, exponiendo
// la MISMA superficie que el cliente HTTP para poder reusar el JSX de las vistas tal cual.
// Las 3 vistas comparten este singleton: pagar en Conductor se ve en Backoffice.
import {
  buildSeed,
  calcularTarifa,
  consultarSesion as consultarSesionCore,
  crearOExtenderSesion,
  newId,
  normalizarPatente,
  seleccionarTarifaVigente,
  type AuditoriaEntry,
  type CalcularTarifaResult,
  type ConfigSistema,
  type Incidencia,
  type IncidenciaStatus,
  type Pago,
  type Permisionario,
  type Sector,
  type Sesion,
  type Tarifa,
  type Valoracion,
  type VehicleType,
} from "@estacionar/core";
import type { Dashboard, PermisionarioConSector, ResultadoPago } from "@estacionar/ui";
import { SPLIT, comisionPlataforma } from "./split.js";

// Efectivo registrado (PRODUCTO.md §9): el ciudadano elige efectivo → orden pendiente;
// el permisionario confirma "recibido" → se activa el tiempo y se genera comprobante + deuda.
export type EstadoOrdenEfectivo = "pending_cash_confirmation" | "cash_confirmed" | "cash_cancelled";
export interface OrdenEfectivo {
  id: string;
  permisionarioId: string;
  plate: string;
  vehicleType: VehicleType;
  minutes: number;
  amount: number; // lo que paga el ciudadano (con descuento app)
  sectorId: string | null;
  status: EstadoOrdenEfectivo;
  createdAt: string;
}

// Deuda del permisionario hacia la plataforma (Nativos) por la comisión del efectivo (§10).
export type EstadoDeuda = "pending" | "paid";
export interface MovimientoDeuda {
  id: string;
  permisionarioId: string;
  ordenId: string;
  plate: string;
  amount: number; // 10% que el permisionario debe a la plataforma
  status: EstadoDeuda;
  createdAt: string;
}

// Alerta temporal por patente cuando un excedente no se regulariza (PRODUCTO.md §17).
export type EstadoAlerta = "excess_alert_active" | "excess_paid" | "excess_alert_expired";
export interface AlertaExcedente {
  id: string;
  plate: string;
  permisionarioId: string;
  sectorId: string | null;
  sesionId: string;
  montoSugerido: number;
  minutosExcedidos: number;
  status: EstadoAlerta;
  createdAt: string;
  expiresAt: string; // vencimiento automático de la alerta
}

// Alta y validación de permisionarios (PRODUCTO.md §5/§18).
export type EstadoValidacion = "pending_validation" | "approved" | "observed" | "rejected";
export interface AltaInput {
  fullName: string;
  dni: string;
  legajo: string;
  telefono: string;
  email: string;
  calle: string;
  entreCalles: string;
  altura: string;
  mano: "par" | "impar" | "ambos";
  turno: "diurno" | "nocturno";
  medioAcreditacion: string; // alias / CBU / cuenta del permisionario
}
export interface Validacion extends AltaInput {
  id: string;
  permisionarioId: string;
  estado: EstadoValidacion;
  motivo: string | null;
  createdAt: string;
}

interface Store {
  config: ConfigSistema;
  tarifas: Tarifa[];
  sectores: Sector[];
  permisionarios: Permisionario[];
  sesiones: Sesion[];
  pagos: Pago[];
  valoraciones: Valoracion[];
  incidencias: Incidencia[];
  ordenesEfectivo: OrdenEfectivo[];
  deudas: MovimientoDeuda[];
  alertas: AlertaExcedente[];
  validaciones: Validacion[];
  auditoria: AuditoriaEntry[];
  idempotencyKeys: Set<string>;
}

// Plazo de vencimiento de una alerta de excedente (configurable). PRODUCTO.md §17.
const ALERTA_HORAS = 48;

function init(): Store {
  const now = new Date().toISOString();
  const seed = buildSeed(now);
  // Incidencias demo (como las del backend) para poblar la pestaña del permisionario.
  const incidencias: Incidencia[] = [
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
  // Sesiones vencidas (overdue) demo para fiscalización y excedentes (PRODUCTO.md §15/§16).
  const nowMs = new Date(now).getTime();
  const sesionesVencidas: Sesion[] = [];
  const pagosVencidas: Pago[] = [];
  [
    { plate: "GH456IJ", venceHaceMin: 22 },
    { plate: "KL789MN", venceHaceMin: 41 },
  ].forEach((v, i) => {
    const perm = seed.permisionarios[i]!;
    const endMs = nowMs - v.venceHaceMin * 60000;
    const startMs = endMs - 60 * 60000;
    const ses: Sesion = {
      id: `ses-venc-${i + 1}`,
      plate: v.plate,
      vehicleType: "auto",
      paidMinutes: 60,
      startValid: new Date(startMs).toISOString(),
      endValid: new Date(endMs).toISOString(),
      tarifaId: "tar-auto-2026",
      amount: 630,
      originSectorId: perm.sectorId,
      status: "active",
      createdAt: new Date(startMs).toISOString(),
    };
    sesionesVencidas.push(ses);
    pagosVencidas.push({
      id: `pago-venc-${i + 1}`,
      sesionId: ses.id,
      method: "mercadopago",
      amount: 630,
      status: "approved",
      externalRef: "MP-DEMO",
      receiptUrl: null,
      registeredBy: null,
      permisionarioId: perm.id,
      plate: v.plate,
      sectorId: perm.sectorId,
      idempotencyKey: null,
      createdAt: ses.createdAt,
    });
  });

  return {
    // Comisión de plataforma = 10% (modelo 80/10/10), no la retención municipal vieja.
    config: { ...seed.config, feePct: SPLIT.plataformaPct },
    // Descuento al ciudadano = 10% (modelo 80/10/10); el otro 10% que resigna la Muni es la plataforma.
    tarifas: seed.tarifas.map((t) => ({ ...t, digitalDiscountPct: SPLIT.descuentoCiudadanoPct })),
    sectores: seed.sectores,
    // Copias para poder mutar sesiones/pagos sin afectar el seed original.
    permisionarios: seed.permisionarios.map((p) => ({ ...p })),
    sesiones: [...seed.sesiones.map((s) => ({ ...s })), ...sesionesVencidas],
    pagos: [...seed.pagos.map((p) => ({ ...p })), ...pagosVencidas],
    valoraciones: seed.valoraciones,
    incidencias,
    ordenesEfectivo: [],
    deudas: [],
    alertas: [],
    validaciones: [],
    auditoria: [],
    idempotencyKeys: new Set(),
  };
}

let store = init();

/** Reinicia la demo al estado seed (botón "Reiniciar"). */
export function reiniciarDemo(): void {
  store = init();
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function dateKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const hoyKey = () => dateKey(new Date().toISOString());
const esDigital = (p: Pago) => p.method !== "cash";
const aprobados = () => store.pagos.filter((p) => p.status === "approved");

function audit(action: string, entity: string, entityId: string | null, payload: Record<string, unknown>): void {
  store.auditoria.unshift({
    id: newId("aud"),
    actorUserId: null,
    action,
    entity,
    entityId,
    payload,
    createdAt: new Date().toISOString(),
  });
}

export type EstadoSesion = "vigente" | "por_vencer" | "vencida";
function estadoDeSesion(s: Sesion, ahoraMs: number): EstadoSesion {
  const diffMin = (new Date(s.endValid).getTime() - ahoraMs) / 60000;
  if (diffMin > 10) return "vigente";
  if (diffMin >= 0) return "por_vencer";
  return "vencida";
}

/** Devuelve la alerta activa de una patente y vence automáticamente las que pasaron su plazo. */
function alertaVigente(plate: string, ahoraMs: number): AlertaExcedente | null {
  for (const a of store.alertas) {
    if (a.status === "excess_alert_active" && new Date(a.expiresAt).getTime() < ahoraMs) a.status = "excess_alert_expired";
  }
  return store.alertas.find((a) => a.plate === plate && a.status === "excess_alert_active") ?? null;
}

/** Detecta duplicados de un alta por DNI y legajo (permiso personal e intransferible, §5). */
function detectarDup(dni: string, legajo: string): string[] {
  const motivos: string[] = [];
  const d = dni.trim();
  const l = legajo.trim();
  if (d && store.permisionarios.some((p) => p.dni === d)) motivos.push(`DNI ${d} ya registrado`);
  if (l && store.validaciones.some((v) => v.legajo.trim() === l)) motivos.push(`Legajo ${l} ya registrado`);
  return motivos;
}

function altaAPermisionario(data: AltaInput): Permisionario {
  const id = newId("perm");
  const perm: Permisionario = {
    id,
    userId: null,
    dni: data.dni.trim(),
    fullName: data.fullName.trim(),
    contactPhone: data.telefono.trim(),
    status: "suspended", // no opera hasta ser aprobado
    qrToken: `nuevo-${id}`,
    sectorId: null,
    shift: data.turno,
    rating: 0,
    createdAt: new Date().toISOString(),
  };
  store.permisionarios.push(perm);
  store.validaciones.unshift({ id: newId("val"), permisionarioId: id, estado: "pending_validation", motivo: null, createdAt: new Date().toISOString(), ...data });
  return perm;
}

// ── Cliente local (misma forma que EstacionarClient) ────────────────────────────
export const clientLocal = {
  async cotizar(data: { vehicleType: VehicleType; minutes: number; isDigital?: boolean }): Promise<CalcularTarifaResult> {
    const now = new Date().toISOString();
    const tarifa = seleccionarTarifaVigente(store.tarifas, data.vehicleType, now);
    if (!tarifa) throw new Error("No hay tarifa vigente.");
    return calcularTarifa({
      vehicleType: data.vehicleType,
      minutes: data.minutes,
      isDigital: data.isDigital ?? true,
      date: now,
      tarifa,
      feriados: store.config.feriados,
    });
  },

  async pagarDigital(data: {
    plate: string;
    vehicleType: VehicleType;
    minutes: number;
    sectorId?: string | null;
    permisionarioId?: string | null;
    method?: "qr" | "mercadopago" | "modo" | "naranja" | "card";
  }): Promise<ResultadoPago> {
    const now = new Date().toISOString();
    const tarifa = seleccionarTarifaVigente(store.tarifas, data.vehicleType, now);
    if (!tarifa) throw new Error("No hay tarifa vigente.");
    const calc = calcularTarifa({
      vehicleType: data.vehicleType,
      minutes: data.minutes,
      isDigital: true,
      date: now,
      tarifa,
      feriados: store.config.feriados,
    });
    const { sesion, extended } = crearOExtenderSesion(store.sesiones, {
      plate: data.plate,
      minutes: data.minutes,
      vehicleType: data.vehicleType,
      tarifaId: tarifa.id,
      amount: calc.amount,
      sectorId: data.sectorId ?? null,
      now,
      toleranceMinutes: store.config.toleranceMinutes,
      newId: () => newId("ses"),
    });
    if (!extended) store.sesiones.push(sesion);

    const method = data.method ?? "mercadopago";
    const pago: Pago = {
      id: newId("pago"),
      sesionId: sesion.id,
      method,
      amount: calc.amount,
      status: "approved",
      externalRef: `${method.toUpperCase()}-${newId("ref")}`,
      receiptUrl: null,
      registeredBy: null,
      permisionarioId: data.permisionarioId ?? null,
      plate: normalizarPatente(data.plate),
      sectorId: data.sectorId ?? null,
      idempotencyKey: null,
      createdAt: now,
    };
    store.pagos.push(pago);
    audit("pago_digital", "pago", pago.id, { plate: pago.plate, amount: pago.amount, method });
    return { sesion, pago, calc, extended, demo: true };
  },

  async consultarSesion(plate: string) {
    return consultarSesionCore(store.sesiones, plate, new Date().toISOString(), store.config.toleranceMinutes);
  },

  // Valoración ciudadana del servicio del permisionario (PRODUCTO.md / Fase 5).
  async valorar(data: { permisionarioId: string; sesionId?: string | null; rating: number; comment?: string | null }): Promise<{ nuevoPromedio: number }> {
    store.valoraciones.unshift({
      id: newId("vlr"),
      permisionarioId: data.permisionarioId,
      sesionId: data.sesionId ?? null,
      rating: data.rating,
      comment: data.comment ?? null,
      createdAt: new Date().toISOString(),
    });
    const vs = store.valoraciones.filter((v) => v.permisionarioId === data.permisionarioId);
    const nuevoPromedio = vs.length ? Math.round((vs.reduce((a, v) => a + v.rating, 0) / vs.length) * 10) / 10 : 0;
    const perm = store.permisionarios.find((p) => p.id === data.permisionarioId);
    if (perm) perm.rating = nuevoPromedio;
    audit("valoracion", "permisionario", data.permisionarioId, { rating: data.rating });
    return { nuevoPromedio };
  },

  async getPermisionarios(): Promise<PermisionarioConSector[]> {
    return store.permisionarios.map((p) => ({
      ...p,
      sector: store.sectores.find((s) => s.id === p.sectorId) ?? null,
      valoracionesCount: store.valoraciones.filter((v) => v.permisionarioId === p.id).length,
    }));
  },

  async getRecaudacionHoy(id: string): Promise<{ digital: number; cash: number; total: number; count: number }> {
    const hoy = hoyKey();
    const pagos = aprobados().filter((p) => p.permisionarioId === id && dateKey(p.createdAt) === hoy);
    let digital = 0;
    let cash = 0;
    for (const p of pagos) p.method === "cash" ? (cash += p.amount) : (digital += p.amount);
    return { digital, cash, total: digital + cash, count: pagos.length };
  },

  async getMovimientos(id: string): Promise<Pago[]> {
    return store.pagos
      .filter((p) => p.permisionarioId === id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async getTarifas(): Promise<Tarifa[]> {
    return store.tarifas;
  },

  async getAuditoria(): Promise<AuditoriaEntry[]> {
    return store.auditoria;
  },

  async getSectores(): Promise<Sector[]> {
    return store.sectores;
  },

  async getPagosPorPatente(plate: string): Promise<Pago[]> {
    const p = normalizarPatente(plate);
    return store.pagos
      .filter((x) => x.plate === p)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async getConfig(): Promise<ConfigSistema> {
    return store.config;
  },

  async setConfig(patch: Partial<ConfigSistema>): Promise<ConfigSistema> {
    store.config = { ...store.config, ...patch };
    audit("config_update", "config", null, patch as Record<string, unknown>);
    return store.config;
  },

  async editarTarifa(id: string, patch: Partial<Tarifa>): Promise<Tarifa> {
    const t = store.tarifas.find((x) => x.id === id);
    if (!t) throw new Error("Tarifa inexistente.");
    Object.assign(t, patch);
    audit("tarifa_update", "tarifa", id, patch as Record<string, unknown>);
    return t;
  },

  async editarPermisionario(id: string, patch: Partial<Permisionario>): Promise<Permisionario> {
    const p = store.permisionarios.find((x) => x.id === id);
    if (!p) throw new Error("Permisionario inexistente.");
    Object.assign(p, patch);
    audit("permisionario_update", "permisionario", id, patch as Record<string, unknown>);
    return p;
  },

  async getValoraciones(id: string): Promise<Valoracion[]> {
    return store.valoraciones.filter((v) => v.permisionarioId === id);
  },

  async getIncidencias(permisionarioId?: string): Promise<Incidencia[]> {
    const xs = permisionarioId ? store.incidencias.filter((i) => i.permisionarioId === permisionarioId) : store.incidencias;
    return [...xs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async crearIncidencia(data: { permisionarioId: string; type: string; description: string }): Promise<Incidencia> {
    const inc: Incidencia = {
      id: newId("inc"),
      permisionarioId: data.permisionarioId,
      type: data.type,
      description: data.description,
      status: "open",
      createdAt: new Date().toISOString(),
    };
    store.incidencias.unshift(inc);
    audit("incidencia_create", "incidencia", inc.id, { type: inc.type });
    return inc;
  },

  async editarIncidencia(id: string, status: IncidenciaStatus): Promise<Incidencia> {
    const inc = store.incidencias.find((i) => i.id === id);
    if (!inc) throw new Error("Incidencia inexistente.");
    inc.status = status;
    audit("incidencia_update", "incidencia", id, { status });
    return inc;
  },

  // ── Efectivo registrado con confirmación + deuda (PRODUCTO.md §9/§10) ──────────
  async crearOrdenEfectivo(data: {
    plate: string;
    vehicleType: VehicleType;
    minutes: number;
    permisionarioId: string;
    sectorId?: string | null;
  }): Promise<OrdenEfectivo> {
    const perm = store.permisionarios.find((p) => p.id === data.permisionarioId);
    if (!perm) throw new Error("Permisionario inexistente.");
    if (perm.status !== "active") throw new Error(`El permisionario está ${perm.status}.`);
    const now = new Date().toISOString();
    const tarifa = seleccionarTarifaVigente(store.tarifas, data.vehicleType, now);
    if (!tarifa) throw new Error("No hay tarifa vigente.");
    // Efectivo vía app: mismo descuento que digital (beneficio por usar la app).
    const calc = calcularTarifa({ vehicleType: data.vehicleType, minutes: data.minutes, isDigital: true, date: now, tarifa, feriados: store.config.feriados });
    const orden: OrdenEfectivo = {
      id: newId("orden"),
      permisionarioId: perm.id,
      plate: normalizarPatente(data.plate),
      vehicleType: data.vehicleType,
      minutes: data.minutes,
      amount: calc.amount,
      sectorId: data.sectorId ?? perm.sectorId,
      status: "pending_cash_confirmation",
      createdAt: now,
    };
    store.ordenesEfectivo.unshift(orden);
    audit("orden_efectivo_creada", "orden_efectivo", orden.id, { plate: orden.plate, amount: orden.amount });
    return orden;
  },

  async getOrdenesEfectivoPendientes(permisionarioId: string): Promise<OrdenEfectivo[]> {
    return store.ordenesEfectivo.filter((o) => o.permisionarioId === permisionarioId && o.status === "pending_cash_confirmation");
  },

  async getOrdenEfectivo(ordenId: string): Promise<OrdenEfectivo | null> {
    return store.ordenesEfectivo.find((o) => o.id === ordenId) ?? null;
  },

  /** Comprobante de una orden de efectivo ya confirmada (para el ciudadano). */
  async getResultadoOrden(ordenId: string): Promise<ResultadoPago | null> {
    const pago = store.pagos.find((p) => p.idempotencyKey === ordenId);
    if (!pago) return null;
    const sesion = store.sesiones.find((s) => s.id === pago.sesionId);
    if (!sesion) return null;
    const tarifa = store.tarifas.find((t) => t.id === sesion.tarifaId) ?? store.tarifas[0]!;
    const calc = calcularTarifa({ vehicleType: sesion.vehicleType, minutes: sesion.paidMinutes, isDigital: true, date: pago.createdAt, tarifa, feriados: store.config.feriados });
    return { sesion, pago, calc, extended: false };
  },

  async confirmarEfectivo(ordenId: string): Promise<ResultadoPago> {
    const orden = store.ordenesEfectivo.find((o) => o.id === ordenId);
    if (!orden) throw new Error("Orden inexistente.");
    if (orden.status !== "pending_cash_confirmation") throw new Error("La orden ya fue procesada.");
    const now = new Date().toISOString();
    const tarifa = seleccionarTarifaVigente(store.tarifas, orden.vehicleType, now) ?? store.tarifas[0]!;
    const { sesion, extended } = crearOExtenderSesion(store.sesiones, {
      plate: orden.plate,
      minutes: orden.minutes,
      vehicleType: orden.vehicleType,
      tarifaId: tarifa.id,
      amount: orden.amount,
      sectorId: orden.sectorId,
      now,
      toleranceMinutes: store.config.toleranceMinutes,
      newId: () => newId("ses"),
    });
    if (!extended) store.sesiones.push(sesion);

    const pago: Pago = {
      id: newId("pago"),
      sesionId: sesion.id,
      method: "cash",
      amount: orden.amount,
      status: "approved",
      externalRef: null,
      receiptUrl: null,
      registeredBy: orden.permisionarioId,
      permisionarioId: orden.permisionarioId,
      plate: orden.plate,
      sectorId: orden.sectorId,
      idempotencyKey: orden.id,
      createdAt: now,
    };
    store.pagos.push(pago);
    orden.status = "cash_confirmed";

    // Genera deuda del permisionario hacia la plataforma por la comisión (10%).
    const comision = comisionPlataforma(orden.amount);
    store.deudas.unshift({
      id: newId("deuda"),
      permisionarioId: orden.permisionarioId,
      ordenId: orden.id,
      plate: orden.plate,
      amount: comision,
      status: "pending",
      createdAt: now,
    });
    audit("efectivo_confirmado", "pago", pago.id, { plate: pago.plate, amount: pago.amount, comision });
    const calc = calcularTarifa({ vehicleType: orden.vehicleType, minutes: orden.minutes, isDigital: true, date: now, tarifa, feriados: store.config.feriados });
    return { sesion, pago, calc, extended };
  },

  async cancelarOrdenEfectivo(ordenId: string): Promise<void> {
    const orden = store.ordenesEfectivo.find((o) => o.id === ordenId);
    if (orden && orden.status === "pending_cash_confirmation") {
      orden.status = "cash_cancelled";
      audit("orden_efectivo_cancelada", "orden_efectivo", orden.id, {});
    }
  },

  async getDeuda(permisionarioId: string): Promise<{ total: number; movimientos: MovimientoDeuda[] }> {
    const movimientos = store.deudas.filter((d) => d.permisionarioId === permisionarioId);
    const total = movimientos.filter((d) => d.status === "pending").reduce((a, d) => a + d.amount, 0);
    return { total, movimientos };
  },

  async pagarDeuda(permisionarioId: string): Promise<{ pagado: number }> {
    const pendientes = store.deudas.filter((d) => d.permisionarioId === permisionarioId && d.status === "pending");
    const pagado = pendientes.reduce((a, d) => a + d.amount, 0);
    pendientes.forEach((d) => (d.status = "paid"));
    audit("deuda_pagada", "deuda", permisionarioId, { pagado, operaciones: pendientes.length });
    return { pagado };
  },

  // ── Fiscalización por patente + excedentes + alertas (PRODUCTO.md §15/§16/§17) ──
  async fiscalizarPatente(plate: string): Promise<{
    plate: string;
    estado: EstadoSesion | "sin_sesion";
    sesion: Sesion | null;
    permisionario: Permisionario | null;
    sector: Sector | null;
    pago: Pago | null;
    alerta: AlertaExcedente | null;
    minutosExcedidos: number;
    toleranceMinutes: number;
  }> {
    const p = normalizarPatente(plate);
    const ahora = new Date().getTime();
    const alerta = alertaVigente(p, ahora);
    const ses = store.sesiones
      .filter((s) => s.plate === p && s.status === "active")
      .sort((a, b) => b.endValid.localeCompare(a.endValid))[0] ?? null;
    if (!ses) return { plate: p, estado: "sin_sesion", sesion: null, permisionario: null, sector: null, pago: null, alerta, minutosExcedidos: 0, toleranceMinutes: store.config.toleranceMinutes };
    const pago = store.pagos.filter((x) => x.sesionId === ses.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
    const permisionario = pago?.permisionarioId ? store.permisionarios.find((x) => x.id === pago.permisionarioId) ?? null : null;
    const sector = ses.originSectorId ? store.sectores.find((x) => x.id === ses.originSectorId) ?? null : null;
    const estado = estadoDeSesion(ses, ahora);
    const minutosExcedidos = estado === "vencida" ? Math.floor((ahora - new Date(ses.endValid).getTime()) / 60000) : 0;
    return { plate: p, estado, sesion: ses, permisionario, sector, pago, alerta, minutosExcedidos, toleranceMinutes: store.config.toleranceMinutes };
  },

  async getSesionesVencidas(permisionarioId?: string): Promise<Array<{ sesion: Sesion; permisionarioId: string | null; sectorName: string | null; minutosExcedidos: number }>> {
    const ahora = new Date().getTime();
    return store.sesiones
      .filter((s) => s.status === "active" && estadoDeSesion(s, ahora) === "vencida")
      .map((s) => {
        const pago = store.pagos.filter((x) => x.sesionId === s.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
        const sector = s.originSectorId ? store.sectores.find((x) => x.id === s.originSectorId) ?? null : null;
        return {
          sesion: s,
          permisionarioId: pago?.permisionarioId ?? null,
          sectorName: sector?.name ?? null,
          minutosExcedidos: Math.floor((ahora - new Date(s.endValid).getTime()) / 60000),
        };
      })
      .filter((x) => !permisionarioId || x.permisionarioId === permisionarioId);
  },

  async cobrarExcedente(data: { sesionId: string; minutes: number; metodo: "digital" | "cash"; permisionarioId: string }): Promise<{ pago: Pago; calc: CalcularTarifaResult }> {
    const ses = store.sesiones.find((s) => s.id === data.sesionId);
    if (!ses) throw new Error("Sesión inexistente.");
    // Guard anti-duplicado (§16): sólo se cobra excedente sobre una sesión efectivamente vencida.
    if (estadoDeSesion(ses, new Date().getTime()) !== "vencida") throw new Error("La sesión ya no está vencida: el excedente ya fue regularizado.");
    const now = new Date().toISOString();
    const tarifa = seleccionarTarifaVigente(store.tarifas, ses.vehicleType, now) ?? store.tarifas[0]!;
    const calc = calcularTarifa({ vehicleType: ses.vehicleType, minutes: data.minutes, isDigital: true, date: now, tarifa, feriados: store.config.feriados });
    // Extiende la ventana (operación vinculada a la sesión original, sin pisar el comprobante).
    const base = new Date(ses.endValid).getTime() >= new Date(now).getTime() ? ses.endValid : now;
    ses.endValid = new Date(new Date(base).getTime() + data.minutes * 60000).toISOString();
    ses.paidMinutes += data.minutes;
    ses.amount += calc.amount;
    const pago: Pago = {
      id: newId("pago"),
      sesionId: ses.id,
      method: data.metodo === "cash" ? "cash" : "mercadopago",
      amount: calc.amount,
      status: "approved",
      externalRef: data.metodo === "cash" ? null : `MP-EXC-${newId("ref")}`,
      receiptUrl: null,
      registeredBy: data.permisionarioId,
      permisionarioId: data.permisionarioId,
      plate: ses.plate,
      sectorId: ses.originSectorId,
      idempotencyKey: null,
      createdAt: now,
    };
    store.pagos.push(pago);
    if (data.metodo === "cash") {
      store.deudas.unshift({ id: newId("deuda"), permisionarioId: data.permisionarioId, ordenId: pago.id, plate: ses.plate, amount: comisionPlataforma(calc.amount), status: "pending", createdAt: now });
    }
    const alerta = store.alertas.find((a) => a.plate === ses.plate && a.status === "excess_alert_active");
    if (alerta) alerta.status = "excess_paid";
    audit("excedente_cobrado", "pago", pago.id, { plate: ses.plate, minutes: data.minutes, metodo: data.metodo });
    return { pago, calc };
  },

  async marcarExcedenteNoPagado(data: { sesionId: string; permisionarioId: string }): Promise<AlertaExcedente> {
    const ses = store.sesiones.find((s) => s.id === data.sesionId);
    if (!ses) throw new Error("Sesión inexistente.");
    const now = new Date();
    const ahora = now.getTime();
    const minutosExcedidos = Math.max(0, Math.floor((ahora - new Date(ses.endValid).getTime()) / 60000));
    const tarifa = seleccionarTarifaVigente(store.tarifas, ses.vehicleType, now.toISOString()) ?? store.tarifas[0]!;
    const sugerido = calcularTarifa({ vehicleType: ses.vehicleType, minutes: Math.max(15, Math.ceil(minutosExcedidos / 15) * 15), isDigital: true, date: now.toISOString(), tarifa, feriados: store.config.feriados }).amount;
    ses.status = "expired"; // se retira sin regularizar
    const alerta: AlertaExcedente = {
      id: newId("alerta"),
      plate: ses.plate,
      permisionarioId: data.permisionarioId,
      sectorId: ses.originSectorId,
      sesionId: ses.id,
      montoSugerido: sugerido,
      minutosExcedidos,
      status: "excess_alert_active",
      createdAt: now.toISOString(),
      expiresAt: new Date(ahora + ALERTA_HORAS * 3600000).toISOString(),
    };
    store.alertas.unshift(alerta);
    audit("excedente_no_pagado", "alerta", alerta.id, { plate: ses.plate, minutosExcedidos });
    return alerta;
  },

  async getAlertaActiva(plate: string): Promise<AlertaExcedente | null> {
    return alertaVigente(normalizarPatente(plate), new Date().getTime());
  },

  async getAlertas(): Promise<AlertaExcedente[]> {
    alertaVigente("", new Date().getTime()); // fuerza vencimiento automático
    return [...store.alertas].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  // ── Alta, validación e importación de permisionarios (PRODUCTO.md §5/§18) ──────
  async detectarDuplicados(data: { dni: string; legajo: string }): Promise<string[]> {
    return detectarDup(data.dni, data.legajo);
  },

  async crearPermisionarioAlta(data: AltaInput): Promise<{ permisionario: Permisionario; duplicados: string[] }> {
    const duplicados = detectarDup(data.dni, data.legajo);
    const permisionario = altaAPermisionario(data);
    audit("permisionario_alta", "permisionario", permisionario.id, { fullName: data.fullName, dni: data.dni, legajo: data.legajo });
    return { permisionario, duplicados };
  },

  async importarPermisionarios(filas: AltaInput[]): Promise<{ creados: number; omitidos: Array<{ fila: AltaInput; motivos: string[] }> }> {
    let creados = 0;
    const omitidos: Array<{ fila: AltaInput; motivos: string[] }> = [];
    for (const fila of filas) {
      const motivos = detectarDup(fila.dni, fila.legajo);
      if (motivos.length) {
        omitidos.push({ fila, motivos });
        continue;
      }
      altaAPermisionario(fila);
      creados++;
    }
    audit("permisionarios_importados", "permisionario", null, { creados, omitidos: omitidos.length });
    return { creados, omitidos };
  },

  async getValidaciones(estado?: EstadoValidacion): Promise<Array<Validacion & { permisionario: Permisionario | null }>> {
    return store.validaciones
      .filter((v) => !estado || v.estado === estado)
      .map((v) => ({ ...v, permisionario: store.permisionarios.find((p) => p.id === v.permisionarioId) ?? null }));
  },

  async resolverValidacion(permisionarioId: string, accion: "approved" | "observed" | "rejected", motivo?: string): Promise<void> {
    const v = store.validaciones.find((x) => x.permisionarioId === permisionarioId);
    if (!v) return;
    v.estado = accion;
    v.motivo = motivo ?? null;
    const perm = store.permisionarios.find((p) => p.id === permisionarioId);
    if (perm) perm.status = accion === "approved" ? "active" : accion === "rejected" ? "expired" : "suspended";
    audit(`permisionario_${accion}`, "permisionario", permisionarioId, { motivo: motivo ?? "" });
  },

  async getDashboard(): Promise<Dashboard> {
    const pagos = aprobados();
    const hoy = hoyKey();
    const mesPrefix = hoy.slice(0, 7);
    let recaudacionHoy = 0;
    let recaudacionMes = 0;
    let digitalTotal = 0;
    let cashTotal = 0;
    for (const p of pagos) {
      const k = dateKey(p.createdAt);
      if (k === hoy) recaudacionHoy += p.amount;
      if (k.startsWith(mesPrefix)) recaudacionMes += p.amount;
      esDigital(p) ? (digitalTotal += p.amount) : (cashTotal += p.amount);
    }
    const recaudacionTotal = digitalTotal + cashTotal;
    const operaciones = pagos.length;
    const ticketPromedio = operaciones ? Math.round(recaudacionTotal / operaciones) : 0;

    const serieDiaria: Dashboard["serieDiaria"] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = dateKey(d.toISOString());
      const delDia = pagos.filter((p) => dateKey(p.createdAt) === key);
      serieDiaria.push({
        date: key,
        total: delDia.reduce((a, p) => a + p.amount, 0),
        digital: delDia.filter(esDigital).reduce((a, p) => a + p.amount, 0),
        cash: delDia.filter((p) => !esDigital(p)).reduce((a, p) => a + p.amount, 0),
        ops: delDia.length,
      });
    }

    const porSector = store.sectores.map((s) => {
      const ps = pagos.filter((p) => p.sectorId === s.id);
      return {
        sectorId: s.id,
        name: s.name,
        centroid: s.centroid,
        ring: s.ring,
        shift: s.shift,
        total: ps.reduce((a, p) => a + p.amount, 0),
        ops: ps.length,
      };
    });

    const porPermisionario = store.permisionarios
      .map((perm) => {
        const ps = pagos.filter((p) => p.permisionarioId === perm.id);
        return {
          permisionarioId: perm.id,
          fullName: perm.fullName,
          status: perm.status,
          rating: perm.rating,
          total: ps.reduce((a, p) => a + p.amount, 0),
          ops: ps.length,
        };
      })
      .sort((a, b) => b.total - a.total);

    const mixMedios: Record<string, number> = {};
    for (const p of pagos) mixMedios[p.method] = (mixMedios[p.method] ?? 0) + p.amount;

    return {
      kpis: {
        recaudacionHoy,
        recaudacionMes,
        recaudacionTotal,
        digitalTotal,
        cashTotal,
        operaciones,
        ticketPromedio,
        permisionariosActivos: store.permisionarios.filter((p) => p.status === "active").length,
        sectores: store.sectores.length,
      },
      serieDiaria,
      porSector,
      porPermisionario,
      mixMedios,
    };
  },
};

export type ClientLocal = typeof clientLocal;
