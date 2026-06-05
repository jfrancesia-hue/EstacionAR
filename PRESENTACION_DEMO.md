# EstacionAR · Guion de demo comercial

## Apertura

**EstacionAR** es una plataforma integral de estacionamiento medido para la **Municipalidad de Salta**.

La propuesta no reemplaza al permisionario: ordena el sistema, amplía la recaudación digital, mantiene el control fiscal municipal y deja trazabilidad completa de cada operación.

## Mensaje central

> “El Municipio ve y controla la recaudación en tiempo real. El conductor paga simple. El permisionario sigue trabajando con una herramienta clara. Todo queda auditado.”

## Recorrido recomendado — 7 minutos

### 1. Backoffice municipal
Abrir: http://localhost:5173

Mostrar:
- Recaudación de hoy.
- Separación digital / efectivo.
- Sesiones activas.
- Mapa/sectores.
- Tarifas configurables.
- Permisionarios activos/suspendidos.
- Auditoría fiscal.

Frase sugerida:
> “La Municipalidad no espera reportes manuales: ve el flujo fiscal en vivo, antes de cualquier liquidación.”

### 2. App Conductor
Abrir: http://localhost:5174

Mostrar:
- QR válido del permisionario.
- Patente `AB123CD`.
- Vigencia 13:00 → 14:00.
- Precio con descuento digital.
- Comprobante municipal.

Frase sugerida:
> “La sesión se vincula a la patente, no a la cuadra. Si la persona se mueve dentro de la ventana, no vuelve a pagar.”

### 3. App Permisionario
Abrir: http://localhost:5175

Mostrar:
- Credencial QR.
- Recaudación del día.
- Digital vs efectivo.
- Registro de efectivo auditado.
- Movimientos.

Frase sugerida:
> “El permisionario no queda afuera: trabaja con QR propio, carga efectivo y todo queda trazado.”

### 4. Cierre fiscal
Volver a Backoffice.

Remarcar:
- Recaudación entra primero al Municipio.
- Liquidación al permisionario se calcula sobre reglas configurables.
- Auditoría inmutable.
- QR firmado evita desvíos.
- Tarifas se actualizan por datos, no por cambios de código.

## Diferenciales para venta/licita

- Control fiscal municipal en tiempo real.
- Billetera de tiempo por patente.
- No recobra si el conductor se mueve.
- QR de permisionario con estado y antifraude.
- Efectivo registrado de forma inmutable.
- Conciliación y liquidación preparadas.
- Diseño institucional co-brandeado con Municipalidad de Salta.
- Arquitectura lista para Supabase, Mercado Pago/MODO/Naranja y app mobile/PWA.

## Estado técnico de esta demo

- Tests core: 31/31 OK.
- Build completo: OK.
- Apps locales:
  - Backoffice: http://localhost:5173
  - Conductor: http://localhost:5174
  - Permisionario: http://localhost:5175
  - API demo: http://localhost:4000/api/health

## Próximo paso recomendado

Preparar deploy preview público y una presentación PDF/landing para enviar como propuesta formal.
