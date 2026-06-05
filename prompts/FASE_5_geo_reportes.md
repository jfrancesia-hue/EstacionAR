# FASE 5 — Georreferenciación y reportes avanzados

> Objetivo: sumar la capa territorial (PostGIS + mapas) y los reportes/exportaciones de gestión
> que pide el pliego, más la valoración ciudadana del servicio.

## Contexto
Leer `CLAUDE.md`. Aprovechar la geometría de `sectores` ya creada en fases anteriores.

## Alcance

### A. Georreferenciación (PostGIS)
- Dashboard de mapa en el backoffice: sectores coloreados por recaudación / ocupación.
- Mapa público (app conductor) con zonas habilitadas y el "Mapa de Estacionamiento Medido".
- Consultas espaciales: recaudación por zona, densidad de operaciones, sectores más activos.

### B. Reportes avanzados y exportación
- Reportes por día/semana/mes; por sector; por permisionario; cantidad de operaciones;
  historial de transacciones.
- **Exportación a Excel y PDF** de todos los reportes.
- Comparativas de período y tendencias.

### C. Valoración ciudadana
- Tras el pago, el conductor puede calificar el servicio del permisionario (opcional).
- Promedio de valoración visible en la ficha del permisionario (backoffice) y para el ciudadano.

## Criterios de aceptación
- El mapa municipal muestra recaudación/ocupación por sector con datos reales.
- Todos los reportes exportan a Excel y PDF correctamente.
- El ciudadano puede calificar y la valoración se agrega a la ficha del permisionario.

## NO hacer
- ANPR / lectura de patentes (Fase 6).
