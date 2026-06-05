// Conciliacion (rendiciones), liquidacion con split y auditoria (FASE 4).
import { Router } from "express";
import { z } from "zod";
import {
  buildRendicion,
  calcularLiquidacion,
  newId,
  toDateKey,
  type Pago,
} from "@estacionar/core";
import { audit, db } from "../store.js";
import { h, parseBody } from "../http.js";

export const fiscalRouter: Router = Router();

// ── Rendiciones (conciliacion diaria) ──────────────────────────────────────────
fiscalRouter.get(
  "/rendiciones",
  h((req, res) => {
    const date = req.query.date ? String(req.query.date) : null;
    let list = db.rendiciones;
    if (date) list = list.filter((r) => r.date === date);
    res.json([...list].sort((a, b) => b.date.localeCompare(a.date)));
  }),
);

const generarRendicionSchema = z.object({
  date: z.string().optional(),
});

// Genera la rendicion del dia para todos los permisionarios (job de cierre, ejecutado a demanda en demo).
fiscalRouter.post(
  "/rendiciones/generar",
  h((req, res) => {
    const data = parseBody(generarRendicionSchema, req);
    const date = data.date ?? toDateKey(new Date().toISOString());
    const now = new Date().toISOString();
    const generadas = [];
    for (const perm of db.permisionarios) {
      // Evita duplicar la rendicion del mismo dia
      const ya = db.rendiciones.find((r) => r.permisionarioId === perm.id && r.date === date);
      if (ya) continue;
      const r = buildRendicion({
        permisionarioId: perm.id,
        date,
        pagos: db.pagos.filter((p): p is Pago => p.status === "approved"),
        // En demo asumimos que el efectivo declarado coincide con el registrado (conciliada).
        declaredCash: undefined,
        newId: () => newId("rend"),
        now,
      });
      // Marcamos como conciliada (sin diferencias) en la demo.
      r.status = "conciliada";
      db.rendiciones.push(r);
      generadas.push(r);
    }
    audit("generar_rendiciones", "rendicion", null, { date, cantidad: generadas.length });
    res.status(201).json({ date, generadas });
  }),
);

// ── Liquidaciones (split + transferencia T+1) ──────────────────────────────────
fiscalRouter.get(
  "/liquidaciones",
  h((_req, res) => res.json([...db.liquidaciones].sort((a, b) => b.period.localeCompare(a.period)))),
);

const generarLiquidacionSchema = z.object({
  period: z.string().optional(),
});

fiscalRouter.post(
  "/liquidaciones/generar",
  h((req, res) => {
    const data = parseBody(generarLiquidacionSchema, req);
    // T+1: liquidamos lo recaudado "ayer" (o el periodo indicado).
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    const period = data.period ?? toDateKey(ayer.toISOString());
    const now = new Date().toISOString();
    const feePct = db.config.feePct;
    const generadas = [];

    for (const perm of db.permisionarios) {
      const ya = db.liquidaciones.find((l) => l.permisionarioId === perm.id && l.period === period);
      if (ya) continue;
      const gross = db.pagos
        .filter(
          (p) =>
            p.permisionarioId === perm.id &&
            p.status === "approved" &&
            toDateKey(p.createdAt) === period,
        )
        .reduce((a, p) => a + p.amount, 0);
      if (gross <= 0) continue;
      const liq = calcularLiquidacion({
        permisionarioId: perm.id,
        period,
        grossAmount: gross,
        feePct,
        newId: () => newId("liq"),
        now,
      });
      // Demo: marcamos la transferencia como realizada.
      liq.status = "transferred";
      liq.transferRef = `TR-${newId("tr")}`;
      db.liquidaciones.push(liq);
      audit("liquidacion", "liquidacion", liq.id, {
        permisionarioId: perm.id,
        period,
        gross,
        fee: liq.feeAmount,
        net: liq.netAmount,
      });
      generadas.push(liq);
    }
    res.status(201).json({ period, feePct, generadas });
  }),
);

// ── Auditoria (append-only, solo lectura) ──────────────────────────────────────
fiscalRouter.get(
  "/auditoria",
  h((req, res) => {
    const entity = req.query.entity ? String(req.query.entity) : null;
    const action = req.query.action ? String(req.query.action) : null;
    let list = db.auditoria;
    if (entity) list = list.filter((a) => a.entity === entity);
    if (action) list = list.filter((a) => a.action === action);
    res.json(list.slice(0, 500));
  }),
);
