// Modelo económico 80/10/10 (PRODUCTO.md §12). Parametrizable.
// El permisionario cobra su 80% con ACREDITACIÓN DIRECTA E INMEDIATA.
// El 10% de plataforma sostiene el sistema y el 10% municipal queda para la Municipalidad.
export interface SplitConfig {
  /** % del precio base que cobra el permisionario (acreditación directa). */
  permisionarioPct: number;
  /** % del precio base que sostiene la plataforma (Nativos). */
  plataformaPct: number;
  /** % del precio base que queda para la Municipalidad. */
  municipioPct: number;
  /** % de descuento al ciudadano. En esta demo queda 0 porque el 10% va al Municipio. */
  descuentoCiudadanoPct: number;
}

// Config vigente de la demo: permisionario 80 + plataforma 10 + municipio 10.
// Sin beneficio/descuento al ciudadano: ese 10% queda como ingreso municipal.
export const SPLIT: SplitConfig = {
  permisionarioPct: 80,
  plataformaPct: 10,
  municipioPct: 10,
  descuentoCiudadanoPct: 0,
};

export interface Desglose {
  base: number; // precio talonario (referencia)
  ciudadanoPaga: number; // base - descuento, si existiera
  permisionario: number; // acreditado directo al permisionario
  plataforma: number; // comisión Nativos
  descuento: number; // descuento ciudadano, actualmente 0
  municipio: number; // ingreso municipal estimado
}

/** Desglose a partir del precio base (talonario). */
export function desglosarBase(base: number, cfg: SplitConfig = SPLIT): Desglose {
  const descuento = (base * cfg.descuentoCiudadanoPct) / 100;
  const permisionario = (base * cfg.permisionarioPct) / 100;
  const plataforma = (base * cfg.plataformaPct) / 100;
  const municipio = (base * cfg.municipioPct) / 100;
  return {
    base: Math.round(base),
    ciudadanoPaga: Math.round(base - descuento),
    permisionario: Math.round(permisionario),
    plataforma: Math.round(plataforma),
    descuento: Math.round(descuento),
    municipio: Math.round(municipio),
  };
}

/** Desglose a partir de lo que pagó el ciudadano. */
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
