# Etapa 20 — Preparar tela Node, Supabase Auth e usuários por filial

**Situação:** PR Draft de preparação. Não existe autorização de deploy, aplicação de migrations Cloud, criação de usuários reais nem mudança de DNS/Cloudflare.

## Estado verificado no código

- A rota `/ajustes-notas` é uma **demonstração com dados fictícios**; a página conectada ao banco está em `src/server/templates/ajustes-notas-live-page.tsx`.
- A API protegida de ajuste está em `src/server/api-ajustes-notas.ts`, com template Node em `src/server/templates/ajustes-notas-route.ts`.
- `src/server/proxy-autenticacao.ts` depende de `EXCELENCIA_AUTH_GUARD_ENABLED=true`, sessão Supabase verificada por `auth.getUser()` e RLS por filial.
- O build estático do GitHub Pages não deve possuir API Node ou dados corporativos.
- A versão Node opt-in requer `EXCELENCIA_NODE_AJUSTES_ENABLED=true` **na construção da imagem**; por padrão é `false`. Esse parâmetro não habilita por si só acesso a dados, flags de runtime ou provisionamento.

## Sequência de implantação a ser autorizada separadamente

1. **Inventário sem mutações:** responsável técnico confirma projeto Supabase/ambiente de homologação, migrações aplicadas, schema, RLS, privilégios e contas existentes sem exportar dados ou senhas. Confirmar backups e teste de restauração do banco alvo.
2. **Revisão de SQL:** revisar e aplicar, em ambiente autorizado e por processo controlado, as migrações de RLS, autorização de importações e ajustes de notas, na ordem definida, com validação de compatibilidade e plano de rollback. **Este PR não executa nenhuma migração.**
3. **Autenticação:** configurar apenas URL HTTPS e chave `sb_publishable_` com segredos em ambiente do servidor; nunca enviar token, `service_role`, `sb_secret_` ou senha pelo GitHub/ChatGPT. Manter Cloudflare Access. Validar callback, refresh, cookies seguros e logout no destino.
4. **Provisionamento:** definir lista de pessoas autorizadas e suas **filiais**, papel/permissões e e-mail corporativo aprovado. O administrador de Auth cria ou convida a conta no painel do projeto Supabase, verifica o UUID gerado, então associa `public.perfis.usuario_id` e `public.filiais_usuario` conforme o schema. Não usar INSERT direto em `auth.users` em ambiente real. Não enviar senhas ao chat. Revogar acesso de contas desligadas/inativas.
5. **Teste de acesso:** usuário ativo deve ver só sua filial; outro usuário de filial diferente não pode ler o mesmo colaborador; administrador sem filial também não pode; anônimo/inativo recebe 401/403; somente administrador autorizado pode usar RPC de ajustes, e Segurança não admite ajuste manual.
6. **Homologação da tela:** em build Node isolado, instalar o template com `EXCELENCIA_NODE_AJUSTES_ENABLED=true` e confirmar `GET/POST /api/ajustes-notas` apenas após Auth/RLS validados. Testar com dados fictícios e perfil de teste. Não substituir diretamente a versão atual do domínio.
7. **Publicação controlada:** confirmar porta livre distinta de 3107 para homologação, capacidade Docker, backup de configuração Nginx/Cloudflare, teste de HTTPS e autorização de mudança. Trocar o roteamento do domínio somente após validação da equipe responsável e plano de reversão. Nunca expor portas de PostgreSQL no host.
8. **Pós-implantação:** monitorar 401/403/5xx e auditoria de acesso; manter ranking oficial bloqueado até fechar RH, acidentes, advertências e abrangência global.

## Comportamento do build opt-in

- `node scripts/preparar-ajustes-node.cjs` por padrão não modifica os arquivos.
- Em Docker Node isolado, o `ARG EXCELENCIA_NODE_AJUSTES_ENABLED=true` instala a página e a rota a partir de templates antes de `next build`. A rota não aparece na exportação estática.
- `EXCELENCIA_AJUSTES_API_ENABLED=true` e `EXCELENCIA_AUTH_GUARD_ENABLED=true` são **flags de runtime independentes**, que só podem ser habilitadas após validação de Auth/RLS/segredos.
- A funcionalidade não é publicada no domínio automaticamente. Ao ativá-la, o texto atual da página ainda indica **homologação**, não operação oficial; revisar essa identificação antes da aceitação funcional.

## Checklist para coleta autorizada de usuários

| Campo | Exemplo não real |
| --- | --- |
| E-mail aprovado | usuario.exemplo@dominio.invalid |
| Papel | administrador / consulta |
| Filiais vinculadas | UUIDs verificados das filiais autorizadas |
| Importações autorizadas | somente permissões por tipo explicitamente concedidas |
| Situação | ativo/inativo |
| Responsável pela aprovação | responsável corporativo designado |

**Não cadastrar pessoas por nome ou e-mail deduzidos do repositório. Não usar credenciais de uma conta pessoal para operar um banco corporativo sem a devida autorização.**

## Bloqueios ainda abertos

- A conexão Supabase corporativa não está disponível nesta execução; o banco real e as contas não foram inspecionados.
- Acesso SSH/Cloudflare ao servidor de destino também não está disponível nesta execução.
- O PR #112 permanece Draft, e o gate `docs/homologacao/gate-liberacao-etapa-17.md` continua NÃO LIBERADO PARA MERGE OU PRODUÇÃO.
- Nenhuma conta, migration, registro, permissão, porta, DNS ou contêiner corporativo foi alterado nesta etapa.
