// Utilidades de tiempo. Todas las funciones reciben "now" explicito para ser deterministas y testeables.

export function addMinutes(iso: string, minutes: number): string {
  return new Date(new Date(iso).getTime() + minutes * 60_000).toISOString();
}

export function minutesBetween(fromIso: string, toIso: string): number {
  return (new Date(toIso).getTime() - new Date(fromIso).getTime()) / 60_000;
}

/** Devuelve la fecha en formato YYYY-MM-DD (zona local America/Argentina/Salta = UTC-3). */
export function toDateKey(iso: string): string {
  const d = new Date(new Date(iso).getTime() - 3 * 60 * 60_000);
  return d.toISOString().slice(0, 10);
}

export function isFeriado(iso: string, feriados: string[]): boolean {
  return feriados.includes(toDateKey(iso));
}
