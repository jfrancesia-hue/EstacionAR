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
  auditoria: AuditoriaEntry[];
  idempotencyKeys: Set<string>;
}

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
  return {
    config: seed.config,
    // Descuento al ciudadano = 10% (modelo 80/10/10); el otro 10% que resigna la Muni es la plataforma.
    tarifas: seed.tarifas.map((t) => ({ ...t, digitalDiscountPct: SPLIT.descuentoCiudadanoPct })),
    sectores: seed.sectores,
    // Copias para poder mutar sesiones/pagos sin afectar el seed original.
    permisionarios: seed.permisionarios.map((p) => ({ ...p })),
    sesiones: seed.sesiones.map((s) => ({ ...s })),
    pagos: seed.pagos.map((p) => ({ ...p })),
    valoraciones: seed.valoraciones,
    incidencias,
    ordenesEfectivo: [],
    deudas: [],
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

  async pagarEfectivo(data: {
    plate: string;
    vehicleType: VehicleType;
    minutes: number;
    permisionarioId: string;
    sectorId?: string | null;
    idempotencyKey: string;
  }): Promise<ResultadoPago> {
    // Antiduplicidad: misma idempotency_key => no se vuelve a registrar.
    if (store.idempotencyKeys.has(data.idempotencyKey)) {
      const existente = store.pagos.find((p) => p.idempotencyKey === data.idempotencyKey)!;
      const sesion = store.sesiones.find((s) => s.id === existente.sesionId)!;
      const tarifa = store.tarifas.find((t) => t.id === sesion.tarifaId) ?? store.tarifas[0]!;
      const calc = calcularTarifa({
        vehicleType: data.vehicleType,
        minutes: data.minutes,
        isDigital: false,
        date: existente.createdAt,
        tarifa,
        feriados: store.config.feriados,
      });
      return { sesion, pago: existente, calc, extended: false, duplicado: true };
    }

    const perm = store.permisionarios.find((p) => p.id === data.permisionarioId);
    if (!perm) throw new Error("Permisionario inexistente.");
    if (perm.status !== "active") throw new Error(`El permisionario está ${perm.status}.`);

    const now = new Date().toISOString();
    const tarifa = seleccionarTarifaVigente(store.tarifas, data.vehicleType, now);
    if (!tarifa) throw new Error("No hay tarifa vigente.");
    // Efectivo: SIN descuento digital.
    const calc = calcularTarifa({
      vehicleType: data.vehicleType,
      minutes: data.minutes,
      isDigital: false,
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
      sectorId: data.sectorId ?? perm.sectorId,
      now,
      toleranceMinutes: store.config.toleranceMinutes,
      newId: () => newId("ses"),
    });
    if (!extended) store.sesiones.push(sesion);

    const pago: Pago = {
      id: newId("pago"),
      sesionId: sesion.id,
      method: "cash",
      amount: calc.amount,
      status: "approved",
      externalRef: null,
      receiptUrl: null,
      registeredBy: perm.id,
      permisionarioId: perm.id,
      plate: normalizarPatente(data.plate),
      sectorId: data.sectorId ?? perm.sectorId,
      idempotencyKey: data.idempotencyKey,
      createdAt: now,
    };
    store.pagos.push(pago);
    store.idempotencyKeys.add(data.idempotencyKey);
    audit("pago_efectivo", "pago", pago.id, { plate: pago.plate, amount: pago.amount, permisionarioId: perm.id });
    return { sesion, pago, calc, extended };
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
    const tarifa = store.tarifas.find((t) => t.vehicleType === orden.vehicleType) ?? store.tarifas[0]!;
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
