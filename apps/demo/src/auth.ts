// "Auth" simulada para la demo (sin backend ni cuentas reales).
// Solo modela el FLUJO de login por rol; en producción esto es Supabase Auth + guards.
export type Rol = "conductor" | "permisionario" | "admin";

export interface SesionDemo {
  rol: Rol;
  nombre: string;
  email: string;
}

export interface CuentaDemo {
  email: string;
  password: string;
  nombre: string;
  titulo: string;
  descripcion: string;
}

// Credenciales de ejemplo (se muestran y se pre-cargan en el login). NO son reales.
export const CUENTAS_DEMO: Record<Rol, CuentaDemo> = {
  conductor: {
    email: "vecino@salta.gob.ar",
    password: "demo1234",
    nombre: "Vecino Conductor",
    titulo: "Conductor",
    descripcion: "Pagá tu estacionamiento por patente, en segundos.",
  },
  permisionario: {
    email: "permisionario@salta.gob.ar",
    password: "demo1234",
    nombre: "Carlos Ramírez",
    titulo: "Permisionario",
    descripcion: "Tu recaudación del día y carga de efectivo auditada.",
  },
  admin: {
    email: "admin@municipalidadsalta.gob.ar",
    password: "demo1234",
    nombre: "Admin Municipal",
    titulo: "Municipalidad",
    descripcion: "Panel de control fiscal, tarifas, permisionarios y auditoría.",
  },
};
