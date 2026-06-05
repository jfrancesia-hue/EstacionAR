// Dashboards, reportes, incidencias y valoraciones (FASE 2, 3 y 5).
import { Router } from "express";
import { z } from "zod";
import { newId, toDateKey, type Pago } from "@estacionar/core";
import { audit, db } from "../store.js";
import { h, HttpError, parseBody } from "../http.js";

export const gestionRouter: Router = Router();

function aprobados(): Pago[] {
  return db.pagos.filter((p) => p.status === "approved");
}

function esDigital(p: Pago): boolean {
  return p.method !== "cash";
}

// ── Dashboard municipal ────────────────────────────────────────────────────────
gestionRouter.get(
  "/dashboard",
  h((_req, res) => {
    const pagos = aprobados();
    const hoyKey = toDateKey(new Date().toISOString());
    const mesPrefix = hoyKey.slice(0, 7);

    let recaudacionHoy = 0;
    let recaudacionMes = 0;
    let digitalTotal = 0;
    let cashTotal = 0;

    for (const p of pagos) {
      const k = toDateKey(p.createdAt);
      if (k === hoyKey) recaudacionHoy += p.amount;
      if (k.startsWith(mesPrefix)) recaudacionMes += p.amount;
      if (esDigital(p)) digitalTotal += p.amount;
      else cashTotal += p.amount;
    }

    const totalGlobal = digitalTotal + cashTotal;
    const operaciones = pagos.length;
    const ticketPromedio = operaciones ? Math.round(totalGlobal / operaciones) : 0;

    // Serie de los ultimos 14 dias
    const serieDiaria: Array<{ date: string; total: number; digital: number; cash: number; ops: number }> = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = toDateKey(d.toISOString());
      const delDia = pagos.filter((p) => toDateKey(p.createdAt) === key);
      serieDiaria.push({
        date: key,
        total: delDia.reduce((a, p) => a + p.amount, 0),
        digital: delDia.filter(esDigital).reduce((a, p) => a + p.amount, 0),
        cash: delDia.filter((p) => !esDigital(p)).reduce((a, p) => a + p.amount, 0),
        ops: delDia.length,
      });
    }

    // Por sector
    const porSector = db.sectores.map((s) => {
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

    // Por permisionario
    const porPermisionario = db.permisionarios.map((perm) => {
      const ps = pagos.filter((p) => p.permisionarioId === perm.id);
      return {
        permisionarioId: perm.id,
        fullName: perm.fullName,
        status: perm.status,
        rating: perm.rating,
        total: ps.reduce((a, p) => a + p.amount, 0),
        ops: ps.length,
      };
    });

    // Mix de medios
    const mixMedios: Record<string, number> = {};
    for (const p of pagos) mixMedios[p.method] = (mixMedios[p.method] ?? 0) + p.amount;

    res.json({
      kpis: {
        recaudacionHoy,
        recaudacionMes,
        recaudacionTotal: totalGlobal,
        digitalTotal,
        cashTotal,
        operaciones,
        ticketPromedio,
        permisionariosActivos: db.permisionarios.filter((p) => p.status === "active").length,
        sectores: db.sectores.length,
      },
      serieDiaria,
      porSector,
      porPermisionario: porPermisionario.sort((a, b) => b.total - a.total),
      mixMedios,
    });
  }),
);

// Recaudacion en vivo (transparencia, antes de liquidar)
gestionRouter.get(
  "/recaudacion-en-vivo",
  h((_req, res) => {
    const hoyKey = toDateKey(new Date().toISOString());
    const pagos = aprobados().filter((p) => toDateKey(p.createdAt) === hoyKey);
    const total = pagos.reduce((a, p) => a + p.amount, 0);
    const porPermisionario = db.permisionarios.map((perm) => {
      const ps = pagos.filter((p) => p.permisionarioId === perm.id);
      return {
        permisionarioId: perm.id,
        fullName: perm.fullName,
        total: ps.reduce((a, p) => a + p.amount, 0),
        ops: ps.length,
      };
    });
    res.json({ fecha: hoyKey, total, operaciones: pagos.length, porPermisionario });
  }),
);

// ── Reportes (agrupables) ──────────────────────────────────────────────────────
gestionRouter.get(
  "/reportes/recaudacion",
  h((req, res) => {
    const groupBy = String(req.query.groupBy ?? "dia");
    const from = req.query.from ? String(req.query.from) : null;
    const to = req.query.to ? String(req.query.to) : null;
    let pagos = aprobados();
    if (from) pagos = pagos.filter((p) => toDateKey(p.createdAt) >= from);
    if (to) pagos = pagos.filter((p) => toDateKey(p.createdAt) <= to);

    const map = new Map<string, { key: string; label: string; total: number; ops: number }>();
    const push = (key: string, label: string, amount: number) => {
      const cur = map.get(key) ?? { key, label, total: 0, ops: 0 };
      cur.total += amount;
      cur.ops += 1;
      map.set(key, cur);
    };

    for (const p of pagos) {
      if (groupBy === "sector") {
        const s = db.sectores.find((x) => x.id === p.sectorId);
        push(p.sectorId ?? "sin_sector", s?.name ?? "Sin sector", p.amount);
      } else if (groupBy === "permisionario") {
        const perm = db.permisionarios.find((x) => x.id === p.permisionarioId);
        push(p.permisionarioId ?? "sin_perm", perm?.fullName ?? "Sin permisionario", p.amount);
      } else if (groupBy === "medio") {
        push(p.method, p.method, p.amount);
      } else {
        const k = toDateKey(p.createdAt);
        push(k, k, p.amount);
      }
    }
    const rows = [...map.values()].sort((a, b) => a.key.localeCompare(b.key));
    res.json({ groupBy, rows, total: rows.reduce((a, r) => a + r.total, 0) });
  }),
);

// ── Incidencias ────────────────────────────────────────────────────────────────
gestionRouter.get(
  "/incidencias",
  h((req, res) => {
    const permisionarioId = req.query.permisionarioId ? String(req.query.permisionarioId) : null;
    let list = db.incidencias;
    if (permisionarioId) list = list.filter((i) => i.permisionarioId === permisionarioId);
    res.json([...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  }),
);

const incidenciaSchema = z.object({
  permisionarioId: z.string().min(1),
  type: z.string().min(2),
  description: z.string().min(3),
});

gestionRouter.post(
  "/incidencias",
  h((req, res) => {
    const data = parseBody(incidenciaSchema, req);
    const inc = {
      id: newId("inc"),
      permisionarioId: data.permisionarioId,
      type: data.type,
      description: data.description,
      status: "open" as const,
      createdAt: new Date().toISOString(),
    };
    db.incidencias.unshift(inc);
    audit("crear_incidencia", "incidencia", inc.id, { type: inc.type });
    res.status(201).json(inc);
  }),
);

gestionRouter.patch(
  "/incidencias/:id",
  h((req, res) => {
    const inc = db.incidencias.find((x) => x.id === req.params.id);
    if (!inc) throw new HttpError(404, "Incidencia no encontrada.");
    const status = z.enum(["open", "in_progress", "closed"]).parse(req.body?.status);
    inc.status = status;
    audit("editar_incidencia", "incidencia", inc.id, { status });
    res.json(inc);
  }),
);

// ── Valoraciones ciudadanas (FASE 5) ─────────────────────────────────────────
const valoracionSchema = z.object({
  permisionarioId: z.string().min(1),
  sesionId: z.string().nullable().optional(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().nullable().optional(),
});

gestionRouter.post(
  "/valoraciones",
  h((req, res) => {
    const data = parseBody(valoracionSchema, req);
    const perm = db.permisionarios.find((p) => p.id === data.permisionarioId);
    if (!perm) throw new HttpError(404, "Permisionario inexistente.");
    const val = {
      id: newId("val"),
      permisionarioId: data.permisionarioId,
      sesionId: data.sesionId ?? null,
      rating: data.rating,
      comment: data.comment ?? null,
      createdAt: new Date().toISOString(),
    };
    db.valoraciones.push(val);
    // Recalcula promedio
    const vs = db.valoraciones.filter((v) => v.permisionarioId === perm.id);
    perm.rating = Math.round((vs.reduce((a, v) => a + v.rating, 0) / vs.length) * 10) / 10;
    res.status(201).json({ valoracion: val, nuevoPromedio: perm.rating });
  }),
);
