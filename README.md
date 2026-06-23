# EstacionAR · Municipalidad de San Fernando del Valle de Catamarca

Demo interactiva de plataforma de estacionamiento medido para la Municipalidad de San Fernando del Valle de Catamarca.

## Demo principal

La app que se despliega es `apps/demo`: una PWA Vite + React 18 con selector de rol para conductor, permisionario y backoffice municipal.

```powershell
pnpm install
pnpm dev:demo      # http://localhost:5180
pnpm build:demo
```

Los pagos son simulados. En producción se integrarían Mercado Pago, MODO, Naranja X, Supabase Auth y base de datos real.

## Qué muestra

- Conductor: QR del permisionario, patente, tiempo, pago digital/efectivo y comprobante.
- Permisionario: credencial QR, recaudación, movimientos, efectivo auditado e incidencias.
- Backoffice municipal: sectores del microcentro, tarifas, permisionarios, fiscalización por patente, reportes y auditoría.
- Mapa SVG propio de sectores Catamarca; no usa librerías de mapa.

## Personalización SFVC

Basada en la página pública de Tránsito Municipal de la Municipalidad de SFVC:

- Área: Dirección de Tránsito Municipal.
- Base operativa: Los Regionales esq. Santa Fe.
- Mesa General de Entradas: Maipú 611.
- Referencia de Estacionamiento Ordenado: Sarmiento 1050.
- Atención: lunes a viernes 07/08 a 13 hs.
- Contacto público: 03834-437-417 / transitomunicipal@catamarcaciudad.gob.ar.
- Trámites vinculados para futuras fases: libre estacionamiento para discapacidad, espacios reservados, taxi/remis y constancias.

La demo no declara integración oficial: usa estos datos como contexto territorial y funcional.

## Diseño

Dirección visual: identidad institucional Catamarca Capital, con fondo claro, azul municipal, celeste operativo, naranja de acción y logo oficial provisto como referencia.

Paleta principal:

- Azul institucional: `#163A63`.
- Fondo claro: `#F4F8FC`.
- Superficie secundaria: `#E8F1F8`.
- Celeste operativo: `#00A6D6`.
- Naranja institucional: `#F28C00`.

## Verificación

Última verificación local:

- `pnpm build:demo`: OK.
- Runtime mobile Playwright: sin errores de consola y sin overflow horizontal.
- Búsqueda de restos críticos: sin Salta ni imports de mapa Leaflet.
