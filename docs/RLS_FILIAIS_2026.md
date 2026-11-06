# RLS por filial — proposta de leitura (Issue #53)

**NÃO aplicada ao Supabase Cloud.** Esta é uma proposta revisável para o Supabase Free de desenvolvimento; não altera dados e não habilita uso de colaboradores reais.

## Regras
- Identidade somente por `auth.uid()` do Supabase Auth. Nenhuma filial ou usuário recebido do navegador decide permissões.
- Usuário **ativo**, associado explicitamente em `filiais_usuario`, pode ler apenas colaboradores e registros dessas filiais **ativas**.
- Sem vínculo, usuário inativo, filial inativa e colaborador sem filial: sem visibilidade.
- Nem mesmo `administrador=true` dá acesso implícito a todas as filiais: os vínculos devem ser explícitos.
- `perfis`, `permissoes_usuario` e `filiais_usuario`: o próprio usuário ativo lê apenas seus registros.
- `empresas`: somente aquelas com filial explicitamente autorizada.
- `categorias`: preserva a política original de leitura autenticada.
- `importacoes`, `auditoria` e `regras_classificacao`: **sem SELECT ou escrita** para clientes. Qualquer futura API para essas tabelas requer política/revisão separada.
- Nenhuma tabela recebeu INSERT, UPDATE ou DELETE para `authenticated`; acesso de escrita dependerá de RBAC, auditoria e validação posterior.

## Como a proteção funciona
As funções `usuario_ativo`, `pode_ler_filial` e `pode_ler_colaborador` usam `SECURITY DEFINER` com `search_path=''`, todos os objetos qualificados e execução concedida apenas a `authenticated`. Isso evita recursão de RLS sem aceitar IDs de usuário do cliente. Requer revisão do proprietário das funções, de grants previamente existentes e das permissões no Supabase antes da implantação.

## Testes
O workflow do PR cria somente banco PostgreSQL efêmero no runner GitHub, carrega a migração base, uma substituição **fictícia** de `auth.uid()`, aplica a proposta de migração e testa com `SET LOCAL ROLE authenticated` para:
- usuário na Filial A não enxerga colaboradores/notas/férias da Filial B;
- usuário na Filial B vê exclusivamente seus registros;
- usuário inativo, sem filial ou sem JWT não vê colaboradores;
- ausência de SELECT nas importações e ausência de escrita em colaboradores/notas.

A simulação `db/homologacao/29_auth_uid_apenas_ci.sql` **nunca** deve ser executada no Supabase Cloud: a autenticação real pertence ao Supabase Auth.

## Implantação futura
1. Revisão de segurança do PR, CI e conferência dos grants e políticas existentes.
2. Confirmar projeto/ambiente no CLI; `npx --yes supabase@3.0.0 db push --dry-run --remote`.
3. Revisão humana da migração pendente; não aplicar automaticamente.
4. Autorizar aplicação **somente em desenvolvimento**, nunca durante uso de dados reais, e realizar testes com usuários de teste e sessão autenticada.
5. Políticas para gravação, RH0034, importações, relatórios e Portal do Motorista exigem PRs e aprovações próprios.

O Cloudflare Access continua ativo. A conclusão do PR não habilita autenticação ou a conexão do site com a nuvem.
