# Autorização administrativa e importações — Issue #55

## Decisão confirmada
Os **administradores do Programa Excelência 5 Estrelas 2027** são também os responsáveis por **todas as importações** (RH0034, advertências, acidentes, produtividade, dirigibilidade, jornada e treinamentos). Não há perfil independente de RH/Importador.

| Capacidade | Administrador ativo | Gestor/consulta | Admin inativo |
|---|---|---|---|
| Passar na verificação de administrador | Sim | Não | Não |
| Passar na verificação de importador | Sim | Não | Não |
| Alterar tabelas diretamente por API | Não | Não | Não |
| Importar planilhas neste PR | Não — operação ainda não implementada | Não | Não |
| Consultar dados por filial (RLS atual) | Apenas filiais explicitamente vinculadas | Apenas filiais vinculadas | Não |

## Arquitetura
A migração `20261111000100_admin_importacoes_autorizacao.sql` adiciona funções de verificação, baseadas em `auth.uid()` e nos campos `perfis.administrador` e `perfis.ativo`. Não há autorização por e-mail, payload ou JWT customizado.

As funções são `SECURITY DEFINER`, usam `search_path=''` e removem EXECUTE de `PUBLIC` e `anon`. Não foi criada policy de escrita e as permissões SQL pré-existentes de leitura/escrita permanecem restritas.

**Autorização de importação é uma checagem preliminar, não uma implementação de importação.** O processamento de arquivos exige um fluxo separado: endpoint server-side autenticado, limites de tamanho e formato, validação da filial e da competência, staging, revisão/confirmar, transações, idempotência e auditoria. Nenhuma chave privilegiada deve sair do servidor ou entrar no Git.

O campo `administrador` já existe em `perfis`. Ele **não** permite bypass de RLS por filial nem permite ao cliente editar perfis, permissões ou dados corporativos. Em fases futuras, administração global e operações privilegiadas deverão ser modeladas e auditadas especificamente.

## Testes
CI usa somente um PostgreSQL descartável com usuário administrador ativo, consulta comum, administrador inativo e identidade ausente. Confere que só o administrador ativo é reconhecido como importador e que o papel `authenticated` continua sem escrita nas tabelas.

## Cuidados antes da aplicação remota
Este PR é **Draft**, não foi aplicado ao Supabase Cloud, não faz deploy ao Vostro e não habilita login real na aplicação publicada. A migração anterior de leitura RLS foi aplicada separadamente ao Supabase Cloud. Após revisão e aprovação, realizar dry-run e checagens no SQL Editor antes de aplicar qualquer nova migração.

Não tornar os e-mails fictícios de homologação administradores. Reservar o privilégio a contas reais e autorizadas da equipe apenas em fase controlada, com MFA e gestão de credenciais.
