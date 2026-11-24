-- Leitura administrativa de usuários e acessos.
-- NÃO aplicar no Supabase Cloud antes da homologação.
--
-- Administrador global:
--   perfil ativo + administrador = true
--   + Configurações:Visualizar
--   + vínculo com pelo menos uma filial ativa.
--
-- Esta migração não concede INSERT, UPDATE ou DELETE.

BEGIN;

CREATE SCHEMA IF NOT EXISTS excelencia_private;

REVOKE ALL ON SCHEMA excelencia_private FROM PUBLIC, anon;

GRANT USAGE ON SCHEMA excelencia_private TO authenticated;

CREATE OR REPLACE FUNCTION
  excelencia_private.pode_consultar_usuarios_administracao()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.perfis p
    WHERE p.usuario_id = (SELECT auth.uid())
      AND p.ativo = true
      AND p.administrador = true
      AND EXISTS (
        SELECT 1
        FROM public.permissoes_usuario pu
        WHERE pu.usuario_id = p.usuario_id
          AND pu.permissao = 'Configurações:Visualizar'
      )
      AND EXISTS (
        SELECT 1
        FROM public.filiais_usuario fu
        JOIN public.filiais f
          ON f.id = fu.filial_id
        WHERE fu.usuario_id = p.usuario_id
          AND f.ativa = true
      )
  );
$$;

REVOKE ALL ON FUNCTION
  excelencia_private.pode_consultar_usuarios_administracao()
FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION
  excelencia_private.pode_consultar_usuarios_administracao()
TO authenticated;

-- Acrescenta acesso administrativo de leitura.
-- As políticas individuais existentes são preservadas.

CREATE POLICY perfis_leitura_administrativa
ON public.perfis
FOR SELECT TO authenticated
USING (
  (SELECT excelencia_private.pode_consultar_usuarios_administracao())
);

CREATE POLICY permissoes_leitura_administrativa
ON public.permissoes_usuario
FOR SELECT TO authenticated
USING (
  (SELECT excelencia_private.pode_consultar_usuarios_administracao())
);

CREATE POLICY filiais_usuario_leitura_administrativa
ON public.filiais_usuario
FOR SELECT TO authenticated
USING (
  (SELECT excelencia_private.pode_consultar_usuarios_administracao())
);

CREATE POLICY filiais_leitura_administrativa
ON public.filiais
FOR SELECT TO authenticated
USING (
  (SELECT excelencia_private.pode_consultar_usuarios_administracao())
);

COMMIT;
