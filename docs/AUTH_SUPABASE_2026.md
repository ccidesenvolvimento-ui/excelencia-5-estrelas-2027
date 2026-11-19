# Supabase Auth: base de sessões SSR — Issue #47

## Escopo e estado

Este PR adiciona **somente uma base técnica** para o Supabase Auth no Next.js 16 (App Router). Não habilita a tela `/login`, não cria contas, não remove Cloudflare Access, não modifica o PostgreSQL/Supabase Cloud, não consulta dados corporativos e não conecta o ambiente público a informações de colaboradores.

O projeto continua em demonstração com dados fictícios. A migração Supabase foi aplicada com CLI a partir do GitHub; conectar o painel Supabase diretamente ao GitHub **não é obrigatório**.

## Arquitetura da base

`src/lib/supabase/sessao-servidor.ts` cria cliente server-only via `@supabase/ssr`, lendo cookies com `next/headers`. A função `verificarUsuarioSupabase()` utiliza `auth.getUser()` — consulta autenticada ao serviço Auth — e retorna `null` se não encontrar uma identidade válida. Não usa o estado de `getSession()` como autoridade de acesso.

Em Server Components, Next.js pode bloquear escrita de cookies; o cliente contém tratamento para isso, mas **a renovação de sessão ainda não está completa**. Precisamos de um proxy/middleware de refresh separado, com testes, antes de liberar a autenticação de verdade.

## Etapas futuras obrigatórias

1. Configurar credenciais publicáveis no runtime do Vostro (nunca no Git, logs ou build, sem reiniciar serviços de terceiros).
2. Implementar callback de login, atualização de cookies, logout, redirects seguros, controle CSRF e testes; ativar a página `/login` após revisão.
3. Implementar perfis, filiais e políticas RLS de acesso mínimo — autenticação não concede permissão para ler colaboradores/avaliações.
4. Testar identidade inválida, sessão expirada, usuários inativos, troca de filial e tentativas de acesso a registros de outra filial.
5. Manter Cloudflare Access durante a homologação; dados reais dependem de autorização corporativa, backups e testes de restauração.

Não reutilizar senhas de banco, tokens do CLI, chave `service_role` nem chaves `sb_secret_` nas APIs de usuário. Não criar usuários corporativos com e-mails reais até haver aprovação e fluxo de provisionamento.
