// Tarifas, sectores y configuracion del sistema (FASE 0 / 3).
import { Router } from "express";
import { z } from "zod";
import { newId, seleccionarTarifaVigente, type Tarifa } from "@estacionar/core";
import { audit, db } from "../store.js";
import { h, HttpError, parseBody } from "../http.js";

export const catalogosRouter: Router = Router();

// ── Tarifas ──────────────────────────────────────────────────────────────────
catalogosRouter.get(
  "/tarifas",
  h((_req, res) => res.json(db.tarifas)),
);

catalogosRouter.get(
  "/tarifas/vigente",
  h((req, res) => {
    const vehicleType = String(req.query.vehicleType ?? "auto") as Tarifa["vehicleType"];
    const date = String(req.query.date ?? new Date().toISOString());
    const t = seleccionarTarifaVigente(db.tarifas, vehicleType, date);
    if (!t) throw new HttpError(404, "No hay tarifa vigente para ese tipo de vehiculo.");
    res.json(t);
  }),
);

const tarifaSchema = z.object({
  vehicleType: z.enum(["auto", "moto"]),
  minUnitMinutes: z.number().int().positive(),
  firstBlockMinutes: z.number().int().positive(),
  firstUnitAmount: z.number().nonnegative(),
  nextUnitAmount: z.number().nonnegative(),
  digitalDiscountPct: z.number().min(0).max(100),
  validFrom: z.string(),
  validTo: z.string().nullable().optional(),
});

// Crear nueva tarifa vigente. La actualizacion semestral es un cambio de DATOS, no de codigo.
catalogosRouter.post(
  "/tarifas",
  h((req, res) => {
    const data = parseBody(tarifaSchema, req);
    // Cierra la vigencia de la tarifa anterior del mismo tipo (validTo = inicio de la nueva).
    for (const t of db.tarifas) {
      if (t.vehicleType === data.vehicleType && t.active && t.validTo === null) {
        t.validTo = data.validFrom;
      }
    }
    const tarifa: Tarifa = {
      id: newId("tar"),
      ...data,
      validTo: data.validTo ?? null,
      active: true,
    };
    db.tarifas.push(tarifa);
    audit("crear_tarifa", "tarifa", tarifa.id, { ...data });
    res.status(201).json(tarifa);
  }),
);

// ── Sectores ─────────────────────────────────────────────────────────────────
catalogosRouter.get(
  "/sectores",
  h((_req, res) => res.json(db.sectores)),
);

const sectorSchema = z.object({
  name: z.string().min(2),
  numbering: z.enum(["par", "impar", "ambos"]),
  shift: z.enum(["diurno", "nocturno"]),
  notes: z.string().optional(),
  centroid: z.tuple([z.number(), z.number()]),
  ring: z.array(z.tuple([z.number(), z.number()])).optional(),
});

catalogosRouter.post(
  "/sectores",
  h((req, res) => {
    const data = parseBody(sectorSchema, req);
    const [lng, lat] = data.centroid;
    const d = 0.0012;
    const sector = {
      id: newId("sec"),
      name: data.name,
      numbering: data.numbering,
      shift: data.shift,
      notes: data.notes ?? "",
      centroid: data.centroid,
      ring:
        data.ring ??
        ([
          [lng - d, lat - d],
          [lng + d, lat - d],
          [lng + d, lat + d],
          [lng - d, lat + d],
          [lng - d, lat - d],
        ] as Array<[number, number]>),
    };
    db.sectores.push(sector);
    audit("crear_sector", "sector", sector.id, { name: sector.name });
    res.status(201).json(sector);
  }),
);

// ── Configuracion del sistema (comision, tolerancia, feriados, corredores) ─────
catalogosRouter.get(
  "/config",
  h((_req, res) => res.json(db.config)),
);

const configSchema = z.object({
  feePct: z.number().min(0).max(100).optional(),
  toleranceMinutes: z.number().int().min(0).optional(),
  feriados: z.array(z.string()).optional(),
  nocturnoCorridors: z.array(z.string()).optional(),
});

catalogosRouter.patch(
  "/config",
  h((req, res) => {
    const data = parseBody(configSchema, req);
    db.config = { ...db.config, ...data };
    audit("editar_config", "config", null, { ...data });
    res.json(db.config);
  }),
);
