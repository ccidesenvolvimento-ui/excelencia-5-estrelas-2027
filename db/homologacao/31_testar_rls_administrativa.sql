-- EXCLUSIVAMENTE banco PostgreSQL descartável de CI.
-- Homologa leitura administrativa e helpers privados com identidades fictícias.
BEGIN;

INSERT INTO auth.users(id) VALUES
 ('11000000-0000-4000-8000-000000000001'),
 ('11000000-0000-4000-8000-000000000002'),
 ('11000000-0000-4000-8000-000000000003'),
 ('11000000-0000-4000-8000-000000000004'),
 ('11000000-0000-4000-8000-000000000005'),
 ('11000000-0000-4000-8000-000000000006');

INSERT INTO public.empresas(id,codigo,nome) VALUES
 ('21000000-0000-4000-8000-000000000001','FICTICIA-ADMIN','Empresa administrativa fictícia');

INSERT INTO public.filiais(id,empresa_id,codigo,nome,ativa) VALUES
 ('31000000-0000-4000-8000-000000000001','21000000-0000-4000-8000-000000000001','FA','Filial fictícia ativa A',true),
 ('31000000-0000-4000-8000-000000000002','21000000-0000-4000-8000-000000000001','FB','Filial fictícia ativa B',true),
 ('31000000-0000-4000-8000-000000000003','21000000-0000-4000-8000-000000000001','FI','Filial fictícia inativa',false);

INSERT INTO public.perfis(usuario_id,nome,administrador,ativo) VALUES
 ('11000000-0000-4000-8000-000000000001','Administradora fictícia',true,true),
 ('11000000-0000-4000-8000-000000000002','Usuário comum fictício',false,true),
 ('11000000-0000-4000-8000-000000000003','Administrador sem permissão fictício',true,true),
 ('11000000-0000-4000-8000-000000000004','Administradora inativa fictícia',true,false),
 ('11000000-0000-4000-8000-000000000005','Administrador sem filial fictício',true,true),
 ('11000000-0000-4000-8000-000000000006','Administrador com filial inativa fictício',true,true);

INSERT INTO public.permissoes_usuario(usuario_id,permissao) VALUES
 ('11000000-0000-4000-8000-000000000001','Configurações:Visualizar'),
 ('11000000-0000-4000-8000-000000000002','Portal:Visualizar'),
 ('11000000-0000-4000-8000-000000000003','Portal:Visualizar'),
 ('11000000-0000-4000-8000-000000000004','Configurações:Visualizar'),
 ('11000000-0000-4000-8000-000000000005','Configurações:Visualizar'),
 ('11000000-0000-4000-8000-000000000006','Configurações:Visualizar');

INSERT INTO public.filiais_usuario(usuario_id,filial_id) VALUES
 ('11000000-0000-4000-8000-000000000001','31000000-0000-4000-8000-000000000001'),
 ('11000000-0000-4000-8000-000000000002','31000000-0000-4000-8000-000000000002'),
 ('11000000-0000-4000-8000-000000000003','31000000-0000-4000-8000-000000000001'),
 ('11000000-0000-4000-8000-000000000004','31000000-0000-4000-8000-000000000001'),
 ('11000000-0000-4000-8000-000000000006','31000000-0000-4000-8000-000000000003');

INSERT INTO public.colaboradores(id,empresa_id,matricula,nome,filial_id) VALUES
 ('41000000-0000-4000-8000-000000000001','21000000-0000-4000-8000-000000000001','FICT-A','Colaborador fictício A','31000000-0000-4000-8000-000000000001'),
 ('41000000-0000-4000-8000-000000000002','21000000-0000-4000-8000-000000000001','FICT-B','Colaborador fictício B','31000000-0000-4000-8000-000000000002');

-- As quatro funções devem existir somente no esquema privado. ALTER FUNCTION
-- preserva os OIDs e deve atualizar as dependências armazenadas das políticas.
DO $$
DECLARE
  assinatura text;
  politica record;
  papel text;
  tabela record;
  privilegio text;
BEGIN
  FOREACH assinatura IN ARRAY ARRAY[
    'excelencia_private.usuario_ativo()',
    'excelencia_private.pode_ler_filial(uuid)',
    'excelencia_private.pode_ler_colaborador(uuid)',
    'excelencia_private.pode_consultar_usuarios_administracao()'
  ] LOOP
    IF to_regprocedure(assinatura) IS NULL THEN
      RAISE EXCEPTION 'Função privada ausente: %', assinatura;
    END IF;
    IF has_function_privilege('anon', assinatura, 'EXECUTE') THEN
      RAISE EXCEPTION 'anon não pode executar %', assinatura;
    END IF;
    IF NOT has_function_privilege('authenticated', assinatura, 'EXECUTE') THEN
      RAISE EXCEPTION 'authenticated precisa executar helper RLS %', assinatura;
    END IF;
  END LOOP;

  IF to_regprocedure('public.usuario_ativo()') IS NOT NULL
     OR to_regprocedure('public.pode_ler_filial(uuid)') IS NOT NULL
     OR to_regprocedure('public.pode_ler_colaborador(uuid)') IS NOT NULL THEN
    RAISE EXCEPTION 'Helpers RLS antigos permaneceram no esquema public';
  END IF;

  IF has_schema_privilege('anon','excelencia_private','USAGE') THEN
    RAISE EXCEPTION 'anon não pode usar o esquema excelencia_private';
  END IF;

  FOR politica IN
    SELECT policyname, qual
    FROM pg_policies
    WHERE schemaname='public'
      AND policyname IN (
        'empresas_por_filial_autorizada','filiais_autorizadas',
        'colaboradores_por_filial','ferias_por_colaborador_autorizado',
        'historico_por_colaborador_autorizado',
        'seguranca_por_colaborador_autorizado','notas_por_colaborador_autorizado',
        'permissoes_proprias_ativas','filiais_proprias_ativas'
      )
  LOOP
    IF politica.qual NOT LIKE '%excelencia_private.%' THEN
      RAISE EXCEPTION 'Política % não referencia helper privado: %', politica.policyname, politica.qual;
    END IF;
  END LOOP;
  IF (SELECT count(*) FROM pg_policies WHERE schemaname='public' AND policyname IN (
        'empresas_por_filial_autorizada','filiais_autorizadas',
        'colaboradores_por_filial','ferias_por_colaborador_autorizado',
        'historico_por_colaborador_autorizado',
        'seguranca_por_colaborador_autorizado','notas_por_colaborador_autorizado',
        'permissoes_proprias_ativas','filiais_proprias_ativas')) <> 9 THEN
    RAISE EXCEPTION 'Uma ou mais políticas originais deixaram de existir';
  END IF;

  IF (SELECT count(*)
      FROM pg_policies
      WHERE schemaname = 'public'
        AND cmd = 'SELECT'
        AND (tablename, policyname) IN (
          ('perfis', 'perfis_leitura_administrativa'),
          ('permissoes_usuario', 'permissoes_leitura_administrativa'),
          ('filiais_usuario', 'filiais_usuario_leitura_administrativa'),
          ('filiais', 'filiais_leitura_administrativa')
        )) <> 4 THEN
    RAISE EXCEPTION 'Uma ou mais políticas administrativas de SELECT deixaram de existir';
  END IF;

  FOR tabela IN SELECT tablename FROM pg_tables WHERE schemaname='public'
  LOOP
    FOREACH papel IN ARRAY ARRAY['anon','authenticated'] LOOP
      FOREACH privilegio IN ARRAY ARRAY['INSERT','UPDATE','DELETE','TRUNCATE','TRIGGER','REFERENCES'] LOOP
        IF has_table_privilege(papel, format('public.%I', tabela.tablename), privilegio) THEN
          RAISE EXCEPTION 'Privilégio indevido: papel %, tabela %, ação %',
            papel, tabela.tablename, privilegio;
        END IF;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;

SET LOCAL ROLE authenticated;

-- Administrador elegível lê os quatro cadastros administrativos por inteiro.
SELECT set_config('request.jwt.claim.sub','11000000-0000-4000-8000-000000000001',true);
DO $$ BEGIN
  IF (SELECT count(*) FROM public.perfis) <> 6
     OR (SELECT count(*) FROM public.permissoes_usuario) <> 6
     OR (SELECT count(*) FROM public.filiais_usuario) <> 5
     OR (SELECT count(*) FROM public.filiais) <> 3 THEN
    RAISE EXCEPTION 'Administrador elegível não recebeu leitura administrativa global';
  END IF;
END $$;

-- Usuário comum mantém somente seus próprios cadastros e sua filial.
SELECT set_config('request.jwt.claim.sub','11000000-0000-4000-8000-000000000002',true);
DO $$ BEGIN
  IF (SELECT count(*) FROM public.perfis) <> 1
     OR (SELECT count(*) FROM public.permissoes_usuario) <> 1
     OR (SELECT count(*) FROM public.filiais_usuario) <> 1
     OR (SELECT count(*) FROM public.filiais) <> 1
     OR (SELECT count(*) FROM public.colaboradores) <> 1
     OR (SELECT matricula FROM public.colaboradores) <> 'FICT-B' THEN
    RAISE EXCEPTION 'Usuário comum escapou do isolamento próprio/por filial';
  END IF;
END $$;

-- Ser administrador sem a permissão específica não concede visão global.
SELECT set_config('request.jwt.claim.sub','11000000-0000-4000-8000-000000000003',true);
DO $$ BEGIN
  IF (SELECT count(*) FROM public.perfis) <> 1
     OR (SELECT count(*) FROM public.permissoes_usuario) <> 1
     OR (SELECT count(*) FROM public.filiais_usuario) <> 1
     OR (SELECT count(*) FROM public.filiais) <> 1 THEN
    RAISE EXCEPTION 'Administrador sem permissão recebeu leitura global';
  END IF;
END $$;

-- Perfil inativo não recebe nem acesso próprio, mesmo com permissão e filial ativa.
SELECT set_config('request.jwt.claim.sub','11000000-0000-4000-8000-000000000004',true);
DO $$ BEGIN
  IF (SELECT count(*) FROM public.perfis) <> 0
     OR (SELECT count(*) FROM public.permissoes_usuario) <> 0
     OR (SELECT count(*) FROM public.filiais_usuario) <> 0
     OR (SELECT count(*) FROM public.filiais) <> 0 THEN
    RAISE EXCEPTION 'Usuário inativo recebeu acesso indevido';
  END IF;
END $$;

-- Sem vínculo de filial, o perfil ativo ainda enxerga apenas a si e sua própria
-- permissão; nenhum cadastro de terceiros ou filial fica disponível.
SELECT set_config('request.jwt.claim.sub','11000000-0000-4000-8000-000000000005',true);
DO $$ BEGIN
  IF (SELECT count(*) FROM public.perfis) <> 1
     OR (SELECT count(*) FROM public.permissoes_usuario) <> 1
     OR (SELECT count(*) FROM public.filiais_usuario) <> 0
     OR (SELECT count(*) FROM public.filiais) <> 0
     OR (SELECT count(*) FROM public.colaboradores) <> 0 THEN
    RAISE EXCEPTION 'Usuário sem filial recebeu leitura global ou por filial';
  END IF;
END $$;

-- Administrador ativo com permissão, mas vinculado somente a filial inativa,
-- mantém acesso próprio sem receber leitura administrativa global.
SELECT set_config('request.jwt.claim.sub','11000000-0000-4000-8000-000000000006',true);
DO $$ BEGIN
  IF (SELECT count(*) FROM public.perfis) <> 1
     OR (SELECT count(*) FROM public.permissoes_usuario) <> 1
     OR (SELECT count(*) FROM public.filiais_usuario) <> 0
     OR (SELECT count(*) FROM public.filiais) <> 0
     OR (SELECT count(*) FROM public.colaboradores) <> 0 THEN
    RAISE EXCEPTION 'Administrador vinculado somente a filial inativa recebeu leitura global';
  END IF;
END $$;

ROLLBACK;
