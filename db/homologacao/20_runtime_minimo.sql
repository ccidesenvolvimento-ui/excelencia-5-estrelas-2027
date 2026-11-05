-- Homologação LOCAL: papel de execução sem privilégios administrativos.
-- Não executar em Supabase real ou nos bancos compartilhados do servidor.
-- O papel é criado inicialmente SEM SENHA. A senha deve ser definida
-- interativamente pelo administrador (\\password excelencia5_runtime).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'excelencia5_runtime') THEN
    CREATE ROLE excelencia5_runtime LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
  END IF;
END $$;

GRANT CONNECT ON DATABASE excelencia5_homologacao TO excelencia5_runtime;
GRANT USAGE ON SCHEMA public TO excelencia5_runtime;
GRANT SELECT ON public.categorias TO excelencia5_runtime;

-- Restrição positiva apenas para categorias, não concede leitura em outras tabelas.
DROP POLICY IF EXISTS categorias_leitura_runtime_local ON public.categorias;
CREATE POLICY categorias_leitura_runtime_local
ON public.categorias FOR SELECT TO excelencia5_runtime USING (true);

-- NUNCA conceder ALL, CREATE no schema, ou permissão no auth.users a este papel.
