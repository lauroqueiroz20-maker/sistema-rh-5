do $$
begin
  if to_regclass('public.solicitacoes') is null then
    create table public.solicitacoes (
      id text primary key,
      protocolo text not null,
      codigo_gestor text not null,
      gestor text not null,
      unidade text not null,
      itens jsonb not null default '[]'::jsonb,
      total_vagas integer not null default 0,
      data_resposta timestamptz not null,
      status text not null default 'RECEBIDA',
      criado_em timestamptz not null default now()
    );
  end if;

  if to_regclass('public.app_state') is null then
    create table public.app_state (
      id text primary key,
      dados jsonb not null,
      atualizado_em timestamptz not null default now()
    );
  end if;
end $$;

alter table public.app_state
  alter column id drop identity if exists;

alter table public.app_state
  alter column id drop default;

alter table public.app_state
  alter column id type text using id::text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'app_state'
      and column_name = 'key'
      and data_type in (
        'text',
        'character varying',
        'character'
      )
  ) then
    alter table public.app_state
      alter column key set default 'principal';
  end if;
end $$;

alter table public.solicitacoes
  add column if not exists protocolo text;

alter table public.solicitacoes
  add column if not exists codigo_gestor text;

alter table public.solicitacoes
  add column if not exists gestor text;

alter table public.solicitacoes
  add column if not exists unidade text;

alter table public.solicitacoes
  add column if not exists itens jsonb not null default '[]'::jsonb;

alter table public.solicitacoes
  add column if not exists total_vagas integer not null default 0;

alter table public.solicitacoes
  add column if not exists data_resposta timestamptz;

alter table public.solicitacoes
  add column if not exists status text not null default 'RECEBIDA';

alter table public.solicitacoes
  add column if not exists criado_em timestamptz not null default now();

alter table public.app_state
  add column if not exists dados jsonb not null default '{}'::jsonb;

alter table public.app_state
  add column if not exists atualizado_em timestamptz not null default now();

alter table public.solicitacoes
  enable row level security;

alter table public.app_state
  enable row level security;

drop policy if exists
  "gestores inserem solicitacoes"
  on public.solicitacoes;

create policy
  "gestores inserem solicitacoes"
  on public.solicitacoes
  for insert
  to authenticated
  with check (
    (
      auth.jwt() -> 'user_metadata' ->> 'perfil' = 'GESTOR'
      or auth.jwt() ->> 'email' = 'tatyanatravassos@gmail.com'
    )
    and codigo_gestor = auth.jwt() -> 'user_metadata' ->> 'codigoGestor'
  );

drop policy if exists
  "gestores leem proprias solicitacoes"
  on public.solicitacoes;

create policy
  "gestores leem proprias solicitacoes"
  on public.solicitacoes
  for select
  to authenticated
  using (
    auth.jwt() -> 'user_metadata' ->> 'perfil' = 'ADMIN'
    or auth.jwt() ->> 'email' = 'tatyanatravassos@gmail.com'
    or codigo_gestor = auth.jwt() -> 'user_metadata' ->> 'codigoGestor'
  );

drop policy if exists
  "admin atualiza solicitacoes"
  on public.solicitacoes;

create policy
  "admin atualiza solicitacoes"
  on public.solicitacoes
  for update
  to authenticated
  using (
    auth.jwt() -> 'user_metadata' ->> 'perfil' = 'ADMIN'
    or auth.jwt() ->> 'email' = 'tatyanatravassos@gmail.com'
  )
  with check (
    auth.jwt() -> 'user_metadata' ->> 'perfil' = 'ADMIN'
    or auth.jwt() ->> 'email' = 'tatyanatravassos@gmail.com'
  );

drop policy if exists
  "admin gerencia estado"
  on public.app_state;

create policy
  "admin gerencia estado"
  on public.app_state
  for all
  to authenticated
  using (
    auth.jwt() -> 'user_metadata' ->> 'perfil' = 'ADMIN'
    or auth.jwt() ->> 'email' = 'tatyanatravassos@gmail.com'
  )
  with check (
    auth.jwt() -> 'user_metadata' ->> 'perfil' = 'ADMIN'
    or auth.jwt() ->> 'email' = 'tatyanatravassos@gmail.com'
  );
