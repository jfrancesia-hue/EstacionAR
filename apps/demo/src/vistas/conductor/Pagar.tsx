import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { Badge, Boton, Campo, Selector, Kpi, Tarjeta, formatARS, formatHora, formatMinutos, etiquetaMedio } from "@estacionar/ui";
import type { PermisionarioConSector, ResultadoPago } from "@estacionar/ui";
import type { CalcularTarifaResult, VehicleType } from "@estacionar/core";
import { clientLocal as client, type OrdenEfectivo, type AlertaExcedente } from "../../store.js";
import { imprimirComprobante, compartirComprobante, codigoVerif } from "./comprobante.js";
import { permisionarioIdDesdeQR } from "../../qr.js";
import { acreditadoPermisionario, SPLIT } from "../../split.js";
import { esPatenteValida } from "../../patente.js";
import { Avatar } from "../../Avatar.js";

// El lector de QR (@zxing) se carga sólo al abrir el escáner: mantiene liviano el bundle inicial.
const EscanerQR = lazy(() => import("./EscanerQR.js").then((m) => ({ default: m.EscanerQR })));

const OPCIONES_MINUTOS = [30, 60, 90, 120, 180];

// El ciudadano paga con el medio que ya usa (PRODUCTO.md §7 / propuesta).
type MedioPago = "mercadopago" | "modo" | "naranja" | "card" | "efectivo";
const MEDIOS: Array<{ id: MedioPago; label: string }> = [
  { id: "mercadopago", label: "Mercado Pago" },
  { id: "modo", label: "MODO" },
  { id: "naranja", label: "Naranja X" },
  { id: "card", label: "Tarjeta" },
  { id: "efectivo", label: "Efectivo" },
];

function CatamarcaMark() {
  return (
    <div className="flex min-w-0 items-center rounded-2xl bg-white px-3 py-2 shadow-sm">
      <img src="/catamarca-logo.png" alt="Municipalidad de San Fernando del Valle de Catamarca" className="h-9 max-w-[130px] object-contain" />
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
  const [medio, setMedio] = useState<MedioPago>("mercadopago");
  const [ordenPendiente, setOrdenPendiente] = useState<OrdenEfectivo | null>(null);
  const [verificando, setVerificando] = useState(false);
  const [alertaExc, setAlertaExc] = useState<AlertaExcedente | null>(null);
  const [valorado, setValorado] = useState(false);

  async function valorar(rating: number) {
    if (!resultado?.pago.permisionarioId) return;
    await client.valorar({ permisionarioId: resultado.pago.permisionarioId, sesionId: resultado.sesion.id, rating });
    setValorado(true);
  }

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
      if (orden && orden.status === "pending_cash_confirmation") {
        setOrdenPendiente(orden);
      } else {
        sessionStorage.removeItem("estacionar:orden");
        setError("Tu pago en efectivo en curso se canceló al recargar. Volvé a cargarlo.");
      }
    })();
  }, []);

  // Si entró por /pagar/:qrId, resolvemos el permisionario y salteamos el escaneo.
  useEffect(() => {
    if (!qrId || perm || !permisionarios.length) return;
    const encontrado = permisionarios.find((p) => p.id === qrId);
    if (!encontrado) setAvisoQr("El QR no corresponde a un permisionario de EstacionAR.");
    else if (encontrado.status !== "active") setAvisoQr("Ese permisionario no está habilitado para operar.");
    else setPerm(encontrado);
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
    if (!esPatenteValida(plate)) {
      setAlertaExc(null);
      return;
    }
    let vig = true;
    client.getAlertaActiva(plate).then((a) => vig && setAlertaExc(a));
    return () => {
      vig = false;
    };
  }, [plate]);

  const resolverQr = useCallback(
    (texto: string) => {
      setMostrarEscaner(false);
      const id = permisionarioIdDesdeQR(texto);
      const encontrado = id ? permisionarios.find((p) => p.id === id) : undefined;
      if (!encontrado) {
        setAvisoQr("Ese QR no corresponde a un permisionario de EstacionAR.");
        return;
      }
      if (encontrado.status !== "active") {
        setAvisoQr(`El permisionario está ${encontrado.status} y no puede operar.`);
        return;
      }
      setAvisoQr(null);
      setPerm(encontrado);
    },
    [permisionarios],
  );

  function simularEscaneo() {
    const activos = permisionarios.filter((p) => p.status === "active");
    if (activos.length === 0) return;
    setPerm(activos[Math.floor(Math.random() * activos.length)]!);
    setAvisoQr(null);
  }

  async function pagar() {
    if (!perm) return;
    setError(null);
    setValorado(false);
    setPagando(true);
    try {
      if (medio === "efectivo") {
        // Efectivo: se crea una orden pendiente; el tiempo se activa cuando el permisionario confirma.
        const orden = await client.crearOrdenEfectivo({ plate, vehicleType, minutes, permisionarioId: perm.id, sectorId: perm.sectorId });
        setOrdenPendiente(orden);
        sessionStorage.setItem("estacionar:orden", orden.id);
      } else {
        setResultado(
          await client.pagarDigital({ plate, vehicleType, minutes, method: medio, permisionarioId: perm.id, sectorId: perm.sectorId }),
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
      setValorado(false);
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
        <Badge tono="cyan">Pagá por patente · Municipalidad de San Fernando del Valle de Catamarca</Badge>
        <h1 className="mt-5 max-w-2xl text-4xl font-extrabold leading-[0.98] tracking-tight sm:text-5xl lg:text-6xl">
          Pagá tu estacionamiento en segundos.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-texto-tenue sm:text-lg">
          Escaneás el QR del permisionario, ingresás tu patente y pagás con comprobante digital. Si te movés de sector, no volvés a pagar.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <Kpi label="Patente" valor={plate || "—"} />
          <Kpi label="Tiempo" valor={formatMinutos(minutes)} />
          <Kpi label="Precio app" valor={cotizando ? "…" : formatARS(monto)} acento="ambar" sub="Comprobante digital" />
        </div>
        <div className="mt-6 grid gap-3 rounded-3xl border border-cyan/25 bg-cyan/10 p-4 text-sm font-semibold text-texto sm:grid-cols-3">
          <span>1. Escaneá QR</span>
          <span>2. Pagá por patente</span>
          <span>3. Usá tu tiempo</span>
        </div>
      </section>

      <section className="relative mx-auto w-full max-w-[430px] rounded-[2.2rem] border border-borde bg-gradient-to-br from-profundo to-nocturno p-3 shadow-2xl sm:p-4">
        <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-cyan/20 blur-3xl" />
        <div className="absolute -bottom-8 left-8 h-28 w-52 rounded-full bg-ambar/20 blur-3xl" />
        <div className="relative overflow-hidden rounded-[1.7rem] bg-white p-4 text-[#163A63] sm:p-5">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <CatamarcaMark />
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
                <div className="flex items-center justify-between gap-4"><span className="text-slate-500">Patente</span><b className="rounded-lg bg-[#00A6D6] px-2 py-1 tracking-widest text-white">{resultado.pago.plate}</b></div>
                <div className="flex items-center justify-between gap-4"><span className="text-slate-500">Vigencia</span><b className="text-right">{formatHora(resultado.sesion.startValid)} → {formatHora(resultado.sesion.endValid)}</b></div>
                <div className="flex items-center justify-between gap-4"><span className="text-slate-500">Tiempo total</span><b>{formatMinutos(resultado.sesion.paidMinutes)}</b></div>
                <div className="flex items-center justify-between gap-4"><span className="text-slate-500">Medio de pago</span><b>{etiquetaMedio(resultado.pago.method)}</b></div>
                <div className="flex items-center justify-between gap-4"><span className="text-slate-500">Se acredita al permisionario</span><b className="text-emerald-600">{formatARS(acreditadoPermisionario(resultado.pago.amount))}</b></div>
                <div className="flex items-end justify-between gap-4 border-t border-slate-200 pt-3 text-lg"><span className="text-slate-500">Pagaste</span><b className="text-2xl text-[#00A6D6]">{formatARS(resultado.pago.amount)}</b></div>
                <div className="flex items-center justify-between gap-4 pt-1 text-xs text-slate-400"><span>Código de verificación</span><b className="font-mono">{codigoVerif(resultado.pago.id)}</b></div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Boton variante="primario" onClick={() => imprimirComprobante(resultado)}>Imprimir / PDF</Boton>
                <Boton variante="ambar" onClick={() => compartirComprobante(resultado)}>Compartir</Boton>
              </div>
              {resultado.pago.permisionarioId && (
                <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-center">
                  {valorado ? (
                    <p className="text-sm font-semibold text-emerald-600">¡Gracias por tu valoración! 🙌</p>
                  ) : (
                    <>
                      <p className="text-sm text-slate-600">¿Cómo fue la atención del permisionario?</p>
                      <div className="mt-2 flex justify-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button key={n} onClick={() => valorar(n)} aria-label={`Calificar con ${n}`} className="text-3xl leading-none text-amber-400 transition hover:scale-110">★</button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
              <Boton variante="secundario" className="mt-2 w-full" onClick={() => { setResultado(null); setValorado(false); }}>Nuevo pago</Boton>
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
                <div className="flex items-end justify-between border-t border-slate-200 pt-2 text-lg"><span className="text-slate-500">A pagar en efectivo</span><b className="text-[#00A6D6]">{formatARS(ordenPendiente.amount)}</b></div>
              </div>
              <Boton grande className="mt-4 w-full" onClick={verificarOrden} cargando={verificando}>Ya lo confirmó</Boton>
              <button onClick={() => { setOrdenPendiente(null); sessionStorage.removeItem("estacionar:orden"); }} className="mt-2 w-full text-xs font-semibold text-slate-500 hover:underline">Cancelar</button>
            </div>
          ) : !perm ? (
            // Paso 1: escanear el QR del permisionario
            <div className="my-4 text-center">
              <div className="mx-auto grid h-24 w-24 place-items-center rounded-3xl bg-[#F5F7FA]">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-[#00A6D6]"><path d="M4 4h6v6H4V4Zm0 10h6v6H4v-6ZM14 4h6v6h-6V4Zm2 12h4v4h-4v-4Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>
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
              <div className="my-4 flex items-center gap-3 rounded-2xl bg-emerald-50 p-3">
                <Avatar id={perm.id} nombre={perm.fullName} size={48} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-emerald-800">{perm.fullName.replace(" (DEMO)", "")}</p>
                  <p className="text-xs text-emerald-700/70">{perm.sector?.name ?? "Sector asignado"}</p>
                  <span className="text-[11px] font-bold text-emerald-600">● Permisionario habilitado</span>
                </div>
                <button onClick={() => setPerm(null)} className="shrink-0 self-start text-xs font-bold text-emerald-700 underline">Cambiar</button>
              </div>
              {alertaExc && (
                <div className="mb-3 rounded-2xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                  Esta patente registra un <b>excedente reciente sin regularizar</b>. Podés regularizarlo ahora (no es obligatorio).
                </div>
              )}
              <Tarjeta className="border-slate-200 bg-slate-50 p-4 text-slate-900 shadow-none" titulo={<span className="text-slate-500">Pago de estacionamiento</span>}>
                <div className="space-y-3">
                  <Campo label="Patente" value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase())} placeholder="AB123CD" className="bg-white text-slate-900" />
                  {plate && !esPatenteValida(plate) && <p className="text-xs text-amber-600">Formato: AB123CD o ABC123</p>}
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
                    <b className="text-2xl text-[#00A6D6]">{cotizando ? "…" : formatARS(monto)}</b>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Cómo pagás</p>
                  <div className="grid grid-cols-3 gap-2">
                    {MEDIOS.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setMedio(m.id)}
                        className={`rounded-xl border p-2 text-xs font-bold transition ${
                          medio === m.id
                            ? m.id === "efectivo"
                              ? "border-amber-500 bg-amber-50 text-amber-700"
                              : "border-[#00A6D6] bg-[#00A6D6]/10 text-[#00A6D6]"
                            : "border-slate-200 text-slate-400 hover:border-slate-300"
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
                <Boton className="mt-3 w-full whitespace-nowrap" grande onClick={pagar} cargando={pagando} disabled={!esPatenteValida(plate)}>{medio === "efectivo" ? "Pagar en efectivo" : "Pagá y activá"}</Boton>
              </Tarjeta>
            </>
          )}
          {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        </div>
        <div className="relative mt-4 rounded-2xl border border-cyan/25 bg-cyan/10 p-4 text-sm leading-relaxed text-texto">
          Comprobante online listo para descargar o enviar por WhatsApp. El pago se acredita directo al permisionario y el Municipio lo fiscaliza en tiempo real.
        </div>
      </section>
    </div>
  );
}
