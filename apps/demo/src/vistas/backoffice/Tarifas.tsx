import { useState } from "react";
import { Badge, Boton, Campo, Tarjeta, formatARS, formatMinutos } from "@estacionar/ui";
import { clientLocal as client } from "../../store.js";
import type { Tarifa } from "@estacionar/core";
import type { DatosBackoffice } from "./tipos.js";
import { SPLIT } from "../../split.js";

// Parseo seguro de inputs numéricos: nunca NaN, clampeado a [0, max].
function num(v: string, max = Number.MAX_SAFE_INTEGER): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(0, n)) : 0;
}

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
        <Campo label="Primera hora ($)" type="number" min={0} value={first} onChange={(e) => setFirst(num(e.target.value))} />
        <Campo label="Fracción adic. ($)" type="number" min={0} value={next} onChange={(e) => setNext(num(e.target.value))} />
        <Campo label="Beneficio app (%)" type="number" min={0} max={100} value={desc} onChange={(e) => setDesc(num(e.target.value, 100))} />
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs text-texto-tenue">
          Pago app 1 h: <b className="text-cyan">{formatARS(Math.round(first * (1 - desc / 100)))}</b>
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
      <div className="rounded-2xl border border-cyan/25 bg-cyan/10 p-4 text-sm text-texto">
        Las tarifas son <b>configurables sin tocar código</b>. El pago app genera comprobante digital, acredita al permisionario
        y asigna el porcentaje municipal con trazabilidad. La actualización semestral es solo un cambio de dato.
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {datos.tarifas.map((t) => (
          <EditorTarifa key={t.id} tarifa={t} onGuardar={onCambio} />
        ))}
      </div>
      <Tarjeta titulo="Reparto de cada pago (modelo 80/10/10)">
        <div className="grid gap-4 text-sm sm:grid-cols-4">
          <div className="rounded-xl bg-cyan/10 p-3"><p className="text-texto-tenue">Permisionario</p><b className="text-lg text-cyan">{SPLIT.permisionarioPct}%</b></div>
          <div className="rounded-xl bg-ambar/10 p-3"><p className="text-texto-tenue">Comisión plataforma</p><b className="text-lg text-ambar">{SPLIT.plataformaPct}%</b></div>
          <div className="rounded-xl bg-profundo/70 p-3"><p className="text-texto-tenue">Al Municipio</p><b className="text-lg">{SPLIT.municipioPct}%</b></div>
          <div className="rounded-xl bg-profundo/70 p-3"><p className="text-texto-tenue">Descuento app</p><b className="text-lg">{SPLIT.descuentoCiudadanoPct}%</b></div>
        </div>
        <p className="mt-3 text-xs text-texto-tenue">Tolerancia post-vencimiento {formatMinutos(datos.config.toleranceMinutes)} · {datos.config.feriados.length} feriados sin cobro. El Municipio fiscaliza y conserva su 10% con trazabilidad.</p>
      </Tarjeta>
    </div>
  );
}
