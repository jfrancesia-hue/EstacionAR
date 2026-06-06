import { useState } from "react";
import { Badge, Boton, Selector, Tarjeta, formatHora, formatMinutos } from "@estacionar/ui";
import { clientLocal as client } from "../../store.js";
import type { DatosPermisionario, VencidaItem } from "./tipos.js";

const FRACCIONES = [15, 30, 60, 90, 120];

function ItemVencida({ item, permId, onCambio }: { item: VencidaItem; permId: string; onCambio: () => void }) {
  const [minutes, setMinutes] = useState(30);
  const [proc, setProc] = useState<string | null>(null);

  async function cobrar(metodo: "digital" | "cash") {
    setProc(metodo);
    await client.cobrarExcedente({ sesionId: item.sesion.id, minutes, metodo, permisionarioId: permId });
    setProc(null);
    onCambio();
  }
  async function noPago() {
    setProc("nopago");
    await client.marcarExcedenteNoPagado({ sesionId: item.sesion.id, permisionarioId: permId });
    setProc(null);
    onCambio();
  }

  return (
    <Tarjeta className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-lg font-bold">{item.sesion.plate}</p>
          <p className="text-xs text-texto-tenue">
            Venció {formatHora(item.sesion.endValid)} · excedido {formatMinutos(item.minutosExcedidos)}{item.sectorName ? ` · ${item.sectorName}` : ""}
          </p>
        </div>
        <Badge tono="error">Vencida</Badge>
      </div>
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <div className="w-32">
          <Selector label="Excedente" value={minutes} onChange={(e) => setMinutes(Number(e.target.value))}>
            {FRACCIONES.map((m) => <option key={m} value={m}>{formatMinutos(m)}</option>)}
          </Selector>
        </div>
        <Boton onClick={() => cobrar("digital")} cargando={proc === "digital"}>Cobrar digital</Boton>
        <Boton variante="ambar" onClick={() => cobrar("cash")} cargando={proc === "cash"}>Cobrar efectivo</Boton>
        <Boton variante="fantasma" onClick={noPago} cargando={proc === "nopago"}>No pagó</Boton>
      </div>
    </Tarjeta>
  );
}

export function SeccionVencidas({ datos, onCambio }: { datos: DatosPermisionario; onCambio: () => void }) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Patentes vencidas en tu zona</h1>
        <p className="mt-2 text-texto-tenue">Cobrá el excedente (extiende la sesión, sin pisar el comprobante original) o marcá que el vehículo se retiró sin pagar.</p>
      </div>
      {datos.vencidas.length === 0 ? (
        <Tarjeta><p className="py-6 text-center text-sm text-texto-tenue">No hay patentes vencidas en tu zona ahora mismo.</p></Tarjeta>
      ) : (
        <div className="space-y-3">
          {datos.vencidas.map((item) => (
            <ItemVencida key={item.sesion.id} item={item} permId={datos.perm.id} onCambio={onCambio} />
          ))}
        </div>
      )}
      <div className="rounded-2xl border border-ambar/20 bg-ambar/10 p-4 text-sm text-ambar-400">
        Si marcás “No pagó”, queda una <b>alerta temporal por la patente</b> (vence sola en 48 h). Si ese vehículo vuelve a estacionar, el sistema sugiere regularizar — sin bloquearlo.
      </div>
    </div>
  );
}
