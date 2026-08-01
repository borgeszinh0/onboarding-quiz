-- ============================================================
-- Valores — schema Supabase
-- Rode isto no SQL Editor do seu projeto Supabase (uma vez).
-- ============================================================

-- Uma linha por usuário guarda o app inteiro como um blob JSON.
-- Simples, sem migrações por feature, e casa com o reducer existente.
--   planner — Tasks, TimeBlocks, Habits, HabitLogs e foco trimestral
--             (regra 1-3-5, Inbox, Modo Foco)
--
-- `quiz`, `plan`, `daily`, `tea` são legado de versões anteriores do app
-- (mapa de valores ACT, 12 Week Year, tarefas soltas, Tempo/Energia/Atenção).
-- O app não lê nem escreve mais nessas colunas, mas elas continuam aqui de
-- propósito: apagá-las destruiria dados de quem usou versões antigas.
-- Remova só quando tiver certeza de que ninguém precisa mais exportá-los.
create table if not exists public.app_state (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  quiz        jsonb not null default '{}'::jsonb,
  plan        jsonb not null default '{}'::jsonb,
  daily       jsonb not null default '{}'::jsonb,
  tea         jsonb not null default '{}'::jsonb,
  planner     jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

-- Para bancos criados antes desta versão. Aditivo: nenhum dado existente é tocado.
alter table public.app_state
  add column if not exists planner jsonb not null default '{}'::jsonb;

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

-- Perfil editável do app. Auth continua em auth.users; esta tabela guarda só
-- dados de apresentação que o usuário pode alterar dentro do produto.
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  display_name  text,
  avatar_url    text,
  avatar_path   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint profiles_display_name_length
    check (display_name is null or char_length(display_name) <= 80)
);

alter table public.profiles
  add column if not exists display_name text,
  add column if not exists avatar_url text,
  add column if not exists avatar_path text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table public.profiles enable row level security;

drop policy if exists "own profile select" on public.profiles;
create policy "own profile select" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "own profile insert" on public.profiles;
create policy "own profile insert" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "own profile update" on public.profiles;
create policy "own profile update" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch
  before update on public.profiles
  for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function public.handle_new_user_profile();

-- Avatar público, escrita restrita à pasta do usuário autenticado.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'avatars',
  'avatars',
  true,
  1048576,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "avatar public read" on storage.objects;
create policy "avatar public read" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatar own insert" on storage.objects;
create policy "avatar own insert" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatar own update" on storage.objects;
create policy "avatar own update" on storage.objects
  for update to authenticated using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  ) with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatar own delete" on storage.objects;
create policy "avatar own delete" on storage.objects
  for delete to authenticated using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
