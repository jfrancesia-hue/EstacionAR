import { describe, expect, it } from "vitest";
import { calcularTarifa, seleccionarTarifaVigente } from "./calcularTarifa.js";
import type { Tarifa } from "../domain/types.js";

const tarifaAuto: Tarifa = {
  id: "tar-auto",
  vehicleType: "auto",
  minUnitMinutes: 15,
  firstBlockMinutes: 60,
  firstUnitAmount: 700,
  nextUnitAmount: 175, // un cuarto de la hora
  digitalDiscountPct: 20,
  validFrom: "2026-01-01T00:00:00.000Z",
  validTo: null,
  active: true,
};

const tarifaMoto: Tarifa = {
  ...tarifaAuto,
  id: "tar-moto",
  vehicleType: "moto",
  firstUnitAmount: 300,
  nextUnitAmount: 75,
};

const fecha = "2026-06-05T13:00:00.000Z";

describe("calcularTarifa", () => {
  it("cobra 1 hora de auto al precio del primer bloque", () => {
    const r = calcularTarifa({
      vehicleType: "auto",
      minutes: 60,
      isDigital: false,
      date: fecha,
      tarifa: tarifaAuto,
    });
    expect(r.grossAmount).toBe(700);
    expect(r.amount).toBe(700);
    expect(r.extraFractions).toBe(0);
  });

  it("cobra el minimo (primer bloque) aunque se estacione 15 min", () => {
    const r = calcularTarifa({
      vehicleType: "auto",
      minutes: 15,
      isDigital: false,
      date: fecha,
      tarifa: tarifaAuto,
    });
    expect(r.amount).toBe(700);
    expect(r.extraFractions).toBe(0);
  });

  it("fracciona cada 15 min a partir del segundo bloque", () => {
    // 90 min = 60 (primer bloque) + 30 extra => 2 fracciones de 15
    const r = calcularTarifa({
      vehicleType: "auto",
      minutes: 90,
      isDigital: false,
      date: fecha,
      tarifa: tarifaAuto,
    });
    expect(r.extraFractions).toBe(2);
    expect(r.grossAmount).toBe(700 + 2 * 175); // 1050
  });

  it("redondea hacia arriba la fraccion parcial", () => {
    // 70 min = 60 + 10 extra => ceil(10/15) = 1 fraccion
    const r = calcularTarifa({
      vehicleType: "auto",
      minutes: 70,
      isDigital: false,
      date: fecha,
      tarifa: tarifaAuto,
    });
    expect(r.extraFractions).toBe(1);
    expect(r.grossAmount).toBe(875);
  });

  it("cobra moto con su tarifa propia", () => {
    const r = calcularTarifa({
      vehicleType: "moto",
      minutes: 60,
      isDigital: false,
      date: fecha,
      tarifa: tarifaMoto,
    });
    expect(r.amount).toBe(300);
  });

  it("aplica descuento del 20% por pago digital", () => {
    const r = calcularTarifa({
      vehicleType: "auto",
      minutes: 60,
      isDigital: true,
      date: fecha,
      tarifa: tarifaAuto,
    });
    expect(r.grossAmount).toBe(700);
    expect(r.amount).toBe(560);
    expect(r.discount).toBe(140);
  });

  it("no cobra en feriado configurado", () => {
    const r = calcularTarifa({
      vehicleType: "auto",
      minutes: 120,
      isDigital: true,
      date: "2026-06-20T13:00:00.000Z",
      tarifa: tarifaAuto,
      feriados: ["2026-06-20"],
    });
    expect(r.feriado).toBe(true);
    expect(r.amount).toBe(0);
  });

  it("rechaza minutos no positivos", () => {
    expect(() =>
      calcularTarifa({
        vehicleType: "auto",
        minutes: 0,
        isDigital: false,
        date: fecha,
        tarifa: tarifaAuto,
      }),
    ).toThrow();
  });

  it("rechaza tarifa de vehiculo distinto", () => {
    expect(() =>
      calcularTarifa({
        vehicleType: "moto",
        minutes: 60,
        isDigital: false,
        date: fecha,
        tarifa: tarifaAuto,
      }),
    ).toThrow();
  });
});

describe("seleccionarTarifaVigente", () => {
  it("elige la tarifa activa mas reciente vigente a la fecha", () => {
    const vieja: Tarifa = { ...tarifaAuto, id: "vieja", firstUnitAmount: 500 };
    const nueva: Tarifa = {
      ...tarifaAuto,
      id: "nueva",
      firstUnitAmount: 700,
      validFrom: "2026-06-01T00:00:00.000Z",
    };
    const elegida = seleccionarTarifaVigente([vieja, nueva], "auto", fecha);
    expect(elegida?.id).toBe("nueva");
  });

  it("ignora tarifas futuras o inactivas", () => {
    const futura: Tarifa = {
      ...tarifaAuto,
      id: "futura",
      validFrom: "2027-01-01T00:00:00.000Z",
    };
    const inactiva: Tarifa = { ...tarifaAuto, id: "inactiva", active: false };
    const elegida = seleccionarTarifaVigente([futura, inactiva, tarifaAuto], "auto", fecha);
    expect(elegida?.id).toBe("tar-auto");
  });
});
