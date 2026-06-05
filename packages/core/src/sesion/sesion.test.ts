import { describe, expect, it } from "vitest";
import {
  buscarSesionActiva,
  consultarSesion,
  crearOExtenderSesion,
  expirarSesiones,
  normalizarPatente,
} from "./sesion.js";
import type { Sesion } from "../domain/types.js";

let counter = 0;
const newId = () => `ses-${++counter}`;

function baseInput(over: Partial<Parameters<typeof crearOExtenderSesion>[1]> = {}) {
  return {
    plate: "AB123CD",
    minutes: 60,
    vehicleType: "auto" as const,
    tarifaId: "tar-auto",
    amount: 560,
    sectorId: "sec-1",
    now: "2026-06-05T13:00:00.000Z",
    newId,
    ...over,
  };
}

describe("normalizarPatente", () => {
  it("normaliza mayusculas y espacios", () => {
    expect(normalizarPatente(" ab 123 cd ")).toBe("AB123CD");
  });
});

describe("crearOExtenderSesion", () => {
  it("crea una sesion nueva si la patente no tiene sesion activa", () => {
    const { sesion, extended } = crearOExtenderSesion([], baseInput());
    expect(extended).toBe(false);
    expect(sesion.plate).toBe("AB123CD");
    expect(sesion.startValid).toBe("2026-06-05T13:00:00.000Z");
    expect(sesion.endValid).toBe("2026-06-05T14:00:00.000Z");
    expect(sesion.paidMinutes).toBe(60);
  });

  it("extiende la sesion activa en vez de crear otra (billetera de tiempo)", () => {
    const { sesion } = crearOExtenderSesion([], baseInput());
    const lista: Sesion[] = [sesion];
    // 30 min mas tarde, paga otros 60
    const r = crearOExtenderSesion(
      lista,
      baseInput({ now: "2026-06-05T13:30:00.000Z", minutes: 60, amount: 560 }),
    );
    expect(r.extended).toBe(true);
    expect(r.sesion.id).toBe(sesion.id);
    expect(r.sesion.paidMinutes).toBe(120);
    expect(r.sesion.amount).toBe(1120);
    // Extiende desde el fin de la ventana previa (14:00 + 60 = 15:00)
    expect(r.sesion.endValid).toBe("2026-06-05T15:00:00.000Z");
  });

  it("reubicarse en otro sector dentro de la ventana NO recobra (extiende, no crea)", () => {
    const { sesion } = crearOExtenderSesion([], baseInput());
    const lista: Sesion[] = [sesion];
    // mismo auto, otro sector, dentro de la ventana, sin pagar de nuevo: se consulta saldo
    const consulta = consultarSesion(lista, "ab123cd", "2026-06-05T13:40:00.000Z");
    expect(consulta.vigente).toBe(true);
    expect(consulta.remainingMinutes).toBe(20);
    expect(consulta.sesion?.id).toBe(sesion.id);
  });

  it("crea una sesion nueva si la anterior vencio mas alla de la tolerancia", () => {
    const { sesion } = crearOExtenderSesion([], baseInput());
    const lista: Sesion[] = [sesion];
    // 2 horas despues (muy vencida): nueva sesion
    const r = crearOExtenderSesion(lista, baseInput({ now: "2026-06-05T16:00:00.000Z" }));
    expect(r.extended).toBe(false);
    expect(r.sesion.id).not.toBe(sesion.id);
  });

  it("dentro de la tolerancia de 5 min extiende desde now", () => {
    const { sesion } = crearOExtenderSesion([], baseInput());
    const lista: Sesion[] = [sesion];
    // vencio 14:00, ahora 14:03 (dentro de tolerancia) -> extiende desde now
    const r = crearOExtenderSesion(lista, baseInput({ now: "2026-06-05T14:03:00.000Z" }));
    expect(r.extended).toBe(true);
    expect(r.sesion.endValid).toBe("2026-06-05T15:03:00.000Z");
  });
});

describe("buscarSesionActiva / expirarSesiones", () => {
  it("no encuentra sesion vencida fuera de tolerancia", () => {
    const { sesion } = crearOExtenderSesion([], baseInput());
    const activa = buscarSesionActiva([sesion], "AB123CD", "2026-06-05T15:00:00.000Z");
    expect(activa).toBeUndefined();
  });

  it("marca como expiradas las sesiones vencidas", () => {
    const { sesion } = crearOExtenderSesion([], baseInput());
    const out = expirarSesiones([sesion], "2026-06-05T16:00:00.000Z");
    expect(out[0]?.status).toBe("expired");
  });
});
