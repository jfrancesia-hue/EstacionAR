# EstacionAR · Municipalidad de Salta

Demo **interactiva** de plataforma de estacionamiento medido para la Municipalidad de Salta.

## 🚀 Demo para mostrar (1 sola app, lista para Vercel)

La forma recomendada de presentar el sistema es la **demo unificada** (`apps/demo`): una sola web
con selector **Backoffice · Conductor · Permisionario**, estado compartido en el navegador y
**sin backend ni base de datos**. Los pagos son **simulados** (en producción se integran Mercado
Pago, MODO y Naranja X). Es 100% estática → se aloja en Vercel gratis.

```powershell
pnpm install
pnpm dev:demo      # arranca en http://localhost:5180
```

Probá el circuito: en **Conductor** pagás una patente → cambiás a **Backoffice** y la recaudación
sube; en **Permisionario** cargás efectivo y aparece en sus movimientos. Botón **Reiniciar** para
volver al estado inicial.

### Deploy a Vercel
El repo ya trae `vercel.json` configurado. En Vercel: *New Project* → importás el repo →
deja el `vercel.json` (build `pnpm build:demo`, output `apps/demo/dist`) → Deploy. Listo, un link.

> El resto del README describe el **modo desarrollo con 3 apps + API** (Express/store en memoria),
> que es la base para la futura versión production-ready (NestJS + Supabase).

## Qué muestra

- Backoffice municipal en vivo: recaudación, sectores, tarifas, permisionarios y auditoría,
  con botón **Actualizar** que refleja al instante los pagos que entran desde las otras apps.
- App Conductor con flujo real QR → patente → cotización → **pago digital** → comprobante
  emitido por la API (vigencia y monto reales). Incluye consulta de saldo por patente.
- App Permisionario con credencial QR real, recaudación del día en vivo y **carga de efectivo
  auditada** (idempotente, sin duplicados).
- API con todos los endpoints del circuito (tarifas, cotización, pagos, dashboard, fiscal).
- Core testeado para reglas críticas: tarifas, billetera por patente, QR, conciliación y liquidación.

> La demo interactiva requiere la API levantada (puerto 4000). Si no corre, cada app lo avisa.

## URLs locales

Con los servidores levantados:

- Backoffice: http://localhost:5173
- Conductor: http://localhost:5174
- Permisionario: http://localhost:5175
- API health: http://localhost:4000/api/health

## Arranque rápido en Windows

```powershell
powershell -ExecutionPolicy Bypass -File .\DEMO_START.ps1
```

Para chequear estado:

```powershell
powershell -ExecutionPolicy Bypass -File .\DEMO_STATUS.ps1
```

Para detener:

```powershell
powershell -ExecutionPolicy Bypass -File .\DEMO_STOP.ps1
```

## Comandos manuales

```bash
pnpm install
pnpm test
pnpm build
pnpm dev:api
pnpm dev:backoffice
pnpm dev:conductor
pnpm dev:permisionario
```

## Estado verificado

- `pnpm test`: 31 tests OK.
- `pnpm build`: OK (core, ui, api y las 3 apps).
- `pnpm typecheck`: OK.
- Flujo end-to-end contra la API: pago digital del conductor → impacta en el dashboard;
  efectivo del permisionario → impacta en su recaudación; billetera por patente extiende
  sin recobrar; auditoría registra cada operación.

## Guion de demo recomendado

1. Abrir Backoffice y mostrar la recaudación municipal (datos en vivo desde la API).
2. Abrir Conductor: ingresar patente, elegir tiempo y **pagar** (digital). Mostrar el comprobante real.
3. Volver al Backoffice y tocar **Actualizar**: la recaudación y las operaciones suben con ese pago.
4. En Conductor, "Consultar saldo" de la patente y explicar la billetera por tiempo:
   si se mueve de sector dentro de la ventana, no vuelve a pagar.
5. Abrir Permisionario: registrar un **pago en efectivo** y ver cómo aparece en sus movimientos
   y en su recaudación del día (registro inmutable e idempotente).
6. Cerrar con la ventaja comercial: control fiscal municipal, trazabilidad, tarifas configurables
   y rol del permisionario preservado.

## Nota

Los datos son demo y están marcados como demo. La arquitectura está preparada para conectar Supabase real, pagos sandbox/producción y autenticación por roles.
