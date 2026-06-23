# EstacionAR · Handoff demo SFVC

## Estado

Demo comercial local para **EstacionAR · Municipalidad de San Fernando del Valle de Catamarca**.

App desplegable: `apps/demo`.
Stack: Vite + React 18 + PWA + monorepo pnpm.

## Reglas importantes

- No agregar `react-leaflet@5`: exige React 19 y rompe el deploy. El mapa es SVG propio.
- No tocar el script raíz `build`: ya incluye `build:ui`.
- Mantener español argentino con voseo.
- No declarar integración oficial con el Municipio: es demo/prototipo contextualizado.

## Personalización aplicada

- Textos cambiados de Salta a San Fernando del Valle de Catamarca / SFVC.
- Paleta cambiada a vino/bordó/ocre.
- Sectores demo: Plaza 25 de Mayo, Peatonal Rivadavia, Calle Sarmiento, Calle República, Calle Esquiú y Av. Belgrano.
- Assets nuevos: `catamarca-preview.jpeg`, `catamarca-brand.svg`, `icon.svg` recoloreado.
- Backoffice usa `MapaSectores` SVG; `MapaReal.tsx` queda como adapter SVG sin dependencias de mapa.
- Removidas dependencias de Leaflet del demo: `leaflet`, `react-leaflet`, `@types/leaflet`.

## Contexto municipal incorporado

Fuente: página pública de Tránsito Municipal de la Municipalidad de SFVC.

- Dirección de Tránsito Municipal.
- Base operativa: Los Regionales esq. Santa Fe.
- Mesa General de Entradas: Maipú 611.
- Estacionamiento Ordenado: Sarmiento 1050.
- Atención: lunes a viernes 07/08 a 13 hs.
- Teléfono: 03834-437-417.
- Email: transitomunicipal@catamarcaciudad.gob.ar.
- Futuras extensiones: libre estacionamiento para discapacidad, espacios reservados, taxi/remis y constancias.

## Verificación realizada

- `pnpm install --lockfile-only`: OK.
- `pnpm build:demo`: OK.
- Playwright mobile layout audit: OK, sin overflow horizontal y sin errores de consola.
- Búsqueda: sin `Municipalidad de Salta`, `microcentro de Salta`, `municipalidad-salta`, `react-leaflet` ni `leaflet/dist`.

## Próximo QA recomendado

1. Reiniciar `pnpm dev:demo` para evitar cache vieja de Vite.
2. Revisar mobile en `http://localhost:5180`.
3. Probar roles: conductor, permisionario y municipio.
4. Al desplegar, probar en incógnito.
