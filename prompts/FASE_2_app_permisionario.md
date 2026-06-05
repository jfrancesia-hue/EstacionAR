# FASE 2 — App del Permisionario

> Objetivo: darle al permisionario una app simple para ver su recaudación en tiempo real,
> registrar pagos en efectivo de forma auditable, gestionar incidencias y consultar reportes.
> Diseñada para personas con bajo manejo tecnológico.

## Contexto
Leer `CLAUDE.md`, en especial §3.5 (efectivo) y §5 (UI en "vos", accesibilidad).

## Alcance

### A. Modelo de datos
- `pagos_efectivo` (extiende `pagos` con method='cash'): incluye `permisionario_id`, `plate`,
  `sello_tiempo`, `idempotency_key` (antiduplicidad).
- `incidencias` (id, permisionario_id, type, description, status[open|in_progress|closed], created_at).

### B. Registro de efectivo (servicio NestJS + UI)
- El permisionario registra un pago en efectivo: patente, tiempo, monto (calculado por el motor
  de tarifas, modalidad efectivo — sin descuento digital).
- Registro **inmutable** con sello de tiempo y `registered_by`.
- Control **antiduplicidad** vía `idempotency_key`.
- Crea/extiende la sesión igual que el flujo digital (reusar lógica de Fase 1).
- Escribe en `auditoria`.

### C. App del Permisionario (Expo)
Pantallas (nombres en español, UI en "vos"):
- `PantallaRecaudacion` — total del día en tiempo real (digital + efectivo), separado por medio.
- `PantallaRegistrarEfectivo` — flujo de 2-3 toques para cargar un pago en efectivo.
- `PantallaMovimientos` — historial de operaciones del permisionario.
- `PantallaIncidencias` — crear y seguir incidencias.
- `PantallaMiPerfil` — datos, sector asignado, estado del permiso, su QR/credencial.

Diseño: botones grandes, alto contraste, lenguaje claro ("Cargá el pago en efectivo",
"Esta es tu recaudación de hoy"). Cero jerga técnica.

### D. Tiempo real
- La recaudación se actualiza en vivo (Supabase Realtime) a medida que entran pagos digitales
  y efectivos.

## Criterios de aceptación
- El permisionario ve su recaudación del día actualizándose en tiempo real.
- Registrar efectivo crea sesión válida, es inmutable, queda auditado y no se puede duplicar.
- Puede crear una incidencia y ver su estado.
- Toda la UI en "vos", accesible, sin pasos innecesarios.

## NO hacer
- Conciliación/rendición automática (Fase 4) ni dashboards municipales (Fase 3).
- Permitir edición o borrado de pagos en efectivo ya registrados (son inmutables).
