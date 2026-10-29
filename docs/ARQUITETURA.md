# Arquitetura inicial

## Tecnologias

- Frontend: Next.js (App Router), React, TypeScript.
- Banco: Supabase PostgreSQL (migrações versionadas).
- Autenticação futura: Supabase Auth, preferindo `@supabase/ssr` para sessões por cookie em Next.js.
- RLS: padrão atual **fechado**; as políticas detalhadas por permissão/filial serão implementadas após a autenticação.

## Fronteiras de segurança

- Modelos XLSX públicos e estáticos podem ser baixados sem autenticação na fundação inicial. Na versão corporativa, decidir se a página de download também exige sessão.
- Nenhum dado de colaborador ou relatório de penalizações é enviado junto ao código.
- Dados reais somente após autenticação, autorização de filial, validação de lote e trilha de auditoria.
- Service role é segredo exclusivo do servidor e NÃO deve estar em variáveis `NEXT_PUBLIC_`.
- Todas as importações devem ser validadas **no servidor**, mesmo que a UI também faça validações.

## Etapas posteriores

1. Criar autenticação e autorização por filial/permissão.
2. Implementar parser e prévia da RH0034, importação transacional e classificação assistida (incluindo criar regra automática).
3. Implementar importação/validação das avaliações, inclusive os dois relatórios de Segurança.
4. Criar Central de Pendências e cálculo de férias ao fim do ciclo.
5. Implementar motor de pontuação, rankings e Top N em PDF/Excel.
