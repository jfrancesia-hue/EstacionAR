import { useState } from "react";
import { Badge, Boton, Campo, Kpi, Tarjeta, formatARS, formatFechaHora, formatHora, formatMinutos, etiquetaMedio } from "@estacionar/ui";
import type { ConsultaSesion, Pago } from "@estacionar/core";
import { clientLocal as client } from "../../store.js";

export function SeccionMiTiempo() {
  const [plate, setPlate] = useState("AB123CD");
  const [saldo, setSaldo] = useState<ConsultaSesion | null>(null);
  const [historial, setHistorial] = useState<Pago[]>([]);
  const [consultado, setConsultado] = useState(false);
  const [cargando, setCargando] = useState(false);

  async function consultar() {
    setCargando(true);
    const [s, h] = await Promise.all([client.consultarSesion(plate), client.getPagosPorPatente(plate)]);
    setSaldo(s);
    setHistorial(h);
    setConsultado(true);
    setCargando(false);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Badge tono="cyan">Mi tiempo · billetera por patente</Badge>
      <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">Consultá el saldo de tu patente.</h1>
      <p className="mt-3 text-texto-tenue">
        El tiempo se vincula a la <b className="text-texto">patente</b>, no a la cuadra. Si te movés de sector dentro de la
        ventana vigente, no pagás de nuevo.
      </p>

      <form
        onSubmit={(e) => { e.preventDefault(); consultar(); }}
        className="mt-6 flex flex-wrap items-end gap-3"
      >
        <div className="flex-1 min-w-[220px]">
          <Campo label="Patente" value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase())} placeholder="AB123CD" />
        </div>
        <Boton type="submit" grande cargando={cargando} disabled={!plate}>Consultar</Boton>
      </form>

      {consultado && (
        <div className="mt-8 space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Kpi
              label="Estado"
              valor={saldo?.vigente ? "Vigente" : "Sin saldo"}
              acento={saldo?.vigente ? "cyan" : "texto"}
            />
            <Kpi label="Tiempo restante" valor={formatMinutos(saldo?.remainingMinutes ?? 0)} acento="ambar" />
            <Kpi label="Vence" valor={saldo?.sesion ? formatHora(saldo.sesion.endValid) : "—"} acento="texto" />
          </div>

          {saldo?.vigente && (
            <div className="rounded-2xl border border-cyan/20 bg-cyan/10 p-4 text-sm text-cyan-300">
              La patente <b>{plate}</b> tiene saldo activo hasta las {saldo.sesion ? formatHora(saldo.sesion.endValid) : "—"}.
              Podés reubicarte en otra mano habilitada sin volver a pagar.
            </div>
          )}

          <Tarjeta titulo={`Historial de la patente (${historial.length})`}>
            {historial.length === 0 ? (
              <p className="py-6 text-center text-sm text-texto-tenue">Sin pagos registrados para esta patente. Probá pagar desde la pestaña “Pagar”.</p>
            ) : (
              <ol className="divide-y divide-white/5">
                {historial.slice(0, 12).map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <span className="flex items-center gap-3">
                      <Badge tono={p.method === "cash" ? "alerta" : "cyan"}>{etiquetaMedio(p.method)}</Badge>
                      <span className="text-texto-tenue">{formatFechaHora(p.createdAt)}</span>
                    </span>
                    <b>{formatARS(p.amount)}</b>
                  </li>
                ))}
              </ol>
            )}
          </Tarjeta>
        </div>
      )}
    </div>
  );
}
