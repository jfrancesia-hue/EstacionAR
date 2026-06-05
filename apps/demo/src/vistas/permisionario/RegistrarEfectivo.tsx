import { useState } from "react";
import { Boton, Campo, Selector, Tarjeta, formatARS, formatMinutos } from "@estacionar/ui";
import type { VehicleType } from "@estacionar/core";
import { clientLocal as client } from "../../store.js";
import type { DatosPermisionario } from "./tipos.js";

const OPCIONES_MINUTOS = [30, 60, 90, 120];

export function SeccionRegistrarEfectivo({ datos, onCambio }: { datos: DatosPermisionario; onCambio: () => void }) {
  const [plate, setPlate] = useState("AC456DE");
  const [vehicleType, setVehicleType] = useState<VehicleType>("auto");
  const [minutes, setMinutes] = useState(60);
  const [registrando, setRegistrando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function registrar() {
    setError(null);
    setAviso(null);
    setRegistrando(true);
    try {
      // idempotencyKey única por operación: antiduplicidad (registro inmutable).
      const idempotencyKey = `ef-${datos.perm.id}-${plate}-${minutes}-${crypto.randomUUID()}`;
      const r = await client.pagarEfectivo({ plate, vehicleType, minutes, permisionarioId: datos.perm.id, idempotencyKey });
      setAviso(r.duplicado ? "Operación ya registrada (antiduplicidad)." : `Efectivo registrado: ${formatARS(r.pago.amount)} · ${r.pago.plate}`);
      onCambio();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo registrar el efectivo.");
    } finally {
      setRegistrando(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Registrar efectivo</h1>
        <p className="mt-2 text-texto-tenue">En 2-3 toques. El registro es inmutable, queda con sello de tiempo y no se puede duplicar.</p>
      </div>
      <Tarjeta>
        <div className="space-y-3">
          <Campo label="Patente del vehículo" value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase())} placeholder="AC456DE" />
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
        <Boton className="mt-5 w-full" variante="ambar" grande onClick={registrar} cargando={registrando} disabled={!plate}>
          Cargá el pago en efectivo
        </Boton>
        {aviso && <p className="mt-3 rounded-xl bg-emerald-500/15 px-3 py-2 text-sm text-emerald-300">{aviso}</p>}
        {error && <p className="mt-3 rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-300">{error}</p>}
      </Tarjeta>
      <p className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-texto-tenue">
        El efectivo se carga sin descuento digital y crea/extiende la sesión por patente igual que el pago digital.
      </p>
    </div>
  );
}
