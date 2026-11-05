# Conexão segura ao PostgreSQL local — proposta #43

Esta etapa prepara um **papel exclusivo de execução**, com leitura somente das oito categorias. Não cria endpoints públicos, não lê colaboradores, não ativa importações, nem muda o protótipo de dados fictícios.

## Dependências
- Infraestrutura no PR #40; schema original no PR #42.
- `excelencia5-homologacao-db-1` deve estar saudável e o schema já aplicado.
- Este PR é empilhado sobre `db/schema-homologacao-41`, sem merge automático.

## Aplicação manual (SOMENTE APÓS CI, revisão e autorização)
Na raiz do repositório, após atualizar a branch:

```bash
docker compose --env-file .env.homologacao -f compose.homologacao.yml \
  exec -T db psql -X -U excelencia5_app -d excelencia5_homologacao -v ON_ERROR_STOP=1 \
  < db/homologacao/20_runtime_minimo.sql

bash scripts/testar-runtime-db.sh
```

O papel `excelencia5_runtime` nasce sem senha: portanto não permite conexão até que a equipe defina uma senha forte **interativamente**. Quando estivermos prontos para conexão da aplicação, executar:

```bash
docker compose --env-file .env.homologacao -f compose.homologacao.yml \
  exec -it db psql -X -U excelencia5_app -d excelencia5_homologacao
```

No prompt do psql, digitar `\password excelencia5_runtime` e escolher senha forte; concluir com `\q`. Não enviar senha por chat, comando, URL ou Issue. Antes de habilitar a conexão na aplicação, a equipe deve revisar como fornecer a senha via configuração privada do contêiner (preferir Docker secrets), sem exposição em build ou logs.

## Código TypeScript
O módulo `src/server/postgres.ts` usa `pg`, `server-only` e um pool com no máximo duas conexões e timeouts. Ele só será executado se importado por uma rotina explicitamente de servidor; atualmente **nenhuma tela ou API o importa**. Exige `EXCELENCIA_DB_HOST`, `EXCELENCIA_DB_NAME`, `EXCELENCIA_DB_USER` (valor fixo `excelencia5_runtime`) e `EXCELENCIA_DB_PASSWORD`; porta opcional `EXCELENCIA_DB_PORT`.

**Não configurar credenciais em variáveis NEXT_PUBLIC.** O Compose atual não as injeta no Next.js, intencionalmente: a integração de execução real ocorrerá em PR posterior após revisão de segredos e autenticação.

## Limites
O PostgreSQL local não fornece o Supabase Auth. A política local deste PR permite somente `SELECT` na tabela pública de categorias; acesso a colaboradores, notas, importações e outros dados permanece negado. A RLS pode ser contornada pelo proprietário das tabelas, motivo pelo qual a aplicação não deve usar o usuário `excelencia5_app`.

A promoção para o Supabase em 2027 exigirá revisão de permissões, RLS e Auth, sem copiar o `auth.users` fictício local.
