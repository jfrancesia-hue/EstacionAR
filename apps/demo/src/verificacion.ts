// Código de verificación del comprobante: derivado del id del pago, estable y verificable.
export function codigoVerif(pagoId: string): string {
  let h = 0;
  for (const c of pagoId) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return "EST-" + h.toString(36).toUpperCase().padStart(6, "0").slice(0, 6);
}
