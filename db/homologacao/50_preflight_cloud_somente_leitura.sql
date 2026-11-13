-- PRE-FLIGHT APENAS LEITURA. Não altera objetos, dados ou usuários.
-- Projeto deve ser selecionado e confirmado pelo responsável antes de executar.
-- NÃO contém credenciais, PII ou valores de UUIDs de usuários/filiais.
SELECT version AS migration_version, name AS migration_name
FROM supabase_migrations.schema_migrations
WHERE version IN ('20261029000100','20261106000100','20261111000100','20261111000200')
ORDER BY version;

SELECT
  (SELECT count(*) FROM auth.users) AS quantidade_contas_auth,
  (SELECT count(*) FROM public.perfis) AS quantidade_perfis,
  (SELECT count(*) FROM public.perfis WHERE administrador IS TRUE) AS administradores,
  (SELECT count(*) FROM public.filiais_usuario) AS vinculos_filiais,
  (SELECT count(DISTINCT filial_id) FROM public.filiais_usuario) AS filiais_vinculadas,
  (SELECT count(*) FROM public.categorias) AS categorias,
  (SELECT count(*) FROM public.notas_mensais) AS notas,
  (SELECT count(*) FROM public.importacoes) AS importacoes;

SELECT to_regclass('public.ajustes_notas') IS NOT NULL AS tabela_ajustes_existe,
       to_regclass('public.notas_mensais_efetivas') IS NOT NULL AS view_efetiva_existe,
       to_regprocedure('public.eh_administrador_ativo()') IS NOT NULL AS funcao_admin_existe,
       to_regprocedure('public.registrar_ajuste_nota(uuid,numeric,numeric,text)') IS NOT NULL AS funcao_ajustes_existe;

SELECT n.nspname AS schema, c.relname AS tabela, c.relrowsecurity AS rls_ativo
FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relkind='r'
ORDER BY c.relname;

SELECT p.proname AS nome_funcao,
  p.prosecdef AS security_definer,
  has_function_privilege('anon',p.oid,'EXECUTE') AS anon_pode_executar,
  has_function_privilege('authenticated',p.oid,'EXECUTE') AS autenticado_pode_executar
FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND p.proname IN
  ('rls_auto_enable','usuario_ativo','pode_ler_filial','pode_ler_colaborador','eh_administrador_ativo','pode_importar_tipo','registrar_ajuste_nota')
ORDER BY p.proname;

SELECT evtname AS gatilho, evtenabled AS status, evtfoid::regprocedure::text AS funcao
FROM pg_catalog.pg_event_trigger
WHERE evtfoid=to_regprocedure('public.rls_auto_enable()');
