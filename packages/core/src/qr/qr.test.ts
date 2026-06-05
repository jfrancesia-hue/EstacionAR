import { describe, expect, it } from "vitest";
import { generarNonce, newId, signQrToken, verifyQrToken } from "./qr.js";

const secret = "secreto-de-prueba-no-usar-en-prod";

describe("QR firmado", () => {
  it("firma y verifica un token valido", async () => {
    const payload = { permisionarioId: "perm-1", sectorId: "sec-1", shift: "diurno" as const, iat: 1 };
    const token = await signQrToken(payload, secret);
    const r = await verifyQrToken(token, secret);
    expect(r.valid).toBe(true);
    expect(r.payload?.permisionarioId).toBe("perm-1");
  });

  it("rechaza un token con firma invalida (clonado/manipulado)", async () => {
    const token = await signQrToken(
      { permisionarioId: "perm-1", sectorId: "sec-1", shift: "diurno", iat: 1 },
      secret,
    );
    const manipulado = token.slice(0, -3) + "xxx";
    const r = await verifyQrToken(manipulado, secret);
    expect(r.valid).toBe(false);
  });

  it("rechaza un token firmado con otro secreto", async () => {
    const token = await signQrToken(
      { permisionarioId: "perm-1", sectorId: "sec-1", shift: "diurno", iat: 1 },
      "otro-secreto",
    );
    const r = await verifyQrToken(token, secret);
    expect(r.valid).toBe(false);
  });
});

describe("nonce / id", () => {
  it("genera nonces unicos", () => {
    const a = generarNonce();
    const b = generarNonce();
    expect(a).not.toBe(b);
  });
  it("genera ids con prefijo", () => {
    expect(newId("perm")).toMatch(/^perm_/);
  });
});
