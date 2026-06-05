import { useState } from "react";
import { Badge, Boton, Logo, MarcaDemo } from "@estacionar/ui";
import { VistaHome } from "./vistas/Home.js";
import { VistaLogin } from "./vistas/Login.js";
import { VistaConductor } from "./vistas/Conductor.js";
import { VistaPermisionario } from "./vistas/Permisionario.js";
import { VistaBackoffice } from "./vistas/Backoffice.js";
import { reiniciarDemo } from "./store.js";
import { CUENTAS_DEMO, type Rol, type SesionDemo } from "./auth.js";

type Pantalla = { tipo: "home" } | { tipo: "login"; rol: Rol };

const BANNER = "DEMO EstacionAR — datos de muestra · pagos simulados (en producción se integran Mercado Pago, MODO y Naranja X)";

export default function App() {
  const [sesion, setSesion] = useState<SesionDemo | null>(null);
  const [pantalla, setPantalla] = useState<Pantalla>({ tipo: "home" });
  // `version` fuerza el remontaje de la vista (re-lee el store) al entrar o reiniciar.
  const [version, setVersion] = useState(0);

  function iniciar(s: SesionDemo) {
    setSesion(s);
    setVersion((v) => v + 1);
  }

  function cerrarSesion() {
    setSesion(null);
    setPantalla({ tipo: "home" });
  }

  function reiniciar() {
    reiniciarDemo();
    setVersion((v) => v + 1);
  }

  // ── Sin sesión: home pública o login ──────────────────────────────────────────
  if (!sesion) {
    return (
      <div className="min-h-screen bg-nocturno text-texto">
        <a href="#contenido" className="skip-link">Saltar al contenido</a>
        <MarcaDemo texto={BANNER} />
        <header className="border-b border-white/10">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
            <Logo />
            <div className="hidden items-center rounded-2xl bg-white px-3 py-1.5 shadow-sm sm:flex">
              <img src="/municipalidad-salta.jpeg" alt="Municipalidad de Salta" className="h-8 w-auto object-contain" />
            </div>
          </div>
        </header>
        <div id="contenido" tabIndex={-1}>
          {pantalla.tipo === "home" ? (
            <VistaHome onElegirRol={(rol) => setPantalla({ tipo: "login", rol })} />
          ) : (
            <VistaLogin rol={pantalla.rol} onIngresar={iniciar} onVolver={() => setPantalla({ tipo: "home" })} />
          )}
        </div>
      </div>
    );
  }

  // ── Con sesión: app del rol ───────────────────────────────────────────────────
  const titulo = CUENTAS_DEMO[sesion.rol].titulo;

  return (
    <div className="min-h-screen bg-nocturno text-texto">
      <a href="#contenido" className="skip-link">Saltar al contenido</a>
      <MarcaDemo texto={BANNER} />
      <header className="sticky top-0 z-20 border-b border-white/10 bg-nocturno/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Logo />
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold leading-tight">{sesion.nombre}</p>
              <p className="text-xs text-texto-tenue">{sesion.email}</p>
            </div>
            <Badge tono="cyan">{titulo}</Badge>
            <Boton variante="fantasma" onClick={reiniciar}>Reiniciar</Boton>
            <Boton variante="secundario" onClick={cerrarSesion}>Cerrar sesión</Boton>
          </div>
        </div>
      </header>

      <div id="contenido" tabIndex={-1} key={`${sesion.rol}-${version}`}>
        {sesion.rol === "conductor" && <VistaConductor />}
        {sesion.rol === "permisionario" && <VistaPermisionario />}
        {sesion.rol === "admin" && <VistaBackoffice />}
      </div>

      <footer className="mx-auto max-w-7xl px-6 py-8 text-center text-xs text-texto-tenue">
        EstacionAR · Plataforma de estacionamiento medido para la Municipalidad de Salta · Demo Nativos Consultora
      </footer>
    </div>
  );
}
