# Supabase Cloud — desenvolvimento e integração gradual (2026)

Referências: Issue #45; infraestrutura local #39/PR #40; schema #41/PR #42.

## Situação confirmada

- Aplicação Next.js hospedada no Vostro 3470, porta 127.0.0.1:3107, domínio `excelencia.decamservice.com` protegido por Cloudflare Access + One-time PIN.
- Supabase Free criado para desenvolvimento em São Paulo. Migração `supabase/migrations/20261029000100_base_inicial.sql` aplicada via CLI, com 14 tabelas com RLS e 8 categorias confirmadas.
- Sem conexão GitHub nativa do Dashboard Supabase: **é opcional**. GitHub é fonte de verdade para SQL, aplicado explicitamente com Supabase CLI; não habilitar migrações/deploys automáticos.
- A aplicação web ainda é demonstração. Nenhuma permissão por filial, importação real ou login Supabase foi implementado.

## Primeiro PR de integração (#45)

`src/lib/supabase/server.ts` fornece uma fábrica de cliente **exclusiva para execução server-side**, com chave publicável `sb_publishable_`, sem persistir sessão, sem `service_role` e sem chamadas de leitura/escrita. Não há conexão ativada apenas por instalar o código; o módulo será usado apenas por futuras APIs depois da autorização.

### Configuração futura no servidor (somente após revisão, testes e autorização de deploy)

Guardar valores exclusivamente em arquivo local de permissão restrita, fora do Git, ou em gerenciador de segredos. A URL pública do projeto pode ser utilizada; a chave `sb_publishable_` **não é uma senha administrativa**, mas ainda deve ser administrada com cuidado. Para evitar exposição prematura no navegador, não usar prefixo `NEXT_PUBLIC_` nesta etapa.

- `SUPABASE_URL`: URL HTTPS do projeto Supabase Cloud.
- `SUPABASE_PUBLISHABLE_KEY`: chave **publicável**, normalmente `sb_publishable_...`.
- **Proibido:** `service_role`, `sb_secret_`, senha do PostgreSQL, connection strings privilegiadas na aplicação, no Git ou em logs.

O `compose.homologacao.yml` ainda não injeta variáveis Supabase: este PR **não modifica** a configuração de runtime nem reinicia contêineres. Futuro PR deve montar apenas essas duas configurações no serviço `web` e preservar `db` isolado. Não copiar tokens pessoais do Supabase CLI para dentro do contêiner.

## Próximas etapas obrigatórias ANTES de ler colaboradores

1. Implementar Supabase Auth + sessões SSR (cookies protegidos, verificação de usuário em cada requisição).
2. Implementar políticas RLS específicas para perfis, permissões e filiais; garantir que não existam tabelas acessíveis indevidamente.
3. Testar negativas de autorização (anon, usuário não autorizado, filial diferente, inativo), em ambiente isolado com dados fictícios.
4. Só depois criar endpoints de dados, uploads RH0034, auditoria, procedimentos de backup e relatórios.
5. Planejar separação entre desenvolvimento e produção antes de inserir dados reais.

O Cloudflare Access restringe a **entrada ao site**, mas não deve ser utilizado como substituto da identidade e das permissões internas da aplicação.

## CI e operações

Não instalar CLI global no Vostro; execução via `npx --yes supabase@3.0.0` já foi validada. Revisar migrações em PR e executar `db push --dry-run --remote` antes de `db push --remote`, com o projeto explicitamente confirmado. Nunca usar `db reset` contra o banco em nuvem. Os scripts Docker não devem ser executados contra o Supabase real.

O Supabase Free não deve guardar dados corporativos reais sem aprovação, políticas e procedimentos de recuperação validados.
