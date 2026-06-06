import { useState } from "react";
import { Boton, Campo, Selector, Tarjeta, formatARS, formatHora, formatMinutos } from "@estacionar/ui";
import type { VehicleType } from "@estacionar/core";
import { clientLocal as client } from "../../store.js";
import type { DatosPermisionario } from "./tipos.js";

const OPCIONES_MINUTOS = [30, 60, 90, 120];

export function SeccionRegistrarEfectivo({ datos, onCambio }: { datos: DatosPermisionario; onCambio: () => void }) {
  const [plate, setPlate] = useState("AC456DE");
  const [vehicleType, setVehicleType] = useState<VehicleType>("auto");
  const [minutes, setMinutes] = useState(60);
  const [procesando, setProcesando] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  async function confirmar(ordenId: string) {
    setProcesando(ordenId);
    await client.confirmarEfectivo(ordenId);
    setProcesando(null);
    setAviso("Efectivo confirmado: tiempo activado y comprobante emitido.");
    onCambio();
  }
  async function cancelar(ordenId: string) {
    setProcesando(ordenId);
    await client.cancelarOrdenEfectivo(ordenId);
    setProcesando(null);
    onCambio();
  }
  async function registrarManual() {
    setProcesando("manual");
    const orden = await client.crearOrdenEfectivo({ plate, vehicleType, minutes, permisionarioId: datos.perm.id });
    await client.confirmarEfectivo(orden.id);
    setProcesando(null);
    setAviso(`Efectivo registrado: ${plate}`);
    onCambio();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Efectivo</h1>
        <p className="mt-2 text-texto-tenue">
          Confirmá los pagos en efectivo que te marcan los ciudadanos. Recién al confirmar se activa el tiempo y se emite el comprobante.
        </p>
      </div>

      <Tarjeta titulo={`Pendientes de confirmar (${datos.ordenesPendientes.length})`}>
        {datos.ordenesPendientes.length === 0 ? (
          <p className="py-4 text-center text-sm text-texto-tenue">
            No tenés efectivos pendientes. Cuando un ciudadano elija “Efectivo” en su pago, aparece acá para que confirmes.
          </p>
        ) : (
          <div className="space-y-2">
            {datos.ordenesPendientes.map((o) => (
              <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ambar/30 bg-ambar/10 p-3">
                <div>
                  <p className="font-mono font-bold">{o.plate}</p>
                  <p className="text-xs text-texto-tenue">{formatMinutos(o.minutes)} · {formatHora(o.createdAt)}</p>
                </div>
                <b className="text-lg">{formatARS(o.amount)}</b>
                <div className="flex gap-2">
                  <Boton variante="fantasma" onClick={() => cancelar(o.id)} cargando={procesando === o.id}>Cancelar</Boton>
                  <Boton variante="ambar" onClick={() => confirmar(o.id)} cargando={procesando === o.id}>Efectivo recibido</Boton>
                </div>
              </div>
            ))}
          </div>
        )}
      </Tarjeta>

      <Tarjeta titulo="Registrar efectivo manual">
        <p className="mb-3 text-xs text-texto-tenue">Si cobraste un efectivo sin que el ciudadano lo cargue desde la app, registralo acá.</p>
        <div className="space-y-3">
          <Campo label="Patente" value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase())} placeholder="AC456DE" />
          <div className="grid grid-cols-2 gap-3">
            <Selector label="Vehículo" value={vehicleType} onChange={(e) => setVehicleType(e.target.value as VehicleType)}>
              <option value="auto">Auto</option>
              <option value="moto">Moto</option>
            </Selector>
            <Selector label="Tiempo" value={minutes} onChange={(e) => setMinutes(Number(e.target.value))}>
              {OPCIONES_MINUTOS.map((m) => <option key={m} value={m}>{formatMinutos(m)}</option>)}
            </Selector>
          </div>
        </div>
        <Boton className="mt-4 w-full" variante="secundario" onClick={registrarManual} cargando={procesando === "manual"} disabled={!plate}>
          Registrar y confirmar
        </Boton>
      </Tarjeta>

      {aviso && <p className="rounded-xl bg-emerald-500/15 px-3 py-2 text-sm text-emerald-300">{aviso}</p>}

      <div className="rounded-2xl border border-ambar/20 bg-ambar/10 p-4 text-sm text-ambar-400">
        Cada efectivo confirmado suma una <b>deuda de plataforma del 10%</b> (lo que en el pago digital se descuenta solo).
        La ves y la pagás desde “Recaudación”.
      </div>
    </div>
  );
}
