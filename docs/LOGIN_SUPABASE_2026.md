# Login Supabase — etapa inicial e isolada (#49)

## O que foi implementado
- A interface de `/login` preserva o layout e o modo demonstrativo atual por padrão.
- Um formulário cliente opcional usa `@supabase/ssr` / `createBrowserClient` para autenticar com e-mail e senha **apenas contas já provisionadas pelo administrador no Supabase Auth**.
- Confere o usuário por `auth.getUser()` após entrar, oferece logout e mensagens sem revelar informações específicas da credencial.
- Sem auto-cadastro, sem chaves administrativas, sem dados reais, sem endpoints públicos para colaboradores e sem alterações de SQL.
- O site estático do GitHub Pages permanece com o login desabilitado por padrão.

## Estado de segurança — NÃO é autenticação/autorização corporativa completa

Este é um teste de login no navegador. **A autenticação ainda não protege as rotas administrativas demonstrativas** e não cria ou autoriza perfis no banco. O painel contém somente dados fictícios. **NÃO inserir dados reais** até implementar guardas SSR com refresh seguro de cookies, RLS de filiais/perfis e testes negativos de permissões, em PRs separados.

O Cloudflare Access com One-time PIN permanece obrigatório durante a homologação. Supabase Auth é uma segunda identidade, separada da Cloudflare.

## Configuração futura (somente após revisão do PR e teste da segurança)

A ativação é explicitamente opt-in, exige três variáveis `NEXT_PUBLIC_` em **tempo de build** do Next.js; são dados **publicáveis**, não segredos. Sem essas configurações, o formulário permanece desabilitado:

- `NEXT_PUBLIC_SUPABASE_LOGIN_ENABLED=true`
- `NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...`

**Não adicionar** `service_role`, `sb_secret_`, senha PostgreSQL ou token Supabase CLI em código, build ou navegador.

O `Dockerfile` e o `compose.homologacao.yml` **não foram alterados**. Portanto, o login não será ativado no Vostro pela simples troca de branch. Um futuro PR de implantação precisará tratar as variáveis públicas no build de maneira controlada, com autorização explícita. Sem implantação, o site permanece idêntico.

## Fluxo para uso futuro

1. Desabilitar autocadastro público nas configurações Supabase Auth.
2. Provisionar manualmente contas de teste autorizadas pelo supervisor, sem expor senhas.
3. Ativar via pipeline controlado com variáveis publicáveis; conferir HTTPS, login/logout e sessões.
4. Implementar guardas do lado do servidor e autorização por filial antes de qualquer leitura/alteração corporativa.

## Testes

O CI executa testes do componente, TypeScript, build para GitHub Pages, regras de negócio e testes visuais. Não usa rede Supabase ou credenciais reais.

## Pendências

- Callback/server actions e refresh de sessão no lado servidor;
- Guardas SSR de rotas administrativas;
- RLS por filial e testes negativos;
- Provisionamento e convites;
- Deploy controlado do modo de testes no Vostro.
