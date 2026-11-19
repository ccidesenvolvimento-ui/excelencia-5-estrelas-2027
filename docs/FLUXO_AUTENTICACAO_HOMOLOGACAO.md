# Autenticacao corporativa — pacote de homologacao

## Escopo

Esta branch prepara tres paginas: recuperacao de senha, confirmacao de links
e definicao de nova senha. Mantem o login existente, o modo demonstrativo e
o guard desativado por padrao. Nao altera nenhum banco ou ambiente publicado.

## Convites administrativos

Convites continuam exclusivamente em Authentication > Users > Add user >
Send invitation no Dashboard. Nao existe endpoint publico de convite nem
chave administrativa no navegador. Uma futura interface de administracao
exigira backend confiavel e autorizacao de administrador validada no servidor.

## Requisitos antes de configurar URLs no Supabase

1. Rever os templates Invite user e Reset password e confirmar o destino
   de cada link. Os templates e redirecionamentos atuais nao foram alterados.
2. Autorizar a URL HTTPS exata de /auth/confirm apenas quando o fluxo
   estiver publicado e testado num ambiente isolado.
3. Alterar Site URL de localhost apenas depois do fluxo pronto.
4. Testar com conta laboratorial aprovada, preservando os dois usuarios reais.
5. Rever SMTP, expiracao de convite, Cloudflare Access e logs de tokens.
6. Vincular novas contas a perfis e filiais por um processo administrativo
   controlado, antes de qualquer consulta de dados reais.

## Protecoes ainda pendentes

- Login e guard SSR sao opt-in, nunca ativados automaticamente.
- O guard atual verifica identidade, mas nao verifica autorizacao por filial.
- Recuperacao, convite e links de sessao precisam de testes reais de ponta
  a ponta, incluindo links vencidos e contas sem permissao.
- Nao habilitar acesso corporativo ate concluir esses testes.

## Testes locais

Executar node scripts/testar-fluxo-senhas.cjs, npm run typecheck e
npm run build sem credenciais reais. O build de GitHub Pages deve continuar
sem proxy.ts; o build Node usa o modelo de proxy somente no Docker isolado.
