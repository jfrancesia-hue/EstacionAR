import { useState } from "react";
import { Badge, Boton, Campo, Tarjeta, formatARS, formatMinutos } from "@estacionar/ui";
import { clientLocal as client } from "../../store.js";
import type { Tarifa } from "@estacionar/core";
import type { DatosBackoffice } from "./tipos.js";

function EditorTarifa({ tarifa, onGuardar }: { tarifa: Tarifa; onGuardar: () => void }) {
  const [first, setFirst] = useState(tarifa.firstUnitAmount);
  const [next, setNext] = useState(tarifa.nextUnitAmount);
  const [desc, setDesc] = useState(tarifa.digitalDiscountPct);
  const [guardando, setGuardando] = useState(false);
  const [ok, setOk] = useState(false);

  const cambiado = first !== tarifa.firstUnitAmount || next !== tarifa.nextUnitAmount || desc !== tarifa.digitalDiscountPct;

  async function guardar() {
    setGuardando(true);
    await client.editarTarifa(tarifa.id, { firstUnitAmount: first, nextUnitAmount: next, digitalDiscountPct: desc });
    setGuardando(false);
    setOk(true);
    onGuardar();
    setTimeout(() => setOk(false), 2500);
  }

  return (
    <Tarjeta
      titulo={<span className="capitalize">{tarifa.vehicleType}</span>}
      accion={<Badge tono="cyan">Fracción {formatMinutos(tarifa.minUnitMinutes)}</Badge>}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <Campo label="Primera hora ($)" type="number" min={0} value={first} onChange={(e) => setFirst(Number(e.target.value))} />
        <Campo label="Fracción adic. ($)" type="number" min={0} value={next} onChange={(e) => setNext(Number(e.target.value))} />
        <Campo label="Desc. digital (%)" type="number" min={0} max={100} value={desc} onChange={(e) => setDesc(Number(e.target.value))} />
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs text-texto-tenue">
          Pago digital 1 h: <b className="text-cyan">{formatARS(Math.round(first * (1 - desc / 100)))}</b>
        </p>
        <div className="flex items-center gap-3">
          {ok && <span className="text-sm font-semibold text-emerald-400">Guardado ✓</span>}
          <Boton onClick={guardar} cargando={guardando} disabled={!cambiado}>Guardar</Boton>
        </div>
      </div>
    </Tarjeta>
  );
}

export function SeccionTarifas({ datos, onCambio }: { datos: DatosBackoffice; onCambio: () => void }) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-cyan/20 bg-cyan/10 p-4 text-sm text-cyan-300">
        Las tarifas son <b>configurables sin tocar código</b>. Editá un valor y guardá: el cambio se aplica
        al instante y se refleja en lo que paga el conductor. La actualización semestral es solo un cambio de dato.
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {datos.tarifas.map((t) => (
          <EditorTarifa key={t.id} tarifa={t} onGuardar={onCambio} />
        ))}
      </div>
      <Tarjeta titulo="Parámetros del sistema">
        <div className="grid gap-4 sm:grid-cols-3 text-sm">
          <div className="rounded-xl bg-white/5 p-3"><p className="text-texto-tenue">Comisión municipal</p><b className="text-lg">{datos.config.feePct}%</b></div>
          <div className="rounded-xl bg-white/5 p-3"><p className="text-texto-tenue">Tolerancia post-vencimiento</p><b className="text-lg">{formatMinutos(datos.config.toleranceMinutes)}</b></div>
          <div className="rounded-xl bg-white/5 p-3"><p className="text-texto-tenue">Feriados sin cobro</p><b className="text-lg">{datos.config.feriados.length}</b></div>
        </div>
      </Tarjeta>
    </div>
  );
}
