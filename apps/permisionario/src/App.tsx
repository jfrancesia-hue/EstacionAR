import { Badge, Boton, Kpi, Logo, MarcaDemo, Tarjeta } from "@estacionar/ui";
import { buildSeed } from "@estacionar/core";

const seed = buildSeed("2026-06-05T13:00:00.000Z");
const perm = seed.permisionarios[0]!;
const pagos = seed.pagos.filter((p) => p.permisionarioId === perm.id && p.createdAt.startsWith("2026-06-05"));
const total = pagos.reduce((sum, p) => sum + p.amount, 0);
const cash = pagos.filter((p) => p.method === "cash").reduce((sum, p) => sum + p.amount, 0);
const digital = total - cash;
const fmt = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

export default function App() {
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
          <div className="mt-8 grid gap-4 sm:grid-cols-3"><Kpi label="Hoy" valor={fmt.format(total)} /><Kpi label="Digital" valor={fmt.format(digital)} /><Kpi label="Efectivo" valor={fmt.format(cash)} acento="ambar" /></div>
        </section>

        <section className="relative mx-auto w-full max-w-md rounded-[2rem] border border-white/10 bg-gradient-to-br from-profundo to-nocturno p-4 shadow-2xl">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-wider text-texto-tenue">Permisionario</p><h2 className="text-2xl font-extrabold">{perm.fullName.replace(" (DEMO)", "")}</h2></div><Badge tono="ok">Activo</Badge></div>
            <div className="my-5 rounded-3xl bg-white p-6 text-[#0A1A2F]">
              <div className="mb-4 flex items-center justify-between"><b>QR Credencial</b><span className="text-xs font-bold text-[#0067B1]">{perm.sectorId}</span></div>
              <div className="grid place-items-center"><div className="grid h-36 w-36 grid-cols-6 gap-1 rounded-xl bg-white p-2 shadow-inner">{Array.from({ length: 36 }).map((_, i) => <span key={i} className={(i % 3 === 0 || i % 5 === 0 || i === 7) ? "bg-[#0067B1]" : "bg-[#0A1A2F]/10"} />)}</div></div>
            </div>
            <Tarjeta titulo="Registrar efectivo" className="mb-4">
              <div className="grid grid-cols-2 gap-3 text-sm"><div className="rounded-xl bg-white/5 p-3"><p className="text-texto-tenue">Patente</p><b>AC456DE</b></div><div className="rounded-xl bg-white/5 p-3"><p className="text-texto-tenue">Tiempo</p><b>60 min</b></div></div>
              <Boton className="mt-4 w-full" variante="ambar" grande>Cargá pago auditado</Boton>
            </Tarjeta>
            <Tarjeta titulo="Últimos movimientos">
              {pagos.slice(0, 3).map((p) => <div key={p.id} className="mb-2 flex items-center justify-between rounded-xl bg-white/5 p-3 text-sm"><span>{p.plate}</span><Badge tono={p.method === "cash" ? "alerta" : "cyan"}>{p.method}</Badge><b>{fmt.format(p.amount)}</b></div>)}
            </Tarjeta>
          </div>
        </section>
      </main>
    </div>
  );
}
