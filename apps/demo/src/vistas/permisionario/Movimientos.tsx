import { Badge, Tarjeta, formatARS, formatFechaHora, etiquetaMedio } from "@estacionar/ui";
import type { DatosPermisionario } from "./tipos.js";

export function SeccionMovimientos({ datos }: { datos: DatosPermisionario }) {
  const movs = datos.movimientos;
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Movimientos</h1>
        <p className="mt-2 text-texto-tenue">Historial de pagos acreditados con tu credencial ({movs.length}).</p>
      </div>
      <Tarjeta>
        {movs.length === 0 ? (
          <p className="py-8 text-center text-sm text-texto-tenue">Sin movimientos todavía. Registrá un efectivo y aparecerá acá.</p>
        ) : (
          <ol className="divide-y divide-white/5">
            {movs.slice(0, 30).map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <span className="flex min-w-0 items-center gap-3">
                  <span className="font-mono font-semibold">{p.plate}</span>
                  <Badge tono={p.method === "cash" ? "alerta" : "cyan"}>{etiquetaMedio(p.method)}</Badge>
                  {p.method === "cash" ? <Badge tono="alerta">En mano</Badge> : <Badge tono="ok">Acreditado</Badge>}
                </span>
                <span className="flex items-center gap-4">
                  <time className="text-xs text-texto-tenue">{formatFechaHora(p.createdAt)}</time>
                  <b className="w-20 text-right">{formatARS(p.amount)}</b>
                </span>
              </li>
            ))}
          </ol>
        )}
      </Tarjeta>
    </div>
  );
}
