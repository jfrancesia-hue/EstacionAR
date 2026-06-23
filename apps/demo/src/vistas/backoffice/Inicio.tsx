import { Badge, Kpi, Tarjeta, formatARS } from "@estacionar/ui";
import { MapaSectores } from "./Mapa.js";
import { desglosarPagado, SPLIT } from "../../split.js";
import type { DatosBackoffice } from "./tipos.js";

export function SeccionInicio({ datos }: { datos: DatosBackoffice }) {
  const k = datos.dashboard.kpis;
  const sp = desglosarPagado(k.recaudacionTotal);
  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-4">
        <Kpi label="Transado hoy" valor={formatARS(k.recaudacionHoy)} sub={`${k.operaciones} operaciones fiscalizadas`} />
        <Kpi label="Acreditado a permisionarios" valor={formatARS(sp.permisionario)} sub={`${SPLIT.permisionarioPct}% · directo, sin liquidar`} />
        <Kpi label="Plataforma (Nativos)" valor={formatARS(sp.plataforma)} sub={`${SPLIT.plataformaPct}% · sostén del sistema`} acento="ambar" />
        <Kpi label="Al Municipio" valor="$0" sub="No maneja fondos: fiscaliza" acento="texto" />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <div>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-texto-tenue">Mapa de sectores fiscalizados</h2>
          <MapaSectores sectores={datos.dashboard.porSector} />
        </div>
        <div>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-texto-tenue">Acreditación por permisionario</h2>
          <Tarjeta>
            <div className="space-y-2">
              {datos.dashboard.porPermisionario.slice(0, 6).map((p, i) => (
                <div key={p.permisionarioId} className="flex items-center justify-between gap-3 rounded-xl bg-white/5 p-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-cyan/20 text-xs font-bold text-cyan">{i + 1}</span>
                    <span className="truncate">{p.fullName.replace(" (DEMO)", "")}</span>
                  </span>
                  <span className="text-texto-tenue">{p.ops} ops</span>
                  <b className="text-cyan">{formatARS(desglosarPagado(p.total).permisionario)}</b>
                </div>
              ))}
            </div>
          </Tarjeta>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <Kpi label="Permisionarios activos" valor={k.permisionariosActivos} acento="texto" />
            <Kpi label="Sectores" valor={k.sectores} acento="texto" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[.9fr_1.1fr]">
        <Tarjeta titulo="Dirección de Tránsito Municipal" accion={<Badge tono="cyan">SFVC</Badge>}>
          <div className="space-y-2 text-sm text-texto-tenue">
            <p><b className="text-texto">Base operativa:</b> Los Regionales esq. Santa Fe.</p>
            <p><b className="text-texto">Mesa General de Entradas:</b> Maipú 611.</p>
            <p><b className="text-texto">Estacionamiento Ordenado:</b> referencia operativa Sarmiento 1050.</p>
            <p><b className="text-texto">Atención:</b> lunes a viernes, 07/08 a 13 hs · 03834-437-417.</p>
            <p><b className="text-texto">Contacto:</b> transitomunicipal@catamarcaciudad.gob.ar.</p>
          </div>
        </Tarjeta>
        <Tarjeta titulo="Tesis comercial" accion={<Badge tono="cyan">Para el Municipio</Badge>}>
          <div className="grid gap-3 text-sm text-texto-tenue md:grid-cols-3">
            <p><b className="text-texto">El permisionario cobra al instante.</b> Su {SPLIT.permisionarioPct}% se acredita directo a su cuenta en cada pago digital — sin liquidar a cientos de personas ni pasar por rentas generales.</p>
            <p><b className="text-texto">Tránsito Municipal fiscaliza.</b> Puede controlar pagos, credenciales, patentes, sectores y espacios reservados sin manejar fondos.</p>
            <p><b className="text-texto">El ciudadano paga menos.</b> {SPLIT.descuentoCiudadanoPct}% de descuento por usar la app vs. el efectivo con talonario, con comprobante digital.</p>
          </div>
        </Tarjeta>
      </section>
    </div>
  );
}
