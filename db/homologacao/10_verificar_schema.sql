-- Verificações estruturais não destrutivas, sem dados pessoais ou inserts.
DO $$
DECLARE
  esperadas text[] := ARRAY[
    'empresas','filiais','categorias','colaboradores','importacoes',
    'ferias','regras_classificacao','historico_categorias',
    'penalizacoes_seguranca','notas_mensais','perfis',
    'permissoes_usuario','filiais_usuario','auditoria'
  ];
  tabela text;
BEGIN
  FOREACH tabela IN ARRAY esperadas LOOP
    IF to_regclass('public.' || tabela) IS NULL THEN
      RAISE EXCEPTION 'Tabela ausente: %', tabela;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public' AND c.relname=tabela AND c.relrowsecurity
    ) THEN
      RAISE EXCEPTION 'RLS não habilitada: %', tabela;
    END IF;
  END LOOP;
  IF (SELECT count(*) FROM public.categorias) <> 8 THEN
    RAISE EXCEPTION 'Esperadas exatamente oito categorias';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname='colaboradores_empresa_id_matricula_key'
      AND conrelid='public.colaboradores'::regclass
  ) THEN
    RAISE EXCEPTION 'Unicidade empresa/matrícula ausente';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname='seguranca_binaria'
      AND conrelid='public.notas_mensais'::regclass
  ) THEN
    RAISE EXCEPTION 'Restrição Segurança 0/100 ausente';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname='fonte_dirigibilidade_aplicavel'
      AND conrelid='public.notas_mensais'::regclass
  ) THEN
    RAISE EXCEPTION 'Restrição de fonte da Dirigibilidade ausente';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='categorias'
      AND policyname='categorias_leitura_autenticada'
  ) THEN
    RAISE EXCEPTION 'Política original de categorias não encontrada';
  END IF;
  RAISE NOTICE 'Schema base validado: 14 tabelas, RLS, 8 categorias e restrições';
END $$;
