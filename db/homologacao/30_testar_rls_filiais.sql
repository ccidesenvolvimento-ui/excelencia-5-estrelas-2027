-- EXCLUSIVAMENTE banco PostgreSQL descartável de CI.
-- Nenhuma credencial, matrícula ou empregado real.
BEGIN;

INSERT INTO auth.users(id) VALUES
 ('10000000-0000-4000-8000-000000000001'),
 ('10000000-0000-4000-8000-000000000002'),
 ('10000000-0000-4000-8000-000000000003'),
 ('10000000-0000-4000-8000-000000000004');

INSERT INTO public.empresas(id,codigo,nome) VALUES
 ('20000000-0000-4000-8000-000000000001','FICTICIA','Empresa de teste');

INSERT INTO public.filiais(id,empresa_id,nome) VALUES
 ('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','Filial A Fictícia'),
 ('30000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000001','Filial B Fictícia');

INSERT INTO public.perfis(usuario_id,nome,ativo) VALUES
 ('10000000-0000-4000-8000-000000000001','Usuário A',true),
 ('10000000-0000-4000-8000-000000000002','Usuário B',true),
 ('10000000-0000-4000-8000-000000000003','Usuário inativo',false),
 ('10000000-0000-4000-8000-000000000004','Usuário sem filial',true);

INSERT INTO public.filiais_usuario(usuario_id,filial_id) VALUES
 ('10000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001'),
 ('10000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000002'),
 ('10000000-0000-4000-8000-000000000003','30000000-0000-4000-8000-000000000001');

INSERT INTO public.colaboradores(id,empresa_id,matricula,nome,filial_id) VALUES
 ('40000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','TESTA','Pessoa fictícia A','30000000-0000-4000-8000-000000000001'),
 ('40000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000001','TESTB','Pessoa fictícia B','30000000-0000-4000-8000-000000000002'),
 ('40000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000001','TESTC','Pessoa sem filial',NULL);

INSERT INTO public.ferias(colaborador_id,inicio,termino,dias_gozo) VALUES
 ('40000000-0000-4000-8000-000000000001','2026-01-01','2026-01-03',3),
 ('40000000-0000-4000-8000-000000000002','2026-01-01','2026-01-03',3);

INSERT INTO public.notas_mensais(colaborador_id,competencia,estrela,nota,origem) VALUES
 ('40000000-0000-4000-8000-000000000001','2026-01-01','seguranca',100,'seguranca_calculada'),
 ('40000000-0000-4000-8000-000000000002','2026-01-01','seguranca',100,'seguranca_calculada');

-- Cada teste roda como role autenticada, respeitando RLS, com JWT fictício.
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);

DO $$
BEGIN
 IF (SELECT count(*) FROM public.colaboradores) <> 1 THEN
   RAISE EXCEPTION 'Usuário A não deve enxergar colaborador de B ou sem filial';
 END IF;
 IF (SELECT count(*) FROM public.filiais) <> 1 THEN
   RAISE EXCEPTION 'Usuário A deve visualizar só sua filial';
 END IF;
 IF (SELECT count(*) FROM public.notas_mensais) <> 1 THEN
   RAISE EXCEPTION 'Usuário A deve visualizar só sua nota';
 END IF;
 IF (SELECT count(*) FROM public.ferias) <> 1 THEN
   RAISE EXCEPTION 'Usuário A deve visualizar só suas férias';
 END IF;
 IF (SELECT count(*) FROM public.perfis) <> 1 THEN
   RAISE EXCEPTION 'Usuário A deve visualizar só próprio perfil';
 END IF;
 IF has_table_privilege('authenticated','public.colaboradores','INSERT') THEN
   RAISE EXCEPTION 'Escrita de colaboradores não pode ser concedida';
 END IF;
 IF has_table_privilege('authenticated','public.notas_mensais','UPDATE') THEN
   RAISE EXCEPTION 'Edição de notas não pode ser concedida';
 END IF;
 IF has_table_privilege('authenticated','public.importacoes','SELECT') THEN
   RAISE EXCEPTION 'Leitura de importações não pode ser concedida';
 END IF;
END $$;

SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
DO $$ BEGIN
 IF (SELECT count(*) FROM public.colaboradores) <> 1
    OR (SELECT matricula FROM public.colaboradores LIMIT 1) <> 'TESTB'
 THEN RAISE EXCEPTION 'Usuário B não deve acessar colaborador A'; END IF;
END $$;

SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',true);
DO $$ BEGIN
 IF (SELECT count(*) FROM public.colaboradores) <> 0
    OR (SELECT count(*) FROM public.perfis) <> 0
 THEN RAISE EXCEPTION 'Usuário inativo não pode acessar dados'; END IF;
END $$;

SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000004',true);
DO $$ BEGIN
 IF (SELECT count(*) FROM public.colaboradores) <> 0
    OR (SELECT count(*) FROM public.notas_mensais) <> 0
 THEN RAISE EXCEPTION 'Usuário sem filial não pode acessar dados'; END IF;
END $$;

SELECT set_config('request.jwt.claim.sub','',true);
DO $$ BEGIN
 IF (SELECT count(*) FROM public.colaboradores) <> 0 THEN
   RAISE EXCEPTION 'JWT ausente não pode acessar dados';
 END IF;
END $$;

ROLLBACK;
