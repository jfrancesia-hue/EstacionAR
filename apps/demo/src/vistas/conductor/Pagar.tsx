import { useEffect, useState } from "react";
import { Badge, Boton, Campo, Selector, Kpi, Tarjeta, formatARS, formatHora, formatMinutos } from "@estacionar/ui";
import type { ResultadoPago } from "@estacionar/ui";
import type { CalcularTarifaResult, VehicleType } from "@estacionar/core";
import { clientLocal as client } from "../../store.js";
import { imprimirComprobante, compartirComprobante } from "./comprobante.js";

const OPCIONES_MINUTOS = [30, 60, 90, 120, 180];

function SaltaMark() {
  return (
    <div className="flex min-w-0 items-center rounded-2xl bg-white px-3 py-2 shadow-sm">
      <img src="/municipalidad-salta.jpeg" alt="Municipalidad de Salta" className="h-9 max-w-[130px] object-contain" />
    </div>
  );
}

function QrDemo() {
  return (
    <div className="relative grid h-36 w-36 grid-cols-7 gap-1 rounded-2xl bg-white p-3 shadow-inner sm:h-44 sm:w-44">
      {Array.from({ length: 49 }).map((_, i) => {
        const finder = (i < 14 && i % 7 < 2) || (i % 7 > 4 && i < 14) || (i > 34 && i % 7 < 2);
        const active = finder || i % 5 === 0 || i % 8 === 0 || [17, 22, 30, 37, 41].includes(i);
        return <span key={i} className={active ? "rounded-[3px] bg-[#0067B1]" : "rounded-[3px] bg-[#0A1A2F]/10"} />;
      })}
      <div className="absolute inset-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-xl border border-[#0067B1]/20 bg-white text-xs font-black text-[#0067B1] shadow">AR</div>
    </div>
  );
}

export function SeccionPagar() {
  const [plate, setPlate] = useState("AB123CD");
  const [vehicleType, setVehicleType] = useState<VehicleType>("auto");
  const [minutes, setMinutes] = useState(60);
  const [cotizacion, setCotizacion] = useState<CalcularTarifaResult | null>(null);
  const [cotizando, setCotizando] = useState(false);
  const [pagando, setPagando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoPago | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vigente = true;
    setCotizando(true);
    client
      .cotizar({ vehicleType, minutes, isDigital: true })
      .then((r) => vigente && setCotizacion(r))
      .finally(() => vigente && setCotizando(false));
    return () => {
      vigente = false;
    };
  }, [vehicleType, minutes]);

  async function pagar() {
    setError(null);
    setPagando(true);
    try {
      setResultado(await client.pagarDigital({ plate, vehicleType, minutes, method: "mercadopago" }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo procesar el pago.");
    } finally {
      setPagando(false);
    }
  }

  const monto = cotizacion?.amount ?? 0;

  return (
    <div className="grid gap-8 lg:grid-cols-[.92fr_1.08fr] lg:items-center">
      <section className="min-w-0">
        <Badge tono="cyan">Pagá por patente · Municipalidad de Salta</Badge>
        <h1 className="mt-5 max-w-2xl text-4xl font-extrabold leading-[0.98] tracking-tight sm:text-5xl lg:text-6xl">
          Pagá tu estacionamiento en segundos.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-texto-tenue sm:text-lg">
          Escaneás el QR del permisionario, ingresás tu patente y activás una billetera de tiempo. Si te movés de sector, no volvés a pagar.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <Kpi label="Patente" valor={plate || "—"} />
          <Kpi label="Tiempo" valor={formatMinutos(minutes)} />
          <Kpi label="Precio digital" valor={cotizando ? "…" : formatARS(monto)} acento="ambar" />
        </div>
        <div className="mt-6 grid gap-3 rounded-3xl border border-cyan/15 bg-cyan/10 p-4 text-sm text-cyan-300 sm:grid-cols-3">
          <span>1. Escaneá QR</span>
          <span>2. Pagá por patente</span>
          <span>3. Usá tu tiempo</span>
        </div>
      </section>

      <section className="relative mx-auto w-full max-w-[430px] rounded-[2.2rem] border border-white/10 bg-gradient-to-br from-profundo to-nocturno p-3 shadow-2xl sm:p-4">
        <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-cyan/20 blur-3xl" />
        <div className="absolute -bottom-8 left-8 h-28 w-52 rounded-full bg-ambar/20 blur-3xl" />
        <div className="relative overflow-hidden rounded-[1.7rem] bg-white p-4 text-[#0A1A2F] sm:p-5">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <SaltaMark />
            <span className="shrink-0 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-emerald-700">QR válido</span>
          </div>

          {resultado ? (
            <div className="my-4">
              <div className="grid place-items-center rounded-3xl bg-emerald-50 p-6 text-center">
                <div className="grid h-14 w-14 place-items-center rounded-full bg-emerald-500 text-white">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <p className="mt-3 text-lg font-black text-emerald-700">{resultado.extended ? "Tiempo extendido" : "Pago aprobado"}</p>
                <p className="text-xs text-emerald-700/70">Comprobante municipal · {resultado.pago.id}</p>
              </div>
              <div className="mt-4 space-y-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-900">
                <div className="flex items-center justify-between gap-4"><span className="text-slate-500">Patente</span><b className="rounded-lg bg-[#0067B1] px-2 py-1 tracking-widest text-white">{resultado.pago.plate}</b></div>
                <div className="flex items-center justify-between gap-4"><span className="text-slate-500">Vigencia</span><b className="text-right">{formatHora(resultado.sesion.startValid)} → {formatHora(resultado.sesion.endValid)}</b></div>
                <div className="flex items-center justify-between gap-4"><span className="text-slate-500">Tiempo total</span><b>{formatMinutos(resultado.sesion.paidMinutes)}</b></div>
                <div className="flex items-end justify-between gap-4 border-t border-slate-200 pt-3 text-lg"><span className="text-slate-500">Pagaste</span><b className="text-2xl text-[#0067B1]">{formatARS(resultado.pago.amount)}</b></div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Boton variante="primario" onClick={() => imprimirComprobante(resultado)}>Imprimir / PDF</Boton>
                <Boton variante="ambar" onClick={() => compartirComprobante(resultado)}>Compartir</Boton>
              </div>
              <Boton variante="secundario" className="mt-2 w-full" onClick={() => setResultado(null)}>Nuevo pago</Boton>
            </div>
          ) : (
            <>
              <div className="my-5 grid place-items-center rounded-3xl bg-[#F5F7FA] p-5 sm:p-7"><QrDemo /></div>
              <Tarjeta className="border-slate-200 bg-slate-50 p-4 text-slate-900 shadow-none" titulo={<span className="text-slate-500">Pago de estacionamiento</span>}>
                <div className="space-y-3">
                  <Campo label="Patente" value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase())} placeholder="AB123CD" className="bg-white text-slate-900" />
                  <div className="grid grid-cols-2 gap-3">
                    <Selector label="Vehículo" value={vehicleType} onChange={(e) => setVehicleType(e.target.value as VehicleType)} className="bg-white text-slate-900">
                      <option value="auto">Auto</option>
                      <option value="moto">Moto</option>
                    </Selector>
                    <Selector label="Tiempo" value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} className="bg-white text-slate-900">
                      {OPCIONES_MINUTOS.map((m) => <option key={m} value={m}>{formatMinutos(m)}</option>)}
                    </Selector>
                  </div>
                  <div className="flex items-end justify-between gap-4 border-t border-slate-200 pt-3 text-lg">
                    <span className="text-slate-500">Total</span>
                    <b className="text-2xl text-[#0067B1]">{cotizando ? "…" : formatARS(monto)}</b>
                  </div>
                </div>
                <Boton className="mt-5 w-full whitespace-nowrap" grande onClick={pagar} cargando={pagando} disabled={!plate}>Pagá y activá</Boton>
              </Tarjeta>
            </>
          )}
          {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        </div>
        <div className="relative mt-4 rounded-2xl border border-cyan/20 bg-cyan/10 p-4 text-sm leading-relaxed text-cyan-300">
          Comprobante municipal listo para descargar o enviar por WhatsApp. La recaudación entra primero al Municipio.
        </div>
      </section>
    </div>
  );
}
