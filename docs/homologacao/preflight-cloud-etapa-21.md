# Etapa 21 — Preflight Supabase corporativo (sem migrações aplicadas)

**Estado: PREPARAÇÃO, NÃO EXECUTAR DDL CLOUD.** Issue #117. Projeto confirmado por conexão Supabase: `excelencia-5-estrelas-2027`, região `sa-east-1`, PostgreSQL 17.

## O que foi observado no Cloud em 13/11/2026

| Item | Leitura observada |
|---|---|
| Migrações registradas | `20261029000100_base_inicial`, `20261106000100_rls_filiais_leitura` |
| Migrações ainda ausentes | `20261111000100_admin_importacoes_autorizacao`, `20261111000200_ajustes_administrativos_notas` |
| Usuários Auth | 2 contas de teste criadas anteriormente para isolamento por filial |
| Perfis | 2 ativos, ambos `administrador=false` |
| Vínculos | 2 usuários diferentes, 2 filiais distintas |
| Categorias / notas / importações | 8 / 0 / 0 |
| Tabela de ajustes e view de notas efetivas | Ambas ausentes |
| RLS | Habilitado nas tabelas principais inspecionadas |
| Leitura anônima de perfis | Sem grant `SELECT` |
| Escrita direta de notas e auditoria por authenticated | Sem grant `UPDATE notas_mensais` ou `INSERT auditoria` |

**Nunca reutilizar ou elevar as contas de teste a administrador sem aprovação independente.** O cadastro de usuários reais requer e-mails e filiais autorizados pelo responsável da empresa.

## Preflight reproduzível

Arquivo: `db/homologacao/50_preflight_cloud_somente_leitura.sql`. São consultas `SELECT` que retornam **somente contagens e metadados**, sem nomes, e-mails, matrículas nem credenciais. Selecionar o projeto correto antes de executar, comparar o resultado com esta fotografia e **parar** se houver divergências.

## Segurança identificada

O advisor do Cloud aponta:

- Função `public.rls_auto_enable()` é `SECURITY DEFINER` e tem `EXECUTE` concedido a `anon` e `authenticated`. Foi confirmado que ela é usada pelo event trigger `ensure_rls`. A correção proposta é retirar os grants diretos, mantendo a função e o gatilho, **após revisão de quem administra o banco**:

```sql
-- PROPOSTA PARA REVISÃO. NÃO EXECUTAR NESTA ETAPA.
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
```

- Helpers `usuario_ativo()`, `pode_ler_filial(uuid)` e `pode_ler_colaborador(uuid)` também são `SECURITY DEFINER` com `EXECUTE` para `authenticated`. Esses grants foram previstos nas políticas de RLS; não revogá-los sem testar as políticas dependentes. Revisar se podem permanecer expostos na API.
- A proteção do Supabase Auth contra senhas vazadas está desativada: avaliar ativação conforme plano/capacidade disponível.
- Três tabelas (`auditoria`, `importacoes`, `regras_classificacao`) usam RLS sem policy para usuários comuns; esse bloqueio é **intencional** nesta fase, não uma autorização para adicionar policy aberta.

Referências de orientação: [advisor de função SECDEF pública](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable), [segurança de senhas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

## Plano proposto de migrações — somente após autorização específica

1. Confirmar escopo do projeto, papel do executor e ausência de migrações concorrentes; gerar backup verificável e **testar restauração** em destino isolado.
2. Revisar SQL integral e plano de reversão. DDL de PostgreSQL não equivale a reversão automática de dados ou aplicações; estabelecer ponto de recuperação.
3. Em ambiente descartável compatível com PostgreSQL 17 e esquema de produção, repetir testes de RLS, RPC administrativa, trigger e API Node. Os testes no CI já executaram PostgreSQL local; isso **não** verifica o Cloud.
4. Aplicar `20261111000100_admin_importacoes_autorizacao.sql` **antes de** `20261111000200_ajustes_administrativos_notas.sql`, porque a segunda depende da função `eh_administrador_ativo()`. Executar pelo fluxo versionado de migrações, não por comandos improvisados ou repetidos no SQL editor.
5. Confirmar histórico de migrations e grants, view `security_invoker`, políticas RLS e logs. Fazer smoke test com identidades de teste autorizadas e sem dados reais; manter dados de origem imutáveis.
6. Somente depois avaliar aplicação de grants adicionais de segurança, provisionamento de usuários, ativação da API e deploy. Cada tipo de mudança tem aprovação independente.

## Critérios que impedem aplicar migrações agora

- Backup/restauração do projeto alvo ainda não confirmado.
- Avaliação de segurança da função `rls_auto_enable` não concluída.
- Nenhuma conta administrativa de homologação foi autorizada e cadastrada; as duas existentes são de **consulta/teste**.
- Verificação completa do runtime SSR/Cloudflare/portas 3107 e janela de mudança não executada.
- Gate de homologação e ranking oficial ainda indicam **NO-GO**.
- Não criar usuários, alterar flags, fazer merge, mudar domínio ou aplicar migrações neste PR.

**Resultado:** documentação e SQL de leitura apenas. A aplicação efetiva dependerá de aprovação expressa após concluir o plano de segurança e recuperação.
