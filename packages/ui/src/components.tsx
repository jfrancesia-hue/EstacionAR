// Design system compartido de EstacionAR. Estetica premium B2G (paleta CLAUDE.md §6).
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

function cn(...xs: Array<string | false | null | undefined>): string {
  return xs.filter(Boolean).join(" ");
}

// ── Marca / logo ────────────────────────────────────────────────────────────
export function Logo({ size = 28, withText = true }: { size?: number; withText?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
        <rect width="40" height="40" rx="10" fill="#0FB6CE" />
        <path d="M13 28V12h7.2c3.5 0 5.8 2.1 5.8 5.3 0 3.2-2.3 5.3-5.8 5.3H17V28h-4Zm4-8.7h2.8c1.3 0 2.1-.7 2.1-2s-.8-2-2.1-2H17v4Z" fill="#0A1A2F" />
      </svg>
      {withText && (
        <span className="text-lg font-extrabold tracking-tight text-texto">
          Estacion<span className="text-cyan">AR</span>
        </span>
      )}
    </div>
  );
}

// Banner que deja claro que es una demo (nunca presentar datos falsos como reales).
export function MarcaDemo({ texto = "DATOS DEMO — no son datos reales de produccion" }: { texto?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 bg-ambar/15 px-3 py-1 text-center text-[11px] font-semibold uppercase tracking-wider text-ambar-400">
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-ambar" />
      {texto}
    </div>
  );
}

// ── Boton ─────────────────────────────────────────────────────────────────────
type BotonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: "primario" | "secundario" | "ambar" | "fantasma" | "peligro";
  grande?: boolean;
  cargando?: boolean;
};

export function Boton({ variante = "primario", grande, cargando, className, children, disabled, ...rest }: BotonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-cyan/50";
  const tam = grande ? "px-6 py-4 text-lg" : "px-4 py-2.5 text-sm";
  const variantes: Record<string, string> = {
    primario: "bg-cyan text-nocturno hover:bg-cyan-400 shadow-glow",
    secundario: "bg-borde/60 text-texto hover:bg-borde",
    ambar: "bg-ambar text-nocturno hover:bg-ambar-400",
    fantasma: "bg-transparent text-texto-tenue hover:text-texto hover:bg-borde/40",
    peligro: "bg-red-500/90 text-white hover:bg-red-500",
  };
  return (
    <button className={cn(base, tam, variantes[variante], className)} disabled={disabled || cargando} {...rest}>
      {cargando && <Spinner size={16} />}
      {children}
    </button>
  );
}

// ── Tarjeta ─────────────────────────────────────────────────────────────────
export function Tarjeta({ children, className, titulo, accion }: { children: ReactNode; className?: string; titulo?: ReactNode; accion?: ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-borde/70 bg-superficie/80 p-5 shadow-card backdrop-blur", className)}>
      {(titulo || accion) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {titulo && <h3 className="text-sm font-bold uppercase tracking-wide text-texto-tenue">{titulo}</h3>}
          {accion}
        </div>
      )}
      {children}
    </div>
  );
}

// ── KPI ─────────────────────────────────────────────────────────────────────
export function Kpi({ label, valor, sub, acento = "cyan", icono }: { label: string; valor: ReactNode; sub?: ReactNode; acento?: "cyan" | "ambar" | "texto"; icono?: ReactNode }) {
  const color = acento === "ambar" ? "text-ambar" : acento === "texto" ? "text-texto" : "text-cyan";
  return (
    <div className="rounded-2xl border border-borde/70 bg-gradient-to-br from-superficie to-profundo/60 p-5 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-texto-tenue">{label}</p>
        {icono && <span className={color}>{icono}</span>}
      </div>
      <p className={cn("mt-2 text-3xl font-extrabold tracking-tight", color)}>{valor}</p>
      {sub && <p className="mt-1 text-xs text-texto-tenue">{sub}</p>}
    </div>
  );
}

// ── Badge / pill de estado ────────────────────────────────────────────────────
export function Badge({ children, tono = "neutro" }: { children: ReactNode; tono?: "neutro" | "ok" | "alerta" | "error" | "cyan" }) {
  const tonos: Record<string, string> = {
    neutro: "bg-borde/60 text-texto-tenue",
    ok: "bg-emerald-500/15 text-emerald-300",
    alerta: "bg-ambar/15 text-ambar-400",
    error: "bg-red-500/15 text-red-300",
    cyan: "bg-cyan/15 text-cyan-400",
  };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", tonos[tono])}>{children}</span>;
}

const ESTADO_TONO: Record<string, "ok" | "alerta" | "error" | "neutro"> = {
  active: "ok",
  suspended: "alerta",
  expired: "error",
  conciliada: "ok",
  con_diferencia: "alerta",
  pendiente: "neutro",
  transferred: "ok",
  approved: "ok",
  open: "alerta",
  in_progress: "cyan" as never,
  closed: "neutro",
};
const ESTADO_TEXTO: Record<string, string> = {
  active: "Activo",
  suspended: "Suspendido",
  expired: "Vencido",
  conciliada: "Conciliada",
  con_diferencia: "Con diferencia",
  pendiente: "Pendiente",
  transferred: "Transferida",
  approved: "Aprobado",
  open: "Abierta",
  in_progress: "En curso",
  closed: "Cerrada",
};

export function EstadoPill({ estado }: { estado: string }) {
  return <Badge tono={(ESTADO_TONO[estado] ?? "neutro") as never}>{ESTADO_TEXTO[estado] ?? estado}</Badge>;
}

// ── Inputs ────────────────────────────────────────────────────────────────────
export function Campo({ label, className, ...rest }: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-texto-tenue">{label}</span>}
      <input
        className={cn(
          "w-full rounded-xl border border-borde bg-nocturno/60 px-4 py-3 text-texto placeholder:text-texto-tenue/60 focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/30",
          className,
        )}
        {...rest}
      />
    </label>
  );
}

export function Selector({ label, className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-texto-tenue">{label}</span>}
      <select
        className={cn(
          "w-full rounded-xl border border-borde bg-nocturno/60 px-4 py-3 text-texto focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/30",
          className,
        )}
        {...rest}
      >
        {children}
      </select>
    </label>
  );
}

// ── Spinner ─────────────────────────────────────────────────────────────────
export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <svg className="animate-spin" width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Cargando({ texto = "Cargando…" }: { texto?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-texto-tenue">
      <Spinner /> {texto}
    </div>
  );
}
