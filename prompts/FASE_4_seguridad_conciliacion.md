# FASE 4 — Seguridad, conciliación y liquidación

> Objetivo: cerrar el circuito fiscal. QR firmado robusto, auditoría inmutable, rendición diaria
> conciliada y liquidación automática al permisionario con split. Es lo que da al Municipio el
> control total que pide el pliego.

## Contexto
Leer `CLAUDE.md`, en especial §3.3 (QR/antifraude), §3.4 (flujo del dinero) y §3.5 (efectivo).

## Alcance

### A. QR firmado endurecido
- Revisar y fortalecer la validación de Fase 1: JWT firmado, nonce por operación, expiración,
  verificación de estado/sector/turno en cada escaneo. Rate limiting.
- Asegurar que el cobro jamás se asocie a una cuenta del permisionario, siempre a la municipal.

### B. Auditoría inmutable
- Toda operación sensible (pago efectivo, cambio de tarifa, ABM permisionario, liquidación)
  escribe en `auditoria` (append-only, sin update/delete por RLS).
- Vista de auditoría en el backoffice (solo lectura, filtrable).

### C. Rendición diaria y conciliación
- Job (BullMQ) que al cierre del día calcula por permisionario: total digital, total efectivo,
  cantidad de operaciones, y genera una `rendicion` con estado de conciliación.
- Detección de inconsistencias (efectivo registrado vs esperado) → marca para revisión.

### D. Liquidación con split
- Tabla `liquidaciones` (id, permisionario_id, period, gross_amount, fee_amount, net_amount,
  status, transfer_ref, created_at).
- Job que liquida al permisionario **T+1** o según convenio, aplicando la comisión configurada
  (modelo de recaudación ampliada). La recaudación pasa por cuenta municipal antes de liquidar.
- Comisión configurable desde el backoffice (no hardcodear).

### E. Transparencia en tiempo real
- Endpoint y vista municipal que muestra la recaudación total y por permisionario en vivo,
  antes de cualquier liquidación.

## Criterios de aceptación
- Ningún registro de `auditoria` puede modificarse ni borrarse (verificado por RLS).
- Al cierre del día se generan rendiciones conciliadas; las inconsistencias quedan marcadas.
- La liquidación T+1 aplica la comisión configurada y registra la transferencia.
- El Municipio ve la recaudación en tiempo real desde el backoffice.

## NO hacer
- ANPR / fiscalización (Fase 6). Mapas avanzados (Fase 5).
