-- Programa Excelência 5 Estrelas 2027 — Migração inicial de desenho.
-- Não executar diretamente em produção antes da revisão pela equipe.
-- Dados corporativos reais nunca devem ser usados em seed.sql.
create extension if not exists pgcrypto;

create table public.empresas (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nome text not null,
  criado_em timestamptz not null default now()
);

create table public.filiais (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id),
  codigo text,
  nome text not null,
  ativa boolean not null default true,
  criado_em timestamptz not null default now(),
  unique (empresa_id, nome)
);

create table public.categorias (
  id smallint primary key,
  slug text not null unique,
  nome text not null unique
);

insert into public.categorias (id,slug,nome) values
(1,'florestal','Florestal'),
(2,'sucro','Sucro'),
(3,'mineracao','Mineração'),
(4,'bebidas','Bebidas'),
(5,'rodoviario-cavalo-mecanico','Rodoviário – Cavalo Mecânico'),
(6,'truck-toco','Motoristas de Truck/Toco'),
(7,'ecommerce','E-commerce'),
(8,'operadores-maquinas-tratores','Operadores de Máquinas e Tratores');

create table public.colaboradores (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id),
  matricula text not null check(length(trim(matricula)) > 0),
  nome text not null check(length(trim(nome)) > 0),
  filial_id uuid references public.filiais(id),
  funcao text,
  secao text,
  situacao_rh text,
  participa_programa boolean not null default false,
  categoria_id smallint references public.categorias(id),
  categorizacao_status text not null default 'pendente' check(categorizacao_status in ('pendente','automatica','manual','nao_participa')),
  desligado_manual boolean not null default false,
  desligado_em date,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique(empresa_id, matricula),
  constraint nao_participante_sem_categoria check (categorizacao_status <> 'nao_participa' or categoria_id is null)
);
create index colaboradores_filial_categoria on public.colaboradores (filial_id,categoria_id);
create index colaboradores_matricula on public.colaboradores (matricula);

create table public.importacoes (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check(tipo in ('rh0034','advertencias','acidentes','produtividade','dirigibilidade','jornada','treinamentos')),
  competencia date,
  arquivo_nome text not null,
  sha256 text check(sha256 is null or sha256 ~ '^[a-f0-9]{64}$'),
  estado text not null default 'validando' check(estado in ('validando','bloqueada','validada','confirmada','cancelada')),
  total_linhas integer not null default 0 check(total_linhas >= 0),
  detalhes_validacao jsonb not null default '{}'::jsonb,
  criado_por uuid references auth.users(id),
  criado_em timestamptz not null default now(),
  confirmado_em timestamptz,
  check (competencia is null or extract(day from competencia) = 1)
);

create table public.ferias (
  id uuid primary key default gen_random_uuid(),
  colaborador_id uuid not null references public.colaboradores(id),
  inicio date not null,
  termino date not null,
  dias_gozo integer not null check (dias_gozo > 0),
  importacao_id uuid references public.importacoes(id),
  criado_em timestamptz not null default now(),
  constraint periodo_ferias_valido check(termino >= inicio),
  unique (colaborador_id, inicio, termino)
);
create index ferias_periodo on public.ferias (inicio, termino);

create table public.regras_classificacao (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references public.empresas(id),
  filial_id uuid references public.filiais(id),
  funcao_padrao text,
  secao_padrao text,
  categoria_id smallint references public.categorias(id),
  nao_participa boolean not null default false,
  prioridade integer not null default 100,
  ativa boolean not null default false,
  aprovada_por uuid references auth.users(id),
  aprovada_em timestamptz,
  criada_em timestamptz not null default now(),
  constraint regra_valida check (
    (nao_participa = true and categoria_id is null)
    or (nao_participa = false and categoria_id is not null)
  )
);

create table public.historico_categorias (
  id uuid primary key default gen_random_uuid(),
  colaborador_id uuid not null references public.colaboradores(id),
  categoria_id smallint references public.categorias(id),
  origem text not null check(origem in ('automatica','manual','nao_participa')),
  competencia_inicio date not null,
  competencia_fim date,
  motivo text,
  aprovado_por uuid references auth.users(id),
  regra_id uuid references public.regras_classificacao(id),
  criado_em timestamptz not null default now(),
  constraint historico_periodo_valido check(competencia_fim is null or competencia_fim >= competencia_inicio)
);
create index historico_categoria_colaborador on public.historico_categorias(colaborador_id,competencia_inicio);

create table public.penalizacoes_seguranca (
  id uuid primary key default gen_random_uuid(),
  colaborador_id uuid not null references public.colaboradores(id),
  competencia date not null check(extract(day from competencia) = 1),
  tipo text not null check(tipo in ('advertencia','acidente')),
  descricao text not null check(length(trim(descricao)) > 0),
  importacao_id uuid not null references public.importacoes(id),
  criado_em timestamptz not null default now()
);
create index penalizacoes_competencia on public.penalizacoes_seguranca(competencia,colaborador_id);

create table public.notas_mensais (
  id uuid primary key default gen_random_uuid(),
  colaborador_id uuid not null references public.colaboradores(id),
  competencia date not null check(extract(day from competencia) = 1),
  estrela text not null check(estrela in ('seguranca','produtividade','dirigibilidade','jornada','treinamentos')),
  nota numeric(5,2) not null check(nota between 0 and 100),
  fonte_dirigibilidade text check(fonte_dirigibilidade in ('gobrax','maxtrack','idt')),
  origem text not null check(origem in ('planilha','seguranca_calculada','ferias_estimada')),
  importacao_id uuid references public.importacoes(id),
  atualizado_em timestamptz not null default now(),
  unique(colaborador_id,competencia,estrela),
  constraint seguranca_binaria check(estrela <> 'seguranca' or nota in (0,100)),
  constraint fonte_dirigibilidade_aplicavel check (
    (estrela = 'dirigibilidade' and fonte_dirigibilidade is not null)
    or (estrela <> 'dirigibilidade' and fonte_dirigibilidade is null)
  )
);
create index notas_periodo on public.notas_mensais(competencia,estrela);

create table public.perfis (
  usuario_id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  administrador boolean not null default false,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);
create table public.permissoes_usuario (
  usuario_id uuid not null references public.perfis(usuario_id) on delete cascade,
  permissao text not null,
  primary key(usuario_id,permissao)
);
create table public.filiais_usuario (
  usuario_id uuid not null references public.perfis(usuario_id) on delete cascade,
  filial_id uuid not null references public.filiais(id),
  primary key(usuario_id,filial_id)
);

create table public.auditoria (
  id bigint generated always as identity primary key,
  tabela text not null,
  registro_id text,
  acao text not null,
  usuario_id uuid references auth.users(id),
  antes jsonb,
  depois jsonb,
  criado_em timestamptz not null default now()
);

-- RLS: padrão seguro (nega acesso via cliente, exceto categorias públicas aos autenticados).
-- Próxima migração implementará políticas de leitura/escrita por permissões e filiais.
-- NÃO usar service_role no navegador. Importações ocorrerão no backend autenticado.
alter table public.empresas enable row level security;
alter table public.filiais enable row level security;
alter table public.categorias enable row level security;
alter table public.colaboradores enable row level security;
alter table public.importacoes enable row level security;
alter table public.ferias enable row level security;
alter table public.regras_classificacao enable row level security;
alter table public.historico_categorias enable row level security;
alter table public.penalizacoes_seguranca enable row level security;
alter table public.notas_mensais enable row level security;
alter table public.perfis enable row level security;
alter table public.permissoes_usuario enable row level security;
alter table public.filiais_usuario enable row level security;
alter table public.auditoria enable row level security;

create policy categorias_leitura_autenticada on public.categorias
  for select to authenticated using (true);
