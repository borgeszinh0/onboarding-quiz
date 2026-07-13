-- ============================================================
-- Valores — schema Supabase
-- Rode isto no SQL Editor do seu projeto Supabase (uma vez).
-- ============================================================

-- Uma linha por usuário guarda o app inteiro como 3 blobs JSON.
-- Simples, sem migrações por feature, e casa com os reducers existentes.
create table if not exists public.app_state (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  quiz        jsonb not null default '{}'::jsonb,
  plan        jsonb not null default '{}'::jsonb,
  daily       jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

-- Row Level Security: cada usuário só enxerga/edita a própria linha.
alter table public.app_state enable row level security;

drop policy if exists "own row select" on public.app_state;
create policy "own row select" on public.app_state
  for select using (auth.uid() = user_id);

drop policy if exists "own row insert" on public.app_state;
create policy "own row insert" on public.app_state
  for insert with check (auth.uid() = user_id);

drop policy if exists "own row update" on public.app_state;
create policy "own row update" on public.app_state
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own row delete" on public.app_state;
create policy "own row delete" on public.app_state
  for delete using (auth.uid() = user_id);

-- Mantém updated_at fresco.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists app_state_touch on public.app_state;
create trigger app_state_touch
  before update on public.app_state
  for each row execute function public.touch_updated_at();
