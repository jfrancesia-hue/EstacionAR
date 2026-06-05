# EstacionAR · Municipalidad de Salta

Demo casi producción de plataforma de estacionamiento medido para la Municipalidad de Salta.

## Qué muestra

- Backoffice municipal con recaudación, sectores, tarifas, permisionarios y auditoría.
- App Conductor con flujo QR → patente → pago → comprobante.
- App Permisionario con credencial QR, recaudación y carga de efectivo auditada.
- API demo con datos seed coherentes.
- Core testeado para reglas críticas: tarifas, billetera por patente, QR, conciliación y liquidación.

## URLs locales

Con los servidores levantados:

- Backoffice: http://localhost:5173
- Conductor: http://localhost:5174
- Permisionario: http://localhost:5175
- API health: http://localhost:4000/api/health

## Comandos

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
- `pnpm build`: OK.
- URLs locales: 5173, 5174, 5175 y 4000 responden 200.

## Guion de demo recomendado

1. Abrir Backoffice y mostrar recaudación municipal en tiempo real.
2. Abrir Conductor y mostrar escaneo QR + patente + pago.
3. Explicar billetera por patente: se puede mover sin pagar dos veces.
4. Abrir Permisionario y mostrar QR/carga de efectivo.
5. Volver al Backoffice y explicar separación digital/efectivo + auditoría.
6. Cerrar con ventaja comercial: control fiscal municipal, trazabilidad, tarifas configurables y rol del permisionario preservado.

## Nota

Los datos son demo y están marcados como demo. La arquitectura está preparada para conectar Supabase real, pagos sandbox/producción y autenticación por roles.
