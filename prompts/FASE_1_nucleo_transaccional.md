# FASE 1 — Núcleo transaccional (tarifas, billetera de tiempo, pagos, flujo conductor)

> Objetivo: que un conductor pueda escanear un QR, elegir tiempo, pagar digitalmente y recibir
> comprobante — con la lógica de billetera de tiempo por patente y el motor de tarifas funcionando.
> Es el corazón del sistema.

## Contexto
Leer `CLAUDE.md`, en especial §3.1 (billetera de tiempo), §3.2 (tarifas), §3.3 (QR/antifraude)
y §3.4 (flujo del dinero). Estas reglas mandan.

## Alcance

### A. Modelo de datos transaccional (migración)
- `sesiones` (id, plate, vehicle_type, paid_minutes, start_valid, end_valid, tarifa_id, amount,
  origin_sector_id, status[active|expired|cancelled], created_at)
- `pagos` (id, sesion_id, method[qr|mercadopago|modo|naranja|card|cash], amount, status[pending|approved|rejected],
  external_ref, receipt_url, registered_by, created_at)

### B. Motor de tarifas (`packages/core` + servicio NestJS)
- Función pura `calcularTarifa({ vehicleType, minutes, isDigital, date })` que:
  - Lee la tarifa vigente de la tabla (NUNCA constantes).
  - Aplica primera unidad + fraccionamiento desde la segunda.
  - Aplica descuento digital si corresponde.
  - Devuelve sin cobro en feriados configurados.
- Tests unitarios cubriendo: 1 hora auto, fracción de 15 min, moto, descuento digital, feriado.

### C. Lógica de sesión / billetera de tiempo (servicio NestJS)
- `crearOExtenderSesion({ plate, minutes, sectorId, vehicleType, isDigital })`:
  - Si existe sesión activa para la patente dentro de su ventana → extiende `end_valid`.
  - Si no → crea nueva con `start_valid = now`, `end_valid = now + minutes`.
- `consultarSesion(plate)`: devuelve saldo de tiempo restante y vigencia.
- Regla: al escanear en otro sector dentro de la ventana, reconocer saldo, NO recobrar.
- Tolerancia de 5 minutos post-vencimiento.

### D. Validación de QR (servicio NestJS)
- Endpoint que recibe el `qr_token` del permisionario y valida del lado del servidor:
  estado activo, sector y turno vigentes. Firma JWT + nonce por operación.
- El cobro se asocia a la cuenta recaudadora municipal, nunca al permisionario directo.

### E. Integración de pago digital (empezar por Mercado Pago)
- Crear preferencia de pago, recibir webhook, actualizar estado del `pago` y la `sesion`.
- Acreditación visible en tiempo real (Supabase Realtime o polling).
- Dejar la integración abstraída tras una interfaz `PaymentProvider` para sumar MODO/Naranja luego.

### F. Flujo del conductor (App Conductor — Expo + PWA)
Pantallas (nombres en español):
- `PantallaEscaneo` — escanear QR del permisionario.
- `PantallaPago` — ingresar patente, elegir tiempo, ver precio (con descuento digital), pagar.
- `PantallaComprobante` — comprobante PDF, envío por WhatsApp / descarga.
- `PantallaMiTiempo` — consultar saldo de tiempo por patente.
UI en "vos", botones grandes, mínimos pasos. Estética premium según paleta de CLAUDE.md.

### G. Comprobante digital
- Generar PDF por operación (job en BullMQ). Guardar en Supabase Storage. Enviar por WhatsApp API.

## Criterios de aceptación
- Escaneo QR → patente → tiempo → pago MP aprobado → sesión activa → comprobante enviado.
- Pagar 1 h y "moverse" a otro sector dentro de la ventana NO recobra.
- El precio respeta tarifa vigente, fraccionamiento y descuento digital, leídos de tabla.
- Tests del motor de tarifas y de la lógica de sesión en verde.

## NO hacer
- App del permisionario, backoffice, conciliación avanzada ni reportes (fases siguientes).
- Hardcodear ningún valor de tarifa.
