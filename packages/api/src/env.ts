// Configuracion por variables de entorno. Sin secretos hardcodeados.
export const env = {
  port: Number(process.env.API_PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  // Secreto para firmar tokens QR. En la demo usa un default explicito marcado; en prod es obligatorio.
  qrSecret:
    process.env.QR_SIGNING_SECRET ??
    "DEMO-SECRET-cambiar-en-produccion-no-usar-este-valor-real",
  isDemo: !process.env.QR_SIGNING_SECRET, // si no hay secreto real, corremos en modo demo
};
