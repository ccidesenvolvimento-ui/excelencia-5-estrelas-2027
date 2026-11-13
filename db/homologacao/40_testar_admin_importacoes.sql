-- CI somente. Dados fictícios, rollback total após testar autorizações.
BEGIN;
INSERT INTO auth.users(id) VALUES
('61000000-0000-4000-8000-000000000001'),
('61000000-0000-4000-8000-000000000002'),
('61000000-0000-4000-8000-000000000003'),
('61000000-0000-4000-8000-000000000004'),
('61000000-0000-4000-8000-000000000005');
INSERT INTO public.perfis(usuario_id,nome,administrador,ativo) VALUES
('61000000-0000-4000-8000-000000000001','Admin fictício',true,true),
('61000000-0000-4000-8000-000000000002','Responsável Segurança',false,true),
('61000000-0000-4000-8000-000000000003','Admin inativo',true,false),
('61000000-0000-4000-8000-000000000004','Consulta fictícia',false,true),
('61000000-0000-4000-8000-000000000005','Responsável inativo',false,false);
INSERT INTO public.permissoes_usuario(usuario_id,permissao) VALUES
('61000000-0000-4000-8000-000000000002','importar:advertencias'),
('61000000-0000-4000-8000-000000000002','importar:acidentes'),
('61000000-0000-4000-8000-000000000005','importar:advertencias');

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','61000000-0000-4000-8000-000000000001',true);
DO $$
BEGIN
 IF NOT public.eh_administrador_ativo() OR NOT public.pode_importar_tipo('rh0034')
 THEN RAISE EXCEPTION 'Admin ativo deve importar RH0034'; END IF;
 IF public.pode_importar_tipo('advertencias') OR public.pode_importar_tipo('produtividade')
 THEN RAISE EXCEPTION 'Admin não recebe automaticamente permissão de importar notas'; END IF;
END $$;

SELECT set_config('request.jwt.claim.sub','61000000-0000-4000-8000-000000000002',true);
DO $$
BEGIN
 IF public.eh_administrador_ativo() OR public.pode_importar_tipo('rh0034')
 THEN RAISE EXCEPTION 'Responsável setorial não pode importar RH0034'; END IF;
 IF NOT public.pode_importar_tipo('advertencias')
 OR NOT public.pode_importar_tipo('acidentes')
 THEN RAISE EXCEPTION 'Responsável por segurança deve importar somente arquivos atribuídos'; END IF;
 IF public.pode_importar_tipo('produtividade')
 OR public.pode_importar_tipo('dirigibilidade')
 OR public.pode_importar_tipo('jornada')
 OR public.pode_importar_tipo('treinamentos')
 OR public.pode_importar_tipo('tipo-invalido')
 THEN RAISE EXCEPTION 'Responsável setorial acessou pilar não atribuído'; END IF;
END $$;

SELECT set_config('request.jwt.claim.sub','61000000-0000-4000-8000-000000000003',true);
DO $$
BEGIN
 IF public.eh_administrador_ativo() OR public.pode_importar_tipo('rh0034')
 THEN RAISE EXCEPTION 'Admin inativo não pode importar'; END IF;
END $$;

SELECT set_config('request.jwt.claim.sub','61000000-0000-4000-8000-000000000004',true);
DO $$
BEGIN
 IF public.pode_importar_tipo('rh0034') OR public.pode_importar_tipo('advertencias')
 THEN RAISE EXCEPTION 'Usuário de consulta não pode importar'; END IF;
END $$;

SELECT set_config('request.jwt.claim.sub','61000000-0000-4000-8000-000000000005',true);
DO $$
BEGIN
 IF public.pode_importar_tipo('advertencias')
 THEN RAISE EXCEPTION 'Responsável inativo não pode importar'; END IF;
END $$;

SELECT set_config('request.jwt.claim.sub','',true);
DO $$
BEGIN
 IF public.eh_administrador_ativo() OR public.pode_importar_tipo('rh0034')
 OR public.pode_importar_tipo('advertencias')
 THEN RAISE EXCEPTION 'Sem identidade não pode importar'; END IF;
 IF has_table_privilege('authenticated','public.importacoes','INSERT')
 OR has_table_privilege('authenticated','public.importacoes','SELECT')
 OR has_table_privilege('authenticated','public.colaboradores','UPDATE')
 OR has_table_privilege('authenticated','public.notas_mensais','INSERT')
 OR has_table_privilege('authenticated','public.permissoes_usuario','INSERT')
 OR has_table_privilege('authenticated','public.auditoria','INSERT')
 THEN RAISE EXCEPTION 'RBAC não pode liberar escrita direta'; END IF;
END $$;
ROLLBACK;
