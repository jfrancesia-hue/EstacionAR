# CLAUDE.md · EstacionAR SFVC

## Proyecto

EstacionAR es una demo de plataforma de estacionamiento medido para San Fernando del Valle de Catamarca.

App principal: `apps/demo`.
Stack: Vite + React 18 + PWA.

## Reglas críticas

- No agregar `react-leaflet@5` ni dependencias de Leaflet en `apps/demo`.
- No tocar el script raíz `build`.
- El mapa de demo debe ser SVG propio.
- Mantener español argentino con voseo.
- No declarar integración oficial con la Municipalidad.

## Contexto SFVC

Área: Dirección de Tránsito Municipal.
Base operativa: Los Regionales esq. Santa Fe.
Mesa General de Entradas: Maipú 611.
Estacionamiento Ordenado: Sarmiento 1050.
Atención: lunes a viernes 07/08 a 13 hs.
Contacto: 03834-437-417 / transitomunicipal@catamarcaciudad.gob.ar.

## Diseño

Usar la dirección **Trama Poncho Operativa**: bordó/ocre, microcentro SFVC, mapa SVG, controles municipales y mobile-first.

## Verificación mínima antes de cerrar

```bash
pnpm build:demo
```

Además: buscar restos de Salta y de Leaflet, probar `pnpm dev:demo` en puerto 5180 y revisar mobile.
