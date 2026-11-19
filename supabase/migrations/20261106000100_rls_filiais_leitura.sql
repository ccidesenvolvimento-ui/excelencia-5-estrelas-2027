-- Programa Excelência 5 Estrelas 2027
-- Migração ainda NÃO aplicada ao Supabase Cloud.
-- Permissões read-only por filial, sem bypass automático para administrador.
-- Identidade exclusivamente de auth.uid() do Supabase Auth.
BEGIN;

-- Helpers SECURITY DEFINER são pequenos e não aceitam ID de usuário enviado pelo cliente.
-- search_path vazio reduz riscos de objetos falsos no schema público.
CREATE OR REPLACE FUNCTION public.usuario_ativo()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.perfis p
    WHERE p.usuario_id = auth.uid() AND p.ativo = true
  )
$$;

CREATE OR REPLACE FUNCTION public.pode_ler_filial(p_filial_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.perfis p
    JOIN public.filiais_usuario fu ON fu.usuario_id = p.usuario_id
    JOIN public.filiais f ON f.id = fu.filial_id
    WHERE p.usuario_id = auth.uid()
      AND p.ativo = true
      AND f.ativa = true
      AND fu.filial_id = p_filial_id
  )
$$;

CREATE OR REPLACE FUNCTION public.pode_ler_colaborador(p_colaborador_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.colaboradores c
    JOIN public.filiais f ON f.id = c.filial_id
    JOIN public.filiais_usuario fu ON fu.filial_id = f.id
    JOIN public.perfis p ON p.usuario_id = fu.usuario_id
    WHERE c.id = p_colaborador_id
      AND p.usuario_id = auth.uid()
      AND p.ativo = true
      AND f.ativa = true
  )
$$;

REVOKE ALL ON FUNCTION public.usuario_ativo() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.pode_ler_filial(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.pode_ler_colaborador(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.usuario_ativo() TO authenticated;
GRANT EXECUTE ON FUNCTION public.pode_ler_filial(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.pode_ler_colaborador(uuid) TO authenticated;

-- Remove grants genéricos concedidos a anon/authenticated por defaults.
-- service_role e o proprietário não são modificados por esta migração.
REVOKE ALL ON
  public.empresas, public.filiais, public.categorias, public.colaboradores,
  public.importacoes, public.ferias, public.regras_classificacao,
  public.historico_categorias, public.penalizacoes_seguranca,
  public.notas_mensais, public.perfis, public.permissoes_usuario,
  public.filiais_usuario, public.auditoria
FROM PUBLIC, anon, authenticated;

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON
  public.empresas, public.filiais, public.categorias, public.colaboradores,
  public.ferias, public.historico_categorias, public.penalizacoes_seguranca,
  public.notas_mensais, public.perfis, public.permissoes_usuario,
  public.filiais_usuario
TO authenticated;

-- A política de categorias da migração base é preservada.
CREATE POLICY empresas_por_filial_autorizada ON public.empresas
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.filiais f
      WHERE f.empresa_id = empresas.id AND public.pode_ler_filial(f.id)
    )
  );

CREATE POLICY filiais_autorizadas ON public.filiais
  FOR SELECT TO authenticated USING (public.pode_ler_filial(id));

CREATE POLICY colaboradores_por_filial ON public.colaboradores
  FOR SELECT TO authenticated USING (public.pode_ler_filial(filial_id));

CREATE POLICY ferias_por_colaborador_autorizado ON public.ferias
  FOR SELECT TO authenticated USING (public.pode_ler_colaborador(colaborador_id));

CREATE POLICY historico_por_colaborador_autorizado ON public.historico_categorias
  FOR SELECT TO authenticated USING (public.pode_ler_colaborador(colaborador_id));

CREATE POLICY seguranca_por_colaborador_autorizado ON public.penalizacoes_seguranca
  FOR SELECT TO authenticated USING (public.pode_ler_colaborador(colaborador_id));

CREATE POLICY notas_por_colaborador_autorizado ON public.notas_mensais
  FOR SELECT TO authenticated USING (public.pode_ler_colaborador(colaborador_id));

CREATE POLICY perfil_proprio_ativo ON public.perfis
  FOR SELECT TO authenticated USING (
    usuario_id = auth.uid() AND ativo = true
  );

CREATE POLICY permissoes_proprias_ativas ON public.permissoes_usuario
  FOR SELECT TO authenticated USING (
    usuario_id = auth.uid() AND public.usuario_ativo()
  );

CREATE POLICY filiais_proprias_ativas ON public.filiais_usuario
  FOR SELECT TO authenticated USING (
    usuario_id = auth.uid() AND public.usuario_ativo()
    AND public.pode_ler_filial(filial_id)
  );

-- Sem policies de leitura ou escrita para importacoes, regras_classificacao e
-- auditoria. Sem policies INSERT/UPDATE/DELETE nas tabelas acima.
COMMIT;
