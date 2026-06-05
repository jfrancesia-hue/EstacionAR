// Utilidades de dinero. Trabajamos en pesos enteros (ARS) para evitar errores de coma flotante.

/** Redondea a peso entero (sin centavos). */
export function redondearPeso(monto: number): number {
  return Math.round(monto);
}

/** Formatea un monto en ARS para UI. */
export function formatARS(monto: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(monto);
}

/** Aplica un descuento porcentual y redondea. */
export function aplicarDescuento(monto: number, pct: number): number {
  return redondearPeso(monto * (1 - pct / 100));
}

/** Calcula la comision municipal (split) sobre un monto bruto y redondea a peso. */
export function comision(bruto: number, pct: number): number {
  if (pct <= 0) return 0;
  return redondearPeso((bruto * pct) / 100);
}
