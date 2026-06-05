# FASE 0 — Fundación

> Objetivo: dejar el monorepo, la infraestructura y la base de datos listos para construir
> sobre ellos. Al terminar, el sistema arranca, autentica usuarios y tiene el schema base.

## Contexto
Leer `CLAUDE.md` completo antes de empezar. Respetar stack, estructura de monorepo y convenciones.

## Alcance de esta fase
1. Inicializar el monorepo (gestor de workspaces: pnpm o turborepo) con la estructura definida
   en CLAUDE.md §2.
2. Configurar `packages/config` (tsconfig base, eslint, prettier, tailwind compartido).
3. Configurar Supabase (proyecto, variables de entorno, cliente compartido en `packages/core`).
4. Crear el **schema base** con migraciones SQL en `supabase/migrations/`.
5. Implementar **auth y roles** (conductor, permisionario, supervisor, admin_municipal) con
   Supabase Auth + guards en NestJS.
6. Scaffolding mínimo de las 3 apps (conductor, permisionario, backoffice) y de `packages/api`
   (NestJS) que arranquen y se conecten a Supabase.
7. CI básico (lint + typecheck + build).

## Schema base (migración inicial)
Crear tablas con RLS habilitado donde corresponda:

- `roles` (id, name)
- `users` (id, email, role_id, full_name, created_at) — espejo de auth.users
- `permisionarios` (id, user_id, dni, full_name, contact_phone, status[active|suspended|expired], qr_token, created_at)
- `sectores` (id, name, geom geometry(Polygon,4326), numbering[par|impar|ambos], notes)
- `asignaciones` (id, permisionario_id, sector_id, shift[diurno|nocturno], schedule jsonb)
- `tarifas` (id, vehicle_type[auto|moto], min_unit_minutes, first_unit_amount, next_unit_amount, digital_discount_pct, valid_from, valid_to, active)
- `auditoria` (id, actor_user_id, action, entity, entity_id, payload jsonb, created_at) — append-only

Habilitar la extensión PostGIS en la migración (`create extension if not exists postgis`).

## Criterios de aceptación
- `pnpm install && pnpm dev` levanta API + las 3 apps sin errores.
- Un usuario puede registrarse/iniciar sesión y se le asigna un rol.
- Los guards de NestJS bloquean rutas según rol.
- Las migraciones corren limpias y el seed carga una tarifa inicial (auto $700, moto $300,
  descuento 20%, unidad 15 min) y 2 sectores de ejemplo con geometría.
- Typecheck y lint en verde.

## NO hacer en esta fase
- Lógica de pagos, sesiones ni reportes (van en fases siguientes).
- Pantallas de producto más allá del scaffolding y login.
