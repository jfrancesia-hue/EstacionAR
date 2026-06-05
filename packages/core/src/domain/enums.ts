// Enumeraciones del dominio. En ingles (codigo) por convencion (CLAUDE.md §5).

export const ROLES = ["conductor", "permisionario", "supervisor", "admin_municipal"] as const;
export type Role = (typeof ROLES)[number];

export const VEHICLE_TYPES = ["auto", "moto"] as const;
export type VehicleType = (typeof VEHICLE_TYPES)[number];

export const PERMISIONARIO_STATUS = ["active", "suspended", "expired"] as const;
export type PermisionarioStatus = (typeof PERMISIONARIO_STATUS)[number];

export const SHIFTS = ["diurno", "nocturno"] as const;
export type Shift = (typeof SHIFTS)[number];

export const NUMBERING = ["par", "impar", "ambos"] as const;
export type Numbering = (typeof NUMBERING)[number];

export const SESSION_STATUS = ["active", "expired", "cancelled"] as const;
export type SessionStatus = (typeof SESSION_STATUS)[number];

export const PAYMENT_METHODS = ["qr", "mercadopago", "modo", "naranja", "card", "cash"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUS = ["pending", "approved", "rejected"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUS)[number];

export const INCIDENCIA_STATUS = ["open", "in_progress", "closed"] as const;
export type IncidenciaStatus = (typeof INCIDENCIA_STATUS)[number];

export const RENDICION_STATUS = ["conciliada", "con_diferencia", "pendiente"] as const;
export type RendicionStatus = (typeof RENDICION_STATUS)[number];

export const LIQUIDACION_STATUS = ["pending", "transferred", "failed"] as const;
export type LiquidacionStatus = (typeof LIQUIDACION_STATUS)[number];

// Medios considerados "digitales" (aplican descuento por pago digital).
export const DIGITAL_METHODS: PaymentMethod[] = ["qr", "mercadopago", "modo", "naranja", "card"];
