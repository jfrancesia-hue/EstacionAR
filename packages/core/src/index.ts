// API publica de @estacionar/core — reglas de dominio puras, tipos y datos demo.
// Compartido por la API (NestJS/Express) y los 3 frontends.

// Dominio
export * from "./domain/enums.js";
export * from "./domain/types.js";

// Utilidades
export * from "./util/money.js";
export * from "./util/time.js";

// Motor de tarifas
export * from "./tarifa/calcularTarifa.js";

// Billetera de tiempo / sesiones
export * from "./sesion/sesion.js";

// QR firmado / nonce / antifraude
export * from "./qr/qr.js";

// Conciliacion / rendicion
export * from "./rendicion/conciliacion.js";

// Liquidacion con split
export * from "./liquidacion/liquidacion.js";

// Datos demo
export * from "./seed/demo.js";
