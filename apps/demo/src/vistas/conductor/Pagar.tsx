import { lazy, Suspense, useEffect, useState } from "react";
import { Badge, Boton, Campo, Selector, Kpi, Tarjeta, formatARS, formatHora, formatMinutos } from "@estacionar/ui";
import type { PermisionarioConSector, ResultadoPago } from "@estacionar/ui";
import type { CalcularTarifaResult, VehicleType } from "@estacionar/core";
import { clientLocal as client, type OrdenEfectivo, type AlertaExcedente } from "../../store.js";
import { imprimirComprobante, compartirComprobante } from "./comprobante.js";
import { permisionarioIdDesdeQR } from "../../qr.js";
import { acreditadoPermisionario } from "../../split.js";

// El lector de QR (@zxing) se carga sólo al abrir el escáner: mantiene liviano el bundle inicial.
const EscanerQR = lazy(() => import("./EscanerQR.js").then((m) => ({ default: m.EscanerQR })));

const OPCIONES_MINUTOS = [30, 60, 90, 120, 180];

function SaltaMark() {
  return (
    <div className="flex min-w-0 items-center rounded-2xl bg-white px-3 py-2 shadow-sm">
      <img src="/municipalidad-salta.jpeg" alt="Municipalidad de Salta" className="h-9 max-w-[130px] object-contain" />
    </div>
  );
}

export function SeccionPagar({ qrId }: { qrId?: string }) {
  const [permisionarios, setPermisionarios] = useState<PermisionarioConSector[]>([]);
  const [perm, setPerm] = useState<PermisionarioConSector | null>(null);
  const [mostrarEscaner, setMostrarEscaner] = useState(false);
  const [avisoQr, setAvisoQr] = useState<string | null>(null);

  const [plate, setPlate] = useState("AB123CD");
  const [vehicleType, setVehicleType] = useState<VehicleType>("auto");
  const [minutes, setMinutes] = useState(60);
  const [cotizacion, setCotizacion] = useState<CalcularTarifaResult | null>(null);
  const [cotizando, setCotizando] = useState(false);
  const [pagando, setPagando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoPago | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [metodo, setMetodo] = useState<"digital" | "efectivo">("digital");
  const [ordenPendiente, setOrdenPendiente] = useState<OrdenEfectivo | null>(null);
  const [verificando, setVerificando] = useState(false);
  const [alertaExc, setAlertaExc] = useState<AlertaExcedente | null>(null);

  useEffect(() => {
    client.getPermisionarios().then(setPermisionarios);
  }, []);

  // Recupera una orden de efectivo pendiente del ciudadano al volver a esta pantalla.
  useEffect(() => {
    const oid = sessionStorage.getItem("estacionar:orden");
    if (!oid) return;
    (async () => {
      const r = await client.getResultadoOrden(oid);
      if (r) {
        setResultado(r);
        sessionStorage.removeItem("estacionar:orden");
        return;
      }
      const orden = await client.getOrdenEfectivo(oid);
      if (orden && orden.status === "pending_cash_confirmation") setOrdenPendiente(orden);
      else sessionStorage.removeItem("estacionar:orden");
    })();
  }, []);

  // Si entró por /pagar/:qrId, resolvemos el permisionario y salteamos el escaneo.
  useEffect(() => {
    if (!qrId || perm || !permisionarios.length) return;
    const encontrado = permisionarios.find((p) => p.id === qrId);
    if (encontrado) setPerm(encontrado);
    else setAvisoQr("El QR no corresponde a un permisionario de EstacionAR.");
  }, [qrId, permisionarios, perm]);

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

  // Aviso suave (no bloqueo) si la patente tiene un excedente reciente sin regularizar (§17).
  useEffect(() => {
    if (!plate || plate.length < 3) {
      setAlertaExc(null);
      return;
    }
    let vig = true;
    client.getAlertaActiva(plate).then((a) => vig && setAlertaExc(a));
    return () => {
      vig = false;
    };
  }, [plate]);

  function resolverQr(texto: string) {
    setMostrarEscaner(false);
    const id = permisionarioIdDesdeQR(texto);
    const encontrado = id && permisionarios.find((p) => p.id === id);
    if (!encontrado) {
      setAvisoQr("Ese QR no corresponde a un permisionario de EstacionAR.");
      return;
    }
    setAvisoQr(null);
    setPerm(encontrado);
  }

  function simularEscaneo() {
    const activos = permisionarios.filter((p) => p.status === "active");
    if (activos.length === 0) return;
    setPerm(activos[Math.floor(Math.random() * activos.length)]!);
    setAvisoQr(null);
  }

  async function pagar() {
    if (!perm) return;
    setError(null);
    setPagando(true);
    try {
      if (metodo === "efectivo") {
        // Efectivo: se crea una orden pendiente; el tiempo se activa cuando el permisionario confirma.
        const orden = await client.crearOrdenEfectivo({ plate, vehicleType, minutes, permisionarioId: perm.id, sectorId: perm.sectorId });
        setOrdenPendiente(orden);
        sessionStorage.setItem("estacionar:orden", orden.id);
      } else {
        setResultado(
          await client.pagarDigital({ plate, vehicleType, minutes, method: "mercadopago", permisionarioId: perm.id, sectorId: perm.sectorId }),
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo procesar el pago.");
    } finally {
      setPagando(false);
    }
  }

  async function verificarOrden() {
    if (!ordenPendiente) return;
    setError(null);
    setVerificando(true);
    const r = await client.getResultadoOrden(ordenPendiente.id);
    setVerificando(false);
    if (r) {
      setResultado(r);
      setOrdenPendiente(null);
      sessionStorage.removeItem("estacionar:orden");
    } else {
      setError("Todavía no fue confirmado por el permisionario.");
    }
  }

  const monto = cotizacion?.amount ?? 0;

  return (
    <div className="grid gap-8 lg:grid-cols-[.92fr_1.08fr] lg:items-center">
      {mostrarEscaner && (
        <Suspense fallback={null}>
          <EscanerQR onDetectar={resolverQr} onCerrar={() => setMostrarEscaner(false)} />
        </Suspense>
      )}

      <section className="min-w-0">
        <Badge tono="cyan">Pagá por patente · Municipalidad de Salta</Badge>
        <h1 className="mt-5 max-w-2xl text-4xl font-extrabold leading-[0.98] tracking-tight sm:text-5xl lg:text-6xl">
          Pagá tu estacionamiento en segundos.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-texto-tenue sm:text-lg">
          Escaneás el QR del permisionario, ingresás tu patente y pagás con 10% de beneficio por usar la app. Si te movés de sector, no volvés a pagar.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <Kpi label="Patente" valor={plate || "—"} />
          <Kpi label="Tiempo" valor={formatMinutos(minutes)} />
          <Kpi label="Precio app" valor={cotizando ? "…" : formatARS(monto)} acento="ambar" sub="10% menos" />
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
            <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wide ${perm ? "bg-emerald-500/10 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
              {perm ? "Permisionario OK" : "Escaneá QR"}
            </span>
          </div>

          {resultado ? (
            <div className="my-4">
              <div className="grid place-items-center rounded-3xl bg-emerald-50 p-6 text-center">
                <div className="grid h-14 w-14 place-items-center rounded-full bg-emerald-500 text-white">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <p className="mt-3 text-lg font-black text-emerald-700">{resultado.extended ? "Tiempo extendido" : "Pago aprobado"}</p>
                <p className="text-xs text-emerald-700/70">Acreditado al permisionario · {resultado.pago.id}</p>
              </div>
              <div className="mt-4 space-y-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-900">
                <div className="flex items-center justify-between gap-4"><span className="text-slate-500">Patente</span><b className="rounded-lg bg-[#0067B1] px-2 py-1 tracking-widest text-white">{resultado.pago.plate}</b></div>
                <div className="flex items-center justify-between gap-4"><span className="text-slate-500">Vigencia</span><b className="text-right">{formatHora(resultado.sesion.startValid)} → {formatHora(resultado.sesion.endValid)}</b></div>
                <div className="flex items-center justify-between gap-4"><span className="text-slate-500">Tiempo total</span><b>{formatMinutos(resultado.sesion.paidMinutes)}</b></div>
                <div className="flex items-center justify-between gap-4"><span className="text-slate-500">Se acredita al permisionario</span><b className="text-emerald-600">{formatARS(acreditadoPermisionario(resultado.pago.amount))}</b></div>
                <div className="flex items-end justify-between gap-4 border-t border-slate-200 pt-3 text-lg"><span className="text-slate-500">Pagaste</span><b className="text-2xl text-[#0067B1]">{formatARS(resultado.pago.amount)}</b></div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Boton variante="primario" onClick={() => imprimirComprobante(resultado)}>Imprimir / PDF</Boton>
                <Boton variante="ambar" onClick={() => compartirComprobante(resultado)}>Compartir</Boton>
              </div>
              <Boton variante="secundario" className="mt-2 w-full" onClick={() => setResultado(null)}>Nuevo pago</Boton>
            </div>
          ) : ordenPendiente ? (
            // Efectivo: esperando que el permisionario confirme que lo recibió
            <div className="my-4 text-center">
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-ambar/15 text-ambar-600">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" /><path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              </div>
              <h3 className="mt-4 text-lg font-black text-slate-800">Entregá el efectivo al permisionario</h3>
              <p className="mt-1 text-sm text-slate-500">Apenas confirme que lo recibió, se activa tu tiempo y te llega el comprobante.</p>
              <div className="mt-4 space-y-2 rounded-2xl bg-slate-50 p-4 text-sm text-slate-900">
                <div className="flex items-center justify-between"><span className="text-slate-500">Patente</span><b>{ordenPendiente.plate}</b></div>
                <div className="flex items-center justify-between"><span className="text-slate-500">Tiempo</span><b>{formatMinutos(ordenPendiente.minutes)}</b></div>
                <div className="flex items-end justify-between border-t border-slate-200 pt-2 text-lg"><span className="text-slate-500">A pagar en efectivo</span><b className="text-[#0067B1]">{formatARS(ordenPendiente.amount)}</b></div>
              </div>
              <Boton grande className="mt-4 w-full" onClick={verificarOrden} cargando={verificando}>Ya lo confirmó</Boton>
              <button onClick={() => { setOrdenPendiente(null); sessionStorage.removeItem("estacionar:orden"); }} className="mt-2 w-full text-xs font-semibold text-slate-500 hover:underline">Cancelar</button>
            </div>
          ) : !perm ? (
            // Paso 1: escanear el QR del permisionario
            <div className="my-4 text-center">
              <div className="mx-auto grid h-24 w-24 place-items-center rounded-3xl bg-[#F5F7FA]">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-[#0067B1]"><path d="M4 4h6v6H4V4Zm0 10h6v6H4v-6ZM14 4h6v6h-6V4Zm2 12h4v4h-4v-4Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>
              </div>
              <h3 className="mt-4 text-lg font-black text-slate-800">Escaneá el QR del permisionario</h3>
              <p className="mt-1 text-sm text-slate-500">Lo encontrás en su credencial. Así el cobro queda asociado a su sector.</p>
              <div className="mt-5 grid gap-2">
                <Boton grande onClick={() => setMostrarEscaner(true)}>Escanear QR</Boton>
                <Boton variante="secundario" onClick={simularEscaneo}>Simular escaneo</Boton>
              </div>
              {avisoQr && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{avisoQr}</p>}
            </div>
          ) : (
            // Paso 2: cargar patente y pagar
            <>
              <div className="my-4 flex items-center justify-between gap-2 rounded-2xl bg-emerald-50 p-3">
                <div className="min-w-0">
                  <p className="text-xs text-emerald-700/70">Permisionario</p>
                  <p className="truncate font-bold text-emerald-800">{perm.fullName.replace(" (DEMO)", "")}</p>
                  <p className="text-xs text-emerald-700/70">{perm.sector?.name ?? "Sector asignado"}</p>
                </div>
                <button onClick={() => setPerm(null)} className="shrink-0 text-xs font-bold text-emerald-700 underline">Cambiar</button>
              </div>
              {alertaExc && (
                <div className="mb-3 rounded-2xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                  Esta patente registra un <b>excedente reciente sin regularizar</b>. Podés regularizarlo ahora (no es obligatorio).
                </div>
              )}
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
                <div className="mt-4">
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Cómo pagás</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setMetodo("digital")} className={`rounded-xl border p-2.5 text-sm font-bold transition ${metodo === "digital" ? "border-[#0067B1] bg-[#0067B1]/10 text-[#0067B1]" : "border-slate-200 text-slate-400"}`}>Digital</button>
                    <button type="button" onClick={() => setMetodo("efectivo")} className={`rounded-xl border p-2.5 text-sm font-bold transition ${metodo === "efectivo" ? "border-amber-500 bg-amber-50 text-amber-700" : "border-slate-200 text-slate-400"}`}>Efectivo</button>
                  </div>
                </div>
                <Boton className="mt-3 w-full whitespace-nowrap" grande onClick={pagar} cargando={pagando} disabled={!plate}>{metodo === "efectivo" ? "Pagar en efectivo" : "Pagá y activá"}</Boton>
              </Tarjeta>
            </>
          )}
          {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        </div>
        <div className="relative mt-4 rounded-2xl border border-cyan/20 bg-cyan/10 p-4 text-sm leading-relaxed text-cyan-300">
          Comprobante online listo para descargar o enviar por WhatsApp. El pago se acredita directo al permisionario y el Municipio lo fiscaliza en tiempo real.
        </div>
      </section>
    </div>
  );
}
