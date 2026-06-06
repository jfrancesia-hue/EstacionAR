// Modelo económico 80/10/10 (PRODUCTO.md §12). Parametrizable.
// El Municipio resigna su 20% histórico: se reparte en descuento al ciudadano + plataforma (Nativos).
// El permisionario cobra su 80% con ACREDITACIÓN DIRECTA E INMEDIATA. El Municipio no maneja fondos.
export interface SplitConfig {
  /** % del precio base que cobra el permisionario (acreditación directa). */
  permisionarioPct: number;
  /** % del precio base que sostiene la plataforma (Nativos). */
  plataformaPct: number;
  /** % de descuento al ciudadano por pagar con la app. */
  descuentoCiudadanoPct: number;
}

// Config vigente de la demo. permisionario 80 + plataforma 10 + descuento 10 = 20% que resigna la Muni.
// (Si no hubiera plataforma, sería descuento 20 / plataforma 0.)
export const SPLIT: SplitConfig = {
  permisionarioPct: 80,
  plataformaPct: 10,
  descuentoCiudadanoPct: 10,
};

export interface Desglose {
  base: number; // precio talonario (referencia)
  ciudadanoPaga: number; // base - descuento
  permisionario: number; // acreditado directo al permisionario
  plataforma: number; // comisión Nativos
  descuento: number; // beneficio que se ahorra el ciudadano
  municipio: number; // siempre 0: el Municipio no maneja fondos
}

/** Desglose a partir del precio base (talonario). */
export function desglosarBase(base: number, cfg: SplitConfig = SPLIT): Desglose {
  const descuento = (base * cfg.descuentoCiudadanoPct) / 100;
  const permisionario = (base * cfg.permisionarioPct) / 100;
  const plataforma = (base * cfg.plataformaPct) / 100;
  return {
    base: Math.round(base),
    ciudadanoPaga: Math.round(base - descuento),
    permisionario: Math.round(permisionario),
    plataforma: Math.round(plataforma),
    descuento: Math.round(descuento),
    municipio: 0,
  };
}

/** Desglose a partir de lo que pagó el ciudadano (monto ya con descuento aplicado). */
export function desglosarPagado(pagado: number, cfg: SplitConfig = SPLIT): Desglose {
  const factor = 1 - cfg.descuentoCiudadanoPct / 100;
  const base = factor > 0 ? pagado / factor : pagado;
  return desglosarBase(base, cfg);
}

/** Monto acreditado al permisionario (80%) a partir de lo pagado por el ciudadano. */
export function acreditadoPermisionario(pagado: number, cfg: SplitConfig = SPLIT): number {
  return desglosarPagado(pagado, cfg).permisionario;
}

/** Comisión de plataforma (10%) a partir de lo pagado por el ciudadano. */
export function comisionPlataforma(pagado: number, cfg: SplitConfig = SPLIT): number {
  return desglosarPagado(pagado, cfg).plataforma;
}
