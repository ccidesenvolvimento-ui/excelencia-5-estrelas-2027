-- Programa Excelência 5 Estrelas 2027 - autorização preliminar para importações.
-- Regra de negócio: administradores importam APENAS RH0034 (cadastro de motoristas).
-- Planilhas de avaliação pertencem a responsáveis explicitamente autorizados por setor.
-- Funções NÃO criam permissões de escrita, nem endpoints de upload.
BEGIN;

CREATE FUNCTION public.eh_administrador_ativo()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.perfis p
    WHERE p.usuario_id = auth.uid()
      AND p.ativo IS TRUE
      AND p.administrador IS TRUE
  )
$$;

-- Não recebe usuario_id ou filial_id do cliente.
-- Os valores em permissoes_usuario são concedidos apenas por fluxo
-- administrativo seguro futuro; cliente authenticated não pode editá-los.
CREATE FUNCTION public.pode_importar_tipo(p_tipo text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT CASE
    WHEN p_tipo = 'rh0034' THEN public.eh_administrador_ativo()
    WHEN p_tipo IN (
      'advertencias', 'acidentes', 'produtividade',
      'dirigibilidade', 'jornada', 'treinamentos'
    ) THEN EXISTS (
      SELECT 1 FROM public.perfis p
      JOIN public.permissoes_usuario pu ON pu.usuario_id = p.usuario_id
      WHERE p.usuario_id = auth.uid()
        AND p.ativo IS TRUE
        AND p.administrador IS FALSE
        AND pu.permissao = 'importar:' || p_tipo
    )
    ELSE FALSE
  END
$$;

-- PostgreSQL concede EXECUTE a PUBLIC por padrão nas novas funções.
REVOKE ALL ON FUNCTION public.eh_administrador_ativo() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.pode_importar_tipo(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.eh_administrador_ativo() TO authenticated;
GRANT EXECUTE ON FUNCTION public.pode_importar_tipo(text) TO authenticated;

-- Não conceder SELECT/INSERT/UPDATE/DELETE em importacoes ou outros dados.
-- Autorização por tipo NÃO é autorização por filial nem validação do arquivo.
COMMIT;
