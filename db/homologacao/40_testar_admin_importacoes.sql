-- Exclusivo CI em banco descartável, após schema base + migração RLS.
-- auth.uid() é simulado apenas no CI por 29_auth_uid_apenas_ci.sql.
BEGIN;
INSERT INTO auth.users (id) VALUES
('61000000-0000-4000-8000-000000000001'),
('61000000-0000-4000-8000-000000000002'),
('61000000-0000-4000-8000-000000000003'),
('61000000-0000-4000-8000-000000000004');
INSERT INTO public.perfis(usuario_id,nome,administrador,ativo) VALUES
('61000000-0000-4000-8000-000000000001','Admin fictício',true,true),
('61000000-0000-4000-8000-000000000002','Consulta fictícia',false,true),
('61000000-0000-4000-8000-000000000003','Admin inativo',true,false),
('61000000-0000-4000-8000-000000000004','Outro usuário comum',false,true);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','61000000-0000-4000-8000-000000000001',true);
DO $$
BEGIN
 IF NOT public.eh_administrador_ativo() OR NOT public.pode_importar_dados()
 THEN RAISE EXCEPTION 'Admin ativo precisa passar na checagem'; END IF;
END $$;

SELECT set_config('request.jwt.claim.sub','61000000-0000-4000-8000-000000000002',true);
DO $$
BEGIN
 IF public.eh_administrador_ativo() OR public.pode_importar_dados()
 THEN RAISE EXCEPTION 'Consulta não pode importar'; END IF;
END $$;

SELECT set_config('request.jwt.claim.sub','61000000-0000-4000-8000-000000000003',true);
DO $$
BEGIN
 IF public.eh_administrador_ativo() OR public.pode_importar_dados()
 THEN RAISE EXCEPTION 'Admin inativo não pode importar'; END IF;
END $$;

SELECT set_config('request.jwt.claim.sub','61000000-0000-4000-8000-000000000004',true);
DO $$
BEGIN
 IF public.eh_administrador_ativo() OR public.pode_importar_dados()
 THEN RAISE EXCEPTION 'Outro usuário não pode importar'; END IF;
END $$;

SELECT set_config('request.jwt.claim.sub','',true);
DO $$
BEGIN
 IF public.eh_administrador_ativo() OR public.pode_importar_dados()
 THEN RAISE EXCEPTION 'Sem identidade não pode importar'; END IF;
 IF has_table_privilege('authenticated','public.importacoes','INSERT')
 OR has_table_privilege('authenticated','public.importacoes','SELECT')
 OR has_table_privilege('authenticated','public.colaboradores','UPDATE')
 OR has_table_privilege('authenticated','public.notas_mensais','INSERT')
 OR has_table_privilege('authenticated','public.auditoria','INSERT')
 THEN RAISE EXCEPTION 'RBAC não pode liberar escrita direta'; END IF;
END $$;
ROLLBACK;
