# EstacionAR — Handoff demo casi producción

## Estado actual

Proyecto creado como monorepo TypeScript para demo comercial de **EstacionAR · Municipalidad de Salta**.

El objetivo de esta primera entrega es mostrar un vertical slice fiscal vendible:

1. Municipio ve recaudación y control en tiempo real.
2. Conductor escanea QR, ingresa patente, paga y recibe comprobante.
3. La sesión se vincula a la patente, no a la cuadra: si se mueve dentro de la ventana no paga dos veces.
4. Permisionario carga efectivo de forma auditada e inmutable.
5. Backoffice separa digital/efectivo, muestra sectores, tarifas, permisionarios y auditoría.
6. QR/nonce y estado del permisionario preparan la capa antifraude.
7. Rendición/liquidación modeladas para explicar control fiscal municipal.

## Branding y diseño

- Producto: **EstacionAR**.
- Co-branding: **Municipalidad de Salta**.
- Referencia visual: `brand_refs/municipalidad_salta.jpeg`.
- Dirección: MotionSite premium B2G, ciudad nocturna, grilla urbana, sectores, QR, billetera de tiempo por patente, recaudación municipal.
- Colores:
  - Azul municipal: `#0067B1` / `#006BB6`.
  - Azul noche: `#0A1A2F`.
  - Azul profundo: `#102A47`.
  - Cyan tecnológico: `#0FB6CE`.
  - Ámbar vial: `#F5A623`.

## Estructura

```txt
apps/
  backoffice/       Panel municipal MotionSite
  conductor/        App/PWA demo para conductor
  permisionario/    App/PWA demo para permisionario
packages/
  api/              API TypeScript demo
  core/             Reglas puras testeadas
  ui/               Design system compartido
  config/           Config compartida
supabase/
  migrations/       Schema SQL Postgres/PostGIS
```

## Comandos

Instalar:

```bash
pnpm install
```

Tests core:

```bash
pnpm test
```

Build completo:

```bash
pnpm build
```

Levantar apps:

```bash
pnpm dev:backoffice      # http://localhost:5173
pnpm dev:conductor       # http://localhost:5174
pnpm dev:permisionario   # http://localhost:5175
pnpm dev:api             # API demo
```

## Verificación realizada

- `pnpm test`: OK, 31 tests pasados.
- `pnpm build`: OK, compilan API + Backoffice + Conductor + Permisionario.

## Qué está listo para mostrar

### Backoffice municipal
- Hero institucional EstacionAR · Municipalidad de Salta.
- Mapa/grilla urbana de sectores.
- KPIs de recaudación total, digital, efectivo y sesiones activas.
- Tarifas configurables visibles.
- Permisionarios con estado.
- Auditoría fiscal resumida.

### App Conductor
- Flujo QR → sector → patente → tiempo → precio digital → pago.
- Comprobante municipal.
- Mensaje claro de billetera de tiempo por patente.

### App Permisionario
- Credencial QR.
- Recaudación del día.
- Separación digital/efectivo.
- Registro de efectivo auditado.
- Últimos movimientos.

## Próximos pasos recomendados

1. QA visual en navegador real y ajustes de responsive.
2. Agregar navegación interna más profunda en cada app.
3. Conectar API demo a las apps en vez de consumir seed directo.
4. Deploy preview para compartir link.
5. Preparar guion comercial de 7 minutos.
6. Si avanza venta/licitación: migrar API demo a NestJS completo + Supabase real + Mercado Pago sandbox.

## Guion comercial recomendado

1. Abrir backoffice y mostrar recaudación municipal en tiempo real.
2. Abrir app conductor y pagar patente `AB123CD`.
3. Explicar que la sesión queda asociada a la patente, no a la cuadra.
4. Mostrar app permisionario cargando efectivo auditado.
5. Volver al backoffice: digital/efectivo separados y trazabilidad.
6. Mostrar tarifas configurables sin tocar código.
7. Cerrar con antifraude: QR firmado, permisionario suspendido rechazado, auditoría inmutable.
