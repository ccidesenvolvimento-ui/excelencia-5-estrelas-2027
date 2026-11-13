# Proteção de rotas administrativas — Issue #51

## Estado e limites
Este PR prepara a proteção SSR para a hospedagem Next.js Node/Docker no Vostro 3470. **Não altera a implantação atual nem ativa autenticação**. A versão GitHub Pages segue como demonstração exportada estaticamente. Cloudflare Access continua obrigatório.

### Como funciona
O modelo versionado `src/server/proxy-autenticacao.ts` é copiado para `src/proxy.ts` **somente durante o build Docker**. Next.js 16 não permite `proxy.ts` em `output: "export"`, então o build estático não recebe esse arquivo. O arquivo gerado está no `.gitignore` e não deve ser comitado.

Por padrão `EXCELENCIA_AUTH_GUARD_ENABLED` está ausente ou diferente de `true`: a demonstração continua disponível dentro do Cloudflare Access, apenas com dados fictícios.

Quando a flag for `true`, o proxy:
- permite somente entrada, login, portal do motorista (ainda demonstrativo), assets e recursos internos do Next.js;
- exige identidade válida do Supabase Auth para páginas administrativas; usuários sem sessão vão a `/login`;
- responde HTTP 401 em `/api/*` sem sessão; não confia no nome ou extensão de rotas de API;
- lê e renova cookies via `@supabase/ssr` e valida a identidade no serviço Auth com `getUser()`;
- **nega acesso** se faltar configuração do Supabase ou se a verificação remota falhar.

As variáveis de execução para o proxy são:
- `EXCELENCIA_AUTH_GUARD_ENABLED=true`, somente mediante autorização formal;
- `SUPABASE_URL=https://...supabase.co`;
- `SUPABASE_PUBLISHABLE_KEY=sb_publishable_...`.

Não configurar tokens de usuário, `service_role`, `sb_secret_`, senhas PostgreSQL nem tokens CLI no servidor web.

### Proteções que ainda faltam
- O proxy controla **identidade**, não autorização: usuários autenticados ainda precisam ser vinculados a perfis e filiais, com políticas RLS e testes negativos no Supabase.
- Rotas `/motorista` são públicas deliberadamente nesta fase **somente porque exibem dados fictícios**. Precisam de autenticação própria antes de introduzir dados de motoristas reais.
- A interface de login na branch #50 usa variáveis publicáveis `NEXT_PUBLIC_*` em tempo de compilação; o Docker existente não está configurado para habilitá-la. **Não ligar a flag do guard até o login e o fluxo de recuperação de sessão estarem operacionais e testados em ambiente isolado.**
- A flag somente deve ser ativada após testes completos de sessão, expiração, logout, redirecionamento e revisão de acesso.

### CI
1. Testes estruturais sem rede nem credenciais.
2. `npm run build` em modo GitHub Pages (sem proxy).
3. Build separado em modo Node com cópia temporária do arquivo `src/proxy.ts` e remoção automática ao final.
4. Testes de navegador existentes para a demonstração.

### Implantação
Este PR não altera Compose, Supabase remoto, Cloudflare Tunnel, Docker do Vostro ou `main`. Merge e implantação exigem aprovação expressa da equipe. Até implementar políticas RLS e autorizações por filial, manter exclusivamente dados fictícios.
