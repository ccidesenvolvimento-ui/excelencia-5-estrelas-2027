-- Issue #57. FUNDAÇÃO AINDA NÃO APLICADA AO SUPABASE CLOUD.
-- Notas de origem são imutáveis quando há ajuste; segurança não admite ajuste manual.
BEGIN;

CREATE TABLE public.ajustes_notas (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nota_mensal_id uuid NOT NULL REFERENCES public.notas_mensais(id) ON DELETE RESTRICT,
  nota_anterior numeric(5,2) NOT NULL CHECK (nota_anterior BETWEEN 0 AND 100),
  nota_nova numeric(5,2) NOT NULL CHECK (nota_nova BETWEEN 0 AND 100),
  justificativa text NOT NULL CHECK (
    length(btrim(justificativa)) BETWEEN 15 AND 1000
  ),
  usuario_id uuid NOT NULL REFERENCES auth.users(id),
  criado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ajuste_precisa_mudar CHECK (nota_nova <> nota_anterior)
);
CREATE INDEX ajustes_notas_mais_recente ON public.ajustes_notas (nota_mensal_id, id DESC);
ALTER TABLE public.ajustes_notas ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ajustes_notas FROM PUBLIC, anon, authenticated;
REVOKE ALL ON SEQUENCE public.ajustes_notas_id_seq FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.ajustes_notas TO authenticated;

CREATE POLICY ajustes_notas_leitura_autorizada ON public.ajustes_notas
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.notas_mensais n
    WHERE n.id = ajustes_notas.nota_mensal_id
      AND public.pode_ler_colaborador(n.colaborador_id)
  )
);

-- Não é possível substituir nem apagar notas após ajuste, mesmo
-- por importadores privilegiados: é necessário procedimento futuro de resolução.
CREATE FUNCTION public.impedir_substituicao_nota_ajustada()
RETURNS trigger LANGUAGE plpgsql SET search_path = ''
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.ajustes_notas a WHERE a.nota_mensal_id = OLD.id
  ) THEN
    RAISE EXCEPTION 'Nota com ajuste administrativo: reimportação exige resolução explícita'
      USING ERRCODE = '23514';
  END IF;
  RETURN OLD;
END;
$$;
CREATE TRIGGER impedir_update_delete_nota_ajustada
BEFORE UPDATE OR DELETE ON public.notas_mensais
FOR EACH ROW EXECUTE FUNCTION public.impedir_substituicao_nota_ajustada();

-- Histórico append-only: somente INSERT pela função administrativa controlada.
CREATE FUNCTION public.impedir_mutacao_ajuste()
RETURNS trigger LANGUAGE plpgsql SET search_path = ''
AS $$
BEGIN
  RAISE EXCEPTION 'Histórico de ajustes é imutável' USING ERRCODE = '23514';
END;
$$;
CREATE TRIGGER ajustes_notas_append_only
BEFORE UPDATE OR DELETE ON public.ajustes_notas
FOR EACH ROW EXECUTE FUNCTION public.impedir_mutacao_ajuste();

-- Transação indivisível: bloqueia a nota, verifica versão esperada,
-- insere ajuste e registra auditoria. Nunca altera o valor original.
CREATE FUNCTION public.registrar_ajuste_nota(
  p_nota_mensal_id uuid,
  p_nota_nova numeric,
  p_nota_esperada numeric,
  p_justificativa text
)
RETURNS bigint LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_nota public.notas_mensais%ROWTYPE;
  v_anterior numeric(5,2);
  v_ajuste_id bigint;
BEGIN
  IF auth.uid() IS NULL OR NOT public.eh_administrador_ativo() THEN
    RAISE EXCEPTION 'Somente administradores ativos podem ajustar notas'
      USING ERRCODE = '42501';
  END IF;
  IF p_nota_mensal_id IS NULL OR p_nota_nova IS NULL
    OR p_nota_esperada IS NULL OR p_justificativa IS NULL
    OR length(btrim(p_justificativa)) NOT BETWEEN 15 AND 1000
    OR p_nota_nova < 0 OR p_nota_nova > 100
    OR p_nota_nova <> trunc(p_nota_nova, 2) THEN
    RAISE EXCEPTION 'Parâmetros inválidos para ajuste' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_nota
    FROM public.notas_mensais WHERE id = p_nota_mensal_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Nota não encontrada' USING ERRCODE = '22023';
  END IF;

  -- Sem bypass de filial: administrador também precisa estar vinculado.
  IF NOT public.pode_ler_colaborador(v_nota.colaborador_id) THEN
    RAISE EXCEPTION 'Filial não autorizada' USING ERRCODE = '42501';
  END IF;
  -- Segurança é calculada pelas penalizações: exigir revisão da origem,
  -- não permitir reverter acidente/advertência com edição manual.
  IF v_nota.estrela = 'seguranca' THEN
    RAISE EXCEPTION 'Segurança não admite ajuste manual; revisar penalizações de origem'
      USING ERRCODE = '22023';
  END IF;

  SELECT COALESCE(
    (SELECT a.nota_nova FROM public.ajustes_notas a
     WHERE a.nota_mensal_id = v_nota.id ORDER BY a.id DESC LIMIT 1),
    v_nota.nota
  ) INTO v_anterior;

  IF v_anterior <> p_nota_esperada THEN
    RAISE EXCEPTION 'Nota alterada por outro ajuste; recarregue antes de salvar'
      USING ERRCODE = '40001';
  END IF;
  IF v_anterior = p_nota_nova THEN
    RAISE EXCEPTION 'A nova nota precisa ser diferente da nota efetiva'
      USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.ajustes_notas (
    nota_mensal_id, nota_anterior, nota_nova, justificativa, usuario_id
  ) VALUES (
    v_nota.id, v_anterior, p_nota_nova, btrim(p_justificativa), auth.uid()
  ) RETURNING id INTO v_ajuste_id;

  INSERT INTO public.auditoria (
    tabela, registro_id, acao, usuario_id, antes, depois
  ) VALUES (
    'notas_mensais', v_nota.id::text, 'ajuste_administrativo_nota',
    auth.uid(),
    jsonb_build_object('nota_efetiva', v_anterior, 'nota_original', v_nota.nota),
    jsonb_build_object(
      'nota_efetiva', p_nota_nova, 'ajuste_id', v_ajuste_id,
      'justificativa', btrim(p_justificativa), 'estrela', v_nota.estrela,
      'competencia', v_nota.competencia
    )
  );
  RETURN v_ajuste_id;
END;
$$;

REVOKE ALL ON FUNCTION public.registrar_ajuste_nota(uuid,numeric,numeric,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.registrar_ajuste_nota(uuid,numeric,numeric,text) TO authenticated;

-- View com direitos do INVOCADOR: respeita RLS de notas e ajustes.
CREATE VIEW public.notas_mensais_efetivas WITH (security_invoker = true)
AS SELECT n.*, COALESCE(
  (SELECT a.nota_nova FROM public.ajustes_notas a
   WHERE a.nota_mensal_id = n.id ORDER BY a.id DESC LIMIT 1),
  n.nota
) AS nota_efetiva,
EXISTS (SELECT 1 FROM public.ajustes_notas a
        WHERE a.nota_mensal_id = n.id) AS possui_ajuste
FROM public.notas_mensais n;
REVOKE ALL ON public.notas_mensais_efetivas FROM PUBLIC, anon;
GRANT SELECT ON public.notas_mensais_efetivas TO authenticated;
COMMIT;
