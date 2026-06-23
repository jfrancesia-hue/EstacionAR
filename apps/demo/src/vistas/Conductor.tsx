import { useState } from "react";
import { SeccionPagar } from "./conductor/Pagar.js";
import { SeccionMiTiempo } from "./conductor/MiTiempo.js";

type Pestana = "pagar" | "mitiempo";

const PESTANAS: Array<{ id: Pestana; label: string }> = [
  { id: "pagar", label: "Pagar" },
  { id: "mitiempo", label: "Mi tiempo" },
];

export function VistaConductor({ qrId }: { qrId?: string }) {
  const [pestana, setPestana] = useState<Pestana>("pagar");

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <nav aria-label="Secciones del conductor" className="mb-6 inline-flex gap-1 rounded-2xl border border-borde bg-profundo/70 p-1">
        {PESTANAS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPestana(p.id)}
            aria-current={pestana === p.id ? "page" : undefined}
            className={`rounded-xl px-5 py-2 text-sm font-semibold transition ${
              pestana === p.id ? "bg-cyan text-white shadow-glow" : "text-texto-tenue hover:text-texto"
            }`}
          >
            {p.label}
          </button>
        ))}
      </nav>

      {pestana === "pagar" ? <SeccionPagar qrId={qrId} /> : <SeccionMiTiempo />}
    </main>
  );
}
