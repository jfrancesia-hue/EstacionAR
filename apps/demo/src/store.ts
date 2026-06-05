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
  type Pago,
  type Permisionario,
  type Sector,
  type Sesion,
  type Tarifa,
  type Valoracion,
  type VehicleType,
} from "@estacionar/core";
import type { Dashboard, PermisionarioConSector, ResultadoPago } from "@estacionar/ui";

interface Store {
  config: ConfigSistema;
  tarifas: Tarifa[];
  sectores: Sector[];
  permisionarios: Permisionario[];
  sesiones: Sesion[];
  pagos: Pago[];
  valoraciones: Valoracion[];
  auditoria: AuditoriaEntry[];
  idempotencyKeys: Set<string>;
}

function init(): Store {
  const now = new Date().toISOString();
  const seed = buildSeed(now);
  return {
    config: seed.config,
    tarifas: seed.tarifas,
    sectores: seed.sectores,
    // Copias para poder mutar sesiones/pagos sin afectar el seed original.
    permisionarios: seed.permisionarios.map((p) => ({ ...p })),
    sesiones: seed.sesiones.map((s) => ({ ...s })),
    pagos: seed.pagos.map((p) => ({ ...p })),
    valoraciones: seed.valoraciones,
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
