import { QRCodeSVG } from "qrcode.react";
import { Badge, Tarjeta, EstadoPill } from "@estacionar/ui";
import { urlPagoQR } from "../../qr.js";
import { Avatar } from "../../Avatar.js";
import type { DatosPermisionario } from "./tipos.js";

export function SeccionPerfil({ datos }: { datos: DatosPermisionario }) {
  const p = datos.perm;
  const nombre = p.fullName.replace(" (DEMO)", "");
  const habilitado = p.status === "active";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Mi credencial</h1>
        <p className="mt-2 text-sm text-texto-tenue">
          Mostrásela al ciudadano: confirma que sos un permisionario <b className="text-texto">habilitado por Tránsito Municipal de SFVC</b>.
        </p>
      </div>

      {/* Carnet digital */}
      <div className="overflow-hidden rounded-3xl border border-borde/70 bg-gradient-to-br from-superficie to-profundo/60 shadow-card">
        <div className="flex items-center justify-between border-b border-borde bg-nocturno/40 px-5 py-3">
          <div className="flex items-center gap-2">
            <img src="/catamarca-logo.png" alt="Municipalidad de San Fernando del Valle de Catamarca" className="h-7 w-auto rounded bg-white p-0.5" />
            <span className="text-xs font-bold uppercase tracking-wide text-texto-tenue">Credencial de permisionario · Dirección de Tránsito</span>
          </div>
          <Badge tono={habilitado ? "ok" : "error"}>{habilitado ? "● Habilitado" : "No habilitado"}</Badge>
        </div>

        <div className="grid gap-5 p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center">
          <div className="mx-auto">
            <Avatar id={p.id} nombre={nombre} size={112} className="border-2 border-cyan/40 shadow-lg" />
          </div>

          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-extrabold leading-tight">{nombre}</h2>
            <p className="text-sm text-texto-tenue">N° {p.id.toUpperCase()}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              <Badge tono="cyan">{p.sector?.name ?? "Sin sector"}</Badge>
              <Badge tono={p.shift === "nocturno" ? "alerta" : "neutro"}>{p.shift ?? "—"}</Badge>
              <Badge tono="neutro">★ {p.rating || "s/d"}</Badge>
            </div>
          </div>

          <div className="mx-auto text-center">
            <div className="inline-block rounded-2xl bg-white p-2.5 shadow-inner">
              <QRCodeSVG value={urlPagoQR(p)} size={116} bgColor="#ffffff" fgColor="#163A63" level="M" />
            </div>
            <p className="mt-1 text-[11px] text-texto-tenue">Escaneá para pagar</p>
          </div>
        </div>
      </div>

      {/* Datos privados: visibles sólo para el permisionario, no en el carnet */}
      <Tarjeta titulo="Tus datos (privados)">
        <div className="grid gap-3 text-sm sm:grid-cols-3">
          <div className="rounded-xl bg-profundo/70 p-3"><p className="text-texto-tenue">DNI</p><b>{p.dni}</b></div>
          <div className="rounded-xl bg-profundo/70 p-3"><p className="text-texto-tenue">Teléfono</p><b>{p.contactPhone}</b></div>
          <div className="rounded-xl bg-profundo/70 p-3"><p className="text-texto-tenue">Validación</p><EstadoPill estado={p.status} /></div>
        </div>
        <p className="mt-3 text-xs text-texto-tenue">Tu DNI y documentación quedan del lado del Municipio para validación. En producción, el circuito puede vincularse con Mesa de Entradas, Tránsito Municipal y Estacionamiento Ordenado.</p>
      </Tarjeta>

      <p className="rounded-xl border border-cyan/25 bg-cyan/10 p-4 text-sm text-texto">
        El QR identifica al permisionario y se valida del lado del servidor en cada escaneo (estado, sector y turno vigentes).
        Un QR clonado no puede desviar fondos: el cobro siempre va por el split a la cuenta del permisionario.
      </p>
    </div>
  );
}
