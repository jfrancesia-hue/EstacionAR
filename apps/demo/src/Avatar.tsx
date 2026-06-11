import { useState } from "react";

// Foto del permisionario con fallback: si la imagen no carga (red lenta), muestra la inicial.
export function Avatar({ id, nombre, size = 44, className = "" }: { id: string; nombre: string; size?: number; className?: string }) {
  const [error, setError] = useState(false);
  const inicial = nombre.trim().charAt(0).toUpperCase() || "?";
  const estilo = { width: size, height: size };

  if (error) {
    return (
      <span
        className={`grid shrink-0 place-items-center rounded-2xl bg-cyan/15 font-bold text-cyan ${className}`}
        style={{ ...estilo, fontSize: Math.round(size * 0.4) }}
        aria-hidden="true"
      >
        {inicial}
      </span>
    );
  }
  return (
    <img
      src={`https://i.pravatar.cc/${Math.round(size * 2)}?u=${id}`}
      alt={nombre}
      loading="lazy"
      onError={() => setError(true)}
      className={`shrink-0 rounded-2xl object-cover ${className}`}
      style={estilo}
    />
  );
}
