import { describe, expect, it } from "vitest";
import { buildRendicion } from "./conciliacion.js";
import { calcularLiquidacion, calcularSplit } from "../liquidacion/liquidacion.js";
import type { Pago } from "../domain/types.js";

let c = 0;
const newId = () => `id-${++c}`;
const now = "2026-06-05T23:30:00.000Z";

function pago(over: Partial<Pago>): Pago {
  return {
    id: newId(),
    sesionId: "s1",
    method: "mercadopago",
    amount: 560,
    status: "approved",
    externalRef: null,
    receiptUrl: null,
    registeredBy: null,
    permisionarioId: "perm-1",
    plate: "AB123CD",
    sectorId: "sec-1",
    idempotencyKey: null,
    // 2026-06-05 hora local Catamarca (UTC-3): 10:00
    createdAt: "2026-06-05T13:00:00.000Z",
    ...over,
  };
}

describe("buildRendicion", () => {
  it("separa digital y efectivo y cuenta operaciones", () => {
    const pagos = [
      pago({ method: "mercadopago", amount: 560 }),
      pago({ method: "qr", amount: 700 }),
      pago({ method: "cash", amount: 700 }),
    ];
    const r = buildRendicion({ permisionarioId: "perm-1", date: "2026-06-05", pagos, newId, now });
    expect(r.totalDigital).toBe(1260);
    expect(r.totalCash).toBe(700);
    expect(r.totalAmount).toBe(1960);
    expect(r.operationsCount).toBe(3);
    expect(r.status).toBe("pendiente");
  });

  it("concilia cuando el efectivo declarado coincide", () => {
    const pagos = [pago({ method: "cash", amount: 700 })];
    const r = buildRendicion({
      permisionarioId: "perm-1",
      date: "2026-06-05",
      pagos,
      declaredCash: 700,
      newId,
      now,
    });
    expect(r.status).toBe("conciliada");
    expect(r.difference).toBe(0);
  });

  it("marca diferencia cuando el efectivo declarado no coincide", () => {
    const pagos = [pago({ method: "cash", amount: 700 })];
    const r = buildRendicion({
      permisionarioId: "perm-1",
      date: "2026-06-05",
      pagos,
      declaredCash: 500,
      newId,
      now,
    });
    expect(r.status).toBe("con_diferencia");
    expect(r.difference).toBe(-200);
  });

  it("ignora pagos de otro dia o no aprobados", () => {
    const pagos = [
      pago({ method: "cash", amount: 700, createdAt: "2026-06-04T13:00:00.000Z" }),
      pago({ method: "mercadopago", amount: 999, status: "rejected" }),
      pago({ method: "qr", amount: 560 }),
    ];
    const r = buildRendicion({ permisionarioId: "perm-1", date: "2026-06-05", pagos, newId, now });
    expect(r.operationsCount).toBe(1);
    expect(r.totalAmount).toBe(560);
  });
});

describe("liquidacion / split", () => {
  it("calcula la comision municipal y el neto", () => {
    const r = calcularSplit(10000, 8);
    expect(r.feeAmount).toBe(800);
    expect(r.netAmount).toBe(9200);
  });

  it("construye una liquidacion T+1 con la comision configurada", () => {
    const l = calcularLiquidacion({
      permisionarioId: "perm-1",
      period: "2026-06-06",
      grossAmount: 50000,
      feePct: 8,
      newId,
      now,
    });
    expect(l.feeAmount).toBe(4000);
    expect(l.netAmount).toBe(46000);
    expect(l.status).toBe("pending");
  });

  it("rechaza comision fuera de rango", () => {
    expect(() => calcularSplit(1000, 120)).toThrow();
  });
});
