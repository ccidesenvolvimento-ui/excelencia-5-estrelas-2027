# Etapa 22 — Backup manual e prova de restauração (Supabase Free)

**Estado: procedimento preparado, ainda NÃO EXECUTADO.** Ref. Issue #119. Não executar migrações ou mudanças de produção enquanto a recuperação não estiver confirmada.

## Escopo e riscos

Projeto Supabase: `excelencia-5-estrelas-2027` (região sa-east-1, PostgreSQL 17, organização Free).
Há duas contas de autenticação de teste vinculadas a duas filiais diferentes, usadas para testes de isolamento. O backup precisa preservar esses vínculos e políticas RLS sem publicar nomes, e-mails, UUIDs, hashes de senha ou connection strings.

**O conector Supabase disponível nesta conversa não oferece exportação de backup em formato restituível nem teste de restauração.** A exportação deve ser feita em estação corporativa autorizada, com a CLI Supabase, por responsável com acesso ao banco e permissão para usar Docker. Não anexar arquivos ou suas saídas ao GitHub, GitHub Actions, mensagens, chats ou ferramentas de IA.

A exportação SQL não inclui automaticamente arquivos reais do Supabase Storage nem configurações externas de OAuth, SMTP, Cloudflare e DNS; levantar esses recursos e documentar backup adicional se utilizados. Não considerar backups de banco como backup integral do sistema.

## Preparação na estação autorizada (instruções, não execução)

1. Confirmar no dashboard que o projeto e a região são os corretos, a política corporativa de retenção, e que a conta executora pode ler os dados e esquemas necessários. Obter autorização da empresa.
2. Validar documentação atual da CLI, suas versões e as flags reais **na estação**:
   ```bash
   supabase --version
   supabase db dump --help
   supabase link --help
   ```
3. Em diretório local **fora do repositório**, criar pasta privada protegida por criptografia de disco e permissões de leitura restritas. Não colocar credenciais nos argumentos do terminal, logs, arquivo .env versionado ou histórico de shell.
4. Vincular a CLI **somente após confirmar a organização e o project-ref**. O fluxo `supabase link` pode solicitar credenciais; introduzi-las apenas no prompt seguro da própria CLI:
   ```bash
   supabase login
   supabase link --project-ref upehxsdwpxqgzkrihgvz
   ```
5. Dentro do diretório de backup seguro, com a CLI devidamente vinculada ao projeto, produzir **roles, schema e data** como três arquivos separados, conforme a [documentação oficial](https://supabase.com/docs/guides/self-hosting/restore-from-platform):
   ```bash
   supabase db dump --role-only -f roles.sql
   supabase db dump -f schema.sql
   supabase db dump --data-only --use-copy -f data.sql
   ```
   **Atenção:** comandos acima pressupõem o diretório de trabalho do projeto corretamente vinculado à CLI e as flags confirmadas com `--help`. A CLI pode precisar de Docker. Nunca compartilhar os arquivos com o ChatGPT.
6. Validar cada retorno de comando (código de saída zero), presença e tamanho não nulo dos três arquivos:
   ```bash
   test -s roles.sql && test -s schema.sql && test -s data.sql
   sha256sum roles.sql schema.sql data.sql > hashes.sha256
   sha256sum -c hashes.sha256
   ```
   Guardar as hashes e o relatório **sem** conteúdo dos arquivos. Um checksum só confirma integridade do arquivo, não restauração válida.
7. Criptografar e guardar conforme política corporativa de segurança, restringindo acesso e definindo responsável/validade/retenção. Evitar cópia de dados corporativos para dispositivos pessoais ou backup não autorizado.

## Prova de restauração: condição obrigatória

Não executar restauração no projeto Cloud ativo. Preparar **ambiente PostgreSQL 17/Supabase isolado**, sem exposição pública e sem envio de e-mails de autenticação, com extensões/versões compatíveis, usando dados somente por responsável autorizado. O roteiro oficial de restauração de instância Supabase apresenta a ordem roles, schema e data, mas **não presuma que PostgreSQL puro isolado reproduza o Auth e as extensões do Supabase**.

Em ambiente isolado, inspecionar o script de restauração e testar de acordo com a [documentação oficial](https://supabase.com/docs/guides/self-hosting/restore-from-platform), com verificação de erros, objetos e constraints. Critérios objetivos:
- Processo concluiu sem erros de SQL e dentro de janela aceitável.
- Estrutura, políticas RLS, funções e triggers presentes; checagem de privilégio de `anon` e `authenticated` sem concessões extras.
- Quantidade de Auth users, perfis, vínculos de filiais, categorias e dados coincide com as contagens do instante de backup.
- Teste de acesso entre as duas filiais em instância isolada segue bloqueando leitura cruzada.
- Plano de recuperação explica como retornar à situação anterior se uma migração futura falhar (incluindo indisponibilidade, migrações aplicadas e limites de rollback).

Registrar na Issue **somente** data/hora, versão da CLI, status de exportação, 3 tamanhos e checksums (sem conteúdo), status da restauração, responsável e prazo de retenção. Não colocar e-mails, números de matrícula, segredos, credenciais, dados de RH nem IDs de usuário.

## Gate para etapas posteriores

- [ ] Autorização da equipe para executar backup de dados corporativos em estação gerenciada
- [ ] Dump de roles, schema e data finalizado e armazenado de forma segura
- [ ] Verificação de hashes e integridade efetuada
- [ ] Restauração isolada testada e evidenciada, com RLS/Auth preservados
- [ ] Responsável pela reversão e janela de mudança definidos
- [ ] Revisão do alerta `rls_auto_enable()` concluída
- [ ] Aprovação **específica** para aplicar migrações `20261111000100` e `20261111000200`

Até o fechamento dos itens, **não** aplicar migrações, criar contas corporativas definitivas, fazer deploy ou alterar `excelencia.decamservice.com`.

## Fontes oficiais

- [CLI — supabase db dump](https://supabase.com/docs/reference/cli/supabase-db-dump)
- [Restore a Platform Project to Self-Hosted](https://supabase.com/docs/guides/self-hosting/restore-from-platform)
- [Backup and Restore using CLI](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore)
