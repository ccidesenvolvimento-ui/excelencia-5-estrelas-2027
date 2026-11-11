-- Programa Excelência 5 Estrelas 2027
-- Etapa RBAC: administradores acumulam a responsabilidade pelas importações.
-- IMPORTANTE: funções de checagem somente; não concedem escrita ou acesso a
-- importacoes, colaboradores, notas, auditoria e demais tabelas de dados.
BEGIN;

CREATE FUNCTION public.eh_administrador_ativo()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.perfis p
    WHERE p.usuario_id = auth.uid()
      AND p.ativo IS TRUE
      AND p.administrador IS TRUE
  )
$$;

CREATE FUNCTION public.pode_importar_dados()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public.eh_administrador_ativo()
$$;

-- Em PostgreSQL, novas funções recebem EXECUTE para PUBLIC por padrão.
REVOKE ALL ON FUNCTION public.eh_administrador_ativo() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.pode_importar_dados() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.eh_administrador_ativo() FROM anon;
REVOKE ALL ON FUNCTION public.pode_importar_dados() FROM anon;
GRANT EXECUTE ON FUNCTION public.eh_administrador_ativo() TO authenticated;
GRANT EXECUTE ON FUNCTION public.pode_importar_dados() TO authenticated;

-- Não criar policies de escrita aqui; "ser admin" não é equivalente a
-- ter autorização de escritura direta em tabelas do setor.
COMMIT;
