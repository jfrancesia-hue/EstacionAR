import { useState } from "react";

// Nombres comunes para inferir el género y elegir una foto coherente con el nombre.
const MASC = new Set([
  "carlos", "juan", "jose", "luis", "jorge", "miguel", "pedro", "pablo", "diego", "martin",
  "sergio", "ramon", "raul", "oscar", "ruben", "hugo", "mario", "alberto", "fernando", "roberto",
  "daniel", "gabriel", "gustavo", "marcelo", "cristian", "leonardo", "nicolas", "facundo", "matias",
  "agustin", "tomas", "lucas", "santiago", "franco", "ezequiel", "walter", "ricardo", "javier", "andres",
]);
const FEM = new Set([
  "maria", "juana", "ana", "carla", "lucia", "sofia", "valentina", "camila", "martina", "julieta",
  "florencia", "rocio", "gabriela", "carolina", "natalia", "laura", "silvia", "paula", "romina", "daniela",
  "veronica", "sandra", "claudia", "mariana", "cecilia", "agustina", "micaela", "antonella", "brenda", "melina",
]);

function sinAcentos(s: string): string {
  return s
    .replace(/[áàä]/g, "a")
    .replace(/[éèë]/g, "e")
    .replace(/[íìï]/g, "i")
    .replace(/[óòö]/g, "o")
    .replace(/[úùü]/g, "u");
}

function inferirGenero(nombre: string): "men" | "women" {
  const base = sinAcentos((nombre.trim().toLowerCase().split(/\s+/)[0] ?? ""));
  if (MASC.has(base)) return "men";
  if (FEM.has(base)) return "women";
  return base.endsWith("a") ? "women" : "men";
}

function hash(s: string): number {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

// Foto del permisionario coherente con su nombre, con fallback a la inicial si la imagen no carga.
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
  const url = `https://randomuser.me/api/portraits/${inferirGenero(nombre)}/${hash(id) % 100}.jpg`;
  return (
    <img
      src={url}
      alt={nombre}
      loading="lazy"
      onError={() => setError(true)}
      className={`shrink-0 rounded-2xl object-cover ${className}`}
      style={estilo}
    />
  );
}
