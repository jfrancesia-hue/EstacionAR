import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Boton,
  Campo,
  Selector,
  Kpi,
  Logo,
  MarcaDemo,
  Tarjeta,
  Cargando,
  EstadoPill,
  crearClient,
  formatARS,
  formatHora,
  formatMinutos,
  etiquetaMedio,
} from "@estacionar/ui";
import type { PermisionarioConSector } from "@estacionar/ui";
import type { Pago, VehicleType } from "@estacionar/core";

const OPCIONES_MINUTOS = [30, 60, 90, 120];

interface RecaudacionHoy {
  digital: number;
  cash: number;
  total: number;
  count: number;
}

export default function App() {
  const client = useMemo(() => crearClient(), []);

  const [perm, setPerm] = useState<PermisionarioConSector | null>(null);
  const [recaudacion, setRecaudacion] = useState<RecaudacionHoy | null>(null);
  const [movimientos, setMovimientos] = useState<Pago[]>([]);
  const [cargandoInicial, setCargandoInicial] = useState(true);
  const [apiCaida, setApiCaida] = useState(false);

  // Estado del formulario de efectivo
  const [plate, setPlate] = useState("AC456DE");
  const [vehicleType, setVehicleType] = useState<VehicleType>("auto");
  const [minutes, setMinutes] = useState(60);
  const [registrando, setRegistrando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Refresca recaudacion y movimientos del permisionario activo.
  async function refrescar(permisionarioId: string) {
    const [rec, movs] = await Promise.all([
      client.getRecaudacionHoy(permisionarioId),
      client.getMovimientos(permisionarioId),
    ]);
    setRecaudacion(rec);
    setMovimientos(movs);
  }

  // Carga inicial: tomamos el primer permisionario activo (credencial demo).
  useEffect(() => {
    let vigente = true;
    (async () => {
      try {
        const permisionarios = await client.getPermisionarios();
        const activo = permisionarios.find((p) => p.status === "active") ?? permisionarios[0];
        if (!activo) throw new Error("No hay permisionarios.");
        if (!vigente) return;
        setPerm(activo);
        await refrescar(activo.id);
        if (vigente) setApiCaida(false);
      } catch {
        if (vigente) setApiCaida(true);
      } finally {
        if (vigente) setCargandoInicial(false);
      }
    })();
    return () => {
      vigente = false;
    };
  }, [client]);

  async function registrarEfectivo() {
    if (!perm) return;
    setError(null);
    setAviso(null);
    setRegistrando(true);
    try {
      // idempotencyKey unica por operacion: antiduplicidad de efectivo (registro inmutable).
      const idempotencyKey = `ef-${perm.id}-${plate}-${minutes}-${crypto.randomUUID()}`;
      const r = await client.pagarEfectivo({ plate, vehicleType, minutes, permisionarioId: perm.id, idempotencyKey });
      if (r.duplicado) {
        setAviso("Operación ya registrada (antiduplicidad).");
      } else {
        setAviso(`Efectivo registrado: ${formatARS(r.pago.amount)} · ${r.pago.plate}`);
      }
      await refrescar(perm.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo registrar el efectivo.");
    } finally {
      setRegistrando(false);
    }
  }

  if (cargandoInicial) {
    return (
      <div className="min-h-screen bg-nocturno text-texto">
        <MarcaDemo texto="APP PERMISIONARIO DEMO — registros inmutables" />
        <Cargando texto="Cargando credencial…" />
      </div>
    );
  }

  if (apiCaida || !perm) {
    return (
      <div className="min-h-screen bg-nocturno text-texto">
        <MarcaDemo texto="APP PERMISIONARIO DEMO — registros inmutables" />
        <div className="mx-auto max-w-md px-6 py-20 text-center">
          <h1 className="text-2xl font-bold">Sin conexión con la API</h1>
          <p className="mt-3 text-texto-tenue">Levantá la demo completa con <b>DEMO_START.ps1</b> (la API corre en el puerto 4000).</p>
        </div>
      </div>
    );
  }

  const qrCorto = perm.qrToken ? `${perm.qrToken.slice(0, 22)}…` : "—";

  return (
    <div className="min-h-screen bg-nocturno text-texto">
      <MarcaDemo texto="APP PERMISIONARIO DEMO — registros inmutables" />
      <main className="mx-auto grid min-h-screen max-w-6xl gap-8 px-6 py-8 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
        <section>
          <div className="flex flex-wrap items-center gap-3">
            <Logo />
            <div className="rounded-2xl bg-white px-3 py-2 shadow-sm">
              <img src="/municipalidad-salta.jpeg" alt="Municipalidad de Salta" className="h-8 w-auto object-contain" />
            </div>
            <a href="http://localhost:5173" className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-texto-tenue hover:text-texto">Volver al backoffice</a>
          </div>
          <div className="mt-3"><Badge tono="cyan">Credencial activa · Municipalidad de Salta</Badge></div>
          <h1 className="mt-5 text-5xl font-extrabold leading-tight tracking-tight">Tu recaudación clara, tu QR protegido.</h1>
          <p className="mt-4 max-w-xl text-lg text-texto-tenue">La app del permisionario registra efectivo sin duplicados, muestra movimientos del día y mantiene al Municipio viendo la recaudación en tiempo real.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <Kpi label="Hoy" valor={formatARS(recaudacion?.total ?? 0)} sub={`${recaudacion?.count ?? 0} operaciones`} />
            <Kpi label="Digital" valor={formatARS(recaudacion?.digital ?? 0)} />
            <Kpi label="Efectivo" valor={formatARS(recaudacion?.cash ?? 0)} acento="ambar" />
          </div>
        </section>

        <section className="relative mx-auto w-full max-w-md rounded-[2rem] border border-white/10 bg-gradient-to-br from-profundo to-nocturno p-4 shadow-2xl">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-texto-tenue">Permisionario</p>
                <h2 className="text-2xl font-extrabold">{perm.fullName.replace(" (DEMO)", "")}</h2>
              </div>
              <EstadoPill estado={perm.status} />
            </div>
            <div className="my-5 rounded-3xl bg-white p-6 text-[#0A1A2F]">
              <div className="mb-4 flex items-center justify-between"><b>QR Credencial</b><span className="text-xs font-bold text-[#0067B1]">{perm.sector?.name ?? perm.sectorId}</span></div>
              <div className="grid place-items-center"><div className="grid h-36 w-36 grid-cols-6 gap-1 rounded-xl bg-white p-2 shadow-inner">{Array.from({ length: 36 }).map((_, i) => <span key={i} className={(i % 3 === 0 || i % 5 === 0 || i === 7) ? "bg-[#0067B1]" : "bg-[#0A1A2F]/10"} />)}</div></div>
              <p className="mt-3 break-all text-center font-mono text-[10px] text-slate-400">{qrCorto}</p>
            </div>
            <Tarjeta titulo="Registrar efectivo" className="mb-4">
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
              <Boton className="mt-4 w-full" variante="ambar" grande onClick={registrarEfectivo} cargando={registrando} disabled={!plate}>
                Cargá pago auditado
              </Boton>
              {aviso && <p className="mt-3 rounded-xl bg-emerald-500/15 px-3 py-2 text-sm text-emerald-300">{aviso}</p>}
              {error && <p className="mt-3 rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-300">{error}</p>}
            </Tarjeta>
            <Tarjeta titulo="Últimos movimientos">
              {movimientos.length === 0 && <p className="text-sm text-texto-tenue">Sin movimientos todavía.</p>}
              {movimientos.slice(0, 4).map((p) => (
                <div key={p.id} className="mb-2 flex items-center justify-between gap-2 rounded-xl bg-white/5 p-3 text-sm">
                  <span className="font-mono">{p.plate}</span>
                  <span className="flex items-center gap-2">
                    <Badge tono={p.method === "cash" ? "alerta" : "cyan"}>{etiquetaMedio(p.method)}</Badge>
                    <span className="text-xs text-texto-tenue">{formatHora(p.createdAt)}</span>
                  </span>
                  <b>{formatARS(p.amount)}</b>
                </div>
              ))}
            </Tarjeta>
          </div>
        </section>
      </main>
    </div>
  );
}
