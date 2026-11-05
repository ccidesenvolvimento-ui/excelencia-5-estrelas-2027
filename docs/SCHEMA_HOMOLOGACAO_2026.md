# Schema PostgreSQL local — homologação 2026

Issue #41, dependência da infraestrutura #39 / PR #40. **Somente dados fictícios.** O comando não mexe na aplicação, não cria contas, não importa planilhas e não altera outros bancos.

## Revisão da migração existente

A migração original `supabase/migrations/20261029000100_base_inicial.sql` é preservada integralmente para 2027. Define: empresas e filiais; oito categorias; colaboradores (matrícula única por empresa); RH0034/importações; férias; regras e histórico de classificação; advertências e acidentes; notas mensais com Segurança 0/100 e fonte de Dirigibilidade; perfis/permissões por filial; auditoria; RLS habilitada em todas as 14 tabelas.

Essa migração **não roda diretamente no PostgreSQL padrão** porque referencia `auth.users` e o papel `authenticated` do Supabase. `db/homologacao/00_compatibilidade_supabase.sql` cria apenas placeholders locais sem login e sem grants para viabilizar testes estruturais. Esses objetos não oferecem autenticação real: **não usar este banco como ambiente de produção**.

## Procedimento local (após revisão e autorização)

Este PR é empilhado sobre `infra/homologacao-local-39` e ainda está em revisão. Atualizar a branch do servidor **somente após revisão** e garantir que o contêiner `db` é `excelencia5-homologacao-db-1`. Validar o backup/volume antes de alterações.

```bash
# Executar na raiz do repositório, com PostgreSQL isolado já iniciado:
bash scripts/aplicar-schema-homologacao.sh
```

O script verifica se o DB está ativo, se não existe schema preexistente sem controle, executa o prelude + migração original em uma única transação, grava marcador e valida 14 tabelas, 8 categorias, RLS e constraints. Se executado novamente, apenas valida a estrutura, sem refazer inserts. Aborta quando encontra estado inesperado.

Para inspecionar apenas nomes de tabelas, sem revelar dados ou senhas:
```bash
docker compose --env-file .env.homologacao -f compose.homologacao.yml \
  exec -T db psql -X -U excelencia5_app -d excelencia5_homologacao -c '\\dt public.*'
```

## Limites da etapa
- O banco permanece **sem dados reais** e **sem integração com Next.js**.
- `auth.users` local é um placeholder de DDL, não um serviço de autenticação. Não reutilizar as tabelas de compatibilidade no Supabase em 2027.
- A RLS é ligada, mas o usuário de migração é proprietário das tabelas e pode contornar RLS. Nas próximas etapas, criar usuários de runtime com privilégios mínimos, aplicar RLS efetiva e testar acessos negados; nunca usar o proprietário das tabelas nas APIs.
- O fluxo de importações, fechamento de ciclos, estimativa de férias, histórico de alterações e revisões de nomenclatura serão implementados/testados em PRs separados.

## Critérios de aceite
- PostgreSQL 16 efêmero no CI aplica a migração sem erro;
- 14 tabelas e as oito categorias criadas corretamente;
- RLS e constraints essenciais presentes;
- Segunda execução é idempotente (somente valida);
- `npm run typecheck`, `npm run test:rules` e build existentes aprovados;
- Nada é implantado automaticamente no Vostro 3470.
