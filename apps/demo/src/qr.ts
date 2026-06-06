// El QR del permisionario codifica la URL pública de EstacionAR: /pagar/:qrId.
// Así cualquier lector de QR del celular abre directo el flujo de pago de ese permisionario
// (PRODUCTO.md §6: el QR abre una orden de EstacionAR, NO una billetera directa).

/** URL que se codifica en el QR de la credencial del permisionario. */
export function urlPagoQR(perm: { id: string }): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://estacionar.vercel.app";
  return `${origin}/pagar/${perm.id}`;
}

/** Extrae el permisionarioId de lo leído por la cámara: acepta URL /pagar/<id> o el formato viejo. */
export function permisionarioIdDesdeQR(texto: string): string | null {
  const t = texto.trim();
  const m = t.match(/\/pagar\/([A-Za-z0-9_-]+)/);
  if (m) return m[1]!;
  const partes = t.split(":");
  if (partes[0] === "ESTACIONAR" && partes[1]) return partes[1];
  return null;
}
