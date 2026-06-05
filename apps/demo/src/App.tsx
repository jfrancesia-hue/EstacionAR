import { useState } from "react";
import { Boton, Logo, MarcaDemo } from "@estacionar/ui";
import { VistaConductor } from "./vistas/Conductor.js";
import { VistaPermisionario } from "./vistas/Permisionario.js";
import { VistaBackoffice } from "./vistas/Backoffice.js";
import { reiniciarDemo } from "./store.js";

export type Tab = "backoffice" | "conductor" | "permisionario";

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "backoffice", label: "Backoffice" },
  { id: "conductor", label: "Conductor" },
  { id: "permisionario", label: "Permisionario" },
];

export default function App() {
  const [tab, setTab] = useState<Tab>("backoffice");
  // `version` fuerza el remontaje de la vista (re-lee el store) al cambiar de pestaña o reiniciar.
  const [version, setVersion] = useState(0);

  function irA(t: Tab) {
    setTab(t);
    setVersion((v) => v + 1);
  }

  function reiniciar() {
    reiniciarDemo();
    setVersion((v) => v + 1);
  }

  return (
    <div className="min-h-screen bg-nocturno text-texto">
      <MarcaDemo texto="DEMO EstacionAR — datos de muestra · pagos simulados (en producción se integran Mercado Pago, MODO y Naranja X)" />
      <header className="sticky top-0 z-20 border-b border-white/10 bg-nocturno/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Logo />
          <nav className="order-3 flex w-full gap-1 rounded-2xl border border-white/10 bg-white/5 p-1 sm:order-2 sm:w-auto">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => irA(t.id)}
                className={`flex-1 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition sm:flex-none ${
                  tab === t.id ? "bg-cyan text-nocturno shadow-glow" : "text-texto-tenue hover:text-texto"
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
          <div className="order-2 flex items-center gap-3 sm:order-3">
            <div className="hidden items-center rounded-2xl bg-white px-3 py-1.5 shadow-sm sm:flex">
              <img src="/municipalidad-salta.jpeg" alt="Municipalidad de Salta" className="h-8 w-auto object-contain" />
            </div>
            <Boton variante="secundario" onClick={reiniciar}>Reiniciar</Boton>
          </div>
        </div>
      </header>

      <div key={`${tab}-${version}`}>
        {tab === "backoffice" && <VistaBackoffice onIrA={irA} />}
        {tab === "conductor" && <VistaConductor />}
        {tab === "permisionario" && <VistaPermisionario />}
      </div>

      <footer className="mx-auto max-w-7xl px-6 py-8 text-center text-xs text-texto-tenue">
        EstacionAR · Plataforma de estacionamiento medido para la Municipalidad de Salta · Demo Nativos Consultora
      </footer>
    </div>
  );
}
