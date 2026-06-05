import { Badge, Boton, Kpi, Logo, MarcaDemo, Tarjeta } from "@estacionar/ui";
import { buildSeed } from "@estacionar/core";

const seed = buildSeed("2026-06-05T13:00:00.000Z");
const todayPayments = seed.pagos.filter((p) => p.createdAt.startsWith("2026-06-05"));
const total = todayPayments.reduce((sum, p) => sum + p.amount, 0);
const digital = todayPayments.filter((p) => p.method !== "cash").reduce((sum, p) => sum + p.amount, 0);
const cash = todayPayments.filter((p) => p.method === "cash").reduce((sum, p) => sum + p.amount, 0);
const activeSessions = seed.sesiones.filter((s) => s.status === "active").length;
const fmt = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

function CityMap() {
  const sectors = seed.sectores.slice(0, 6);
  return (
    <div className="relative min-h-[360px] overflow-hidden rounded-[2rem] border border-cyan/20 bg-[#061323] p-6 shadow-2xl">
      <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(15,182,206,.16)_1px,transparent_1px),linear-gradient(90deg,rgba(15,182,206,.16)_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-cyan/20 blur-3xl" />
      <div className="absolute bottom-0 left-10 h-28 w-[80%] rounded-t-full bg-ambar/10 blur-3xl" />
      <div className="relative grid grid-cols-3 gap-4">
        {sectors.map((sector, idx) => (
          <div key={sector.id} className="group rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur transition hover:-translate-y-1 hover:border-cyan/50">
            <div className="mb-3 flex items-center justify-between">
              <span className="h-3 w-3 rounded-full bg-cyan shadow-[0_0_18px_#0FB6CE]" />
              <Badge tono={sector.shift === "nocturno" ? "alerta" : "cyan"}>{sector.shift}</Badge>
            </div>
            <p className="text-sm font-bold text-white">{sector.name}</p>
            <p className="mt-2 text-xs text-texto-tenue">Ocupación demo {72 - idx * 6}%</p>
            <div className="mt-4 h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-gradient-to-r from-cyan to-ambar" style={{ width: `${72 - idx * 6}%` }} /></div>
          </div>
        ))}
      </div>
      <div className="relative mt-6 rounded-2xl border border-ambar/20 bg-ambar/10 p-4 text-sm text-ambar-400">
        Circuito fiscal visible: QR firmado → patente → pago → sesión activa → rendición municipal.
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-nocturno text-texto">
      <MarcaDemo />
      <header className="sticky top-0 z-20 border-b border-white/10 bg-nocturno/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Logo />
          <div className="flex items-center gap-3"><Badge tono="cyan">Municipalidad de Salta</Badge><Boton variante="ambar">Solicitar demo</Boton></div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-10">
        <section className="grid gap-8 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
          <div>
            <Badge tono="cyan">EstacionAR · Control municipal en tiempo real</Badge>
            <h1 className="mt-5 text-5xl font-extrabold leading-tight tracking-tight md:text-7xl">
              Estacionamiento medido con <span className="text-cyan">recaudación trazable</span> para Salta.
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-texto-tenue">
              Una plataforma MotionSite + backoffice fiscal: el Municipio ve cada peso antes de liquidar, el permisionario conserva su rol y el conductor no paga dos veces si se mueve.
            </p>
            <div className="mt-8 flex flex-wrap gap-3"><Boton grande>Ver panel municipal</Boton><Boton grande variante="secundario">Probar flujo conductor</Boton></div>
          </div>
          <CityMap />
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-4">
          <Kpi label="Recaudación de hoy" valor={fmt.format(total)} sub="Cuenta recaudadora municipal" />
          <Kpi label="Digital" valor={fmt.format(digital)} sub="MP · MODO · QR · Naranja" />
          <Kpi label="Efectivo auditado" valor={fmt.format(cash)} sub="Carga inmutable permisionario" acento="ambar" />
          <Kpi label="Sesiones activas" valor={activeSessions} sub="Billetera por patente" />
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-3">
          <Tarjeta titulo="Tarifas configurables">
            {seed.tarifas.map((t) => <div key={t.id} className="mb-3 flex items-center justify-between rounded-xl bg-white/5 p-3"><span>{t.vehicleType}</span><b>{fmt.format(t.firstUnitAmount)}/h</b><Badge tono="ok">{t.digitalDiscountPct}% digital</Badge></div>)}
          </Tarjeta>
          <Tarjeta titulo="Permisionarios y QR">
            {seed.permisionarios.slice(0,4).map((p) => <div key={p.id} className="mb-3 flex items-center justify-between rounded-xl bg-white/5 p-3"><span>{p.fullName.replace(" (DEMO)", "")}</span><Badge tono={p.status === "active" ? "ok" : "alerta"}>{p.status === "active" ? "Activo" : "Suspendido"}</Badge></div>)}
          </Tarjeta>
          <Tarjeta titulo="Auditoría fiscal">
            <ol className="space-y-3 text-sm text-texto-tenue">
              <li>✓ Pago digital aprobado en cuenta municipal</li><li>✓ Efectivo registrado con idempotencia</li><li>✓ Cambio tarifario trazado</li><li>✓ QR suspendido rechazado</li>
            </ol>
          </Tarjeta>
        </section>
      </main>
    </div>
  );
}
