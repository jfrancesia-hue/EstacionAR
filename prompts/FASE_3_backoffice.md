# FASE 3 — Backoffice Municipal

> Objetivo: panel de control para el Municipio y supervisores. Configurar el sistema
> (tarifas, zonas, horarios), administrar permisionarios, y ver dashboards de gestión.

## Contexto
Leer `CLAUDE.md`, en especial §3.2 (tarifas configurables) y §3.6 (horarios/zonas).
Solo roles `supervisor` y `admin_municipal` acceden.

## Alcance

### A. Configuración del sistema (la flexibilidad que diferencia)
- **Tarifas:** CRUD de `tarifas` con vigencia. Crear nueva tarifa vigente desde una fecha
  (la actualización semestral debe ser un cambio de datos, sin tocar código). Configurar unidad
  mínima, primera unidad vs siguientes, descuento digital, feriados sin cobro.
- **Zonas/sectores:** alta/edición de `sectores` con dibujo de geometría sobre mapa, numeración
  par/impar, turno.
- **Horarios:** configurar diurno/nocturno por zona (corredores nocturnos específicos).

### B. ABM de permisionarios
- Alta, baja, modificación. Cambiar estado (activo/suspendido/vencido).
- Asignación a sector y turno. Generación/regeneración de QR (token firmado).
- Ficha completa: datos, contacto, sector georreferenciado, estado, QR.

### C. Dashboards de gestión
- Recaudación por día / semana / mes.
- Recaudación por sector y por permisionario.
- Cantidad de operaciones, ticket promedio, mix de medios de pago.
- Recaudación en tiempo real (lo que el Municipio ve antes de liquidar).

### D. Backoffice (React + Vite + TypeScript)
Vistas (nombres en español):
- `PanelInicio` — KPIs y recaudación en tiempo real.
- `PanelTarifas`, `PanelZonas`, `PanelHorarios` — configuración.
- `PanelPermisionarios` — ABM y fichas.
- `PanelReportes` — filtros y visualizaciones.
Estética premium, tablas y gráficos claros, responsive.

## Criterios de aceptación
- Un admin puede crear una tarifa nueva vigente desde una fecha y el motor de la Fase 1 la toma
  automáticamente, sin deploy.
- Alta de permisionario genera su QR firmado y queda asignado a un sector/turno.
- Los dashboards reflejan datos reales de las fases anteriores.
- Acceso restringido por rol; toda acción sensible queda en `auditoria`.

## NO hacer
- Conciliación/liquidación automática (Fase 4) ni ANPR (Fase 6).
