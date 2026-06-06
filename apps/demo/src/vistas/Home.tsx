import { Badge, Boton, Logo, Tarjeta } from "@estacionar/ui";
import { CUENTAS_DEMO, type Rol } from "../auth.js";

const ACCESOS: Array<{ rol: Rol; icono: string; acento: string }> = [
  { rol: "conductor", icono: "🚗", acento: "from-cyan/15 to-superficie/80 border-cyan/30" },
  { rol: "permisionario", icono: "🎟️", acento: "from-ambar/15 to-superficie/80 border-ambar/30" },
  { rol: "admin", icono: "🏛️", acento: "from-white/10 to-superficie/80 border-white/15" },
];

export function VistaHome({ onElegirRol }: { onElegirRol: (rol: Rol) => void }) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <section className="grid gap-10 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge tono="cyan">Estacionamiento medido · Municipalidad de Salta</Badge>
          </div>
          <h1 className="mt-5 text-5xl font-extrabold leading-[0.98] tracking-tight md:text-7xl">
            Estacionar en Salta, <span className="text-cyan">simple y trazable</span>.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-texto-tenue">
            Una plataforma para el ciudadano, el permisionario y el Municipio. Pago digital por patente con 10% de beneficio,
            acreditación inmediata del pago digital al permisionario y control municipal en tiempo real. Elegí cómo querés ingresar.
          </p>
          <div className="mt-8 flex flex-wrap gap-6 text-sm text-texto-tenue">
            <span>✓ Pago por patente (billetera de tiempo)</span>
            <span>✓ 10% de beneficio por usar la app</span>
            <span>✓ Tarifas configurables</span>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-cyan/20 blur-3xl" />
          <div className="absolute -bottom-10 left-6 h-32 w-56 rounded-full bg-ambar/15 blur-3xl" />
          <div className="relative grid gap-4">
            {ACCESOS.map(({ rol, icono, acento }) => {
              const c = CUENTAS_DEMO[rol];
              return (
                <Tarjeta key={rol} className={`bg-gradient-to-br ${acento}`}>
                  <div className="flex items-center gap-4">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-2xl">{icono}</span>
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

      <section className="mt-14 grid gap-4 sm:grid-cols-3">
        <Tarjeta titulo="Para el conductor">
          <p className="text-sm text-texto-tenue">Escaneás un QR, ingresás tu patente y activás tiempo. Si te movés de sector, no pagás de nuevo.</p>
        </Tarjeta>
        <Tarjeta titulo="Para el permisionario">
          <p className="text-sm text-texto-tenue">Ves cada pago acreditado en el momento y cargás efectivo de forma inmutable y sin duplicados.</p>
        </Tarjeta>
        <Tarjeta titulo="Para el Municipio">
          <p className="text-sm text-texto-tenue">No administra transferencias masivas ni rentas generales: fiscaliza operaciones online, sectores y comprobantes.</p>
        </Tarjeta>
      </section>

      <div className="mt-10 flex items-center justify-center gap-2 text-xs text-texto-tenue">
        <Logo size={20} withText={false} /> EstacionAR · Demo Nativos Consultora
      </div>
    </main>
  );
}
