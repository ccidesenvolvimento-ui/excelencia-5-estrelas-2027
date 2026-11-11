-- Somente CI/PostgreSQL descartável. Toda operação revertida ao final.
BEGIN;
INSERT INTO auth.users(id) VALUES
 ('62000000-0000-4000-8000-000000000001'),
 ('62000000-0000-4000-8000-000000000002'),
 ('62000000-0000-4000-8000-000000000003'),
 ('62000000-0000-4000-8000-000000000004');
INSERT INTO public.perfis(usuario_id,nome,administrador,ativo) VALUES
 ('62000000-0000-4000-8000-000000000001','Admin da filial',true,true),
 ('62000000-0000-4000-8000-000000000002','Consulta',false,true),
 ('62000000-0000-4000-8000-000000000003','Admin de outra filial',true,true),
 ('62000000-0000-4000-8000-000000000004','Admin inativo',true,false);
INSERT INTO public.empresas(id,codigo,nome)
 VALUES ('62000000-0000-4000-8000-000000000010','TESTE-AJUSTE','Empresa fictícia');
INSERT INTO public.filiais(id,empresa_id,codigo,nome)
 VALUES ('62000000-0000-4000-8000-000000000011','62000000-0000-4000-8000-000000000010','AJ-A','Filial fictícia A'),
 ('62000000-0000-4000-8000-000000000012','62000000-0000-4000-8000-000000000010','AJ-B','Filial fictícia B');
INSERT INTO public.filiais_usuario(usuario_id,filial_id) VALUES
 ('62000000-0000-4000-8000-000000000001','62000000-0000-4000-8000-000000000011'),
 ('62000000-0000-4000-8000-000000000002','62000000-0000-4000-8000-000000000011'),
 ('62000000-0000-4000-8000-000000000003','62000000-0000-4000-8000-000000000012'),
 ('62000000-0000-4000-8000-000000000004','62000000-0000-4000-8000-000000000011');
INSERT INTO public.colaboradores(id,empresa_id,matricula,nome,filial_id)
 VALUES ('62000000-0000-4000-8000-000000000020','62000000-0000-4000-8000-000000000010','AJ-001','Motorista fictício','62000000-0000-4000-8000-000000000011');
INSERT INTO public.notas_mensais(id,colaborador_id,competencia,estrela,nota,origem)
 VALUES
 ('62000000-0000-4000-8000-000000000030','62000000-0000-4000-8000-000000000020','2027-10-01','produtividade',75,'planilha'),
 ('62000000-0000-4000-8000-000000000031','62000000-0000-4000-8000-000000000020','2027-10-01','seguranca',0,'seguranca_calculada');

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','62000000-0000-4000-8000-000000000001',true);
DO $$
DECLARE
  v_id bigint;
BEGIN
  v_id := public.registrar_ajuste_nota(
    '62000000-0000-4000-8000-000000000030',90,75,
    'Correção de divergência confirmada pelo setor de Produtividade.'
  );
  IF v_id IS NULL THEN RAISE EXCEPTION 'Ajuste não criado'; END IF;
  IF (SELECT nota FROM public.notas_mensais WHERE id='62000000-0000-4000-8000-000000000030') <> 75
    OR (SELECT nota_efetiva FROM public.notas_mensais_efetivas WHERE id='62000000-0000-4000-8000-000000000030') <> 90
    OR (SELECT count(*) FROM public.ajustes_notas WHERE nota_mensal_id='62000000-0000-4000-8000-000000000030') <> 1
  THEN RAISE EXCEPTION 'Origem/efetiva/histórico inválidos'; END IF;
END $$;

-- Verificar exceções dentro de blocos para não abortar transação de CI.
DO $$
BEGIN
  BEGIN
    PERFORM public.registrar_ajuste_nota('62000000-0000-4000-8000-000000000030',95,75,'Justificativa legítima de alteração de nota.');
    RAISE EXCEPTION 'Esperado conflito otimista';
  EXCEPTION WHEN serialization_failure THEN NULL; END;
  BEGIN
    PERFORM public.registrar_ajuste_nota('62000000-0000-4000-8000-000000000030',101,90,'Justificativa legítima de alteração de nota.');
    RAISE EXCEPTION 'Esperado validar limite 100';
  EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
  BEGIN
    PERFORM public.registrar_ajuste_nota('62000000-0000-4000-8000-000000000030',91,90,'curta');
    RAISE EXCEPTION 'Esperado exigir justificativa';
  EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
  BEGIN
    PERFORM public.registrar_ajuste_nota('62000000-0000-4000-8000-000000000031',100,0,'Reverter penalização sem investigação.');
    RAISE EXCEPTION 'Esperado bloquear segurança';
  EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
  IF (SELECT nota_efetiva FROM public.notas_mensais_efetivas WHERE id='62000000-0000-4000-8000-000000000030') <> 90
  THEN RAISE EXCEPTION 'Falha após tentativas negadas'; END IF;
END $$;

SELECT set_config('request.jwt.claim.sub','62000000-0000-4000-8000-000000000002',true);
DO $$
BEGIN
  BEGIN
    PERFORM public.registrar_ajuste_nota('62000000-0000-4000-8000-000000000030',80,90,'Não é administrador ativo autorizado.');
    RAISE EXCEPTION 'Usuário comum ajustou';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;

SELECT set_config('request.jwt.claim.sub','62000000-0000-4000-8000-000000000003',true);
DO $$
BEGIN
  BEGIN
    PERFORM public.registrar_ajuste_nota('62000000-0000-4000-8000-000000000030',80,90,'Admin de outra filial não pode ajustar.');
    RAISE EXCEPTION 'Admin de outra filial ajustou';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;

SELECT set_config('request.jwt.claim.sub','62000000-0000-4000-8000-000000000004',true);
DO $$
BEGIN
  BEGIN
    PERFORM public.registrar_ajuste_nota('62000000-0000-4000-8000-000000000030',80,90,'Admin inativo não pode ajustar.');
    RAISE EXCEPTION 'Admin inativo ajustou';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;

SELECT set_config('request.jwt.claim.sub','',true);
DO $$
BEGIN
  BEGIN
    PERFORM public.registrar_ajuste_nota('62000000-0000-4000-8000-000000000030',80,90,'Identidade ausente não pode ajustar.');
    RAISE EXCEPTION 'Sem sessão ajustou';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  IF has_table_privilege('authenticated','public.ajustes_notas','INSERT')
   OR has_table_privilege('authenticated','public.ajustes_notas','UPDATE')
   OR has_table_privilege('authenticated','public.ajustes_notas','DELETE')
   OR has_table_privilege('authenticated','public.auditoria','INSERT')
  THEN RAISE EXCEPTION 'Escrita direta indevida'; END IF;
END $$;

RESET ROLE;
DO $
BEGIN
 IF (SELECT count(*) FROM public.auditoria WHERE registro_id='62000000-0000-4000-8000-000000000030' AND acao='ajuste_administrativo_nota') <> 1
 THEN RAISE EXCEPTION 'Registro de auditoria ausente'; END IF;
END $;
DO $
BEGIN
  BEGIN
    UPDATE public.notas_mensais SET nota=79 WHERE id='62000000-0000-4000-8000-000000000030';
    RAISE EXCEPTION 'Reimportação sobrescreveu ajuste';
  EXCEPTION WHEN check_violation THEN NULL; END;
  BEGIN
    DELETE FROM public.notas_mensais WHERE id='62000000-0000-4000-8000-000000000030';
    RAISE EXCEPTION 'Reimportação excluiu nota ajustada';
  EXCEPTION WHEN check_violation THEN NULL; END;
  BEGIN
    UPDATE public.ajustes_notas SET nota_nova=85 WHERE nota_mensal_id='62000000-0000-4000-8000-000000000030';
    RAISE EXCEPTION 'Histórico sofreu mutação';
  EXCEPTION WHEN check_violation THEN NULL; END;
END $$;
ROLLBACK;
