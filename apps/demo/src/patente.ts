// Validación de patente argentina: formato viejo (ABC123) o Mercosur (AB123CD).
const RE = /^([A-Z]{3}\d{3}|[A-Z]{2}\d{3}[A-Z]{2})$/;

export function esPatenteValida(plate: string): boolean {
  return RE.test(plate.trim().toUpperCase().replace(/\s+/g, ""));
}
