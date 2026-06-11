import { useState } from "react";
import { Badge, Boton, Campo, Tarjeta, formatARS, formatFechaHora, formatHora, formatMinutos, etiquetaMedio } from "@estacionar/ui";
import { clientLocal as client } from "../store.js";

type Resultado = Awaited<ReturnType<typeof client.verificarComprobante>>;

export function VistaVerificar() {
  const [codigo, setCodigo] = useState("");
  const [res, setRes] = useState<Resultado | null>(null);
  const [buscando, setBuscando] = useState(false);

  async function verificar() {
    if (!codigo.trim()) return;
    setBuscando(true);
    setRes(await client.verificarComprobante(codigo));
    setBuscando(false);
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      <Badge tono="cyan">Verificación pública</Badge>
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">Verificá un comprobante</h1>
      <p className="mt-2 text-texto-tenue">Ingresá el código del comprobante (<b className="text-texto">EST-XXXXXX</b>) para confirmar que el pago es real.</p>

      <form onSubmit={(e) => { e.preventDefault(); verificar(); }} className="mt-6 flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1">
          <Campo label="Código del comprobante" value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} placeholder="EST-XXXXXX" />
        </div>
        <Boton type="submit" grande cargando={buscando} disabled={!codigo.trim()}>Verificar</Boton>
      </form>

      {res && (
        res.valido && res.pago ? (
          <Tarjeta className="mt-6 border-emerald-500/30 bg-emerald-500/10" titulo="Comprobante válido" accion={<Badge tono="ok">✓ Verificado</Badge>}>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-4"><span className="text-texto-tenue">Patente</span><b className="font-mono">{res.pago.plate}</b></div>
              {res.sesion && <div className="flex items-center justify-between gap-4"><span className="text-texto-tenue">Vigencia</span><b>{formatHora(res.sesion.startValid)} → {formatHora(res.sesion.endValid)} ({formatMinutos(res.sesion.paidMinutes)})</b></div>}
              <div className="flex items-center justify-between gap-4"><span className="text-texto-tenue">Medio</span><b>{etiquetaMedio(res.pago.method)}</b></div>
              <div className="flex items-center justify-between gap-4"><span className="text-texto-tenue">Monto</span><b className="text-cyan">{formatARS(res.pago.amount)}</b></div>
              {res.permisionario && <div className="flex items-center justify-between gap-4"><span className="text-texto-tenue">Permisionario</span><b>{res.permisionario.fullName.replace(" (DEMO)", "")}</b></div>}
              <div className="flex items-center justify-between gap-4"><span className="text-texto-tenue">Fecha</span><b>{formatFechaHora(res.pago.createdAt)}</b></div>
            </div>
          </Tarjeta>
        ) : (
          <Tarjeta className="mt-6 border-red-500/30 bg-red-500/10" titulo="No encontrado" accion={<Badge tono="error">✕</Badge>}>
            <p className="text-sm text-texto-tenue">No encontramos un comprobante con ese código. Revisá que esté completo (formato EST-XXXXXX).</p>
          </Tarjeta>
        )
      )}

      <p className="mt-6 text-xs text-texto-tenue">El código figura en el comprobante que recibe el ciudadano al pagar. En producción, cada comprobante incluye también un QR de verificación.</p>
    </main>
  );
}
