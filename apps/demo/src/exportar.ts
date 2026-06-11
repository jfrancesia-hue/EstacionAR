// Exportación de datos generada en el cliente (CSV real + impresión a PDF), sin dependencias.
export function descargarCSV(nombre: string, filas: Array<Record<string, string | number>>): void {
  if (!filas.length) return;
  const cols = Object.keys(filas[0]!);
  const esc = (v: string | number) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [cols.join(","), ...filas.map((f) => cols.map((c) => esc(f[c] ?? "")).join(","))].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${nombre}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
