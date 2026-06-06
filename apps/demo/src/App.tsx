import { useState } from "react";
import { Routes, Route, Navigate, Link, useNavigate, useParams } from "react-router-dom";
import { Badge, Boton, Logo, MarcaDemo } from "@estacionar/ui";
import { VistaHome } from "./vistas/Home.js";
import { VistaLogin } from "./vistas/Login.js";
import { VistaConductor } from "./vistas/Conductor.js";
import { VistaPermisionario } from "./vistas/Permisionario.js";
import { VistaBackoffice } from "./vistas/Backoffice.js";
import { reiniciarDemo } from "./store.js";
import { CUENTAS_DEMO, type Rol, type SesionDemo } from "./auth.js";

const BANNER = "DEMO EstacionAR — datos de muestra · pagos simulados (en producción se integran Mercado Pago, MODO y Naranja X)";
const RUTA_ROL: Record<Rol, string> = { conductor: "/pagar", permisionario: "/permisionario", admin: "/municipio" };

function HeaderPublico({ volver }: { volver?: boolean }) {
  return (
    <header className="border-b border-white/10">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" aria-label="Ir al inicio"><Logo /></Link>
        <div className="flex items-center gap-3">
          {volver && <Link to="/" className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-texto-tenue hover:text-texto">← Inicio</Link>}
          <div className="hidden items-center rounded-2xl bg-white px-3 py-1.5 shadow-sm sm:flex">
            <img src="/municipalidad-salta.jpeg" alt="Municipalidad de Salta" className="h-8 w-auto object-contain" />
          </div>
        </div>
      </div>
    </header>
  );
}

function HeaderLogueado({ sesion, onReiniciar, onCerrar }: { sesion: SesionDemo; onReiniciar: () => void; onCerrar: () => void }) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-nocturno/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link to="/" aria-label="Ir al inicio"><Logo /></Link>
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

function CiudadanoRoute() {
  const { qrId } = useParams();
  return (
    <>
      <HeaderPublico volver />
      <div id="contenido" tabIndex={-1}>
        <VistaConductor qrId={qrId} />
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
        {rol === "permisionario" ? <VistaPermisionario /> : <VistaBackoffice />}
      </div>
    </>
  );
}

export default function App() {
  const [sesion, setSesion] = useState<SesionDemo | null>(null);
  const [version, setVersion] = useState(0);
  const reiniciar = () => {
    reiniciarDemo();
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
          element={<RutaRol rol="permisionario" sesion={sesion} onLogin={setSesion} onReiniciar={reiniciar} onCerrar={() => setSesion(null)} />}
        />
        <Route
          path="/municipio"
          element={<RutaRol rol="admin" sesion={sesion} onLogin={setSesion} onReiniciar={reiniciar} onCerrar={() => setSesion(null)} />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <footer className="mx-auto max-w-7xl px-6 py-8 text-center text-xs text-texto-tenue">
        EstacionAR · Plataforma de estacionamiento medido para la Municipalidad de Salta · Demo Nativos Consultora
      </footer>
    </div>
  );
}
