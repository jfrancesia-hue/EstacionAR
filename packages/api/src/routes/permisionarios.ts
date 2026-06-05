// ABM de permisionarios + generacion de QR firmado (FASE 3).
import { Router } from "express";
import { z } from "zod";
import { newId, signQrToken, type Permisionario } from "@estacionar/core";
import { audit, db } from "../store.js";
import { env } from "../env.js";
import { h, HttpError, parseBody } from "../http.js";

export const permisionariosRouter: Router = Router();

function enriquecer(p: Permisionario) {
  const sector = db.sectores.find((s) => s.id === p.sectorId) ?? null;
  const valoraciones = db.valoraciones.filter((v) => v.permisionarioId === p.id);
  return { ...p, sector, valoracionesCount: valoraciones.length };
}

permisionariosRouter.get(
  "/",
  h((_req, res) => res.json(db.permisionarios.map(enriquecer))),
);

permisionariosRouter.get(
  "/:id",
  h((req, res) => {
    const p = db.permisionarios.find((x) => x.id === req.params.id);
    if (!p) throw new HttpError(404, "Permisionario no encontrado.");
    res.json(enriquecer(p));
  }),
);

// Movimientos (pagos) del permisionario
permisionariosRouter.get(
  "/:id/movimientos",
  h((req, res) => {
    const pagos = db.pagos
      .filter((p) => p.permisionarioId === req.params.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    res.json(pagos);
  }),
);

// Recaudacion del dia (en vivo) del permisionario — el front hace polling.
permisionariosRouter.get(
  "/:id/recaudacion-hoy",
  h((req, res) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const desde = hoy.getTime();
    const pagos = db.pagos.filter(
      (p) =>
        p.permisionarioId === req.params.id &&
        p.status === "approved" &&
        new Date(p.createdAt).getTime() >= desde,
    );
    let digital = 0;
    let cash = 0;
    for (const p of pagos) (p.method === "cash" ? (cash += p.amount) : (digital += p.amount));
    res.json({ digital, cash, total: digital + cash, count: pagos.length });
  }),
);

const crearSchema = z.object({
  dni: z.string().min(6),
  fullName: z.string().min(3),
  contactPhone: z.string().min(6),
  sectorId: z.string().nullable().optional(),
  shift: z.enum(["diurno", "nocturno"]).nullable().optional(),
});

permisionariosRouter.post(
  "/",
  h(async (req, res) => {
    const data = parseBody(crearSchema, req);
    const id = newId("perm");
    const sectorId = data.sectorId ?? null;
    const shift = data.shift ?? null;
    const qrToken = await signQrToken(
      { permisionarioId: id, sectorId, shift, iat: Date.now() },
      env.qrSecret,
    );
    const perm: Permisionario = {
      id,
      userId: null,
      dni: data.dni,
      fullName: data.fullName,
      contactPhone: data.contactPhone,
      status: "active",
      qrToken,
      sectorId,
      shift,
      rating: 0,
      createdAt: new Date().toISOString(),
    };
    db.permisionarios.push(perm);
    audit("alta_permisionario", "permisionario", id, { dni: data.dni, fullName: data.fullName });
    res.status(201).json(enriquecer(perm));
  }),
);

const editarSchema = z.object({
  fullName: z.string().min(3).optional(),
  contactPhone: z.string().min(6).optional(),
  status: z.enum(["active", "suspended", "expired"]).optional(),
  sectorId: z.string().nullable().optional(),
  shift: z.enum(["diurno", "nocturno"]).nullable().optional(),
});

permisionariosRouter.patch(
  "/:id",
  h((req, res) => {
    const p = db.permisionarios.find((x) => x.id === req.params.id);
    if (!p) throw new HttpError(404, "Permisionario no encontrado.");
    const data = parseBody(editarSchema, req);
    Object.assign(p, data);
    audit("editar_permisionario", "permisionario", p.id, { ...data });
    res.json(enriquecer(p));
  }),
);

// Regenerar QR firmado (revoca el anterior).
permisionariosRouter.post(
  "/:id/regenerar-qr",
  h(async (req, res) => {
    const p = db.permisionarios.find((x) => x.id === req.params.id);
    if (!p) throw new HttpError(404, "Permisionario no encontrado.");
    p.qrToken = await signQrToken(
      { permisionarioId: p.id, sectorId: p.sectorId, shift: p.shift, iat: Date.now() },
      env.qrSecret,
    );
    audit("regenerar_qr", "permisionario", p.id, {});
    res.json({ qrToken: p.qrToken });
  }),
);

// Valoraciones del permisionario (FASE 5)
permisionariosRouter.get(
  "/:id/valoraciones",
  h((req, res) => {
    const vs = db.valoraciones.filter((v) => v.permisionarioId === req.params.id);
    res.json(vs);
  }),
);
