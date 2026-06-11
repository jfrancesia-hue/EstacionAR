// Generación de comprobante imprimible (el navegador permite "Guardar como PDF") y compartir.
// Sin dependencias: se abre una ventana con el comprobante estilizado y se dispara print().
import { formatARS, formatFechaHora, formatHora, formatMinutos, etiquetaMedio } from "@estacionar/ui";
import type { ResultadoPago } from "@estacionar/ui";
import { codigoVerif } from "../../verificacion.js";

export { codigoVerif };

export function textoComprobante(r: ResultadoPago): string {
  return [
    "Comprobante EstacionAR — Municipalidad de Salta",
    `Patente: ${r.pago.plate}`,
    `Vigencia: ${formatHora(r.sesion.startValid)} a ${formatHora(r.sesion.endValid)}`,
    `Tiempo: ${formatMinutos(r.sesion.paidMinutes)}`,
    `Medio: ${etiquetaMedio(r.pago.method)}`,
    `Total: ${formatARS(r.pago.amount)}`,
    `Comprobante: ${r.pago.id}`,
  ].join("\n");
}

export async function compartirComprobante(r: ResultadoPago): Promise<void> {
  const text = textoComprobante(r);
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title: "Comprobante EstacionAR", text });
      return;
    } catch {
      /* el usuario canceló: seguimos al fallback */
    }
  }
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    await navigator.clipboard.writeText(text);
    alert("Comprobante copiado al portapapeles.");
  }
}

export function imprimirComprobante(r: ResultadoPago): void {
  const w = window.open("", "_blank", "width=420,height=680");
  if (!w) {
    alert("Permití las ventanas emergentes para descargar el comprobante.");
    return;
  }
  const html = `<!doctype html><html lang="es-AR"><head><meta charset="utf-8" />
  <title>Comprobante ${r.pago.plate} · EstacionAR</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; margin: 0; padding: 24px; color: #0A1A2F; }
    .card { max-width: 360px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 18px; overflow: hidden; }
    .head { background: #0A1A2F; color: #fff; padding: 18px 20px; }
    .head h1 { margin: 0; font-size: 18px; } .head p { margin: 4px 0 0; font-size: 12px; color: #9fb3c8; }
    .ok { background: #ecfdf5; color: #047857; text-align: center; padding: 12px; font-weight: 800; }
    .rows { padding: 16px 20px; }
    .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #e2e8f0; font-size: 14px; }
    .row:last-child { border-bottom: 0; }
    .row b { text-align: right; }
    .total { font-size: 22px; color: #0067B1; }
    .plate { background: #0067B1; color: #fff; padding: 2px 8px; border-radius: 6px; letter-spacing: 2px; }
    .foot { padding: 14px 20px; font-size: 11px; color: #64748b; text-align: center; }
    @media print { body { padding: 0; } .card { border: 0; } }
  </style></head>
  <body onload="window.print()">
    <div class="card">
      <div class="head"><h1>EstacionAR</h1><p>Municipalidad de Salta · Comprobante de estacionamiento</p></div>
      <div class="ok">${r.extended ? "TIEMPO EXTENDIDO" : "PAGO APROBADO"}</div>
      <div class="rows">
        <div class="row"><span>Patente</span><b class="plate">${r.pago.plate}</b></div>
        <div class="row"><span>Vigencia</span><b>${formatHora(r.sesion.startValid)} → ${formatHora(r.sesion.endValid)}</b></div>
        <div class="row"><span>Tiempo</span><b>${formatMinutos(r.sesion.paidMinutes)}</b></div>
        <div class="row"><span>Medio de pago</span><b>${etiquetaMedio(r.pago.method)}</b></div>
        <div class="row"><span>Fecha</span><b>${formatFechaHora(r.pago.createdAt)}</b></div>
        <div class="row"><span>Total</span><b class="total">${formatARS(r.pago.amount)}</b></div>
        <div class="row"><span>N.º</span><b>${r.pago.id}</b></div>
        <div class="row"><span>Código de verificación</span><b>${codigoVerif(r.pago.id)}</b></div>
      </div>
      <div class="foot">Pago acreditado al permisionario. Fiscalización municipal online — datos de muestra.</div>
    </div>
  </body></html>`;
  w.document.write(html);
  w.document.close();
  w.focus();
}
