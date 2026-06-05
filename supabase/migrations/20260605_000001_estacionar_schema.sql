-- EstacionAR · Municipalidad de Salta
-- Schema base demo/casi producción para PostgreSQL + PostGIS vía Supabase.

create extension if not exists postgis;
create extension if not exists pgcrypto;

-- Tipos
create type user_role as enum ('conductor', 'permisionario', 'supervisor', 'admin_municipal');
create type permisionario_status as enum ('active', 'suspended', 'expired');
create type numbering_type as enum ('par', 'impar', 'ambos');
create type shift_type as enum ('diurno', 'nocturno');
create type vehicle_type as enum ('auto', 'moto');
create type session_status as enum ('active', 'expired', 'cancelled');
create type payment_method as enum ('qr', 'mercadopago', 'modo', 'naranja', 'card', 'cash');
create type payment_status as enum ('pending', 'approved', 'rejected');
create type incident_status as enum ('open', 'in_progress', 'closed');
create type rendicion_status as enum ('pendiente', 'conciliada', 'con_diferencia');
create type liquidacion_status as enum ('pending', 'approved', 'transferred', 'failed');

-- Roles / usuarios espejo de auth.users
create table roles (
  id uuid primary key default gen_random_uuid(),
  name user_role not null unique
);

create table users (
  id uuid primary key,
  email text not null unique,
  role_id uuid references roles(id),
  full_name text not null,
  created_at timestamptz not null default now()
);

create table permisionarios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  dni text not null unique,
  full_name text not null,
  contact_phone text,
  status permisionario_status not null default 'active',
  qr_token text not null unique,
  created_at timestamptz not null default now()
);

create table sectores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  geom geometry(Polygon, 4326) not null,
  numbering numbering_type not null default 'ambos',
  shift shift_type not null default 'diurno',
  notes text
);
create index sectores_geom_idx on sectores using gist (geom);

create table asignaciones (
  id uuid primary key default gen_random_uuid(),
  permisionario_id uuid not null references permisionarios(id),
  sector_id uuid not null references sectores(id),
  shift shift_type not null,
  schedule jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table tarifas (
  id uuid primary key default gen_random_uuid(),
  vehicle_type vehicle_type not null,
  min_unit_minutes int not null check (min_unit_minutes > 0),
  first_block_minutes int not null default 60,
  first_unit_amount numeric(12,2) not null check (first_unit_amount >= 0),
  next_unit_amount numeric(12,2) not null check (next_unit_amount >= 0),
  digital_discount_pct numeric(5,2) not null default 0 check (digital_discount_pct >= 0 and digital_discount_pct <= 100),
  valid_from timestamptz not null,
  valid_to timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index tarifas_lookup_idx on tarifas(vehicle_type, active, valid_from desc);

create table sesiones (
  id uuid primary key default gen_random_uuid(),
  plate text not null,
  vehicle_type vehicle_type not null,
  paid_minutes int not null check (paid_minutes > 0),
  start_valid timestamptz not null,
  end_valid timestamptz not null,
  tarifa_id uuid references tarifas(id),
  amount numeric(12,2) not null check (amount >= 0),
  origin_sector_id uuid references sectores(id),
  status session_status not null default 'active',
  created_at timestamptz not null default now(),
  constraint plate_uppercase check (plate = upper(plate))
);
create index sesiones_plate_active_idx on sesiones(plate, status, end_valid desc);

create table pagos (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid references sesiones(id),
  method payment_method not null,
  amount numeric(12,2) not null check (amount >= 0),
  status payment_status not null default 'pending',
  external_ref text,
  receipt_url text,
  registered_by uuid references permisionarios(id),
  permisionario_id uuid references permisionarios(id),
  plate text,
  sector_id uuid references sectores(id),
  idempotency_key text,
  created_at timestamptz not null default now()
);
create unique index pagos_cash_idempotency_idx on pagos(idempotency_key) where idempotency_key is not null;
create index pagos_created_idx on pagos(created_at desc);
create index pagos_permisionario_idx on pagos(permisionario_id, created_at desc);

create table incidencias (
  id uuid primary key default gen_random_uuid(),
  permisionario_id uuid not null references permisionarios(id),
  type text not null,
  description text not null,
  status incident_status not null default 'open',
  created_at timestamptz not null default now()
);

create table rendiciones (
  id uuid primary key default gen_random_uuid(),
  permisionario_id uuid not null references permisionarios(id),
  period_date date not null,
  digital_amount numeric(12,2) not null default 0,
  cash_amount numeric(12,2) not null default 0,
  operations_count int not null default 0,
  status rendicion_status not null default 'pendiente',
  difference_amount numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  unique (permisionario_id, period_date)
);

create table liquidaciones (
  id uuid primary key default gen_random_uuid(),
  permisionario_id uuid not null references permisionarios(id),
  period daterange not null,
  gross_amount numeric(12,2) not null default 0,
  fee_amount numeric(12,2) not null default 0,
  net_amount numeric(12,2) not null default 0,
  status liquidacion_status not null default 'pending',
  transfer_ref text,
  created_at timestamptz not null default now()
);

create table valoraciones (
  id uuid primary key default gen_random_uuid(),
  permisionario_id uuid not null references permisionarios(id),
  sesion_id uuid references sesiones(id),
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create table auditoria (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references users(id),
  action text not null,
  entity text not null,
  entity_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- RLS base. En producción se reemplazan las policies demo por claims reales de Supabase Auth.
alter table users enable row level security;
alter table permisionarios enable row level security;
alter table sectores enable row level security;
alter table asignaciones enable row level security;
alter table tarifas enable row level security;
alter table sesiones enable row level security;
alter table pagos enable row level security;
alter table incidencias enable row level security;
alter table rendiciones enable row level security;
alter table liquidaciones enable row level security;
alter table valoraciones enable row level security;
alter table auditoria enable row level security;

-- Auditoría append-only: sin policies de update/delete. Insert/select restringible por rol en producción.
create policy auditoria_insert_demo on auditoria for insert with check (true);
create policy auditoria_select_demo on auditoria for select using (true);

-- Seed mínimo institucional demo.
insert into roles(name) values
  ('conductor'), ('permisionario'), ('supervisor'), ('admin_municipal')
on conflict do nothing;

insert into tarifas(vehicle_type, min_unit_minutes, first_block_minutes, first_unit_amount, next_unit_amount, digital_discount_pct, valid_from, active)
values
  ('auto', 15, 60, 700, 175, 20, '2026-01-01T00:00:00Z', true),
  ('moto', 15, 60, 300, 75, 20, '2026-01-01T00:00:00Z', true);
