import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Boton,
  Kpi,
  Logo,
  MarcaDemo,
  Tarjeta,
  Cargando,
  EstadoPill,
  crearClient,
  formatARS,
  formatFechaHora,
} from "@estacionar/ui";
import type { Dashboard, PermisionarioConSector } from "@estacionar/ui";
import type { AuditoriaEntry, Tarifa } from "@estacionar/core";

function CityMap({ sectores }: { sectores: Dashboard["porSector"] }) {
  const top = sectores.slice(0, 6);
  const maxTotal = Math.max(1, ...top.map((s) => s.total));
  return (
    <div className="relative min-h-[360px] overflow-hidden rounded-[2rem] border border-cyan/20 bg-[#061323] p-6 shadow-2xl">
      <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(15,182,206,.16)_1px,transparent_1px),linear-gradient(90deg,rgba(15,182,206,.16)_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-cyan/20 blur-3xl" />
      <div className="absolute bottom-0 left-10 h-28 w-[80%] rounded-t-full bg-ambar/10 blur-3xl" />
      <div className="relative grid grid-cols-3 gap-4">
        {top.map((sector) => {
          const pct = Math.round((sector.total / maxTotal) * 100);
          return (
            <div key={sector.sectorId} className="group rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur transition hover:-translate-y-1 hover:border-cyan/50">
              <div className="mb-3 flex items-center justify-between">
                <span className="h-3 w-3 rounded-full bg-cyan shadow-[0_0_18px_#0FB6CE]" />
                <Badge tono={sector.shift === "nocturno" ? "alerta" : "cyan"}>{sector.shift}</Badge>
              </div>
              <p className="text-sm font-bold text-white">{sector.name}</p>
              <p className="mt-2 text-xs text-texto-tenue">{formatARS(sector.total)} · {sector.ops} ops</p>
              <div className="mt-4 h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-gradient-to-r from-cyan to-ambar" style={{ width: `${pct}%` }} /></div>
            </div>
          );
        })}
      </div>
      <div className="relative mt-6 rounded-2xl border border-ambar/20 bg-ambar/10 p-4 text-sm text-ambar-400">
        Circuito fiscal visible: QR firmado → patente → pago → sesión activa → rendición municipal.
      </div>
    </div>
  );
}

export default function App() {
  const client = useMemo(() => crearClient(), []);

  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [tarifas, setTarifas] = useState<Tarifa[]>([]);
  const [permisionarios, setPermisionarios] = useState<PermisionarioConSector[]>([]);
  const [auditoria, setAuditoria] = useState<AuditoriaEntry[]>([]);
  const [cargandoInicial, setCargandoInicial] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [apiCaida, setApiCaida] = useState(false);
  const [ultima, setUltima] = useState<string | null>(null);

  async function cargar() {
    setActualizando(true);
    try {
      const [d, t, p, a] = await Promise.all([
        client.getDashboard(),
        client.getTarifas(),
        client.getPermisionarios(),
        client.getAuditoria(),
      ]);
      setDashboard(d);
      setTarifas(t);
      setPermisionarios(p);
      setAuditoria(a);
      setUltima(new Date().toISOString());
      setApiCaida(false);
    } catch {
      setApiCaida(true);
    } finally {
      setActualizando(false);
      setCargandoInicial(false);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (cargandoInicial) {
    return (
      <div className="min-h-screen bg-nocturno text-texto">
        <MarcaDemo />
        <Cargando texto="Cargando panel municipal…" />
      </div>
    );
  }

  if (apiCaida || !dashboard) {
    return (
      <div className="min-h-screen bg-nocturno text-texto">
        <MarcaDemo />
        <div className="mx-auto max-w-md px-6 py-20 text-center">
          <h1 className="text-2xl font-bold">Sin conexión con la API</h1>
          <p className="mt-3 text-texto-tenue">Levantá la demo completa con <b>DEMO_START.ps1</b> (la API corre en el puerto 4000).</p>
          <Boton className="mt-6" onClick={cargar} cargando={actualizando}>Reintentar</Boton>
        </div>
      </div>
    );
  }

  const k = dashboard.kpis;

  return (
    <div className="min-h-screen bg-nocturno text-texto">
      <MarcaDemo />
      <header className="sticky top-0 z-20 border-b border-white/10 bg-nocturno/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Logo />
          <div className="flex items-center gap-3">
            <div className="hidden items-center rounded-2xl bg-white px-3 py-2 shadow-sm sm:flex">
              <img src="/municipalidad-salta.jpeg" alt="Municipalidad de Salta" className="h-9 w-auto object-contain" />
            </div>
            <Boton variante="ambar" onClick={cargar} cargando={actualizando}>Actualizar</Boton>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-10">
        <section className="grid gap-8 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <Badge tono="cyan">EstacionAR · Control municipal en tiempo real</Badge>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-texto-tenue">Municipalidad de Salta</span>
            </div>
            <h1 className="mt-5 text-5xl font-extrabold leading-tight tracking-tight md:text-7xl">
              Estacionamiento medido con <span className="text-cyan">recaudación trazable</span> para Salta.
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-texto-tenue">
              El Municipio ve cada peso antes de liquidar, el permisionario conserva su rol y el conductor no paga dos veces si se mueve.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="http://localhost:5174" target="_blank" rel="noreferrer"><Boton grande>Probar flujo conductor</Boton></a>
              <a href="http://localhost:5175" target="_blank" rel="noreferrer"><Boton grande variante="secundario">Ver app permisionario</Boton></a>
            </div>
            {ultima && <p className="mt-4 text-xs text-texto-tenue">Datos en vivo desde la API · actualizado {formatFechaHora(ultima)}</p>}
          </div>
          <CityMap sectores={dashboard.porSector} />
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-4">
          <Kpi label="Recaudación de hoy" valor={formatARS(k.recaudacionHoy)} sub="Cuenta recaudadora municipal" />
          <Kpi label="Digital" valor={formatARS(k.digitalTotal)} sub="MP · MODO · QR · Naranja" />
          <Kpi label="Efectivo auditado" valor={formatARS(k.cashTotal)} sub="Carga inmutable permisionario" acento="ambar" />
          <Kpi label="Operaciones" valor={k.operaciones} sub={`Ticket promedio ${formatARS(k.ticketPromedio)}`} />
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-3">
          <Tarjeta titulo="Tarifas configurables" accion={<Badge tono="cyan">{tarifas.length}</Badge>}>
            {tarifas.map((t) => (
              <div key={t.id} className="mb-3 flex items-center justify-between gap-2 rounded-xl bg-white/5 p-3">
                <span className="capitalize">{t.vehicleType}</span>
                <b>{formatARS(t.firstUnitAmount)}/h</b>
                <Badge tono="ok">{t.digitalDiscountPct}% digital</Badge>
              </div>
            ))}
          </Tarjeta>
          <Tarjeta titulo="Permisionarios y QR" accion={<Badge tono="cyan">{k.permisionariosActivos} activos</Badge>}>
            {permisionarios.slice(0, 5).map((p) => (
              <div key={p.id} className="mb-3 flex items-center justify-between gap-2 rounded-xl bg-white/5 p-3">
                <span className="truncate">{p.fullName.replace(" (DEMO)", "")}</span>
                <EstadoPill estado={p.status} />
              </div>
            ))}
          </Tarjeta>
          <Tarjeta titulo="Auditoría fiscal" accion={<Badge tono="cyan">{auditoria.length}</Badge>}>
            <ol className="space-y-2 text-sm text-texto-tenue">
              {auditoria.slice(0, 6).map((a) => (
                <li key={a.id} className="flex items-start gap-2">
                  <span className="mt-0.5 text-emerald-400">✓</span>
                  <span><b className="text-texto">{a.action}</b> · {formatFechaHora(a.createdAt)}</span>
                </li>
              ))}
              {auditoria.length === 0 && <li>Sin eventos auditados todavía.</li>}
            </ol>
          </Tarjeta>
        </section>

        <section className="mt-10">
          <Tarjeta titulo="Recaudación por permisionario">
            <div className="grid gap-3 md:grid-cols-2">
              {dashboard.porPermisionario.slice(0, 6).map((p) => (
                <div key={p.permisionarioId} className="flex items-center justify-between gap-3 rounded-xl bg-white/5 p-3 text-sm">
                  <span className="truncate">{p.fullName.replace(" (DEMO)", "")}</span>
                  <span className="text-texto-tenue">{p.ops} ops</span>
                  <b className="text-cyan">{formatARS(p.total)}</b>
                </div>
              ))}
            </div>
          </Tarjeta>
        </section>
      </main>
    </div>
  );
}
