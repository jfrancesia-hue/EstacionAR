# CLAUDE.md — EstacionAR

> Anchor de sesión para Claude Code. Leer SIEMPRE al inicio de cada sesión.
> Este archivo define el stack y las convenciones técnicas.

> ⚠️ **FUENTE DE VERDAD DE PRODUCTO Y NEGOCIO: [`PRODUCTO.md`](PRODUCTO.md)** (leer también al
> inicio). Define roles, flujos, QR de EstacionAR, efectivo con deuda, excedentes, fiscalización,
> alta/validación de permisionarios y el **modelo económico vigente 80/10/10** (permisionario 80%
> con **acreditación directa e inmediata**, plataforma/Nativos 10%, descuento al ciudadano 10%, el
> Municipio **no maneja fondos, solo fiscaliza**). Esto **actualiza la §3.4 de abajo** (que describía
> recaudación a cuenta municipal + liquidación T+1 — modelo descartado). Ante conflicto, manda `PRODUCTO.md`.

---

## 1. Qué es EstacionAR

Plataforma integral de **gestión de estacionamiento medido** para la Municipalidad de la
Ciudad de Salta (Argentina). Digitaliza el circuito completo —ciudadano, permisionario y
Municipio— con foco en **control fiscal, trazabilidad total y recaudación ampliada**.

Tres aplicaciones, un backend único:

- **App Conductor** (ciudadano): paga el estacionamiento en segundos. PWA + app.
- **App Permisionario** (trabajador): recaudación, efectivo, incidencias, reportes.
- **Backoffice Municipal** (admin/supervisor): configuración, ABM, dashboards, auditoría.

Objetivo de negocio: que el Municipio conserve el 100% de su recaudación y el control,
sin sacarle ingresos al permisionario, financiando el sistema con una comisión baja sobre
el pago digital.

---

## 2. Stack y arquitectura

Monorepo TypeScript end-to-end.

| Capa | Tecnología |
|------|------------|
| Apps móviles (conductor + permisionario) | React Native + Expo + TypeScript |
| PWA conductor (sin instalación) | Expo Web / React |
| Backoffice municipal | React (Vite) + TypeScript |
| Backend / API | NestJS (TypeScript) |
| Base de datos | PostgreSQL + PostGIS (vía Supabase) |
| Auth / Storage / Realtime | Supabase |
| Pagos | Mercado Pago, MODO, Naranja X, tarjetas (cuenta recaudadora municipal + split) |
| Notificaciones | WhatsApp Business API + email |
| Cola / jobs | BullMQ (Redis) para conciliación, liquidación y comprobantes |

> Nota de stack: el backoffice está en React por cohesión del monorepo. Si se decide
> respetar la regla "Web → PHP", se aísla como módulo Laravel consumiendo la misma API.

### Estructura del monorepo

```
estacionar/
├── apps/
│   ├── conductor/        # Expo (app + PWA): escaneo QR, pago, comprobante
│   ├── permisionario/    # Expo: recaudación, efectivo, incidencias, reportes
│   └── backoffice/       # React + Vite: admin municipal
├── packages/
│   ├── api/              # NestJS: API REST + lógica de negocio
│   ├── core/             # tipos, DTOs, reglas de dominio compartidas
│   ├── ui/               # componentes compartidos (design system)
│   └── config/           # eslint, tsconfig, tailwind compartidos
├── supabase/
│   ├── migrations/       # SQL de schema
│   └── seed/             # datos de prueba
└── CLAUDE.md
```

---

## 3. Reglas de negocio CRÍTICAS

Estas reglas son el corazón del sistema. No improvisar sobre ellas.

### 3.1 Billetera de tiempo por patente (núcleo)
- Una **sesión** se vincula a la **patente** + una **ventana temporal**, NO a la cuadra.
- Al pagar, se crea o extiende una ventana de vigencia (`inicio_vigencia` → `fin_vigencia`).
- Si el conductor se reubica en otra mano habilitada **dentro de la ventana**, el sistema
  reconoce el saldo restante y NO vuelve a cobrar.
- La cuadra/sector se registra solo para estadística de recaudación.
- Tolerancia de **5 minutos** tras el vencimiento antes de considerar impago.

### 3.2 Motor de tarifas configurable (nunca hardcodear)
- Tarifas, unidades y fracciones viven en tabla `tarifas`, editables desde el backoffice.
- Soportar: unidad mínima parametrizable (15/30/60/90/120 min), **tarifa diferenciada de
  primera unidad** vs siguientes, descuento por pago digital, feriados sin cobro.
- Vigente 2026 (valores iniciales del seed, NO constantes de código):
  auto/camioneta $700/h, moto $300/h, **descuento 20% pago digital**,
  fraccionamiento cada 15 min a partir de la segunda hora.
- Actualización tarifaria semestral → solo cambia un registro, nunca código.

### 3.3 QR y antifraude
- El QR identifica al **permisionario** (estático, en credencial).
- El cobro SIEMPRE se procesa del lado del servidor contra la **cuenta recaudadora municipal**.
- Validación con **JWT firmado + nonce por operación**. Un QR clonado no puede desviar fondos.
- Al escanear: validar estado del permisionario (activo/suspendido/vencido), sector y turno vigente.

### 3.4 Flujo del dinero
- Toda la recaudación (digital y efectivo) ingresa a **cuenta municipal**.
- **Split de pago** automático; liquidación al permisionario **T+1** o según convenio.
- El Municipio ve la recaudación en tiempo real ANTES de cualquier liquidación.

### 3.5 Efectivo
- Carga por el permisionario (rol autorizado) desde su app.
- Registro **inmutable** con sello de tiempo, usuario responsable y control **antiduplicidad**.
- **Rendición diaria** conciliada automáticamente.

### 3.6 Horarios y zonas
- Diurno (L-V y sábados) y nocturno (solo corredores específicos: Paseo Balcarce, Paseo Güemes,
  Plaza Alvarado y zonas autorizadas). Configurable por zona y turno.

---

## 4. Modelo de datos (entidades núcleo)

- `usuarios` / `roles` — conductor, permisionario, supervisor, admin_municipal
- `permisionarios` — datos, estado, qr_token, asignación
- `sectores` — geometría PostGIS, numeración par/impar, turno
- `asignaciones` — permisionario ↔ sector ↔ turno ↔ horario
- `tarifas` — configurables, con vigencia
- `sesiones` — billetera de tiempo por patente (patente, ventana, monto, sector_origen, estado)
- `pagos` — medio, monto, estado, comprobante, registrado_por
- `rendiciones` — por permisionario y fecha, estado de conciliación
- `liquidaciones` — split y transferencia al permisionario
- `incidencias` — reportes del permisionario
- `auditoria` — log inmutable de operaciones sensibles

---

## 5. Convenciones (OBLIGATORIAS)

- **Código** (variables, funciones, clases, archivos): **inglés**.
- **Comentarios**: **español**.
- **UI / textos de cara al usuario**: **español argentino, forma "vos"** ("Ingresá tu patente",
  "Pagá tu estacionamiento", "Revisá tu recaudación").
- **Nombres de pantallas y elementos de UI**: en español, consistentes en todo el proyecto
  (ej. `PantallaInicio`, `PantallaPago`, `PantallaRecaudacion`).
- Commits descriptivos. Tests en la lógica de negocio crítica (tarifas, sesiones, split).
- TypeScript estricto. DTOs validados (class-validator en NestJS, zod en front si aplica).

---

## 6. Reglas de trabajo

- **Production-ready, no demos.** Nada de mocks salvo que el prompt lo pida explícitamente.
- **Cambios quirúrgicos.** Tocar solo lo que la tarea pide. No refactorizar fuera de alcance.
- **Por fases.** No saltar de fase. Cada fase deja el sistema funcional y desplegable.
- Antes de crear, revisar si ya existe. Reutilizar `packages/core` y `packages/ui`.
- Estética premium en todas las UI: limpia, moderna, accesible. Paleta del proyecto abajo.
- Si una tarea es ambigua, asumir la opción más alineada con las reglas de negocio de la §3
  y dejar un comentario `// TODO(decisión):` en vez de inventar.

### Identidad visual
- Azul noche `#0A1A2F`, azul profundo `#102A47`, cyan eléctrico `#0FB6CE`, ámbar vial `#F5A623`.
- Tipografía geométrica moderna y legible. Foco en accesibilidad (permisionarios con bajo
  manejo tecnológico): botones grandes, alto contraste, mínimos pasos.

---

## 7. Mapa de fases

| Fase | Entrega |
|------|---------|
| **0** | Fundación: monorepo, Supabase, schema, auth, roles, CI |
| **1** | Núcleo transaccional: tarifas, billetera de tiempo, pagos digitales, flujo conductor |
| **2** | App del permisionario: recaudación, efectivo, incidencias, reportes |
| **3** | Backoffice municipal: configuración, ABM, dashboards |
| **4** | Seguridad y conciliación: QR firmado, auditoría, rendición, liquidación, transparencia |
| **5** | Georreferenciación y reportes avanzados: PostGIS, mapas, exportación |
| **6** | (Futuro) Fiscalización: ANPR, actas digitales, integración inspectores |

Cada fase tiene su prompt en `prompts/`. Ejecutar en orden.
