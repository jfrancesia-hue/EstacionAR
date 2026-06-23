import { Badge, Boton, Logo, Tarjeta } from "@estacionar/ui";
import { CUENTAS_DEMO, type Rol } from "../auth.js";

const ACCESOS: Array<{ rol: Rol; icono: string; acento: string }> = [
  { rol: "conductor", icono: "🚗", acento: "border-cyan/30 bg-white" },
  { rol: "permisionario", icono: "🎟️", acento: "border-ambar/35 bg-white" },
  { rol: "admin", icono: "🏛️", acento: "border-[#163A63]/20 bg-white" },
];

export function VistaHome({ onElegirRol }: { onElegirRol: (rol: Rol) => void }) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <section className="relative overflow-hidden rounded-xl border border-borde bg-white p-5 shadow-card sm:p-8 lg:grid lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:gap-10">
        <div className="absolute right-0 top-0 h-24 w-24 bg-cyan" aria-hidden="true" />
        <div className="absolute right-24 top-0 h-14 w-14 bg-ambar" aria-hidden="true" />
        <div className="absolute right-0 top-24 h-10 w-10 bg-profundo" aria-hidden="true" />
        <div className="absolute bottom-0 left-0 h-2 w-2/3 bg-cyan" aria-hidden="true" />
        <div className="relative">
          <img src="/catamarca-logo.png" alt="Municipalidad de San Fernando del Valle de Catamarca" className="mb-6 h-14 w-auto object-contain sm:h-16" />
          <div className="flex flex-wrap items-center gap-3">
            <Badge tono="cyan">Catamarca Capital · Tránsito Municipal</Badge>
          </div>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.02] tracking-tight md:text-7xl">
            Estacionamiento medido para una <span className="text-cyan">ciudad más ordenada</span>.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-texto-tenue">
            Demo municipal para ordenar el estacionamiento medido en el microcentro de SFVC. Pagás por patente con comprobante digital, el permisionario ve la operación al momento y Tránsito Municipal fiscaliza sectores, comprobantes, credenciales y recaudación en tiempo real.
          </p>
          <div className="mt-8 flex flex-wrap gap-6 text-sm text-texto-tenue">
            <span>✓ Pago por patente (billetera de tiempo)</span>
            <span>✓ 10% de recaudación para la Municipalidad</span>
            <span>✓ Dirección: Los Regionales esq. Santa Fe</span>
            <span>✓ Atención municipal: lunes a viernes, 07/08 a 13 hs</span>
          </div>
        </div>

        <div className="relative mt-8 lg:mt-0">
          <div className="grid gap-4">
            {ACCESOS.map(({ rol, icono, acento }) => {
              const c = CUENTAS_DEMO[rol];
              return (
                <Tarjeta key={rol} className={`${acento} transition hover:-translate-y-0.5 hover:border-cyan/50`}>
                  <div className="flex items-center gap-4">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-profundo text-2xl">{icono}</span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-bold text-texto">{c.titulo}</h3>
                      <p className="text-sm text-texto-tenue">{c.descripcion}</p>
                    </div>
                    <Boton onClick={() => onElegirRol(rol)}>Ingresar</Boton>
                  </div>
                </Tarjeta>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <Tarjeta titulo="Para el conductor">
          <p className="text-sm text-texto-tenue">Escaneás un QR, ingresás tu patente y activás tiempo. Si te movés de sector, no pagás de nuevo.</p>
        </Tarjeta>
        <Tarjeta titulo="Para el permisionario">
          <p className="text-sm text-texto-tenue">Ves cada pago acreditado en el momento y cargás efectivo de forma inmutable y sin duplicados.</p>
        </Tarjeta>
        <Tarjeta titulo="Para Tránsito Municipal">
          <p className="text-sm text-texto-tenue">Fiscaliza operaciones online, sectores, comprobantes, credenciales y posibles espacios reservados sin administrar transferencias masivas.</p>
        </Tarjeta>
      </section>

      <div className="mt-10 flex items-center justify-center gap-2 text-xs text-texto-tenue">
        <Logo size={20} withText={false} /> EstacionAR · Demo Nativos Consultora
      </div>
    </main>
  );
}
