# FASE 6 — Fiscalización inteligente (FUTURO, no implementar hasta consolidar la base)

> Objetivo: dejar preparada la capa de fiscalización por lectura de patentes (ANPR), actas
> digitales e integración con inspectores. Se incorpora SOLO cuando las fases 0-5 están
> consolidadas y validadas en producción. No sobreprometer: esta capa no va en el MVP.

## Contexto
Leer `CLAUDE.md`. Esta fase se apoya en que la sesión ya está modelada por patente (Fase 1),
lo que permite cruzar una patente detectada contra las sesiones activas.

## Alcance (cuando se active)

### A. Lectura de patentes (ANPR)
- App de supervisión que procesa video/imágenes y reconoce patentes (modelo de visión).
- Cruce de la patente detectada contra `sesiones` activas dentro de la ventana de tiempo.
- Si no hay pago vigente → genera una infracción candidata para revisión humana.

### B. Actas digitales
- Tabla `actas` (id, plate, sector_id, inspector_id, evidence_url, status, created_at).
- Generación de acta digital con evidencia (foto/ubicación) y flujo de revisión.

### C. Integración con inspectores
- App/rol de inspector municipal: ver infracciones candidatas, validar, emitir acta.
- Georreferenciación de la infracción.

### D. Analítica predictiva (opcional)
- Mapas de calor de ocupación y predicción de demanda con datos históricos de las fases anteriores.

## Criterios de aceptación (cuando se active)
- Una patente sin sesión activa detectada por ANPR genera una infracción candidata revisable.
- El inspector puede validar y emitir un acta digital con evidencia.
- Nada de esto degrada el rendimiento del núcleo transaccional.

## Importante
- NO implementar en el MVP ni prometerlo como entrega inicial. Es escalabilidad posterior.
- Requiere definición legal previa (debido proceso, evidencia, normativa de infracciones).
