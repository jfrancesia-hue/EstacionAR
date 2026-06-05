// Helpers de formato para UI (es-AR).
export { formatARS } from "@estacionar/core";

export function formatFecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatFechaHora(iso: string): string {
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatHora(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

export function formatMinutos(min: number): string {
  if (min <= 0) return "0 min";
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

const ETIQUETAS_MEDIO: Record<string, string> = {
  qr: "QR",
  mercadopago: "Mercado Pago",
  modo: "MODO",
  naranja: "Naranja X",
  card: "Tarjeta",
  cash: "Efectivo",
};

export function etiquetaMedio(m: string): string {
  return ETIQUETAS_MEDIO[m] ?? m;
}
