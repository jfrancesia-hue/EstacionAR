import { lazy, Suspense, useState } from "react";
import { Routes, Route, Navigate, Link, useNavigate, useParams } from "react-router-dom";
import { Badge, Boton, Cargando, Logo, MarcaDemo } from "@estacionar/ui";
import { VistaHome } from "./vistas/Home.js";
import { VistaLogin } from "./vistas/Login.js";
import { VistaVerificar } from "./vistas/Verificar.js";
import { reiniciarDemo } from "./store.js";
import { CUENTAS_DEMO, type Rol, type SesionDemo } from "./auth.js";

// Code-splitting por rol: el ciudadano no descarga el código del permisionario ni del backoffice.
const VistaConductor = lazy(() => import("./vistas/Conductor.js").then((m) => ({ default: m.VistaConductor })));
const VistaPermisionario = lazy(() => import("./vistas/Permisionario.js").then((m) => ({ default: m.VistaPermisionario })));
const VistaBackoffice = lazy(() => import("./vistas/Backoffice.js").then((m) => ({ default: m.VistaBackoffice })));

const BANNER = "DEMO EstacionAR — datos de muestra · pagos simulados (en producción se integran Mercado Pago, MODO y Naranja X)";
const RUTA_ROL: Record<Rol, string> = { conductor: "/pagar", permisionario: "/permisionario", admin: "/municipio" };

function HeaderPublico({ volver }: { volver?: boolean }) {
  return (
    <header className="border-b border-borde bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link to="/" aria-label="Ir al inicio" className="flex min-w-0 items-center gap-3">
          <img src="/catamarca-logo.png" alt="Municipalidad de San Fernando del Valle de Catamarca" className="h-9 w-auto object-contain sm:h-10" />
          <span className="hidden h-8 w-px bg-borde sm:block" aria-hidden="true" />
          <span className="hidden sm:block"><Logo /></span>
        </Link>
        <div className="flex shrink-0 items-center gap-2">
          {volver && <Link to="/" className="rounded-lg border border-borde bg-profundo px-3 py-1.5 text-xs font-semibold text-texto-tenue hover:text-texto">← Inicio</Link>}
          <Link to="/verificar" className="hidden rounded-lg border border-borde bg-profundo px-3 py-1.5 text-xs font-semibold text-texto-tenue hover:text-texto sm:inline-block">Verificar comprobante</Link>
        </div>
      </div>
    </header>
  );
}

function HeaderLogueado({ sesion, onReiniciar, onCerrar }: { sesion: SesionDemo; onReiniciar: () => void; onCerrar: () => void }) {
  return (
    <header className="sticky top-0 z-20 border-b border-borde bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link to="/" aria-label="Ir al inicio" className="flex min-w-0 items-center gap-3"><img src="/catamarca-logo.png" alt="Municipalidad de San Fernando del Valle de Catamarca" className="h-9 w-auto object-contain" /><span className="hidden sm:block"><Logo /></span></Link>
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold leading-tight">{sesion.nombre}</p>
            <p className="text-xs text-texto-tenue">{sesion.email}</p>
          </div>
          <Badge tono="cyan">{CUENTAS_DEMO[sesion.rol].titulo}</Badge>
          <Boton variante="fantasma" onClick={onReiniciar}>Reiniciar</Boton>
          <Boton variante="secundario" onClick={onCerrar}>Cerrar sesión</Boton>
        </div>
      </div>
    </header>
  );
}

function HomeRoute() {
  const navigate = useNavigate();
  return (
    <>
      <HeaderPublico />
      <div id="contenido" tabIndex={-1}>
        <VistaHome onElegirRol={(rol) => navigate(RUTA_ROL[rol])} />
      </div>
    </>
  );
}

function VerificarRoute() {
  return (
    <>
      <HeaderPublico volver />
      <div id="contenido" tabIndex={-1}>
        <VistaVerificar />
      </div>
    </>
  );
}

function CiudadanoRoute() {
  const { qrId } = useParams();
  return (
    <>
      <HeaderPublico volver />
      <div id="contenido" tabIndex={-1}>
        <Suspense fallback={<Cargando texto="Cargando…" />}>
          <VistaConductor qrId={qrId} />
        </Suspense>
      </div>
    </>
  );
}

function RutaRol({
  rol,
  sesion,
  onLogin,
  onReiniciar,
  onCerrar,
}: {
  rol: Rol;
  sesion: SesionDemo | null;
  onLogin: (s: SesionDemo) => void;
  onReiniciar: () => void;
  onCerrar: () => void;
}) {
  const navigate = useNavigate();
  if (!sesion || sesion.rol !== rol) {
    return (
      <>
        <HeaderPublico volver />
        <div id="contenido" tabIndex={-1}>
          <VistaLogin rol={rol} onIngresar={onLogin} onVolver={() => navigate("/")} />
        </div>
      </>
    );
  }
  return (
    <>
      <HeaderLogueado sesion={sesion} onReiniciar={onReiniciar} onCerrar={() => { onCerrar(); navigate("/"); }} />
      <div id="contenido" tabIndex={-1}>
        <Suspense fallback={<Cargando texto="Cargando…" />}>
          {rol === "permisionario" ? <VistaPermisionario /> : <VistaBackoffice />}
        </Suspense>
      </div>
    </>
  );
}

export default function App() {
  // La sesión persiste en sessionStorage: refrescar no te saca al login.
  const [sesion, setSesion] = useState<SesionDemo | null>(() => {
    try {
      const s = sessionStorage.getItem("estacionar:sesion");
      return s ? (JSON.parse(s) as SesionDemo) : null;
    } catch {
      return null;
    }
  });
  const [version, setVersion] = useState(0);
  function guardarSesion(s: SesionDemo | null) {
    setSesion(s);
    if (s) sessionStorage.setItem("estacionar:sesion", JSON.stringify(s));
    else sessionStorage.removeItem("estacionar:sesion");
  }
  const reiniciar = () => {
    reiniciarDemo();
    sessionStorage.removeItem("estacionar:orden");
    setVersion((v) => v + 1);
  };

  return (
    <div className="min-h-screen bg-nocturno text-texto">
      <a href="#contenido" className="skip-link">Saltar al contenido</a>
      <MarcaDemo texto={BANNER} />
      <Routes key={version}>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/pagar" element={<CiudadanoRoute />} />
        <Route path="/pagar/:qrId" element={<CiudadanoRoute />} />
        <Route
          path="/permisionario"
          element={<RutaRol rol="permisionario" sesion={sesion} onLogin={guardarSesion} onReiniciar={reiniciar} onCerrar={() => guardarSesion(null)} />}
        />
        <Route
          path="/municipio"
          element={<RutaRol rol="admin" sesion={sesion} onLogin={guardarSesion} onReiniciar={reiniciar} onCerrar={() => guardarSesion(null)} />}
        />
        <Route path="/verificar" element={<VerificarRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <footer className="mx-auto max-w-7xl px-6 py-8 text-center text-xs text-texto-tenue">
        EstacionAR · Plataforma de estacionamiento medido para la Municipalidad de San Fernando del Valle de Catamarca · Demo Nativos Consultora
      </footer>
    </div>
  );
}
