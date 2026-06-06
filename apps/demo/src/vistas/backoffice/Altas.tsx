import { useEffect, useState } from "react";
import { Badge, Boton, Campo, Selector, Tarjeta } from "@estacionar/ui";
import { clientLocal as client, type AltaInput, type Validacion } from "../../store.js";

type TabAlta = "pendientes" | "nueva" | "importar";
type ValidacionConPerm = Validacion & { permisionario: { id: string; status: string } | null };

const VACIA: AltaInput = {
  fullName: "", dni: "", legajo: "", telefono: "", email: "",
  calle: "", entreCalles: "", altura: "", mano: "ambos", turno: "diurno", medioAcreditacion: "",
};

const EJEMPLO_CSV = `fullName,dni,legajo,telefono,email,calle,entreCalles,altura,mano,turno,medioAcreditacion
Juana Pérez,28111222,P-101,+543870000001,juana@mail.com,España,Alvarado y Urquiza,500,par,diurno,juana.mp
Pedro Gómez,30222333,P-102,+543870000002,pedro@mail.com,Caseros,Balcarce y Lerma,1200,impar,nocturno,pedro.cvu`;

function parseCSV(texto: string): AltaInput[] {
  const lineas = texto.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lineas.length) return [];
  const inicio = /dni/i.test(lineas[0]!) && /legajo/i.test(lineas[0]!) ? 1 : 0;
  const filas: AltaInput[] = [];
  for (let i = inicio; i < lineas.length; i++) {
    const c = lineas[i]!.split(",").map((x) => x.trim());
    if (c.length < 3) continue;
    filas.push({
      fullName: c[0] ?? "", dni: c[1] ?? "", legajo: c[2] ?? "", telefono: c[3] ?? "", email: c[4] ?? "",
      calle: c[5] ?? "", entreCalles: c[6] ?? "", altura: c[7] ?? "",
      mano: (["par", "impar", "ambos"].includes(c[8] ?? "") ? c[8] : "ambos") as AltaInput["mano"],
      turno: c[9] === "nocturno" ? "nocturno" : "diurno",
      medioAcreditacion: c[10] ?? "",
    });
  }
  return filas;
}

export function SeccionAltas({ onCambio }: { onCambio: () => void }) {
  const [tab, setTab] = useState<TabAlta>("pendientes");
  return (
    <div className="space-y-5">
      <nav className="inline-flex gap-1 rounded-2xl border border-white/10 bg-white/5 p-1">
        {(["pendientes", "nueva", "importar"] as TabAlta[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-xl px-4 py-2 text-sm font-semibold capitalize transition ${tab === t ? "bg-cyan text-nocturno shadow-glow" : "text-texto-tenue hover:text-texto"}`}>
            {t === "pendientes" ? "Validación" : t === "nueva" ? "Alta individual" : "Importar CSV"}
          </button>
        ))}
      </nav>
      {tab === "pendientes" && <Pendientes onCambio={onCambio} />}
      {tab === "nueva" && <Nueva onCambio={onCambio} />}
      {tab === "importar" && <Importar onCambio={onCambio} />}
    </div>
  );
}

function Pendientes({ onCambio }: { onCambio: () => void }) {
  const [items, setItems] = useState<ValidacionConPerm[]>([]);
  const [proc, setProc] = useState<string | null>(null);

  async function cargar() {
    const todas = await client.getValidaciones();
    setItems(todas.filter((v) => v.estado === "pending_validation" || v.estado === "observed") as ValidacionConPerm[]);
  }
  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function resolver(id: string, accion: "approved" | "observed" | "rejected") {
    setProc(id + accion);
    const motivo = accion === "observed" ? (prompt("Motivo de la observación:") ?? "Documentación incompleta") : undefined;
    await client.resolverValidacion(id, accion, motivo);
    setProc(null);
    await cargar();
    onCambio();
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-texto-tenue">Permisionarios cargados por alta o importación, pendientes de validación documental. Solo operan al ser aprobados.</p>
      {items.length === 0 ? (
        <Tarjeta><p className="py-6 text-center text-sm text-texto-tenue">No hay permisionarios pendientes. Cargá uno en “Alta individual” o “Importar CSV”.</p></Tarjeta>
      ) : (
        items.map((v) => (
          <Tarjeta key={v.id} className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-lg font-bold">{v.fullName}</p>
                <p className="text-xs text-texto-tenue">DNI {v.dni} · Legajo {v.legajo} · {v.telefono}</p>
                <p className="text-xs text-texto-tenue">{v.calle} {v.altura} ({v.entreCalles}) · mano {v.mano} · {v.turno}</p>
                <p className="mt-1 text-xs text-texto-tenue">Acreditación: <b className="text-texto">{v.medioAcreditacion || "—"}</b></p>
                {v.motivo && <p className="mt-1 text-xs text-ambar-400">Observado: {v.motivo}</p>}
              </div>
              <Badge tono={v.estado === "observed" ? "alerta" : "neutro"}>{v.estado === "observed" ? "Observado" : "Pendiente"}</Badge>
            </div>
            <div className="mt-3 flex flex-wrap justify-end gap-2">
              <Boton variante="fantasma" onClick={() => resolver(v.permisionarioId, "rejected")} cargando={proc === v.permisionarioId + "rejected"}>Rechazar</Boton>
              <Boton variante="secundario" onClick={() => resolver(v.permisionarioId, "observed")} cargando={proc === v.permisionarioId + "observed"}>Observar</Boton>
              <Boton onClick={() => resolver(v.permisionarioId, "approved")} cargando={proc === v.permisionarioId + "approved"}>Aprobar</Boton>
            </div>
          </Tarjeta>
        ))
      )}
    </div>
  );
}

function Nueva({ onCambio }: { onCambio: () => void }) {
  const [f, setF] = useState<AltaInput>(VACIA);
  const [creando, setCreando] = useState(false);
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);
  const set = (k: keyof AltaInput) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  async function crear() {
    setCreando(true);
    const { duplicados } = await client.crearPermisionarioAlta(f);
    setCreando(false);
    setAviso({ ok: duplicados.length === 0, texto: duplicados.length ? `Cargado, pero ojo: ${duplicados.join("; ")}. Queda pendiente para revisión.` : `${f.fullName} cargado como pendiente de validación.` });
    setF(VACIA);
    onCambio();
  }

  return (
    <Tarjeta titulo="Nuevo permisionario">
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo label="Nombre y apellido" value={f.fullName} onChange={set("fullName")} />
        <Campo label="DNI" value={f.dni} onChange={set("dni")} />
        <Campo label="Legajo municipal" value={f.legajo} onChange={set("legajo")} />
        <Campo label="Teléfono" value={f.telefono} onChange={set("telefono")} />
        <Campo label="Email" value={f.email} onChange={set("email")} />
        <Campo label="Medio de acreditación (alias/CBU)" value={f.medioAcreditacion} onChange={set("medioAcreditacion")} />
        <Campo label="Calle" value={f.calle} onChange={set("calle")} />
        <Campo label="Entre calles" value={f.entreCalles} onChange={set("entreCalles")} />
        <Campo label="Altura" value={f.altura} onChange={set("altura")} />
        <Selector label="Mano" value={f.mano} onChange={(e) => setF({ ...f, mano: e.target.value as AltaInput["mano"] })}>
          <option value="par">Par</option><option value="impar">Impar</option><option value="ambos">Ambos</option>
        </Selector>
        <Selector label="Turno" value={f.turno} onChange={(e) => setF({ ...f, turno: e.target.value as AltaInput["turno"] })}>
          <option value="diurno">Diurno</option><option value="nocturno">Nocturno</option>
        </Selector>
      </div>
      <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-texto-tenue">
        En producción se suben además: foto DNI frente/dorso, foto de la credencial municipal vigente y, si existe, el QR municipal.
      </div>
      <Boton className="mt-4" onClick={crear} cargando={creando} disabled={!f.fullName || !f.dni || !f.legajo}>Cargar como pendiente</Boton>
      {aviso && <p className={`mt-3 rounded-xl px-3 py-2 text-sm ${aviso.ok ? "bg-emerald-500/15 text-emerald-300" : "bg-ambar/15 text-ambar-400"}`}>{aviso.texto}</p>}
    </Tarjeta>
  );
}

function Importar({ onCambio }: { onCambio: () => void }) {
  const [csv, setCsv] = useState("");
  const [preview, setPreview] = useState<AltaInput[] | null>(null);
  const [importando, setImportando] = useState(false);
  const [resultado, setResultado] = useState<{ creados: number; omitidos: number } | null>(null);

  function previsualizar() {
    setResultado(null);
    setPreview(parseCSV(csv));
  }
  async function confirmar() {
    if (!preview) return;
    setImportando(true);
    const r = await client.importarPermisionarios(preview);
    setImportando(false);
    setResultado({ creados: r.creados, omitidos: r.omitidos.length });
    setPreview(null);
    setCsv("");
    onCambio();
  }

  return (
    <Tarjeta titulo="Importar padrón (CSV)">
      <p className="mb-2 text-xs text-texto-tenue">
        Pegá el CSV del padrón municipal. Columnas: fullName, dni, legajo, telefono, email, calle, entreCalles, altura, mano, turno, medioAcreditacion.
      </p>
      <textarea
        value={csv}
        onChange={(e) => setCsv(e.target.value)}
        rows={6}
        placeholder={EJEMPLO_CSV}
        className="w-full rounded-xl border border-borde bg-nocturno/60 px-3 py-2 font-mono text-xs text-texto focus:border-cyan focus:outline-none"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <Boton variante="secundario" onClick={() => setCsv(EJEMPLO_CSV)}>Cargar ejemplo</Boton>
        <Boton onClick={previsualizar} disabled={!csv.trim()}>Previsualizar</Boton>
      </div>

      {preview && (
        <div className="mt-4">
          <p className="mb-2 text-sm font-semibold">{preview.length} filas detectadas</p>
          <div className="max-h-56 overflow-auto rounded-xl border border-white/10">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-superficie text-texto-tenue">
                <tr><th className="p-2">Nombre</th><th className="p-2">DNI</th><th className="p-2">Legajo</th><th className="p-2">Cuadra</th><th className="p-2">Turno</th></tr>
              </thead>
              <tbody>
                {preview.map((f, i) => (
                  <tr key={i} className="border-t border-white/5">
                    <td className="p-2">{f.fullName}</td><td className="p-2 font-mono">{f.dni}</td><td className="p-2">{f.legajo}</td>
                    <td className="p-2">{f.calle} {f.altura}</td><td className="p-2">{f.turno}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Boton className="mt-3" onClick={confirmar} cargando={importando}>Confirmar importación ({preview.length})</Boton>
        </div>
      )}

      {resultado && (
        <p className="mt-3 rounded-xl bg-emerald-500/15 px-3 py-2 text-sm text-emerald-300">
          Importados {resultado.creados} permisionarios como pendientes{resultado.omitidos > 0 ? ` · ${resultado.omitidos} omitidos por duplicado (DNI/legajo)` : ""}. Validalos en la pestaña “Validación”.
        </p>
      )}
    </Tarjeta>
  );
}
