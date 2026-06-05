import { useState } from "react";
import { Badge, Boton, Campo, Logo, Tarjeta } from "@estacionar/ui";
import { CUENTAS_DEMO, type Rol, type SesionDemo } from "../auth.js";

export function VistaLogin({
  rol,
  onIngresar,
  onVolver,
}: {
  rol: Rol;
  onIngresar: (sesion: SesionDemo) => void;
  onVolver: () => void;
}) {
  const cuenta = CUENTAS_DEMO[rol];
  // Credenciales pre-cargadas para que el login de la demo sea de un solo clic.
  const [email, setEmail] = useState(cuenta.email);
  const [password, setPassword] = useState(cuenta.password);
  const [ingresando, setIngresando] = useState(false);

  function ingresar(e: React.FormEvent) {
    e.preventDefault();
    setIngresando(true);
    // Login simulado: sin validación real (no hay BD). Mostramos el flujo y entramos.
    onIngresar({ rol, nombre: cuenta.nombre, email });
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-160px)] max-w-md flex-col justify-center px-6 py-10">
      <button onClick={onVolver} className="mb-6 self-start text-sm font-semibold text-texto-tenue hover:text-texto">
        ← Volver al inicio
      </button>

      <Tarjeta className="bg-gradient-to-br from-superficie to-profundo/60">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo size={32} />
          <Badge tono="cyan">Acceso {cuenta.titulo}</Badge>
          <p className="mt-3 text-sm text-texto-tenue">{cuenta.descripcion}</p>
        </div>

        <form onSubmit={ingresar} className="space-y-4">
          <Campo label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" />
          <Campo label="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          <Boton type="submit" grande className="w-full" cargando={ingresando} disabled={!email}>
            Ingresar como {cuenta.titulo}
          </Boton>
        </form>

        <div className="mt-5 rounded-xl border border-ambar/20 bg-ambar/10 p-3 text-center text-xs text-ambar-400">
          Demo: credenciales de ejemplo ya cargadas. No hay cuentas reales (se conectan en producción con Supabase Auth).
        </div>
      </Tarjeta>
    </main>
  );
}
