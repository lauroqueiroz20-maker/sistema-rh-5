create table if not exists public.solicitacoes (
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

alter table public.solicitacoes
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
    auth.jwt() -> 'user_metadata' ->> 'perfil' = 'GESTOR'
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
  )
  with check (
    auth.jwt() -> 'user_metadata' ->> 'perfil' = 'ADMIN'
  );
