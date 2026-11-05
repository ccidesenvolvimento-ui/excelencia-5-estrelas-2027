-- EXCLUSIVO do PostgreSQL local DESCARTÁVEL de homologação.
-- NÃO executar no Supabase real: auth.users do Supabase é gerido pelo Auth.
-- Estruturas mínimas para permitir FKs do desenho original sem habilitar login.
CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY
);
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
END $$;
-- Sem grants, sem usuários: a autenticação NÃO está implementada.
