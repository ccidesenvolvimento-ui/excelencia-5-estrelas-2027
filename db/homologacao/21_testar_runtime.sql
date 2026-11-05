-- Teste de autorização com SET ROLE, sem criar dados reais.
-- Executar como usuário proprietário/migrador somente no DB isolado.
BEGIN;
SET LOCAL ROLE excelencia5_runtime;
DO $$
DECLARE n integer;
BEGIN
  SELECT count(*) INTO n FROM public.categorias;
  IF n <> 8 THEN RAISE EXCEPTION 'Runtime deve ler 8 categorias: encontrou %', n; END IF;

  BEGIN
    PERFORM 1 FROM public.colaboradores LIMIT 1;
    RAISE EXCEPTION 'Falha de segurança: runtime conseguiu consultar colaboradores';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'Acesso a colaboradores negado como esperado';
  END;
  BEGIN
    EXECUTE 'CREATE TABLE public.tabela_proibida(id integer)';
    RAISE EXCEPTION 'Falha de segurança: runtime tem CREATE em public';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'Criação de tabela negada como esperado';
  END;
END $$;
ROLLBACK;
