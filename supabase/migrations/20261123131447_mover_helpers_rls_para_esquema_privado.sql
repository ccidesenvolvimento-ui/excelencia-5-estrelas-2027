-- Programa Excelência 5 Estrelas 2027
-- Move as três funções RLS existentes para esquema privado.
-- Não modifica dados, políticas, assinaturas ou regras de autorização.
-- NÃO aplicar no Supabase Cloud antes da homologação.

BEGIN;

-- O esquema é compartilhado com a migração administrativa anterior.
CREATE SCHEMA IF NOT EXISTS excelencia_private;

REVOKE ALL ON SCHEMA excelencia_private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA excelencia_private TO authenticated;

-- Preserva as funções e suas dependências existentes.
ALTER FUNCTION public.usuario_ativo()
  SET SCHEMA excelencia_private;

ALTER FUNCTION public.pode_ler_filial(uuid)
  SET SCHEMA excelencia_private;

ALTER FUNCTION public.pode_ler_colaborador(uuid)
  SET SCHEMA excelencia_private;

-- Mantém a execução restrita ao papel autenticado.
REVOKE ALL ON FUNCTION
  excelencia_private.usuario_ativo()
FROM PUBLIC, anon;

REVOKE ALL ON FUNCTION
  excelencia_private.pode_ler_filial(uuid)
FROM PUBLIC, anon;

REVOKE ALL ON FUNCTION
  excelencia_private.pode_ler_colaborador(uuid)
FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION
  excelencia_private.usuario_ativo()
TO authenticated;

GRANT EXECUTE ON FUNCTION
  excelencia_private.pode_ler_filial(uuid)
TO authenticated;

GRANT EXECUTE ON FUNCTION
  excelencia_private.pode_ler_colaborador(uuid)
TO authenticated;

COMMIT;
