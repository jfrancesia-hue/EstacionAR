import { useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";

// Lector de QR con la cámara del dispositivo, dentro de la misma webapp (sin app nativa).
// Requiere https (Vercel) o localhost. Si no hay cámara/permiso, el padre ofrece "simular".
export function EscanerQR({ onDetectar, onCerrar }: { onDetectar: (texto: string) => void; onCerrar: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const reader = new BrowserQRCodeReader();
    let controls: IScannerControls | null = null;
    let activo = true;

    (async () => {
      try {
        controls = await reader.decodeFromConstraints(
          { video: { facingMode: "environment" } },
          videoRef.current!,
          (result) => {
            if (result && activo) {
              activo = false;
              onDetectar(result.getText());
            }
          },
        );
        // Si se desmontó o ya detectó mientras esperábamos el await, frenamos la cámara.
        if (!activo) controls.stop();
      } catch {
        setError("No pudimos acceder a la cámara. Usá “Simular escaneo”.");
      }
    })();

    return () => {
      activo = false;
      controls?.stop();
    };
  }, [onDetectar]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-nocturno/90 p-4" role="dialog" aria-modal="true" aria-label="Escanear QR del permisionario">
      <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-superficie p-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="font-bold">Escaneá el QR del permisionario</h3>
          <button onClick={onCerrar} aria-label="Cerrar escáner" className="rounded-lg px-2 py-1 text-texto-tenue hover:text-texto">✕</button>
        </div>
        <div className="relative mt-3 aspect-square overflow-hidden rounded-2xl bg-black">
          <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
          <div className="pointer-events-none absolute inset-8 rounded-2xl border-2 border-cyan/70 shadow-[0_0_40px_rgba(15,182,206,.4)]" />
        </div>
        {error ? (
          <p className="mt-3 rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-300">{error}</p>
        ) : (
          <p className="mt-3 text-center text-xs text-texto-tenue">Apuntá la cámara a la credencial del permisionario.</p>
        )}
      </div>
    </div>
  );
}
