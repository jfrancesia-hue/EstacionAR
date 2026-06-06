// Flujo transaccional: validacion de QR, cotizacion, pago digital, pago efectivo y
// consulta de billetera de tiempo (FASE 1 y 2). El cobro SIEMPRE se procesa del lado del
// servidor contra la credencial/cuenta del permisionario.
import { Router } from "express";
import { z } from "zod";
import {
  calcularTarifa,
  consultarSesion,
  crearOExtenderSesion,
  generarNonce,
  newId,
  normalizarPatente,
  seleccionarTarifaVigente,
  verifyQrToken,
  type Pago,
} from "@estacionar/core";
import { audit, db } from "../store.js";
import { env } from "../env.js";
import { h, HttpError, parseBody } from "../http.js";

export const transaccionesRouter: Router = Router();

// ── Validacion de QR del permisionario (antifraude) ────────────────────────────
const qrSchema = z.object({ token: z.string().min(10) });

transaccionesRouter.post(
  "/qr/validar",
  h(async (req, res) => {
    const { token } = parseBody(qrSchema, req);
    const r = await verifyQrToken(token, env.qrSecret);
    if (!r.valid || !r.payload) {
      throw new HttpError(401, "QR invalido o manipulado.", { reason: r.reason });
    }
    const perm = db.permisionarios.find((p) => p.id === r.payload!.permisionarioId);
    if (!perm) throw new HttpError(404, "Permisionario inexistente.");
    if (perm.status !== "active") {
      throw new HttpError(403, `El permisionario esta ${perm.status}. No puede operar.`);
    }
    const sector = db.sectores.find((s) => s.id === perm.sectorId) ?? null;
    // Nonce por operacion: liga este escaneo a un unico cobro posterior.
    const nonce = generarNonce();
    db.noncesUsados.add(nonce); // se reserva; se consume al pagar
    res.json({
      valid: true,
      nonce,
      permisionario: {
        id: perm.id,
        fullName: perm.fullName,
        status: perm.status,
        shift: perm.shift,
        rating: perm.rating,
      },
      sector,
    });
  }),
);

// ── Cotizacion (preview de precio sin cobrar) ──────────────────────────────────
const cotizarSchema = z.object({
  vehicleType: z.enum(["auto", "moto"]),
  minutes: z.number().int().positive(),
  isDigital: z.boolean().default(true),
  date: z.string().optional(),
});

transaccionesRouter.post(
  "/cotizar",
  h((req, res) => {
    const data = parseBody(cotizarSchema, req);
    const date = data.date ?? new Date().toISOString();
    const tarifa = seleccionarTarifaVigente(db.tarifas, data.vehicleType, date);
    if (!tarifa) throw new HttpError(404, "No hay tarifa vigente.");
    const calc = calcularTarifa({
      vehicleType: data.vehicleType,
      minutes: data.minutes,
      isDigital: data.isDigital,
      date,
      tarifa,
      feriados: db.config.feriados,
    });
    res.json(calc);
  }),
);

// ── Consulta de billetera de tiempo por patente ────────────────────────────────
transaccionesRouter.get(
  "/sesiones/:plate",
  h((req, res) => {
    const r = consultarSesion(
      db.sesiones,
      String(req.params.plate),
      new Date().toISOString(),
      db.config.toleranceMinutes,
    );
    res.json(r);
  }),
);

// ── Pago digital (Mercado Pago simulado en demo) ───────────────────────────────
const pagoDigitalSchema = z.object({
  plate: z.string().min(3),
  vehicleType: z.enum(["auto", "moto"]),
  minutes: z.number().int().positive(),
  sectorId: z.string().nullable().optional(),
  permisionarioId: z.string().nullable().optional(),
  method: z.enum(["qr", "mercadopago", "modo", "naranja", "card"]).default("mercadopago"),
});

transaccionesRouter.post(
  "/pagos/digital",
  h((req, res) => {
    const data = parseBody(pagoDigitalSchema, req);
    const now = new Date().toISOString();
    const tarifa = seleccionarTarifaVigente(db.tarifas, data.vehicleType, now);
    if (!tarifa) throw new HttpError(404, "No hay tarifa vigente.");

    const calc = calcularTarifa({
      vehicleType: data.vehicleType,
      minutes: data.minutes,
      isDigital: true,
      date: now,
      tarifa,
      feriados: db.config.feriados,
    });

    const { sesion, extended } = crearOExtenderSesion(db.sesiones, {
      plate: data.plate,
      minutes: data.minutes,
      vehicleType: data.vehicleType,
      tarifaId: tarifa.id,
      amount: calc.amount,
      sectorId: data.sectorId ?? null,
      now,
      toleranceMinutes: db.config.toleranceMinutes,
      newId: () => newId("ses"),
    });
    if (!extended) db.sesiones.push(sesion);

    // En demo, el pago digital se aprueba al instante (Mercado Pago simulado).
    const pago: Pago = {
      id: newId("pago"),
      sesionId: sesion.id,
      method: data.method,
      amount: calc.amount,
      status: "approved",
      externalRef: `${data.method.toUpperCase()}-${newId("ref")}`,
      receiptUrl: null,
      registeredBy: null,
      permisionarioId: data.permisionarioId ?? null,
      plate: normalizarPatente(data.plate),
      sectorId: data.sectorId ?? null,
      idempotencyKey: null,
      createdAt: now,
    };
    db.pagos.push(pago);
    audit("pago_digital", "pago", pago.id, {
      plate: pago.plate,
      amount: pago.amount,
      method: pago.method,
    });

    res.status(201).json({ sesion, pago, calc, extended, demo: env.isDemo });
  }),
);

// ── Pago en efectivo (permisionario) — inmutable + antiduplicidad ──────────────
const pagoEfectivoSchema = z.object({
  plate: z.string().min(3),
  vehicleType: z.enum(["auto", "moto"]),
  minutes: z.number().int().positive(),
  permisionarioId: z.string().min(1),
  sectorId: z.string().nullable().optional(),
  idempotencyKey: z.string().min(8),
});

transaccionesRouter.post(
  "/pagos/efectivo",
  h((req, res) => {
    const data = parseBody(pagoEfectivoSchema, req);

    // Antiduplicidad: misma idempotency_key => no se vuelve a registrar.
    if (db.idempotencyKeys.has(data.idempotencyKey)) {
      const existente = db.pagos.find((p) => p.idempotencyKey === data.idempotencyKey);
      return res.status(200).json({ duplicado: true, pago: existente });
    }

    const perm = db.permisionarios.find((p) => p.id === data.permisionarioId);
    if (!perm) throw new HttpError(404, "Permisionario inexistente.");
    if (perm.status !== "active") throw new HttpError(403, `Permisionario ${perm.status}.`);

    const now = new Date().toISOString();
    const tarifa = seleccionarTarifaVigente(db.tarifas, data.vehicleType, now);
    if (!tarifa) throw new HttpError(404, "No hay tarifa vigente.");

    // Efectivo: SIN descuento digital.
    const calc = calcularTarifa({
      vehicleType: data.vehicleType,
      minutes: data.minutes,
      isDigital: false,
      date: now,
      tarifa,
      feriados: db.config.feriados,
    });

    const { sesion, extended } = crearOExtenderSesion(db.sesiones, {
      plate: data.plate,
      minutes: data.minutes,
      vehicleType: data.vehicleType,
      tarifaId: tarifa.id,
      amount: calc.amount,
      sectorId: data.sectorId ?? perm.sectorId,
      now,
      toleranceMinutes: db.config.toleranceMinutes,
      newId: () => newId("ses"),
    });
    if (!extended) db.sesiones.push(sesion);

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
    // Registro inmutable: se agrega y nunca se edita/borra (auditado).
    db.pagos.push(pago);
    db.idempotencyKeys.add(data.idempotencyKey);
    audit("pago_efectivo", "pago", pago.id, {
      plate: pago.plate,
      amount: pago.amount,
      permisionarioId: perm.id,
    });

    res.status(201).json({ sesion, pago, calc, extended });
  }),
);
