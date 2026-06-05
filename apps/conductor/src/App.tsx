import { Badge, Boton, Kpi, Logo, MarcaDemo, Tarjeta } from "@estacionar/ui";
import { buildSeed, calcularTarifa } from "@estacionar/core";

const seed = buildSeed("2026-06-05T13:00:00.000Z");
const tarifa = seed.tarifas.find((t) => t.vehicleType === "auto")!;
const precio = calcularTarifa({ vehicleType: "auto", minutes: 60, isDigital: true, date: "2026-06-05T13:00:00.000Z", tarifa, feriados: seed.config.feriados });
const fmt = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

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

export default function App() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-nocturno text-texto">
      <MarcaDemo texto="APP CONDUCTOR DEMO — Municipalidad de Salta" />
      <main className="mx-auto grid min-h-[calc(100vh-28px)] max-w-6xl gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[.92fr_1.08fr] lg:items-center lg:py-10">
        <section className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <Logo />
            <Badge tono="cyan">Municipalidad de Salta</Badge>
          </div>
          <h1 className="mt-5 max-w-2xl text-4xl font-extrabold leading-[0.98] tracking-tight sm:text-5xl lg:text-6xl">
            Pagá tu estacionamiento en segundos.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-texto-tenue sm:text-lg">
            Escaneás el QR del permisionario, ingresás tu patente y activás una billetera de tiempo. Si te movés de sector, no volvés a pagar.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <Kpi label="Patente" valor="AB123CD" />
            <Kpi label="Tiempo" valor="60 min" />
            <Kpi label="Precio digital" valor={fmt.format(precio.amount)} acento="ambar" />
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

            <div className="my-5 grid place-items-center rounded-3xl bg-[#F5F7FA] p-5 sm:p-7">
              <QrDemo />
            </div>

            <Tarjeta className="border-slate-200 bg-slate-50 p-4 text-slate-900 shadow-none" titulo={<span className="text-slate-500">Pago de estacionamiento</span>}>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4"><span className="text-slate-500">Sector</span><b className="text-right">Paseo Balcarce</b></div>
                <div className="flex items-center justify-between gap-4"><span className="text-slate-500">Patente</span><b className="rounded-lg bg-[#0067B1] px-2 py-1 tracking-widest text-white">AB123CD</b></div>
                <div className="flex items-center justify-between gap-4"><span className="text-slate-500">Vigencia</span><b className="text-right">13:00 → 14:00</b></div>
                <div className="flex items-end justify-between gap-4 border-t border-slate-200 pt-3 text-lg"><span className="text-slate-500">Total</span><b className="text-2xl text-[#0067B1]">{fmt.format(precio.amount)}</b></div>
              </div>
              <Boton className="mt-5 w-full whitespace-nowrap" grande>Pagá y activá</Boton>
            </Tarjeta>
          </div>
          <div className="relative mt-4 rounded-2xl border border-cyan/20 bg-cyan/10 p-4 text-sm leading-relaxed text-cyan-300">
            Comprobante municipal listo para descargar o enviar por WhatsApp. La recaudación entra primero al Municipio.
          </div>
        </section>
      </main>
    </div>
  );
}
