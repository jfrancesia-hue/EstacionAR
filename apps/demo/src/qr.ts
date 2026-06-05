// Formato del QR del permisionario para la demo. El QR codifica a qué permisionario
// (y sector) pertenece la credencial; el conductor lo escanea para asociar el cobro.
const PREFIJO = "ESTACIONAR";

export function payloadQR(perm: { id: string; sectorId: string | null }): string {
  return `${PREFIJO}:${perm.id}:${perm.sectorId ?? ""}`;
}

export interface QRParsed {
  permisionarioId: string;
  sectorId: string | null;
}

export function parseQR(text: string): QRParsed | null {
  const parts = text.trim().split(":");
  if (parts[0] !== PREFIJO || !parts[1]) return null;
  return { permisionarioId: parts[1], sectorId: parts[2] || null };
}
